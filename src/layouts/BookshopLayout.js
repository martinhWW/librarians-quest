export default class BookshopLayout {
  constructor(scene) {
    this.scene = scene;
  }

  /////////////////////////////////////
  /** Create Bookshop Layout**/
  /////////////////////////////////////

  build() {
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

  createShelf(x, y, width, height, color, interactionX, interactionY) {
    const shelf = this.scene.add.rectangle(x, y, width, height, color);

    shelf.interactionX = interactionX;
    shelf.interactionY = interactionY;

    this.scene.obstacles.push(shelf);
    this.scene.interactables.push(shelf);
    return shelf;
  }

  createDesk(shape, x, y, width, height, color) {
    if (shape === "rectangle") {
      const desk = this.scene.add.rectangle(x, y, width, height, color);
      this.scene.obstacles.push(desk);
      return desk;
    } else if (shape === "circle") {
      const desk = this.scene.add.circle(x, y, width, color);
      this.scene.obstacles.push(desk);
      return desk;
    }
  }

  createChair(x, y, width, height, color) {
    const chair = this.scene.add.rectangle(x, y, width, height, color);
    this.scene.obstacles.push(chair);
    return chair;
  }

  createTable(x, y, radius, color, startAngle, endAngle) {
    const table = this.scene.add.arc(
      x,
      y,
      radius,
      startAngle,
      endAngle,
      false,
      color,
    );
    this.scene.obstacles.push(table);
    return table;
  }
}
