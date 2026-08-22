import Phaser from "phaser";
import "./style.css";
import BookshopFloorScene from "./scenes/BookshopFloorScene";

const config = {
  type: Phaser.AUTO,
  width: 1200,
  height: 800,
  backgroundColor: "#2b2118",
  scene: BookshopFloorScene,
};

new Phaser.Game(config);
