// ============================================================
//  PROJECTILE — etwas, das durch die Luft fliegt
// ============================================================
//  Die Jackfrucht des Affen und die Lorbeere der Taube. Sie fliegen
//  im Bogen (die Schwerkraft zieht sie nach unten), drehen sich dabei
//  und dürfen ein paarmal vom Boden ABPRALLEN, bevor sie zerplatzen:
//  die Jackfrucht hüpft einmal hoch auf (drüberspringen!), die
//  Lorbeere kullert flach über den Boden. Anzahl und Sprungkraft
//  stehen beim Werfer in der Config (ai.wurf.bounces / .bounce).
// ============================================================
import Phaser from 'phaser'
import { P } from '../palette.js'

export default class Projectile extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, key, vx, vy, { bounces = 0, bounce = 0.5 } = {}) {
    super(scene, x, y, key)
    scene.add.existing(this)
    scene.physics.add.existing(this)
    this.setDepth(9)
    this.body.setSize(Math.min(10, this.width), Math.min(10, this.height))
    this.setVelocity(vx, vy)
    this.spin = Math.sign(vx) * 6
    this.bornAt = scene.time.now
    this.bouncesLeft = bounces
    this.lastBounceAt = -1
    // Die Physik lässt den Körper selbst abprallen; wir zählen nur mit (aufprall).
    this.setBounce(bounce, bounce)
    this.body.useDamping = false
  }

  update(time) {
    this.angle += this.spin
    if (time - this.bornAt > 6000) this.zerplatzen()      // Notbremse: nie ewig fliegen
  }

  // Boden oder Wand berührt (vom Collider gerufen). Jeder Aufprall zählt einmal;
  // beim Kullern liegt der Körper Bild für Bild auf – das zählt nicht doppelt.
  aufprall(time) {
    if (!this.active) return
    if (time - this.lastBounceAt < 120) return
    this.lastBounceAt = time
    if (this.bouncesLeft <= 0) { this.zerplatzen(); return }
    this.bouncesLeft--
    this.spin *= 0.7
    this.scene.sparkle?.(this.x, this.body.bottom, P.sandHell, 3)
    if (this.bouncesLeft <= 0) this.setBounce(0, 0)   // der nächste Aufprall ist der letzte
  }

  zerplatzen() {
    if (!this.active) return
    // kleine grüne Stücke fliegen auseinander
    this.scene.sparkle?.(this.x, this.y, P.wiesenGruen, 6)
    this.scene.sfx?.play('hit')
    this.destroy()
  }
}
