import Phaser from 'phaser'
import { GAME, PHYSICS } from './config.js'
import { P, hex } from './palette.js'
import BootScene from './scenes/BootScene.js'
import GameScene from './scenes/GameScene.js'

// ?debug an die Adresse hängen → man sieht die Trefferboxen
const DEBUG = new URLSearchParams(location.search).has('debug')

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME.width,
  height: GAME.height,
  backgroundColor: hex(P.schwarz),

  // Das Wichtigste für Pixel-Art: KEINE Glättung beim Hochskalieren.
  pixelArt: true,
  roundPixels: true,

  scale: {
    mode: Phaser.Scale.FIT,            // passt ins Fenster, behält 16:9
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },

  input: {
    activePointers: 3,   // mehrere Finger gleichzeitig (laufen + springen)
  },

  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: PHYSICS.gravity },
      debug: DEBUG,
    },
  },

  scene: [BootScene, GameScene],
}

new Phaser.Game(config)
