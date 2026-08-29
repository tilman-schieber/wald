// ============================================================
//  ENEMY — ein verwirrter Waldbewohner
// ============================================================
//  Gegner sind nicht böse, sie sind durcheinander, weil der Wald
//  verstummt. Man haut sie nicht kaputt, man HEILT sie: Bei 0
//  Lebenspunkten werden sie wieder friedlich und bleiben im Raum.
// ============================================================
import Phaser from 'phaser'
import { P } from '../palette.js'

export default class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, cfg) {
    super(scene, x, y, cfg.key, 0)
    this.cfg = cfg
    scene.add.existing(this)
    scene.physics.add.existing(this)
    this.body.setSize(cfg.body.w, cfg.body.h)
    this.body.setOffset((cfg.frame.w - cfg.body.w) / 2, cfg.frame.h - cfg.body.h)
    this.setCollideWorldBounds(true)

    this.hp = cfg.hp
    this.healed = false
    this.dir = -1
    this.flashUntil = 0
  }

  update(time, groundLayer) {
    if (this.healed) { this.setVelocityX(0); return }

    // Umdrehen an Wand oder Abgrund – der Igel fällt nie von seiner Plattform
    const blocked = this.dir < 0 ? this.body.blocked.left : this.body.blocked.right
    const aheadX = this.x + this.dir * (this.body.width / 2 + 2)
    const groundAhead = groundLayer.getTileAtWorldXY(aheadX, this.body.bottom + 2) !== null
    if (this.onGround && (blocked || !groundAhead)) this.dir = -this.dir

    this.setVelocityX(this.dir * this.cfg.speed)
    this.setFlipX(this.dir > 0)
    if (time > this.flashUntil) this.clearTint()
  }

  get onGround() {
    return this.body.blocked.down
  }

  // Ein Treffer. Gibt true zurück, wenn der Gegner dadurch geheilt wurde.
  hit(damage, fromX, time) {
    if (this.healed) return false
    this.hp -= damage
    this.setTintFill(P.weiss)                      // kurz weiß aufblitzen
    this.flashUntil = time + 80
    this.setVelocity(Math.sign(this.x - fromX) * 60, -80)   // kleiner Rückstoß
    if (this.hp <= 0) { this.heal(); return true }
    return false
  }

  heal(silent = false) {
    this.healed = true
    this.hp = 0
    this.clearTint()
    this.setTint(P.wiesenGruen)                    // friedlich = grünlich
    this.setVelocity(0, 0)
    if (silent) return
    // ein kleines Herz steigt auf
    const heart = this.scene.add.text(this.x, this.body.top - 4, '♥', { fontFamily: 'monospace', fontSize: '10px', color: '#f6757a' }).setOrigin(0.5).setDepth(15)
    this.scene.tweens.add({ targets: heart, y: heart.y - 20, alpha: 0, duration: 900, onComplete: () => heart.destroy() })
  }
}
