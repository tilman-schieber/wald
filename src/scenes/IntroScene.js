// ============================================================
//  INTRO-SZENE — die Geschichte in fünf Sätzen
// ============================================================
import Phaser from 'phaser'
import { GAME, INTROS, UI } from '../config.js'
import { P, hex } from '../palette.js'

export default class IntroScene extends Phaser.Scene {
  constructor() { super('Intro') }

  init(data) {
    this.forest = data.forest ?? 'schwarzwald'
    this.room = data.room ?? this.forest
    this.spawn = data.spawn ?? 'start'
    this.folien = INTROS[this.forest] ?? []
  }

  create() {
    if (!this.folien.length) return this.start()
    const W = GAME.width, H = GAME.height
    const font = document.fonts?.check?.(`8px "${UI.fontFamily}"`) ? UI.fontFamily : 'monospace'
    this.add.rectangle(0, 0, W, H, P.nachtBlau).setOrigin(0)
    this.pics = this.folien.map((f, i) => { const k = 'intro-' + this.forest + '-' + i; return this.textures.exists(k) ? this.add.image(0, 0, k).setOrigin(0).setAlpha(i === 0 ? 1 : 0) : null })
    this.add.rectangle(0, H - 64, W, 64, P.schwarz, 0.6).setOrigin(0)
    this.slide = 0
    this.line = 0
    this.text = this.add.text(W / 2, H - 40, '', { fontFamily: font, fontSize: font === 'monospace' ? '9px' : '11px', color: '#ffffff', stroke: hex(P.schwarz), strokeThickness: 3, align: 'center', wordWrap: { width: W - 70, useAdvancedWrap: true } }).setOrigin(0.5)
    this.hint = this.add.text(W / 2, H - 10, 'Leertaste / Antippen: weiter   ·   Esc: überspringen', { fontFamily: 'monospace', fontSize: '7px', color: hex(P.nebelHell) }).setOrigin(0.5)
    this.showLine()
    this.cameras.main.fadeIn(600, 0, 0, 0)
    const next = () => this.next()
    this.input.keyboard.on('keydown-SPACE', next); this.input.keyboard.on('keydown-ENTER', next); this.input.on('pointerdown', next)
    this.input.keyboard.on('keydown-ESC', () => this.start())
  }

  get lines() { return this.folien[this.slide].lines }

  showLine() {
    // Buchstabe für Buchstabe erscheinen lassen
    const full = this.lines?.[this.line]
    if (full === undefined) return
    this.text.setText('')
    let i = 0
    this.typing?.remove()
    this.typing = this.time.addEvent({ delay: 28, repeat: full.length - 1, callback: () => { i++; this.text.setText(full.slice(0, i)) } })
  }

  next() {
    // Nach dem letzten Satz kommt nichts mehr: weitere Tastendrücke (und Tipper)
    // einfach schlucken. Ohne diese Bremse holte der Code hier einen Satz, den
    // es nicht mehr gibt – der Fehler hat das ganze Spiel eingefroren.
    if (this.starting) return
    const satz = this.lines?.[this.line]
    if (satz === undefined) return
    if (this.text.text.length < satz.length) { this.typing?.remove(); this.text.setText(satz); return }   // erst ganze Zeile zeigen
    this.line++
    if (this.line >= this.lines.length) {
      // nächste Folie: Bild überblenden
      if (this.slide + 1 >= this.folien.length) return this.start()
      const from = this.pics[this.slide], to = this.pics[this.slide + 1]
      this.slide++; this.line = 0
      if (to) { to.setAlpha(0); this.tweens.add({ targets: to, alpha: 1, duration: 600 }) }
      if (from) this.tweens.add({ targets: from, alpha: 0, duration: 600 })
    }
    this.showLine()
  }

  start() {
    if (this.starting) return
    this.starting = true
    this.typing?.remove()
    if (!this.folien.length) return this.scene.start('Game', { room: this.room, spawn: this.spawn })
    this.cameras.main.fadeOut(400, 0, 0, 0)
    // Nicht auf das Ende der Blende warten, sondern selbst die Zeit nehmen:
    // läuft gerade noch die Einblendung, käme das Blenden-Ende nie – und das
    // Spiel würde ewig auf dem letzten Intro-Bild stehenbleiben.
    this.time.delayedCall(450, () => this.scene.start('Game', { room: this.room, spawn: this.spawn }))
  }
}
