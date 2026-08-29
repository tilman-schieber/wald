// ============================================================
//  TITEL-SZENE — W.A.L.D.
// ============================================================
import Phaser from 'phaser'
import { GAME, COMBAT, BACKGROUND, MUSIC, UI } from '../config.js'
import { P, hex } from '../palette.js'
import { world } from '../world.js'
import { hasSave, loadGame, clearSave } from '../save.js'

export default class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title')
  }

  create() {
    const W = GAME.width, H = GAME.height
    if (this.cache.audio.exists('musik') && !this.sound.get('musik')) this.sound.add('musik', { loop: true, volume: MUSIC.volume })
    const m = this.sound.get('musik')
    if (m && !m.isPlaying && !world.musicOff) {
      // Browser erlauben Ton erst nach der ersten Berührung/Taste
      const tryPlay = () => { if (!m.isPlaying && !world.musicOff) m.play() }
      tryPlay(); this.input.once('pointerdown', tryPlay); this.input.keyboard.once('keydown', tryPlay)
    }
    const font = document.fonts?.check?.(`8px "${UI.fontFamily}"`) ? UI.fontFamily : 'monospace'
    this.font = font
    if (this.textures.exists('titelbild')) {
      // Das gemalte Titelbild (Pro): Figuren sind schon drauf
      this.add.image(0, 0, 'titelbild').setOrigin(0)
      this.add.rectangle(0, H - 70, W, 70, P.schwarz, 0.35).setOrigin(0)
    } else if (this.textures.exists(BACKGROUND.titleKey)) {
      this.add.tileSprite(0, 0, W, H, BACKGROUND.titleKey).setOrigin(0)
      this.add.rectangle(0, 0, W, H, P.nachtBlau, 0.5).setOrigin(0)
    } else {
      this.add.image(0, 0, 'bg_sky').setOrigin(0)
      this.add.tileSprite(0, 0, W, H, 'bg_far').setOrigin(0)
    }

    const hasPic = this.textures.exists('titelbild')
    this.add.text(W / 2, hasPic ? 34 : 70, 'W.A.L.D.', { fontFamily: font, fontSize: font === 'monospace' ? '40px' : '44px', color: hex(P.hellGelb), stroke: hex(P.schwarz), strokeThickness: 5 }).setOrigin(0.5)
    this.add.text(W / 2, hasPic ? 62 : 100, 'Wächter Aller Lebenden Dinge', { fontFamily: font, fontSize: font === 'monospace' ? '11px' : '13px', color: hex(P.nebelHell), stroke: hex(P.schwarz), strokeThickness: 3 }).setOrigin(0.5)

    if (!hasPic) {
      // Die beiden Helden stehen da und atmen
      this.add.sprite(W / 2 - 24, 170, 'jonas').play('jonas-idle')
      this.add.sprite(W / 2 + 24, 172, 'leonel').play('leonel-idle').setFlipX(true)
    }

    if (this.textures.exists('panel')) {
      this.add.nineslice(W / 2, hasPic ? 228 : 216, 'panel', undefined, 150, 46, UI.panelBorder, UI.panelBorder, UI.panelBorder, UI.panelBorder).setAlpha(0.95)
    }
    this.options = []
    if (hasSave()) this.options.push({ label: 'Weiter', action: () => this.continueGame() })
    this.options.push({ label: 'Neues Spiel', action: () => this.newGame() })
    this.selected = 0
    this.optionTexts = this.options.map((o, i) =>
      this.add.text(W / 2, (hasPic ? 214 : 205) + i * 16, o.label, { fontFamily: font, fontSize: font === 'monospace' ? '12px' : '14px', color: '#ffffff', stroke: hex(P.schwarz), strokeThickness: 3 }).setOrigin(0.5)
        .setInteractive({ useHandCursor: true }).on('pointerdown', () => { this.selected = i; this.choose() }))
    this.hint = this.add.text(W / 2, H - 10, 'Leertaste / Antippen zum Starten', { fontFamily: 'monospace', fontSize: '8px', color: hex(P.nebelHell), stroke: hex(P.schwarz), strokeThickness: 2 }).setOrigin(0.5)
    this.refresh()

    const kb = this.input.keyboard
    kb.on('keydown-UP', () => this.move(-1)); kb.on('keydown-W', () => this.move(-1))
    kb.on('keydown-DOWN', () => this.move(1)); kb.on('keydown-S', () => this.move(1))
    kb.on('keydown-SPACE', () => this.choose()); kb.on('keydown-ENTER', () => this.choose())
  }

  move(d) {
    this.selected = Phaser.Math.Wrap(this.selected + d, 0, this.options.length)
    this.refresh()
  }

  refresh() {
    this.optionTexts.forEach((t, i) => t.setColor(i === this.selected ? hex(P.hellGelb) : '#ffffff').setText((i === this.selected ? '> ' : '  ') + this.options[i].label + (i === this.selected ? ' <' : '  ')))
    this.hint.setAlpha(0.5 + Math.sin(this.time.now / 300) * 0.3)
  }

  update() { this.hint.setAlpha(0.6 + Math.sin(this.time.now / 300) * 0.4) }

  choose() { this.options[this.selected].action() }

  newGame() {
    clearSave()
    world.active = 'jonas'
    world.hp = { jonas: COMBAT.heroHp, leonel: COMBAT.heroHp }
    world.healed = {}; world.gatesOpen = {}; world.collected = {}; world.leaves = 0
    this.scene.start('Intro')
  }

  continueGame() {
    const where = loadGame()
    if (where) this.scene.start('Game', where)
    else this.newGame()
  }
}
