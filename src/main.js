import Phaser from 'phaser'
import './style.css'
import LibraryScene from './scenes/LibraryScene'

const config = {
  type: Phaser.AUTO,
  width: 1200,
  height: 800,
  backgroundColor: '#2b2118',
  scene: LibraryScene,
}

new Phaser.Game(config)