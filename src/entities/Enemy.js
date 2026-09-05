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
//              climber (Nasenbär):    läuft hinterher und springt auf Plattformen
//              dropper (Faultier):    hängt am Ast und lässt sich fallen
//              marcher (Ameise):      marschiert nur, greift nie an
//    turn    nur beim Wildschwein: Pause zwischen zwei Sturmläufen
//    dizzy   danach benommen/außer Puste → tut nicht weh, gut zu treffen
//
//  Die AMPEL über dem Kopf (updateMark) sagt immer dasselbe – bei jedem Tier:
//    ?  weiß   verwirrt, aber harmlos (stromert, sitzt, hängt)
//    !  gelb   hat dich gesehen – gleich geht's los (noch harmlos)
//    !  rot    GEFAHR: greift an, Berühren tut weh (pulsiert)
//    ★  gelb   benommen: harmlos und jetzt gut zu treffen
//    ♥  rosa   geheilt
//  Weh tut ein Gegner NUR bei Rot – ohne Ausnahme, damit Kinder sich darauf verlassen können.
// ============================================================
import Phaser from 'phaser'
import { P } from '../palette.js'

const rand = Phaser.Math.Between
const MARK = { weiss: '#ffffff', gelb: '#fee761', rot: '#e43b44', rosa: '#f6757a' }

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
    this.mark = scene.add.text(0, 0, '!', { fontFamily: 'monospace', fontSize: '10px', color: '#fee761', stroke: '#181425', strokeThickness: 2 }).setOrigin(0.5).setDepth(25).setVisible(false)   // vor Deko und Farn-Ebene: das Zeichen muss man IMMER sehen
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
  // Greift er gerade an? (Ameisen: ihr Marsch IST der Angriff – anrempeln tut weh)
  get dangerous() { return this.state === 'roll' || (this.cfg.ai.kind === 'marcher' && this.state === 'wander') }
  // Tut er gerade weh, wenn man ihn berührt? NUR beim Angriff (rotes "!") –
  // beim Stromern, Erschrecken und Benommensein ist jeder Gegner harmlos.
  hurtsOnTouch(time) { return !this.healed && !this.isCalm(time) && this.dangerous }

  // Vom Stampfer erwischt → sofort benommen (verwundbar)
  stun(time, ms) {
    if (this.healed) return
    this.stopRolling()
    this.state = 'dizzy'
    this.stateUntil = time + ms
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
      // Geheilte Ameisen marschieren weiter – dann sollen die Beinchen auch laufen,
      // sonst rutscht die Kolonne steif über den Boden. (Nur bei Ameisen: ihr
      // geheiltes Bild ist dasselbe wie das normale, bei anderen Tieren nicht.)
      if (ai.kind === 'marcher' && !this.wanderPause && this.scene.anims.exists(this.cfg.key + '-lauf')
          && (!this.anims.isPlaying || this.anims.currentAnim?.key !== this.cfg.key + '-lauf')) {
        this.useTexture(this.cfg.key + '-lauf')
        this.play(this.cfg.key + '-lauf', true)
      }
      // Das Herz schwebt noch kurz mit und blendet dann aus
      if (this.markHideAt) {
        if (time > this.markHideAt) { this.showMark(false); this.markHideAt = 0 }
        else this.mark.setPosition(this.x, this.body.top - 8 + Math.sin(time / 200) * 0.8)
      }
      return
    }
    if (this.isCalm(time)) { this.setVelocityX(0); this.mark.setVisible(false); return }

    switch (this.state) {
      case 'perch': {
        // Faultier: hängt am Ast und wartet, bis jemand darunter durchläuft
        this.setVelocity(0, 0)
        this.y = this.perch.y + Math.sin(time / 900) * 1.5
        const unten = heroes.find((h) => Math.abs(h.x - this.x) <= (ai.dropWidth ?? 22) && h.body.top > this.body.bottom - 6)
        if (unten && time >= this.alertReadyAt) {
          this.state = 'alert'
          this.stateUntil = time + ai.alertMs
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
        // Ameisen trödeln nicht herum: sie marschieren stur geradeaus, alle in
        // dieselbe Richtung – sonst ist von der Kolonne nach kurzer Zeit nichts mehr zu sehen.
        if (ai.kind === 'marcher') {
          this.wanderPause = false
          this.walk(ai.wanderSpeed, groundLayer)
          break
        }
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
        if (time >= this.alertReadyAt) {
          const seen = heroes.find((h) => Math.abs(h.x - this.x) <= ai.sight.x && Math.abs(h.body.bottom - this.body.bottom) <= ai.sight.y)
          if (seen) {
            this.target = seen
            this.state = 'alert'
            this.stateUntil = time + ai.alertMs
            this.dir = Math.sign(seen.x - this.x) || this.dir
            this.setVelocityX(0)
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
            // Nach der Salve ist er nicht "benommen" (er ist ja nicht müde) – er schaut
            // sich nur eine Weile um. Diese Pause ist die Zeit, um zu ihm hinaufzuklettern.
            this.state = 'wander'; this.stateUntil = time; this.wanderPause = true
            this.alertReadyAt = time + ai.cooldownMs
          }
          break
        }
        if (ai.kind === 'dropper') {
          // --- Faultier: fällt herunter, bis es aufkommt ---
          this.setVelocityX(0)
          if (this.onGround) { this.state = 'dizzy'; this.stateUntil = time + ai.dizzyMs; this.scene.sfx?.play('slam') }
          break
        }
        if (ai.kind === 'climber') {
          // --- Nasenbär: läuft hinterher und SPRINGT auf Plattformen.
          // Den Weg sucht er auf der Landkarte der Stehflächen (PlatformGraph), genau wie
          // der Begleiter: Auf welcher Fläche steht das Ziel, welche Fläche ist der nächste
          // Schritt dorthin? Er schwebt nie – gesprungen wird nur mit den Füßen am Boden.
          const ziel = this.target ?? heroes[0]
          const graph = this.scene.graph
          const tempo = ai.rollSpeed ?? 70
          if (ziel && graph) {
            if (this.onGround) this.meineFlaeche = graph.platformAt(this)
            if (ziel.onGround) this.zielFlaeche = graph.platformAt(ziel)
            let punkt = { x: ziel.x, bottom: ziel.body.bottom, flaeche: this.zielFlaeche }
            if (this.meineFlaeche && this.zielFlaeche && this.meineFlaeche !== this.zielFlaeche) {
              const next = graph.nextStep(this.meineFlaeche, this.zielFlaeche)
              // Zwischenziel: der Punkt auf der nächsten Fläche, der ihm am nächsten ist
              if (next && next !== this.zielFlaeche) punkt = { x: Phaser.Math.Clamp(this.x, next.px0 + 8, next.px1 - 8), bottom: next.py, flaeche: next }
            }
            const dx = punkt.x - this.x
            if (this.onGround && Math.abs(dx) > 4) this.dir = Math.sign(dx)
            const zielOben = punkt.bottom < this.body.bottom - 12
            const fl = punkt.flaeche
            // Absprung-Fenster: Beim Erreichen der Kante muss er schon um `rise` Pixel gestiegen
            // sein – springt er zu früh, stößt er sich den Kopf an der Unterseite, springt er zu
            // spät, fällt er wieder herunter. Aus Sprungkraft v und Schwerkraft g folgt, WANN er
            // so hoch ist: t = (v ∓ √(v² − 2·g·rise)) / g. Mit seinem Lauftempo wird daraus ein
            // Abstand zur Kante: [minAbstand, maxAbstand]. Genau da springt er ab – wie ein
            // echtes Tier, das den Sprung abschätzt.
            const v = ai.jump ?? 380, g = this.scene.physics.world.gravity.y
            const rise = this.body.bottom - punkt.bottom + 2
            const disc = v * v - 2 * g * rise
            const minAbstand = disc > 0 ? tempo * (v - Math.sqrt(disc)) / g + 2 : 30
            const maxAbstand = disc > 0 ? tempo * (v + Math.sqrt(disc)) / g - 8 : -1
            // Steht er UNTER der Zielfläche (oder zu dicht daneben)? Dann erst hinauslaufen,
            // bis der Absprung-Abstand erreicht ist – immer zur selben Seite, sonst zappelt er.
            const darunter = zielOben && fl && fl.py < this.body.top && this.body.right > fl.px0 - minAbstand && this.body.left < fl.px1 + minAbstand
            if (darunter && this.onGround) {
              if (!this.rausRichtung) this.rausRichtung = (this.x - fl.px0) < (fl.px1 - this.x) ? -1 : 1
              this.dir = this.rausRichtung
            } else this.rausRichtung = 0
            // Hat er das Ziel auf gleicher Höhe erreicht, bleibt er dran (statt drumherum zu zappeln)
            const dran = !zielOben && Math.abs(dx) < 8 && Math.abs(punkt.bottom - this.body.bottom) <= 12
            this.setVelocityX(dran ? 0 : this.dir * tempo)
            // Springen: nur am Boden, nicht zu oft – gegen eine Wand, oder hinauf, wenn die
            // Kante im Absprung-Fenster liegt und über ihm genug Platz frei ist.
            if (this.onGround && time >= this.nextHopAt) {
              const wand = this.dir < 0 ? this.body.blocked.left : this.body.blocked.right
              let hinauf = false
              if (zielOben && !darunter && fl && maxAbstand > 0) {
                const kante = this.dir > 0 ? fl.px0 - this.body.right : this.body.left - fl.px1
                hinauf = kante >= minAbstand - 2 && kante <= maxAbstand && !this.deckeUeber(groundLayer, rise + this.body.height + 4)
              }
              if (wand || hinauf) { this.setVelocityY(-v); this.nextHopAt = time + (ai.jumpEveryMs ?? 600) }
            }
          } else {
            this.setVelocityX(this.dir * tempo)
          }
          if (time >= this.stateUntil) { this.setVelocityX(0); this.state = 'dizzy'; this.stateUntil = time + ai.dizzyMs }
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
            } else if (this.body.velocity.y === 0) {
              this.setVelocityX(0)   // kurz sammeln vor dem nächsten Satz
            }
          }
          if (time >= this.stateUntil) { this.setVelocityX(0); this.state = 'dizzy'; this.stateUntil = time + ai.dizzyMs }
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
            break
          }
          this.stopRolling()
          this.state = 'dizzy'
          this.stateUntil = time + ai.dizzyMs
        }
        break
      }
      case 'turn':
        this.setVelocityX(0)
        if (time >= this.stateUntil) {
          this.state = 'roll'
          this.stateUntil = time + (ai.rollMaxMs ?? 2000)
          this.useTexture(this.cfg.key + '-kugel')
        }
        break
      case 'dizzy':
        this.setVelocityX(0)
        // schnaufende Animation, wenn es eine gibt (Wildschwein)
        if (this.scene.anims.exists(this.cfg.key + '-muede') && this.anims.currentAnim?.key !== this.cfg.key + '-muede') { this.play(this.cfg.key + '-muede'); this.useTexture(this.cfg.key + '-muede') }
        if (time >= this.stateUntil) {
          this.state = ai.kind === 'dropper' ? 'return' : 'wander'
          this.stateUntil = time
          this.alertReadyAt = time + ai.cooldownMs
        }
        break
    }

    if (this.state !== 'roll' || ai.rotate === false || ai.kind === 'hopper') this.setFlipX(this.dir > 0)
    // Lauf-Animation, wenn es eine gibt (nur beim Gehen); im Alarm läuft die Alarm-Animation
    // Läuft er gerade? Auch beim Verfolgen/Hüpfen/Marschieren sollen die Beine gehen –
    // sonst rutscht ein Gegner wie ein Möbelstück über den Boden.
    const jagt = this.state === 'roll' && (['hopper', 'climber', 'marcher'].includes(ai.kind) || ai.laufAnim)   // laufAnim: auch beim Sprint die Beine bewegen (Eidechse)
    const walking = (this.state === 'wander' && !this.wanderPause) || jagt
    if (this.scene.anims.exists(this.cfg.key + '-lauf')) {
      // WICHTIG: auch `isPlaying` prüfen! Nach einem anims.stop() merkt sich Phaser
      // die letzte Animation weiter – ohne diese Prüfung liefe sie nie wieder an
      // (der Gegner rutschte dann nach jeder Pause steif über den Boden).
      if (walking) {
        if (!this.anims.isPlaying || this.anims.currentAnim?.key !== this.cfg.key + '-lauf') {
          this.useTexture(this.cfg.key + '-lauf')
          this.play(this.cfg.key + '-lauf', true)
        }
      }
      else if (this.anims.isPlaying && this.state !== 'alert' && this.state !== 'dizzy') { this.anims.stop(); this.useTexture(this.state === 'roll' ? this.cfg.key + '-kugel' : this.cfg.key) }
    }
    if (time > this.flashUntil && !this.isCalm(time)) this.clearTint()
    this.updateMark(time)
  }

  // Die Ampel über dem Kopf (Legende oben in der Datei). Immer sichtbar, solange
  // das Tier nicht geheilt ist – so sieht man auf einen Blick, was gerade Sache ist.
  updateMark(time) {
    const hurts = this.hurtsOnTouch(time)
    const benommen = this.state === 'dizzy' || this.state === 'turn' || this.state === 'rest'
    const [text, farbe] = hurts ? ['!', MARK.rot] : this.state === 'alert' ? ['!', MARK.gelb] : benommen ? ['★', MARK.gelb] : ['?', MARK.weiss]
    if (this.mark.text !== text || this.markFarbe !== farbe) { this.mark.setText(text).setColor(farbe); this.markFarbe = farbe }
    this.mark.setVisible(true)
    this.mark.setAngle(benommen ? Math.sin(time / 100) * 20 : 0)       // benommen: torkelt
    this.mark.setScale(hurts ? 1.1 + Math.sin(time / 110) * 0.2 : 1)   // Gefahr: pulsiert
    this.mark.setPosition(this.x, this.body.top - 8)
  }

  // Ist über dem Kopf (bis "hoehe" Pixel hoch) irgendwo eine Kachel? (links, Mitte, rechts)
  deckeUeber(groundLayer, hoehe = 72) {
    for (const x of [this.body.left + 1, this.x, this.body.right - 1]) {
      for (let y = this.body.top - 2; y > this.body.top - hoehe; y -= 8) {
        if (groundLayer.getTileAtWorldXY(x, y) !== null) return true
      }
    }
    return false
  }

  // Normales Laufen: an Wand oder Abgrund umdrehen – fällt nie von seiner Plattform
  walk(speed, groundLayer) {
    const blocked = this.dir < 0 ? this.body.blocked.left : this.body.blocked.right
    if (this.onGround && (blocked || !this.groundAhead(groundLayer))) {
      this.dir = -this.dir
      // Ameisen laufen im Gänsemarsch: dreht eine um, drehen alle um.
      // Sonst löst sich die Reihe nach ein paar Stufen in lauter Einzelgänger auf.
      if (this.cfg.ai?.kind === 'marcher' && this.groupMates) for (const m of this.groupMates) m.dir = this.dir
    }
    this.setVelocityX(this.dir * speed)
  }

  // Ist vor mir Boden? Auch eine oder zwei Stufen tiefer zählt – sonst bleibt
  // ein rollender Igel an jeder kleinen Geländestufe stehen.
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

  showMark(on, text, farbe = MARK.gelb) {
    this.mark.setVisible(on).setScale(1)
    if (text) { this.mark.setText(text).setAngle(0).setColor(farbe); this.markFarbe = farbe }
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

  heal(vonDerGruppe = false) {
    this.healed = true
    this.body.setAllowGravity(true)
    // Ameisen: es reicht, EINE zu treffen – die ganze Kolonne wacht mit auf
    if (this.groupMates && !vonDerGruppe) for (const m of this.groupMates) if (m !== this && !m.healed) m.heal(true)
    this.hp = 0
    this.clearTint()
    this.setVelocity(0, 0)
    this.setAngle(0)
    this.showMark(false)
    this.stateUntil = 0
    this.wanderPause = true
    // WICHTIG: erst die laufende Animation anhalten! Sonst malt Phaser im
    // nächsten Bild wieder ein Bild aus dem Hüpf-/Lauf-Film darüber – der Hase
    // sah dann geheilt immer noch böse aus.
    this.anims.stop()
    if (this.scene.textures.exists(this.cfg.key + '-heil')) this.useTexture(this.cfg.key + '-heil')
    // Blattschneiderameisen: alle kehren um und tragen wieder ein Blatt nach Hause.
    // Das Umdrehen und das Blatt sind das Zeichen: die Kolonne ist geheilt.
    if (this.cfg.ai?.kind === 'marcher') {
      this.dir = -this.dir
      this.wanderPause = false
      this.stateUntil = Number.MAX_SAFE_INTEGER      // kein zufälliges Stehenbleiben mehr
      // Aus dem "?" wird ein Herz: das sieht man auch im dichten Grün noch.
      this.showMark(true, '♥', MARK.rosa)
      this.markHideAt = this.scene.time.now + 2500
    }
    // Ein Herz steigt auf – bei JEDER Ameise, damit man sofort sieht,
    // dass die ganze Reihe erlöst ist und nicht nur die eine, die man getroffen hat.
    const heart = this.scene.add.text(this.x, this.body.top - 4, '♥', { fontFamily: 'monospace', fontSize: '10px', color: '#f6757a' }).setOrigin(0.5).setDepth(15)
    this.scene.tweens.add({ targets: heart, y: heart.y - 20, alpha: 0, duration: 900, onComplete: () => heart.destroy() })
  }

  destroy(fromScene) {
    this.mark?.destroy()
    super.destroy(fromScene)
  }
}
