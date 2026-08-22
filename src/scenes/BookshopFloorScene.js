import Phaser from "phaser";
import PF from "pathfinding";
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

    this.bookGenres = [
      { name: "fantasy", color: 0x4f7cff },
      { name: "sci-fi", color: 0xb04cff },
      { name: "mystery", color: 0x50c878 },
      { name: "romance", color: 0xf5a623 },
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
    this.createBookshopLayout();
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
  /** Create Bookshop Layout**/
  /////////////////////////////////////

  createBookshopLayout() {
    this.createShelves();
    this.createObstacleFurniture();
    this.createRegister();
  }

  createShelves() {
    //blue shelves
    this.createShelf(1000, 400, 40, 280, 0x4f7cff, 940, 400);
    this.createShelf(1100, 400, 40, 280, 0x4f7cff, 1060, 400);

    //green shelves
    this.createShelf(220, 650, 280, 40, 0x50c878, 220, 600);
    this.createShelf(220, 750, 280, 40, 0x50c878, 220, 700);

    //purple shelves
    this.createShelf(1000, 650, 280, 40, 0xb04cff, 1000, 600);
    this.createShelf(1000, 750, 280, 40, 0xb04cff, 1000, 700);

    //yellow shelves
    this.createShelf(900, 25, 500, 40, 0xf5a623, 900, 75);
    this.createShelf(800, 150, 200, 80, 0xf5a623, 800, 220);
    this.createShelf(600, 125, 40, 200, 0xf5a623, 660, 150);
  }

  createObstacleFurniture() {
    this.createDesk("rectangle", 600, 675, 140, 200, "black");
    this.createChair(500, 725, 40, 60, "black");
    this.createChair(700, 725, 40, 60, "black");
    this.createChair(500, 625, 40, 60, "black");
    this.createChair(700, 625, 40, 60, "black");

    this.createDesk("circle", 200, 200, 100, 100, "black");
    this.createChair(75, 200, 40, 80, "black");
    this.createChair(325, 200, 40, 80, "black");
    this.createChair(200, 75, 80, 40, "black");
    this.createChair(200, 325, 80, 40, "black");
  }

  createRegister() {
    this.createTable(600, 400, 100, "black", 90, 270);
    this.createTable(650, 400, 100, "black", 270, 90);
  }

  /////////////////////////////////////
  /** Create Bookseller and NPCs**/
  /////////////////////////////////////

  createBookseller(x, y) {
    this.bookseller = this.add.circle(x, y, 16, 0xffffff);
  }

  createCustomer(x, y) {
    const customer = this.add.circle(x, y, 16, 0xff69b4);
    const randomIndex = Math.floor(Math.random() * this.bookGenres.length);
    const request = this.bookGenres[randomIndex];
    customer.request = request;
    customer.state = "waiting";
    this.createRequestBubble(customer);
    this.customers.push(customer);
    return customer;
  }

  /////////////////////////////////////
  /** NPC Actions**/
  /////////////////////////////////////

  createRequestBubble(customer) {
    const bubbleX = customer.x;
    const bubbleY = customer.y - 50;

    this.add.rectangle(bubbleX, bubbleY, 50, 35, 0xffffff);
    this.add.rectangle(bubbleX, bubbleY, 14, 20, customer.request.color);
  }

  /////////////////////////////////////
  /** Bookseller's Movement & Pathfinding**/
  /////////////////////////////////////

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
  /** Scene Object Creation**/
  /////////////////////////////////////

  createShelf(x, y, width, height, color, interactionX, interactionY) {
    const shelf = this.add.rectangle(x, y, width, height, color);

    shelf.interactionX = interactionX;
    shelf.interactionY = interactionY;

    this.obstacles.push(shelf);
    this.interactables.push(shelf);
    return shelf;
  }

  createDesk(shape, x, y, width, height, color) {
    if (shape === "rectangle") {
      const desk = this.add.rectangle(x, y, width, height, color);
      this.obstacles.push(desk);
      return desk;
    } else if (shape === "circle") {
      const desk = this.add.circle(x, y, width, color);
      this.obstacles.push(desk);
      return desk;
    }
  }

  createChair(x, y, width, height, color) {
    const chair = this.add.rectangle(x, y, width, height, color);
    this.obstacles.push(chair);
    return chair;
  }

  createTable(x, y, radius, color, startAngle, endAngle) {
    const table = this.add.arc(
      x,
      y,
      radius,
      startAngle,
      endAngle,
      false,
      color,
    );
    this.obstacles.push(table);
    return table;
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
