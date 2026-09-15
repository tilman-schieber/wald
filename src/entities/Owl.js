// ============================================================
//  OWL — die verwirrte Eule
// ============================================================
//  Sitzt auf ihrem Platz (dem Punkt aus Tiled, in der Luft). Sieht
//  sie einen Helden, stürzt sie im Sturzflug auf ihn herab, landet
//  am Boden, sitzt kurz benommen (jetzt zuschlagen!) und fliegt dann
//  zurück auf ihren Ast. Nur am Boden kann man sie treffen.
//
//  Die Graja (ai.tiefflug) macht es anders: Sie fliegt erst VOR den
//  Helden hinunter (Anflug, gelb, noch harmlos) und fegt dann im
//  Tiefflug quer über den Boden an ihm vorbei (rot – drüberspringen
//  oder ducken!). Wo der Flug endet, sitzt sie kurz – da trifft man sie.
// ============================================================
import Phaser from 'phaser'
import Enemy from './Enemy.js'

const GELB = '#fee761'

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

  // Aufgesetzt? Zählt erst unterhalb des Sitzplatzes: Hockt sie dicht über einer Plattform,
  // meldet die Physik schon am Ast "blocked.down".
  gelandet() { return this.body.blocked.down && this.y > this.perch.y + 8 }

  // Zu einem Punkt fliegen. Sitzt sie noch auf einer Plattformkante (blocked.down), kann sie
  // nicht nach unten – dann erst waagerecht von der Kante herunter, und das Ziel rutscht mit,
  // damit sie nie rückwärts fliegen muss.
  fliegZu(ziel, speed) {
    if (this.body.blocked.down && !this.gelandet()) {
      this.setVelocity(this.dir * speed, 0)
      if ((ziel.x - this.x) * this.dir < 0) ziel.x = this.x
    } else this.scene.physics.moveTo(this, ziel.x, ziel.y, speed)
  }
  get dangerous() { return this.state === 'swoop' }   // nur der Sturzflug tut weh

  update(time, groundLayer, heroes = []) {
    if (this.healed) { this.setVelocity(0, 0); this.body.setAllowGravity(true); this.mark.setPosition(this.x, this.body.top - 8 + Math.sin(time / 200) * 0.8); return }   // geheilt: setzt sich hin, Herz bleibt
    if (this.isCalm(time)) { this.setVelocity(0, 0); this.mark.setVisible(false); return }
    const ai = this.cfg.ai
    switch (this.state) {
      case 'perch': {
        this.setVelocity(0, 0)
        this.y = this.perch.y + Math.sin(time / 500) * 1.5          // leichtes Wippen
        if (time >= this.alertReadyAt) {
          const seen = heroes.find((h) => Math.abs(h.x - this.x) <= ai.sight.x && h.y > this.y && h.y - this.y <= ai.sight.y)
          if (seen) { this.state = 'alert'; this.stateUntil = time + ai.alertMs; this.target = seen }
        }
        break
      }
      case 'alert':
        this.dir = Math.sign(this.target.x - this.x) || this.dir
        if (time >= this.stateUntil) {
          this.useTexture(this.cfg.key + '-flug')
          if (ai.tiefflug) {
            // Graja: erst zu einem Punkt VOR dem Helden hinunter (auf seiner Höhe), noch harmlos
            this.state = 'anflug'
            this.stateUntil = time + 1500
            this.swoopTo = { x: this.target.x - this.dir * (ai.anlauf ?? 70), y: this.target.body.bottom - this.body.height / 2 }
            this.fliegZu(this.swoopTo, ai.swoopSpeed)
          } else {
            this.state = 'swoop'
            // Zielpunkt: dort, wo der Held gerade steht
            this.swoopTo = { x: this.target.x, y: this.target.body.bottom - this.body.height / 2 }
            this.fliegZu(this.swoopTo, ai.swoopSpeed)
          }
        }
        break
      case 'anflug': {
        // "Gelandet" zählt erst unterhalb des Sitzplatzes – sitzt sie dicht über einer Plattform,
        // meldet die Physik schon am Ast "blocked.down", und sie würde sofort losfegen.
        const nah = Phaser.Math.Distance.Between(this.x, this.y, this.swoopTo.x, this.swoopTo.y) < 8
        if (nah || this.gelandet() || time >= this.stateUntil) {
          // Jetzt der Tiefflug: quer am Helden vorbei, bis die Strecke um ist oder eine Wand kommt
          this.state = 'swoop'
          this.dir = Math.sign(this.target.x - this.x) || this.dir
          this.strafeEndX = this.x + this.dir * ((ai.anlauf ?? 70) + (ai.strecke ?? 150))
          this.stateUntil = time + 2500
          this.setVelocity(this.dir * ai.swoopSpeed, 0)
        } else this.fliegZu(this.swoopTo, ai.swoopSpeed)
        break
      }
      case 'swoop':
        if (ai.tiefflug) {
          const wand = this.dir < 0 ? this.body.blocked.left : this.body.blocked.right
          if ((this.x - this.strafeEndX) * this.dir >= 0 || wand || time >= this.stateUntil) {
            this.state = 'rest'
            this.stateUntil = time + ai.restMs
            this.setVelocity(0, 0)
            this.useTexture(this.scene.textures.exists(this.cfg.key + '-boden') ? this.cfg.key + '-boden' : this.cfg.key)
          }
          break
        }
        if (Phaser.Math.Distance.Between(this.x, this.y, this.swoopTo.x, this.swoopTo.y) < 8 || this.gelandet()) {
          this.state = 'rest'
          this.stateUntil = time + ai.restMs
          this.setVelocity(0, 0)
          this.useTexture(this.scene.textures.exists(this.cfg.key + '-boden') ? this.cfg.key + '-boden' : this.cfg.key)   // am Boden: ohne Ast
        } else this.fliegZu(this.swoopTo, ai.swoopSpeed)
        break
      case 'rest':
        this.setVelocity(0, 0)
        if (time >= this.stateUntil) {
          this.state = 'return'
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
    // Flügelschlag im Flug, wenn es die Animation gibt
    const flying = this.state === 'swoop' || this.state === 'return' || this.state === 'anflug'
    if (this.scene.anims.exists(this.cfg.key + '-flug-anim')) {
      if (flying) { if (!this.anims.isPlaying || this.anims.currentAnim?.key !== this.cfg.key + '-flug-anim') { this.useTexture(this.cfg.key + '-flug-anim'); this.play(this.cfg.key + '-flug-anim', true) } }
      else if (this.anims.isPlaying) { this.anims.stop(); this.useTexture(this.state === 'rest' && this.scene.textures.exists(this.cfg.key + '-boden') ? this.cfg.key + '-boden' : this.cfg.key) }
    }
    if (this.body.velocity.x !== 0) this.dir = Math.sign(this.body.velocity.x)
    this.setFlipX(this.dir > 0)
    if (time > this.flashUntil && !this.isCalm(time)) this.clearTint()
    this.updateMark(time)
    if (this.state === 'anflug') this.showMark(true, '!', GELB)   // Anflug: gleich geht's los, noch harmlos
  }

  // Der Stampfer erwischt nur, was am Boden sitzt – ein fliegender Vogel spürt nichts davon
  stampfbar() { return !this.healed && this.state === 'rest' }

  stun(time, ms) {
    if (!this.stampfbar()) return   // in der Luft erwischt sie nichts
    this.state = 'rest'; this.stateUntil = time + ms; this.setVelocity(0, 0); this.useTexture(this.scene.textures.exists(this.cfg.key + '-boden') ? this.cfg.key + '-boden' : this.cfg.key)
  }

  hit(damage, fromX, time) {
    const r = super.hit(damage, fromX, time)
    if (r !== null && !this.healed) { this.setVelocity(0, 0); if (this.state === 'rest') this.stateUntil = Math.max(this.stateUntil, time + 700) }
    return r
  }
}
