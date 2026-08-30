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
    if (this.textures.exists('introbild')) this.add.image(0, 0, 'introbild').setOrigin(0)
    else this.add.rectangle(0, 0, W, H, P.nachtBlau).setOrigin(0)
    this.add.rectangle(0, H - 64, W, 64, P.schwarz, 0.6).setOrigin(0)
    this.line = 0
    this.text = this.add.text(W / 2, H - 40, '', { fontFamily: font, fontSize: font === 'monospace' ? '10px' : '12px', color: '#ffffff', stroke: hex(P.schwarz), strokeThickness: 3, align: 'center', wordWrap: { width: W - 40 } }).setOrigin(0.5)
    this.hint = this.add.text(W / 2, H - 10, 'Leertaste / Antippen: weiter   ·   Esc: überspringen', { fontFamily: 'monospace', fontSize: '7px', color: hex(P.nebelHell) }).setOrigin(0.5)
    this.showLine()
    this.cameras.main.fadeIn(600, 0, 0, 0)
    const next = () => this.next()
    this.input.keyboard.on('keydown-SPACE', next); this.input.keyboard.on('keydown-ENTER', next); this.input.on('pointerdown', next)
    this.input.keyboard.on('keydown-ESC', () => this.start())
  }

  showLine() {
    // Buchstabe für Buchstabe erscheinen lassen
    const full = INTRO[this.line]
    this.text.setText('')
    let i = 0
    this.typing?.remove()
    this.typing = this.time.addEvent({ delay: 28, repeat: full.length - 1, callback: () => { i++; this.text.setText(full.slice(0, i)) } })
  }

  next() {
    if (this.text.text.length < INTRO[this.line].length) { this.typing?.remove(); this.text.setText(INTRO[this.line]); return }   // erst ganze Zeile zeigen
    this.line++
    if (this.line >= INTRO.length) return this.start()
    this.showLine()
  }

  start() {
    if (this.starting) return
    this.starting = true
    this.cameras.main.fadeOut(400, 0, 0, 0)
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Game', { room: 'schwarzwald', spawn: 'start' }))
  }
}
