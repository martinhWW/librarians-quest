import Phaser from "phaser";
import PF from "pathfinding";
import BookshopLayout from "../layouts/BookshopLayout";
import MovementSystem from "../systems/MovementSystem";

export default class BookshopFloorScene extends Phaser.Scene {
  constructor() {
    super("BookshopFloorScene");

    this.obstacles = [];
    this.interactables = [];

    this.gridSize = 40;
    this.grid = [];

    this.debugNavigation = true;

    this.customers = [];

    // this.availableBookColors = [0x4f7cff, 0xb04cff, 0x50c878, 0xf5a623];
    this.availableBookColors = [
      { name: "blue", value: 0x4f7cff },
      { name: "purple", value: 0xb04cff },
      { name: "green", value: 0x50c878 },
      { name: "yellow", value: 0xf5a623 },
    ];

    this.customerWaitingSpots = [
      { x: 400, y: 400 },
      { x: 340, y: 400 },
      { x: 280, y: 400 },
      { x: 220, y: 400 },
    ];
  }

  create() {
    this.renderTitle();
    this.bookshopLayout = new BookshopLayout(this);
    this.bookshopLayout.build();
    this.createBookseller(1000, 700);

    this.createCustomer(
      this.customerWaitingSpots[0].x,
      this.customerWaitingSpots[0].y,
    );
    this.createCustomer(
      this.customerWaitingSpots[1].x,
      this.customerWaitingSpots[1].y,
    );
    this.createCustomer(
      this.customerWaitingSpots[2].x,
      this.customerWaitingSpots[2].y,
    );
    this.createCustomer(
      this.customerWaitingSpots[3].x,
      this.customerWaitingSpots[3].y,
    );

    this.createNavigationGrid();
    this.markBlockedCells();

    if (this.debugNavigation) {
      this.drawNavigationGrid();
    }

    this.pathfindingGrid = this.createPathfindingGrid();

    this.movementSystem = new MovementSystem(
      this.bookseller,
      this.pathfindingGrid,
      this.gridSize,
    );

    this.pointerDown = this.pointerDown.bind(this);
    this.input.on("pointerdown", this.pointerDown);
  }

  /////////////////////////////////////
  /** Render Title**/
  /////////////////////////////////////
  renderTitle() {
    this.add.text(30, 10, "Lily's Cozy Bookshop", {
      fontSize: "32px",
      color: "#ffffff",
    });
  }

  /////////////////////////////////////
  /** Create Bookseller and NPCs**/
  /////////////////////////////////////

  createBookseller(x, y) {
    this.bookseller = this.add.circle(x, y, 16, 0xffffff);
    this.bookseller.inventory = [];
    this.booksellet.inventoryVisuals = [];
    this.bookseller.maxCarry = 2;
  }

  createCustomer(x, y) {
    const customer = this.add.circle(x, y, 16, 0xff69b4);
    const randomIndex = Math.floor(
      Math.random() * this.availableBookColors.length,
    );
    const request = this.availableBookColors[randomIndex];
    customer.requestedBookColor = request;
    customer.state = "waiting";
    this.createRequestBubble(customer);
    this.customers.push(customer);
    return customer;
  }

  /////////////////////////////////////
  /** Actions**/
  /////////////////////////////////////

  createRequestBubble(customer) {
    const bubbleX = customer.x;
    const bubbleY = customer.y - 50;

    this.add.rectangle(bubbleX, bubbleY, 50, 35, 0xffffff);
    this.add.rectangle(
      bubbleX,
      bubbleY,
      14,
      20,
      customer.requestedBookColor.value,
    );
  }

  renderInventory(bookseller) {
    const bubbleX = bookseller.x;
    const bubbleY = bookseller.y - 50;
    const inventory = bookseller.inventory;
    const inventoryVisuals = bookseller.inventoryVisuals;

    if (inventory.length > 0) {
      this.add.rectangle(bubbleX, bubbleY, 50, 35, 0xffffff);
      for (let i = 0; i < inventory.length; i++) {
        this.add.rectangle(
          bubbleX,
          bubbleY + i * 20,
          14,
          20,
          inventory[i].bookColor.value,
        );
      }
    }
  }

  /**
   * Handles clicks within the game world.
   *
   * If an interactable object (such as a bookshelf) is clicked,
   * queue its predefined interaction point rather than the object's
   * physical coordinates. This allows the Bookseller to approach
   * furniture without trying to walk inside it.
   *
   * Floor clicks queue the exact clicked location.
   */
  pointerDown(pointer) {
    const interactable = this.interactables.find((object) => {
      return object.getBounds().contains(pointer.x, pointer.y);
    });

    if (interactable) {
      this.movementSystem.queueMovement(
        interactable.interactionX,
        interactable.interactionY,
        interactable,
      );
      return;
    }
    this.movementSystem.queueMovement(pointer.x, pointer.y);
  }

  /**
   * Phaser lifecycle method called once per frame.
   *
   * delta is the number of milliseconds since the previous frame and is
   * passed to updateMovement() so movement speed remains frame-independent.
   */
  update(time, delta) {
    this.movementSystem.updateMovement(delta);
  }

  /////////////////////////////////////
  /** Navigation Grid Creation**/
  /////////////////////////////////////

  /**
   * Creates the logical navigation grid used for pathfinding.
   * All cells begin as walkable and are updated after furniture
   * has been placed in the scene.
   */
  createNavigationGrid() {
    const cols = 1200 / this.gridSize;
    const rows = 800 / this.gridSize;

    for (let row = 0; row < rows; row++) {
      this.grid[row] = [];

      for (let col = 0; col < cols; col++) {
        this.grid[row][col] = {
          row,
          col,
          walkable: true,
        };
      }
    }
  }

  /**
   * Marks grid cells as blocked when their center falls within
   * the bounds of a furniture obstacle.
   *
   * These blocked cells prevent A* from routing the Bookseller
   * through shelves, tables, chairs, and other furniture.
   */
  markBlockedCells() {
    for (let row = 0; row < this.grid.length; row++) {
      for (let col = 0; col < this.grid[row].length; col++) {
        const cell = this.grid[row][col];

        const centerX = col * this.gridSize + this.gridSize / 2;
        const centerY = row * this.gridSize + this.gridSize / 2;

        const blocked = this.obstacles.some((obstacle) => {
          return obstacle.getBounds().contains(centerX, centerY);
        });

        cell.walkable = !blocked;
      }
    }
  }

  /**
   * Converts the game's navigation grid into the matrix format expected
   * by PathFinding.js.
   *
   * 0 = walkable
   * 1 = blocked
   */
  createPathfindingGrid() {
    const matrix = this.grid.map((row) => {
      return row.map((cell) => {
        return cell.walkable ? 0 : 1;
      });
    });
    return new PF.Grid(matrix);
  }

  /**
   * Draws the navigation grid and highlights blocked cells.
   *
   * This is a development/debugging aid and is not intended to
   * appear in the finished game.
   */
  drawNavigationGrid() {
    const graphics = this.add.graphics();

    for (let row = 0; row < this.grid.length; row++) {
      for (let col = 0; col < this.grid[row].length; col++) {
        const cell = this.grid[row][col];

        const x = col * this.gridSize;
        const y = row * this.gridSize;

        if (!cell.walkable) {
          graphics.fillStyle(0xff0000, 0.25);
          graphics.fillRect(x, y, this.gridSize, this.gridSize);
        }

        graphics.lineStyle(1, 0xffffff, 0.2);
        graphics.strokeRect(x, y, this.gridSize, this.gridSize);
      }
    }
  }
}
