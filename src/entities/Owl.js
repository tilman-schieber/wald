// ============================================================
//  OWL — die verwirrte Eule
// ============================================================
//  Sitzt auf ihrem Platz (dem Punkt aus Tiled, in der Luft). Sieht
//  sie einen Helden, stürzt sie im Sturzflug auf ihn herab, landet
//  am Boden, sitzt kurz benommen (jetzt zuschlagen!) und fliegt dann
//  zurück auf ihren Ast. Nur am Boden kann man sie treffen.
// ============================================================
import Phaser from 'phaser'
import Enemy from './Enemy.js'

export default class Owl extends Enemy {
  constructor(scene, x, y, cfg) {
    super(scene, x, y, cfg)
    this.body.setAllowGravity(false)
    this.setCollideWorldBounds(false)
    this.perch = { x, y: this.y }
    this.state = 'perch'
  }

  // Nur am Boden (rest) oder beruhigt verwundbar – im Flug prallt alles ab
  isVulnerable(time) { return this.state === 'rest' || this.isCalm(time) }
  hurtsOnTouch(time) { return !this.healed && !this.isCalm(time) && this.state !== 'rest' }

  update(time, groundLayer, heroes = []) {
    if (this.healed) { this.setVelocity(0, 0); this.body.setAllowGravity(true); return }   // geheilt: setzt sich hin
    if (this.isCalm(time)) { this.setVelocity(0, 0); this.showMark(false); return }
    const ai = this.cfg.ai
    switch (this.state) {
      case 'perch': {
        this.setVelocity(0, 0)
        this.y = this.perch.y + Math.sin(time / 500) * 1.5          // leichtes Wippen
        if (time >= this.alertReadyAt) {
          const seen = heroes.find((h) => Math.abs(h.x - this.x) <= ai.sight.x && h.y > this.y && h.y - this.y <= ai.sight.y)
          if (seen) { this.state = 'alert'; this.stateUntil = time + ai.alertMs; this.target = seen; this.showMark(true, '!') }
        }
        break
      }
      case 'alert':
        this.dir = Math.sign(this.target.x - this.x) || this.dir
        if (time >= this.stateUntil) {
          this.state = 'swoop'
          this.showMark(false)
          this.useTexture(this.cfg.key + '-flug')
          // Zielpunkt: dort, wo der Held gerade steht
          this.swoopTo = { x: this.target.x, y: this.target.body.bottom - this.body.height / 2 }
          this.scene.physics.moveTo(this, this.swoopTo.x, this.swoopTo.y, ai.swoopSpeed)
        }
        break
      case 'swoop':
        if (Phaser.Math.Distance.Between(this.x, this.y, this.swoopTo.x, this.swoopTo.y) < 8 || this.body.blocked.down) {
          this.state = 'rest'
          this.stateUntil = time + ai.restMs
          this.setVelocity(0, 0)
          this.useTexture(this.cfg.key)
          this.showMark(true, '★')
        }
        break
      case 'rest':
        this.setVelocity(0, 0)
        this.mark.setAngle(Math.sin(time / 100) * 20)
        if (time >= this.stateUntil) {
          this.state = 'return'
          this.showMark(false)
          this.useTexture(this.cfg.key + '-flug')
          this.scene.physics.moveTo(this, this.perch.x, this.perch.y, ai.returnSpeed)
        }
        break
      case 'return':
        if (Phaser.Math.Distance.Between(this.x, this.y, this.perch.x, this.perch.y) < 6) {
          this.state = 'perch'
          this.setPosition(this.perch.x, this.perch.y)
          this.setVelocity(0, 0)
          this.useTexture(this.cfg.key)
          this.alertReadyAt = time + ai.cooldownMs
        }
        break
    }
    if (this.body.velocity.x !== 0) this.dir = Math.sign(this.body.velocity.x)
    this.setFlipX(this.dir > 0)
    if (time > this.flashUntil && !this.isCalm(time)) this.clearTint()
    this.mark.setPosition(this.x, this.body.top - 8)
  }

  stun(time, ms) {
    if (this.healed || this.state === 'perch' || this.state === 'return') return   // in der Luft erwischt sie nichts
    this.state = 'rest'; this.stateUntil = time + ms; this.setVelocity(0, 0); this.useTexture(this.cfg.key); this.showMark(true, '★')
  }

  hit(damage, fromX, time) {
    const r = super.hit(damage, fromX, time)
    if (r !== null && !this.healed) { this.setVelocity(0, 0); if (this.state === 'rest') this.stateUntil = Math.max(this.stateUntil, time + 700) }
    return r
  }
}
