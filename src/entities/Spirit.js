// ============================================================
//  SPIRIT — Leonels Waldgeist
// ============================================================
//  Ein leuchtender Geist, der zum nächsten verwirrten Tier fliegt,
//  es beruhigt (es bleibt stehen und tut nicht weh) und dann eine
//  Weile um Leonel herumschwebt. Danach verschwindet er.
// ============================================================
import Phaser from 'phaser'
import { SPIRIT } from '../config.js'

export default class Spirit extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, owner, time) {
    super(scene, owner.x, owner.body.top - 10, 'geist')
    scene.add.existing(this)
    scene.physics.add.existing(this)
    this.body.setAllowGravity(false)
    this.setDepth(12)
    this.owner = owner
    this.bornAt = time
    this.target = null
    this.done = false
    this.setScale(0.2)
    scene.tweens.add({ targets: this, scale: 1, duration: 200, ease: 'Back.Out' })
  }

  update(time, enemies) {
    if (this.done) return
    if (time - this.bornAt > SPIRIT.durationMs) {
      this.done = true
      this.scene.tweens.add({ targets: this, alpha: 0, scale: 0.2, duration: 300, onComplete: () => this.destroy() })
      return
    }
    // Ziel: nächstes verwirrtes Tier in Reichweite (das noch nicht beruhigt ist)
    if (!this.target || this.target.healed || this.target.isCalm(time)) {
      this.target = enemies
        .filter((e) => !e.healed && !e.isCalm(time) && Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y) < SPIRIT.range)
        .sort((a, b) => Phaser.Math.Distance.Between(this.x, this.y, a.x, a.y) - Phaser.Math.Distance.Between(this.x, this.y, b.x, b.y))[0] ?? null
    }
    let tx, ty
    if (this.target) {
      tx = this.target.x; ty = this.target.body.top - 6
      if (Phaser.Math.Distance.Between(this.x, this.y, tx, ty) < 10) {
        this.target.calm(time, SPIRIT.calmMs)
        this.target.hit(SPIRIT.damage, this.x, time)
        this.target = null
      }
    } else {
      // um Leonel herumschweben
      tx = this.owner.x + Math.cos(time / 400) * 16
      ty = this.owner.body.top - 12 + Math.sin(time / 300) * 5
    }
    this.scene.physics.moveTo(this, tx, ty, SPIRIT.speed)
    this.setAlpha(0.8 + Math.sin(time / 120) * 0.2)
  }
}
