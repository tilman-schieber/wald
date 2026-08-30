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
//    attack  der Angriff – je nach ai.kind:
//              roller  (Igel):        rollt als Kugel geradeaus (drüberhüpfen!)
//              charger (Wildschwein): stürmt, dreht um, stürmt nochmal (mehrmals)
//              hopper  (Hase):        hüpft in großen Sätzen heran
//              thrower (Affe):        sitzt oben und wirft Früchte im Bogen
//              climber (Nasenbär):    läuft hinterher und klettert Wände hoch
//              dropper (Faultier):    hängt am Ast und lässt sich fallen
//              marcher (Ameise):      marschiert nur, greift nie an
//    turn    nur beim Wildschwein: Pause zwischen zwei Sturmläufen
//    dizzy   danach benommen/außer Puste → tut nicht weh, gut zu treffen
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
    this.chargesLeft = 0
    this.hopsLeft = 0
    this.nextHopAt = 0
    this.throwsLeft = 0
    this.nextThrowAt = 0
    this.target = null
    this.perch = { x, y: this.y }        // Ausgangsplatz (für Faultier)
    if (cfg.ai?.kind === 'dropper') { this.body.setAllowGravity(false); this.state = 'perch' }
    this.wanderPause = false
    this.alertReadyAt = 0
    this.mark = scene.add.text(0, 0, '!', { fontFamily: 'monospace', fontSize: '10px', color: '#fee761', stroke: '#181425', strokeThickness: 2 }).setOrigin(0.5).setDepth(9).setVisible(false)
  }

  // Bild wechseln und die Trefferbox unten-mittig neu ausrichten
  useTexture(key) {
    if (!this.scene.textures.exists(key)) return
    this.setTexture(key)
    const f = this.frame
    this.body.setSize(this.cfg.body.w, this.cfg.body.h)
    this.body.setOffset((f.width - this.cfg.body.w) / 2, f.height - this.cfg.body.h)
  }

  get onGround() { return this.body.blocked.down }
  isCalm(time) { return time < this.calmUntil }
  // Kann man ihn gerade treffen?
  isVulnerable(time) { return !this.cfg.ai.spiky || this.state === 'dizzy' || this.state === 'turn' || this.isCalm(time) }
  // Tut er gerade weh, wenn man ihn berührt?
  hurtsOnTouch(time) { return !this.healed && !this.isCalm(time) && this.state !== 'dizzy' && this.state !== 'turn' }

  // Vom Stampfer erwischt → sofort benommen (verwundbar)
  stun(time, ms) {
    if (this.healed) return
    this.stopRolling()
    this.state = 'dizzy'
    this.stateUntil = time + ms
    this.showMark(true, '★')
  }

  calm(time, ms) {
    this.calmUntil = time + ms
    this.setTint(P.eisBlau)
    this.stopRolling()
  }

  update(time, groundLayer, heroes = []) {
    const ai = this.cfg.ai
    if (this.healed) {                                       // geheilt: schnüffelt gemütlich herum
      if (time >= this.stateUntil) {
        this.wanderPause = !this.wanderPause
        if (!this.wanderPause) this.dir = Math.random() < 0.5 ? -1 : 1
        this.stateUntil = time + (this.wanderPause ? rand(1500, 4000) : rand(600, 1500))
      }
      if (this.wanderPause) this.setVelocityX(0)
      else this.walk(ai.healedWanderSpeed ?? 10, groundLayer)
      this.setFlipX(this.dir > 0)
      this.y += Math.sin(time / 400) * 0.02   // ganz leichtes Atmen
      return
    }
    if (this.isCalm(time)) { this.setVelocityX(0); this.showMark(false); return }

    switch (this.state) {
      case 'perch': {
        // Faultier: hängt am Ast und wartet, bis jemand darunter durchläuft
        this.setVelocity(0, 0)
        this.y = this.perch.y + Math.sin(time / 900) * 1.5
        const unten = heroes.find((h) => Math.abs(h.x - this.x) <= (ai.dropWidth ?? 22) && h.body.top > this.body.bottom - 6)
        if (unten && time >= this.alertReadyAt) {
          this.state = 'alert'
          this.stateUntil = time + ai.alertMs
          this.showMark(true, '!')
        }
        break
      }
      case 'return': {
        // langsam zurück an den Ast klettern
        this.body.setAllowGravity(false)
        this.scene.physics.moveTo(this, this.perch.x, this.perch.y, ai.climbSpeed ?? 30)
        if (Phaser.Math.Distance.Between(this.x, this.y, this.perch.x, this.perch.y) < 4) {
          this.setPosition(this.perch.x, this.perch.y)
          this.setVelocity(0, 0)
          this.state = 'perch'
          this.alertReadyAt = time + ai.cooldownMs
        }
        break
      }
      case 'wander': {
        if (time >= this.stateUntil) {                       // neue Laune: laufen oder stehen?
          this.wanderPause = !this.wanderPause
          if (!this.wanderPause) this.dir = Math.random() < 0.5 ? -1 : 1
          this.stateUntil = time + (this.wanderPause ? rand(400, 1800) : rand(700, 2500))
        }
        if (this.wanderPause) this.setVelocityX(0)
        else {
          this.walk(ai.wanderSpeed, groundLayer)
          // Hase: hüpft auch beim Stromern statt zu laufen
          if (ai.wanderHopMs && this.onGround && time >= this.nextHopAt) {
            this.nextHopAt = time + ai.wanderHopMs
            this.setVelocityY(-150)
          }
        }

        // Sieht er einen Helden?
        if (ai.kind === 'marcher') break            // Ameisen marschieren nur, sie greifen nie an
        if (time >= this.alertReadyAt) {
          const seen = heroes.find((h) => Math.abs(h.x - this.x) <= ai.sight.x && Math.abs(h.body.bottom - this.body.bottom) <= ai.sight.y)
          if (seen) {
            this.target = seen
            this.state = 'alert'
            this.stateUntil = time + ai.alertMs
            this.dir = Math.sign(seen.x - this.x) || this.dir
            this.setVelocityX(0)
            this.showMark(true, '!')
            // Einroll-/Schnaub-Animation, wenn es eine gibt (läuft einmal durch)
            if (this.scene.anims.exists(this.cfg.key + '-alarm')) { this.anims.stop(); this.useTexture(this.cfg.key + '-alarm'); this.play(this.cfg.key + '-alarm') }
          }
        }
        break
      }
      case 'alert':
        this.setVelocityX(0)
        if (time >= this.stateUntil) {
          this.state = 'roll'
          this.stateUntil = time + (ai.rollMaxMs ?? 2000)
          this.chargesLeft = ai.charges ?? 0
          this.hopsLeft = ai.hops ?? 0
          this.throwsLeft = ai.throws ?? 0
          this.nextHopAt = 0
          this.nextThrowAt = 0
          if (ai.kind === 'dropper') this.body.setAllowGravity(true)     // loslassen!
          if (!['hopper', 'thrower', 'climber', 'dropper'].includes(ai.kind)) this.useTexture(this.cfg.key + '-kugel')
          this.showMark(false)
        }
        break
      case 'roll': {
        if (ai.kind === 'thrower') {
          // --- Affe: sitzt und wirft Früchte im Bogen ---
          this.setVelocityX(0)
          if (this.target) { this.dir = Math.sign(this.target.x - this.x) || this.dir }
          if (this.throwsLeft > 0 && time >= this.nextThrowAt) {
            this.throwsLeft--
            this.nextThrowAt = time + (ai.throwEveryMs ?? 700)
            this.scene.wirfFrucht?.(this, this.target)
          } else if (this.throwsLeft <= 0 && time >= this.nextThrowAt) {
            this.state = 'dizzy'; this.stateUntil = time + ai.dizzyMs; this.showMark(true, '★')
          }
          break
        }
        if (ai.kind === 'dropper') {
          // --- Faultier: fällt herunter, bis es aufkommt ---
          this.setVelocityX(0)
          if (this.onGround) { this.state = 'dizzy'; this.stateUntil = time + ai.dizzyMs; this.showMark(true, '★'); this.scene.sfx?.play('slam') }
          break
        }
        if (ai.kind === 'climber') {
          // --- Nasenbär: läuft hinterher und klettert hoch, wenn das Ziel oben ist.
          // Klettern in drei einfachen Schritten:
          //   'hoch'    – gerade nach oben (nicht zur Seite ziehen lassen!)
          //   'seite'   – stößt er unten gegen eine Plattform, geht er zur freien Kante
          //   angekommen – auf gleicher Höhe hüpft er auf die Kante
          const ziel = this.target ?? heroes[0]
          const dx = ziel ? ziel.x - this.x : 0
          const zielOben = ziel && ziel.body.bottom < this.body.bottom - 12
          if (!this.klettert) this.dir = Math.sign(dx) || this.dir

          if (!this.klettert && zielOben && Math.abs(dx) <= (ai.climbWidth ?? 34)) {
            this.klettert = true
            this.kletterPhase = 'hoch'
          }

          // Erst hinüberhangeln, wenn er WIRKLICH über der Kante ist – sonst
          // stößt er von der Seite gegen die Plattform und kommt nicht weiter.
          if (this.klettert && ziel && this.kletterPhase !== 'rueber' && this.body.bottom <= ziel.body.bottom - 3) {
            this.kletterPhase = 'rueber'
            this.dir = Math.sign(dx) || this.dir
          }
          if (this.klettert) {
            this.body.setAllowGravity(false)
            const deckeFrei = groundLayer.getTileAtWorldXY(this.x, this.body.top - 6) === null
            if (this.kletterPhase === 'hoch') {
              if (!deckeFrei || this.body.blocked.up) { this.kletterPhase = 'seite'; this.ausweichen = this.freieSeite(groundLayer) }
              else this.setVelocity(0, -(ai.climbSpeed ?? 60))
              if (ziel && this.body.bottom < ziel.body.bottom - 60) { this.kletterPhase = 'rueber'; this.dir = Math.sign(dx) || this.dir }   // nicht endlos hoch
            }
            if (this.kletterPhase === 'seite') {
              this.setVelocity(this.ausweichen * 70, 0)
              if (deckeFrei && !this.body.blocked.up) this.kletterPhase = 'hoch'
            }
            if (this.kletterPhase === 'rueber') {
              // hangelt sich seitlich, bis unter ihm fester Boden ist – dann loslassen
              this.setVelocity(this.dir * 70, 0)
              // stößt er dabei seitlich an, muss er noch ein Stück höher
              if (this.dir < 0 ? this.body.blocked.left : this.body.blocked.right) this.kletterPhase = 'hoch'
              if (groundLayer.getTileAtWorldXY(this.x, this.body.bottom + 4) !== null) {
                this.klettert = false
                this.body.setAllowGravity(true)
                this.setVelocity(0, 0)
              }
            }
          } else {
            this.body.setAllowGravity(true)
            this.setVelocityX(this.dir * (ai.rollSpeed ?? 70))
          }
          if (time >= this.stateUntil) { this.klettert = false; this.body.setAllowGravity(true); this.setVelocityX(0); this.state = 'dizzy'; this.stateUntil = time + ai.dizzyMs; this.showMark(true, '★') }
          break
        }
        if (ai.kind === 'hopper') {
          // --- Hase: große Sätze. Am Boden abspringen, in der Luft nur fliegen ---
          if (this.onGround) {
            if (this.hopsLeft > 0 && time >= this.nextHopAt) {
              this.hopsLeft--
              this.setVelocity(this.dir * ai.hopSpeed, -ai.hopPower)
              this.nextHopAt = time + 220
            } else if (this.hopsLeft <= 0 && time >= this.nextHopAt) {
              this.setVelocityX(0)
              this.state = 'dizzy'
              this.stateUntil = time + ai.dizzyMs
              this.showMark(true, '★')
            } else if (this.body.velocity.y === 0) {
              this.setVelocityX(0)   // kurz sammeln vor dem nächsten Satz
            }
          }
          if (time >= this.stateUntil) { this.setVelocityX(0); this.state = 'dizzy'; this.stateUntil = time + ai.dizzyMs; this.showMark(true, '★') }
          break
        }
        // --- Igel und Wildschwein: geradeaus ---
        this.setVelocityX(this.dir * ai.rollSpeed)
        if (ai.rotate !== false) this.angle += this.dir * 14 // die Kugel dreht sich (Wildschwein nicht)
        const blocked = this.dir < 0 ? this.body.blocked.left : this.body.blocked.right
        const edge = this.onGround && !this.groundAhead(groundLayer, 3)
        if (blocked || edge || time >= this.stateUntil) {
          if (ai.kind === 'charger' && this.chargesLeft > 0) {
            // Wildschwein: umdrehen und nochmal – dabei kurz stehen (jetzt trifft man es!)
            this.chargesLeft--
            this.dir = -this.dir
            this.setVelocityX(0)
            this.stopRolling()
            this.state = 'turn'
            this.stateUntil = time + (ai.turnMs ?? 400)
            this.showMark(true, '!')
            break
          }
          this.stopRolling()
          this.state = 'dizzy'
          this.stateUntil = time + ai.dizzyMs
          this.showMark(true, '★')
        }
        break
      }
      case 'turn':
        this.setVelocityX(0)
        if (time >= this.stateUntil) {
          this.state = 'roll'
          this.stateUntil = time + (ai.rollMaxMs ?? 2000)
          this.useTexture(this.cfg.key + '-kugel')
          this.showMark(false)
        }
        break
      case 'dizzy':
        this.setVelocityX(0)
        this.mark.setAngle(Math.sin(time / 100) * 20)
        // schnaufende Animation, wenn es eine gibt (Wildschwein)
        if (this.scene.anims.exists(this.cfg.key + '-muede') && this.anims.currentAnim?.key !== this.cfg.key + '-muede') { this.play(this.cfg.key + '-muede'); this.useTexture(this.cfg.key + '-muede') }
        if (time >= this.stateUntil) {
          this.state = ai.kind === 'dropper' ? 'return' : 'wander'
          this.stateUntil = time
          this.alertReadyAt = time + ai.cooldownMs
          this.showMark(false)
        }
        break
    }

    if (this.state !== 'roll' || ai.rotate === false || ai.kind === 'hopper') this.setFlipX(this.dir > 0)
    // Lauf-Animation, wenn es eine gibt (nur beim Gehen); im Alarm läuft die Alarm-Animation
    // Läuft er gerade? Auch beim Verfolgen/Hüpfen/Marschieren sollen die Beine gehen –
    // sonst rutscht ein Gegner wie ein Möbelstück über den Boden.
    const jagt = this.state === 'roll' && ['hopper', 'climber', 'marcher'].includes(ai.kind)
    const walking = (this.state === 'wander' && !this.wanderPause) || jagt
    if (this.scene.anims.exists(this.cfg.key + '-lauf')) {
      if (walking) { if (this.anims.currentAnim?.key !== this.cfg.key + '-lauf') { this.play(this.cfg.key + '-lauf'); this.useTexture(this.cfg.key + '-lauf') } }
      else if (this.anims.isPlaying && this.state !== 'alert' && this.state !== 'dizzy') { this.anims.stop(); this.useTexture(this.state === 'roll' ? this.cfg.key + '-kugel' : this.cfg.key) }
    }
    if (time > this.flashUntil && !this.isCalm(time)) this.clearTint()
    this.mark.setPosition(this.x, this.body.top - 8)
  }

  // Normales Laufen: an Wand oder Abgrund umdrehen – fällt nie von seiner Plattform
  walk(speed, groundLayer) {
    const blocked = this.dir < 0 ? this.body.blocked.left : this.body.blocked.right
    if (this.onGround && (blocked || !this.groundAhead(groundLayer))) this.dir = -this.dir
    this.setVelocityX(this.dir * speed)
  }

  // Ist vor mir Boden? Auch eine oder zwei Stufen tiefer zählt – sonst bleibt
  // ein rollender Igel an jeder kleinen Geländestufe stehen.
  // Nach welcher Seite ist der Weg nach oben frei? (für kletternde Gegner)
  // Wir schauen links und rechts nach der ersten Spalte ohne Decke über uns.
  freieSeite(groundLayer, weite = 6) {
    for (let i = 1; i <= weite; i++) {
      for (const s of [1, -1]) {
        const x = this.x + s * i * 16
        if (groundLayer.getTileAtWorldXY(x, this.body.top - 8) === null) return s
      }
    }
    return 1
  }

  // Steht direkt vor mir (auf Bauchhöhe) eine feste Kachel?
  wallAhead(groundLayer) {
    const x = this.x + this.dir * (this.body.width / 2 + 3)
    return groundLayer.getTileAtWorldXY(x, this.body.center.y) !== null
  }

  groundAhead(groundLayer, tiefe = 1) {
    const aheadX = this.x + this.dir * (this.body.width / 2 + 2)
    for (let i = 0; i < tiefe; i++) {
      if (groundLayer.getTileAtWorldXY(aheadX, this.body.bottom + 2 + i * 16) !== null) return true
    }
    return false
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
    this.body.setAllowGravity(true)
    // Ameisen: die ganze Kolonne kehrt mit der Anführerin um
    if (this.groupMates && !silent) for (const m of this.groupMates) if (m !== this && !m.healed) m.heal(true)
    this.hp = 0
    this.clearTint()
    this.setVelocity(0, 0)
    this.setAngle(0)
    this.showMark(false)
    this.stateUntil = 0
    this.wanderPause = true
    if (this.scene.textures.exists(this.cfg.key + '-heil')) this.useTexture(this.cfg.key + '-heil')
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
