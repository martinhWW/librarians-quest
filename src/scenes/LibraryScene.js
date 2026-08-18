import Phaser from 'phaser'
import PF from 'pathfinding'

export default class LibraryScene extends Phaser.Scene {
  constructor() {
    super('LibraryScene')

    this.moveQueue = []
    this.obstacles = []
    this.interactables = []

    this.gridSize = 40
    this.grid = []
  }

  create() {
    this.add.text(30, 10, "Librarian's Quest", {
      fontSize: '32px',
      color: '#ffffff',
    })

    //blue shelves
    this.createShelf(1000, 400, 40, 280, 0x4f7cff, 940, 400)
    this.createShelf(1100, 400, 40, 280, 0x4f7cff, 1060, 400)
  
    //green shelves
    this.createShelf(220, 650, 280, 40, 0x50c878, 220, 600)
    this.createShelf(220, 750, 280, 40, 0x50c878, 220, 700)
  
    //purple shelves
    this.createShelf(1000, 650, 280, 40, 0xb04cff, 1000, 600)
    this.createShelf(1000, 750, 280, 40, 0xb04cff, 1000, 700)

    //yellow shelves
    this.createShelf(900, 25, 500, 40, 0xf5a623, 900, 75)
    this.createShelf(800, 150, 200, 80, 0xf5a623, 800, 220)
    this.createShelf(600, 125, 40, 200, 0xf5a623, 660, 150)

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
    
    const frontRegisterTable = this.createTable(600, 400, 100, 'black', 90, 270)
    const backRegisterTable = this.createTable(650, 400, 100, 'black', 270, 90)

    this.createNavigationGrid()
    this.markedBlockedCells()
    this.drawNavigationGrid()
    this.pathfindingGrid = this.createPathfindingGrid()

    this.createLibrarian(1000, 700)

    this.input.on('pointerdown', (pointer) => {
      const interactable = this.interactables.find((object) => {
        return object.getBounds().contains(pointer.x, pointer.y)
      })

      if (interactable) {
        this.queueMovement(
          interactable.interactionX,
          interactable.interactionY
        )
        return
      }

      this.queueMovement(pointer.x, pointer.y)
    })

    this.testPathfinding(
      this.librarian.x,
      this.librarian.y,
      900,
      75
    )

  }

  update(time, delta) {
    this.updateMovement(delta)
  }


  updateMovement(delta) {
    if(this.moveQueue.length == 0) {
      return
    }
    const speed = 240
    const moveDistance = speed * (delta / 1000)

    const target = this.moveQueue[0]

    const dx = target.x - this.librarian.x
    const dy = target.y - this.librarian.y

    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance < moveDistance) {
     this.completeMovement(target)
      return
    }
    this.librarian.x += (dx / distance) * moveDistance
    this.librarian.y += (dy / distance) * moveDistance
  }

  completeMovement(target) {
    this.librarian.x = target.x
    this.librarian.y = target.y

    this.moveQueue.shift()
  }

  queueMovement(x, y) {
    const blocked = this.isPathBlocked(this.librarian.x, this.librarian.y, x, y)
    this.moveQueue.push({ x, y })
  }

  isPathBlocked(startX, startY, endX, endY) {
    const line = new Phaser.Geom.Line(startX, startY, endX, endY)

    return this.obstacles.some((obstacle) => {
      const bounds = obstacle.getBounds()

      return Phaser.Geom.Intersects.LineToRectangle(line, bounds)
    })
  }


  createPathfindingGrid() {
    const matrix = this.grid.map((row) => {
      return row.map((cell) => {
        return cell.walkable ? 0 : 1
      })
    })
    return new PF.Grid(matrix)
  }

  worldToGrid(x, y) {
    return {
      x: Math.floor(x / this.gridSize),
      y: Math.floor(y / this.gridSize),
    }
  }

  testPathfinding(startX, startY, endX, endY) {
    const start = this.worldToGrid(startX, startY)
    const end = this.worldToGrid(endX, endY)

    const grid = this.pathfindingGrid.clone()
    const finder = new PF.AStarFinder()

    console.log('Start:', start)
    console.log('End:', end)
    console.log(
      'Grid size:',
      this.pathfindingGrid.width,
      this.pathfindingGrid.height
      )

    const path = finder.findPath(
      start.x,
      start.y,
      end.x,
      end.y,
      grid
    )
    console.log("Path: ", path)
    this.drawPath(path)
  }

  drawPath(path) {
    const graphics = this.add.graphics()
    graphics.fillStyle(0x00ffff, 0.7)

    path.forEach(([col,row])=> {
      const centerX = col * this.gridSize + this.gridSize / 2
      const centerY = row * this.gridSize + this.gridSize / 2

      graphics.fillCircle(
        centerX,
        centerY,
        5
      )
    })
  }

  createShelf(x, y, width, height, color, interactionX, interactionY) {
    const shelf = this.add.rectangle(x, y, width, height, color)

    shelf.interactionX = interactionX
    shelf.interactionY = interactionY

    this.obstacles.push(shelf)
    this.interactables.push(shelf)
    return shelf
  }

  createLibrarian(x, y) {
    this.librarian = this.add.circle(x, y, 16, 0xffffff)
  }

  createDesk(shape, x, y, width, height, color) {
    if (shape === 'rectangle') {
      const desk = this.add.rectangle(x, y, width, height, color)
      this.obstacles.push(desk)
      return desk
    } else if (shape === 'circle') {
      const desk = this.add.circle(x, y, width, color)
      this.obstacles.push(desk)
      return desk
    }
  }

  createChair(x, y, width, height, color) {
    const chair = this.add.rectangle(x, y, width, height, color)
    this.obstacles.push(chair)
    return chair
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
    this.obstacles.push(table)
    return table
  }

  createNavigationGrid() {
    const cols = 1200 / this.gridSize
    const rows = 800 / this.gridSize

    for(let row = 0; row < rows; row++) {
      this.grid[row] = []

      for(let col = 0; col < cols; col++) {
        this.grid[row][col] = {
          row,
          col,
          walkable: true,
        }
      }
    }
  }

  drawNavigationGrid() {
    const graphics = this.add.graphics()
  
    for (let row = 0; row < this.grid.length; row++) {
      for (let col = 0; col < this.grid[row].length; col++) {
        const cell = this.grid[row][col]
  
        const x = col * this.gridSize
        const y = row * this.gridSize
  
        if (!cell.walkable) {
          graphics.fillStyle(0xff0000, 0.25)
          graphics.fillRect(
            x,
            y,
            this.gridSize,
            this.gridSize
          )
        }
  
        graphics.lineStyle(1, 0xffffff, 0.2)
        graphics.strokeRect(
          x,
          y,
          this.gridSize,
          this.gridSize
        )
      }
    }
  }

  markedBlockedCells() {
    for (let row = 0; row < this.grid.length; row++) {
      for (let col = 0; col < this.grid[row].length; col++) {
        const cell = this.grid[row][col]

        const centerX = col * this.gridSize + this.gridSize / 2
        const centerY = row * this.gridSize + this.gridSize / 2

        const blocked = this.obstacles.some((obstacle) => {
          return obstacle.getBounds().contains(centerX, centerY)
        })

        cell.walkable = !blocked
      }
    }
  }

}