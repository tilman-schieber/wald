// ============================================================
//  PROJECTILE — etwas, das durch die Luft fliegt
// ============================================================
//  Zurzeit nur die Jackfrucht, die der verwirrte Affe wirft.
//  Sie fliegt im Bogen (die Schwerkraft zieht sie nach unten),
//  dreht sich dabei und zerplatzt, sobald sie etwas berührt.
// ============================================================
import Phaser from 'phaser'
import { P } from '../palette.js'

export default class Projectile extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, key, vx, vy) {
    super(scene, x, y, key)
    scene.add.existing(this)
    scene.physics.add.existing(this)
    this.setDepth(9)
    this.body.setSize(Math.min(10, this.width), Math.min(10, this.height))
    this.setVelocity(vx, vy)
    this.spin = Math.sign(vx) * 6
    this.bornAt = scene.time.now
  }

  update(time) {
    this.angle += this.spin
    if (time - this.bornAt > 6000) this.zerplatzen()      // Notbremse: nie ewig fliegen
  }

  zerplatzen() {
    if (!this.active) return
    // kleine grüne Stücke fliegen auseinander
    this.scene.sparkle?.(this.x, this.y, P.wiesenGruen, 6)
    this.scene.sfx?.play('hit')
    this.destroy()
  }
}
