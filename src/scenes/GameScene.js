// ============================================================
//  GAME-SZENE — ein Raum im Schwarzwald
// ============================================================
import Phaser from 'phaser'
import { GAME, TILESET } from '../config.js'
import Jonas from '../entities/Jonas.js'
import Leonel from '../entities/Leonel.js'
import CompanionBrain from '../entities/CompanionBrain.js'
import Controls from '../input/Controls.js'
import TouchButtons from '../ui/TouchButtons.js'

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('Game')
  }

  create() {
    // ---------- Level ----------
    const map = this.make.tilemap({ key: 'schwarzwald_01' })
    const tiles = map.addTilesetImage('tiles', TILESET.key)

    // ---------- Parallax: hinten → vorne ----------
    // scrollFactor sagt, wie stark eine Ebene mit der Kamera mitwandert.
    // 0 = bleibt stehen (Himmel), 1 = normal (Spielebene), >1 = schneller (Vordergrund)
    this.add.image(0, 0, 'bg_sky').setOrigin(0).setScrollFactor(0).setDepth(-40)
    this.bgFar = this.add.tileSprite(0, 0, GAME.width, GAME.height, 'bg_far').setOrigin(0).setScrollFactor(0).setDepth(-30)
    this.bgMid = this.add.tileSprite(0, 0, GAME.width, GAME.height, 'bg_mid').setOrigin(0).setScrollFactor(0).setDepth(-20)

    this.groundLayer = map.createLayer('Boden', tiles, 0, 0).setDepth(0)
    this.groundLayer.setCollisionByExclusion([-1])   // jede gesetzte Kachel ist fest

    this.fgBushes = this.add.tileSprite(0, 0, GAME.width, GAME.height, 'fg_bushes').setOrigin(0).setScrollFactor(0).setDepth(20)

    // ---------- Helden ----------
    const spawnJ = map.findObject('Objekte', (o) => o.name === 'spawn_jonas')
    const spawnL = map.findObject('Objekte', (o) => o.name === 'spawn_leonel')
    this.jonas = new Jonas(this, spawnJ.x, spawnJ.y).setDepth(10)
    this.leonel = new Leonel(this, spawnL.x, spawnL.y).setDepth(9)

    this.physics.add.collider(this.jonas, this.groundLayer)
    this.physics.add.collider(this.leonel, this.groundLayer)

    this.active = this.jonas
    this.companion = this.leonel
    this.brain = new CompanionBrain(this.groundLayer)

    this.marker = this.add.image(0, 0, 'marker').setDepth(11)

    // ---------- Kamera & Welt ----------
    const worldW = map.widthInPixels, worldH = map.heightInPixels
    this.physics.world.setBounds(0, 0, worldW, worldH)
    this.cameras.main.setBounds(0, 0, worldW, worldH)
    this.cameras.main.startFollow(this.active, true, 0.12, 0.12)

    // ---------- Steuerung ----------
    this.controls = new Controls(this)
    const isTouch = this.sys.game.device.input.touch || new URLSearchParams(location.search).has('touch')
    if (isTouch) this.touchButtons = new TouchButtons(this, this.controls)

    // Hinweistext (fest am Bildschirm)
    this.add.text(4, 4, 'Pfeile/WASD laufen · Leertaste springen · Tab wechseln', {
      fontFamily: 'monospace', fontSize: '8px', color: '#c0cbdc',
    }).setScrollFactor(0).setDepth(100).setAlpha(0.8)
    this.nameText = this.add.text(4, 14, '', {
      fontFamily: 'monospace', fontSize: '8px', color: '#fee761',
    }).setScrollFactor(0).setDepth(100)
    this.updateNameText()

    // Zum Nachschauen in der Browser-Konsole: __wald.scene.jonas.x usw.
    window.__wald = { scene: this }
  }

  update(time) {
    // 1. Finger lesen (setzt controls.touch), dann Kommando bauen
    this.touchButtons?.update()
    const cmd = this.controls.read()

    // 2. Wechsel?
    if (cmd.switch) this.switchHero()

    // 3. Der Aktive tut, was der Spieler sagt …
    this.active.applyCommand(cmd, time)

    // 4. … der Begleiter tut, was sein Gehirn sagt.
    const aiCmd = this.brain.think(this.companion, this.active, time)
    this.companion.applyCommand(aiCmd, time)

    // 5. Pfeil über dem Aktiven
    this.marker.setPosition(Math.round(this.active.x), Math.round(this.active.body.top - 8))

    // 6. Parallax: Hintergrund langsamer, Vordergrund schneller als die Kamera
    const sx = this.cameras.main.scrollX
    this.bgFar.tilePositionX = sx * 0.2
    this.bgMid.tilePositionX = sx * 0.5
    this.fgBushes.tilePositionX = sx * 1.3
  }

  // Wechsel: sofort, ohne Animation. Der neue Begleiter bleibt stehen,
  // die Kamera gleitet weich zum neuen Aktiven.
  switchHero() {
    ;[this.active, this.companion] = [this.companion, this.active]
    this.companion.halt()
    this.brain.moving = false
    this.active.setDepth(10)
    this.companion.setDepth(9)
    this.cameras.main.startFollow(this.active, true, 0.12, 0.12)
    this.updateNameText()
  }

  updateNameText() {
    this.nameText.setText(`Du bist: ${this.active.cfg.name}`)
  }
}
