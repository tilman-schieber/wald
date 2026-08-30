// ============================================================
//  INTRO-SZENE — die Geschichte in fünf Sätzen
// ============================================================
import Phaser from 'phaser'
import { GAME, INTRO, UI } from '../config.js'
import { P, hex } from '../palette.js'

export default class IntroScene extends Phaser.Scene {
  constructor() { super('Intro') }

  create() {
    const W = GAME.width, H = GAME.height
    const font = document.fonts?.check?.(`8px "${UI.fontFamily}"`) ? UI.fontFamily : 'monospace'
    this.add.rectangle(0, 0, W, H, P.nachtBlau).setOrigin(0)
    this.pics = INTRO.map((f, i) => this.textures.exists('intro' + i) ? this.add.image(0, 0, 'intro' + i).setOrigin(0).setAlpha(i === 0 ? 1 : 0) : null)
    this.add.rectangle(0, H - 64, W, 64, P.schwarz, 0.6).setOrigin(0)
    this.slide = 0
    this.line = 0
    this.text = this.add.text(W / 2, H - 40, '', { fontFamily: font, fontSize: font === 'monospace' ? '10px' : '12px', color: '#ffffff', stroke: hex(P.schwarz), strokeThickness: 3, align: 'center', wordWrap: { width: W - 40 } }).setOrigin(0.5)
    this.hint = this.add.text(W / 2, H - 10, 'Leertaste / Antippen: weiter   ·   Esc: überspringen', { fontFamily: 'monospace', fontSize: '7px', color: hex(P.nebelHell) }).setOrigin(0.5)
    this.showLine()
    this.cameras.main.fadeIn(600, 0, 0, 0)
    const next = () => this.next()
    this.input.keyboard.on('keydown-SPACE', next); this.input.keyboard.on('keydown-ENTER', next); this.input.on('pointerdown', next)
    this.input.keyboard.on('keydown-ESC', () => this.start())
  }

  get lines() { return INTRO[this.slide].lines }

  showLine() {
    // Buchstabe für Buchstabe erscheinen lassen
    const full = this.lines[this.line]
    this.text.setText('')
    let i = 0
    this.typing?.remove()
    this.typing = this.time.addEvent({ delay: 28, repeat: full.length - 1, callback: () => { i++; this.text.setText(full.slice(0, i)) } })
  }

  next() {
    if (this.text.text.length < this.lines[this.line].length) { this.typing?.remove(); this.text.setText(this.lines[this.line]); return }   // erst ganze Zeile zeigen
    this.line++
    if (this.line >= this.lines.length) {
      // nächste Folie: Bild überblenden
      if (this.slide + 1 >= INTRO.length) return this.start()
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
    this.cameras.main.fadeOut(400, 0, 0, 0)
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Game', { room: 'schwarzwald', spawn: 'start' }))
  }
}
