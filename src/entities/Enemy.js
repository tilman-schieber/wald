// ============================================================
//  ENEMY — ein verwirrter Waldbewohner
// ============================================================
//  Gegner sind nicht böse, sie sind durcheinander, weil der Wald
//  verstummt. Man haut sie nicht kaputt, man HEILT sie: Bei 0
//  Lebenspunkten werden sie wieder friedlich und bleiben im Raum.
//
//  Verhalten (Zustände, siehe cfg.ai in config.js):
//    wander  stromert herum: läuft, bleibt stehen, dreht um
//    alert   hat einen Helden gesehen → "!" und kurz erstarren
//    roll    rollt als Kugel schnell auf ihn zu (drüberhüpfen!)
//    dizzy   danach benommen → NUR JETZT verwundbar, tut nicht weh
// ============================================================
import Phaser from 'phaser'
import { P } from '../palette.js'

const rand = Phaser.Math.Between

export default class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, cfg) {
    super(scene, x, y, cfg.key, 0)
    this.cfg = cfg
    scene.add.existing(this)
    scene.physics.add.existing(this)
    this.useTexture(cfg.key)
    this.setCollideWorldBounds(true)

    this.hp = cfg.hp
    this.healed = false
    this.dir = -1
    this.flashUntil = 0
    this.calmUntil = 0           // vom Waldgeist beruhigt: bleibt stehen, tut nicht weh
    this.state = 'wander'
    this.stateUntil = 0
    this.wanderPause = false
    this.alertReadyAt = 0
    this.mark = scene.add.text(0, 0, '!', { fontFamily: 'monospace', fontSize: '10px', color: '#fee761', stroke: '#181425', strokeThickness: 2 }).setOrigin(0.5).setDepth(9).setVisible(false)
  }

  // Bild wechseln und die Trefferbox unten-mittig neu ausrichten
  useTexture(key) {
    if (!this.scene.textures.exists(key)) return
    this.setTexture(key)
    const f = this.scene.textures.get(key).getSourceImage()
    this.body.setSize(this.cfg.body.w, this.cfg.body.h)
    this.body.setOffset((f.width - this.cfg.body.w) / 2, f.height - this.cfg.body.h)
  }

  get onGround() { return this.body.blocked.down }
  isCalm(time) { return time < this.calmUntil }
  // Kann man ihn gerade treffen?
  isVulnerable(time) { return !this.cfg.ai.spiky || this.state === 'dizzy' || this.isCalm(time) }
  // Tut er gerade weh, wenn man ihn berührt?
  hurtsOnTouch(time) { return !this.healed && !this.isCalm(time) && this.state !== 'dizzy' }

  calm(time, ms) {
    this.calmUntil = time + ms
    this.setTint(P.eisBlau)
    this.stopRolling()
  }

  update(time, groundLayer, heroes = []) {
    if (this.healed) { this.setVelocityX(0); return }
    if (this.isCalm(time)) { this.setVelocityX(0); this.showMark(false); return }
    const ai = this.cfg.ai

    switch (this.state) {
      case 'wander': {
        if (time >= this.stateUntil) {                       // neue Laune: laufen oder stehen?
          this.wanderPause = !this.wanderPause
          if (!this.wanderPause) this.dir = Math.random() < 0.5 ? -1 : 1
          this.stateUntil = time + (this.wanderPause ? rand(400, 1800) : rand(700, 2500))
        }
        if (this.wanderPause) this.setVelocityX(0)
        else this.walk(ai.wanderSpeed, groundLayer)

        // Sieht er einen Helden?
        if (time >= this.alertReadyAt) {
          const seen = heroes.find((h) => Math.abs(h.x - this.x) <= ai.sight.x && Math.abs(h.body.bottom - this.body.bottom) <= ai.sight.y)
          if (seen) {
            this.state = 'alert'
            this.stateUntil = time + ai.alertMs
            this.dir = Math.sign(seen.x - this.x) || this.dir
            this.setVelocityX(0)
            this.showMark(true, '!')
          }
        }
        break
      }
      case 'alert':
        this.setVelocityX(0)
        if (time >= this.stateUntil) {
          this.state = 'roll'
          this.stateUntil = time + ai.rollMaxMs
          this.useTexture(this.cfg.key + '-kugel')
          this.showMark(false)
        }
        break
      case 'roll': {
        this.setVelocityX(this.dir * ai.rollSpeed)
        this.angle += this.dir * 14                          // die Kugel dreht sich
        const blocked = this.dir < 0 ? this.body.blocked.left : this.body.blocked.right
        const edge = this.onGround && !this.groundAhead(groundLayer)
        if (blocked || edge || time >= this.stateUntil) {
          this.stopRolling()
          this.state = 'dizzy'
          this.stateUntil = time + ai.dizzyMs
          this.showMark(true, '★')
        }
        break
      }
      case 'dizzy':
        this.setVelocityX(0)
        this.mark.setAngle(Math.sin(time / 100) * 20)
        if (time >= this.stateUntil) {
          this.state = 'wander'
          this.stateUntil = time
          this.alertReadyAt = time + ai.cooldownMs
          this.showMark(false)
        }
        break
    }

    if (this.state !== 'roll') this.setFlipX(this.dir > 0)
    if (time > this.flashUntil && !this.isCalm(time)) this.clearTint()
    this.mark.setPosition(this.x, this.body.top - 8)
  }

  // Normales Laufen: an Wand oder Abgrund umdrehen – fällt nie von seiner Plattform
  walk(speed, groundLayer) {
    const blocked = this.dir < 0 ? this.body.blocked.left : this.body.blocked.right
    if (this.onGround && (blocked || !this.groundAhead(groundLayer))) this.dir = -this.dir
    this.setVelocityX(this.dir * speed)
  }

  groundAhead(groundLayer) {
    const aheadX = this.x + this.dir * (this.body.width / 2 + 2)
    return groundLayer.getTileAtWorldXY(aheadX, this.body.bottom + 2) !== null
  }

  stopRolling() {
    this.setVelocityX(0)
    this.setAngle(0)
    this.useTexture(this.cfg.key)
  }

  showMark(on, text) {
    this.mark.setVisible(on)
    if (text) this.mark.setText(text).setAngle(0)
  }

  // Ein Treffer. true = dadurch geheilt, false = getroffen, null = abgeprallt (Stacheln!)
  hit(damage, fromX, time) {
    if (this.healed) return false
    if (!this.isVulnerable(time)) return null
    this.hp -= damage
    this.setTintFill(P.weiss)                      // kurz weiß aufblitzen
    this.flashUntil = time + 80
    this.setVelocity(Math.sign(this.x - fromX) * 60, -80)   // kleiner Rückstoß
    if (this.state === 'dizzy') this.stateUntil = Math.max(this.stateUntil, time + 700)   // Zeit für weitere Schläge
    if (this.hp <= 0) { this.heal(); return true }
    return false
  }

  heal(silent = false) {
    this.healed = true
    this.hp = 0
    this.clearTint()
    this.setVelocity(0, 0)
    this.setAngle(0)
    this.showMark(false)
    if (this.scene.textures.exists(this.cfg.key + '-heil')) this.useTexture(this.cfg.key + '-heil')
    else this.setTint(P.wiesenGruen)               // Platzhalter: friedlich = grünlich
    if (silent) return
    // ein kleines Herz steigt auf
    const heart = this.scene.add.text(this.x, this.body.top - 4, '♥', { fontFamily: 'monospace', fontSize: '10px', color: '#f6757a' }).setOrigin(0.5).setDepth(15)
    this.scene.tweens.add({ targets: heart, y: heart.y - 20, alpha: 0, duration: 900, onComplete: () => heart.destroy() })
  }

  destroy(fromScene) {
    this.mark?.destroy()
    super.destroy(fromScene)
  }
}
