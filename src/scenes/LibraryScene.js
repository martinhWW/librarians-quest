import Phaser from 'phaser'

export default class LibraryScene extends Phaser.Scene {
  constructor() {
    super('LibraryScene')
  }

  create() {
    this.add.text(30, 10, "Librarian's Quest", {
      fontSize: '32px',
      color: '#ffffff',
    })

    //blue shelves
    this.createShelf(1000, 400, 40, 280, 0x4f7cff)
    this.createShelf(1100, 400, 40, 280, 0x4f7cff)
  
    //green shelves
    this.createShelf(220, 650, 280, 40, 0x50c878)
    this.createShelf(220, 750, 280, 40, 0x50c878)
  
    //purple shelves
    this.createShelf(1000, 650, 280, 40, 0xb04cff)
    this.createShelf(1000, 750, 280, 40, 0xb04cff)

    //yellow shelves
    this.createShelf(900, 25, 500, 40, 0xf5a623)
    this.createShelf(800, 150, 200, 80, 0xf5a623)
    this.createShelf(600, 125, 40, 200, 0xf5a623)

    this.createDesk('rectangle', 600, 675, 140, 200, 'black')
    this.createChair(500, 725, 40, 60, 'black')
    this.createChair(700, 725, 40, 60, 'black')
    this.createChair(500, 625, 40, 60, 'black')
    this.createChair(700, 625, 40, 60, 'black')

    this.createDesk('circle', 200, 200, 100, 100, 'black')
    this.createChair(75, 200, 40, 80, 'black')
    this.createChair(325, 200, 40, 80, 'black')
    this.createChair(200, 75, 80, 40, 'black')
    this.createChair(200, 325, 80, 40, 'black')

    this.createLibrarian(600, 600)

    const frontRegisterTable = this.createTable(600, 400, 100, 'black', 90, 270)
    const backRegisterTable = this.createTable(650, 400, 100, 'black', 270, 90)
  }

  createShelf(x, y, width, height, color) {
    this.add.rectangle(x, y, width, height, color)
  }

  createLibrarian(x, y) {
    this.add.circle(480, 360, 16, 0xffffff)
  }

  createDesk(shape, x, y, width, height, color) {
    if (shape === 'rectangle') {
      this.add.rectangle(x, y, width, height, color)
    } else if (shape === 'circle') {
      this.add.circle(x, y, width, color)
    }
  }

  createChair(x, y, width, height, color) {
    this.add.rectangle(x, y, width, height, color)
  }

  createTable(x, y, radius, color, startAngle, endAngle) {
    const table = this.add.arc(
      x,
      y,
      radius,
      startAngle,
      endAngle,
      false,
      color
    )
  
    return table
  }

}