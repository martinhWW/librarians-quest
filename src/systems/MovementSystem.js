import PF from "pathfinding";

export default class MovementSystem {
  // Receives references to things movement needs but doesn't own
  constructor(bookseller, pathfindingGrid, gridSize, onInventoryChange) {
    // Uses but doesn't own
    this.bookseller = bookseller;
    this.pathfindingGrid = pathfindingGrid;
    this.gridSize = gridSize;

    this.moveQueue = [];
    this.currentPath = [];
    this.onInventoryChange = onInventoryChange;
  }

  /**
   * Adds a destination to the end of the Bookseller's movement queue.
   *
   * Destinations are processed in FIFO order so multiple clicks behave
   * like Diner Dash: the Bookseller must visit previously queued
   * destinations before moving to newer ones.
   */
  queueMovement(x, y, target = null) {
    this.moveQueue.push({ x, y, target });
  }

  /**
   * Moves the Bookseller through the currently calculated A* path.
   *
   * moveQueue stores the destinations requested by the player.
   * currentPath stores the individual A* waypoints required to reach
   * the current destination.
   *
   * When no current path exists, a path is calculated for the first
   * destination in moveQueue. The Bookseller then travels through each
   * waypoint until the destination is reached. Once complete, the
   * destination is removed and the next queued destination can begin.
   */
  updateMovement(delta) {
    if (this.currentPath.length === 0 && this.moveQueue.length === 0) {
      return;
    }

    const destination = this.moveQueue[0];

    if (this.currentPath.length === 0) {
      this.findPathTo(destination.x, destination.y);
      // An empty path means the destination cannot currently be reached.
      // Remove it so it does not permanently block the movement queue.
      if (this.currentPath.length === 0) {
        this.moveQueue.shift();
        return;
      }
    }
    // Movement speed is expressed in pixels per second.
    const speed = 240;
    const moveDistance = speed * (delta / 1000);

    // Always move toward the next waypoint in the calculated path.
    const target = this.currentPath[0];

    const dx = target.x - this.bookseller.x;
    const dy = target.y - this.bookseller.y;

    const distance = Math.sqrt(dx * dx + dy * dy);

    // If the Bookseller can reach the waypoint this frame, snap to its
    // exact position and remove it from the current path.
    if (distance < moveDistance) {
      this.bookseller.x = target.x;
      this.bookseller.y = target.y;
      this.currentPath.shift();

      // An empty currentPath means the queued destination is complete.
      if (this.currentPath.length === 0) {
        this.handleArrival(destination.target);
        this.moveQueue.shift();
      }
      return;
    }

    // Normalize the direction vector so movement speed is consistent
    // regardless of the direction the Bookseller is traveling.
    this.bookseller.x += (dx / distance) * moveDistance;
    this.bookseller.y += (dy / distance) * moveDistance;
  }

  /**
   * Calculates a walkable route from the Bookseller's current position
   * to a destination using A* pathfinding.
   *
   * PathFinding.js works with grid coordinates, while Phaser positions
   * objects using pixel/world coordinates. The start and destination are
   * converted to grid cells before pathfinding, and the resulting path
   * is converted back into world coordinates for the Bookseller to follow.
   */
  findPathTo(destinationX, destinationY) {
    const start = this.worldToGrid(this.bookseller.x, this.bookseller.y);

    const end = this.worldToGrid(destinationX, destinationY);

    // PathFinding.js mutates a grid while searching it, so each search
    // receives a clone of the original navigation grid.
    const grid = this.pathfindingGrid.clone();
    const finder = new PF.AStarFinder();

    const path = finder.findPath(start.x, start.y, end.x, end.y, grid);

    this.currentPath = path.map(([x, y]) => {
      return this.gridToWorld(x, y);
    });
  }

  /**
   * Converts Phaser world/pixel coordinates into navigation-grid
   * coordinates used by PathFinding.js.
   */
  worldToGrid(x, y) {
    return {
      x: Math.floor(x / this.gridSize),
      y: Math.floor(y / this.gridSize),
    };
  }

  /**
   * Converts navigation-grid coordinates back to the pixel coordinates
   * at the center of that grid cell.
   */
  gridToWorld(x, y) {
    return {
      x: x * this.gridSize + this.gridSize / 2,
      y: y * this.gridSize + this.gridSize / 2,
    };
  }

  /**
 * Handles interactions after the Bookseller reaches a queued target.
 *
 * Uses the target's interaction type to determine the appropriate action:
 * - shelf: retrieves a book if inventory capacity is available.
 * - customer: delivers a matching requested book, if carried.
 * - restock: removes all carried books from inventory.
 *
 * Inventory visuals are refreshed whenever the Bookseller's inventory changes.
 *
 * @param {Phaser.GameObjects.GameObject} target
 *   The interactable object the Bookseller has reached.
 */
  handleArrival(target) {
    switch (target?.interactionType) {
      case "shelf":
        if (this.bookseller.inventory.length < this.bookseller.maxCarry) {
          const item = { type: "book", bookColor: target.bookColor };
          this.bookseller.inventory.push(item);
          this.onInventoryChange(this.bookseller);
        }
        break;
      case "customer":
        const index = this.bookseller.inventory.findIndex(
          (item) => item.bookColor.name === target.request.color.name,
        );
        if (index !== -1) {
          this.bookseller.inventory.splice(index, 1);
          this.onInventoryChange(this.bookseller);
          target.state = "served";
          for (const visual of target.requestVisuals) {
            visual.destroy();
          }
          target.requestVisuals.length = 0;
        }
        break;
      case "restock":
        const newInventory = this.bookseller.inventory.filter((item) => {
          return item.type !== "book";
        });
        this.bookseller.inventory = newInventory;
        this.onInventoryChange(this.bookseller);
        break;
      default:
        return;
    }
  }
}
