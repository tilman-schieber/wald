// ============================================================
//  GAME-SZENE — ein Raum im Schwarzwald
// ============================================================
import Phaser from 'phaser'
import { GAME, TILESET } from '../config.js'
import { P } from '../palette.js'
import Jonas from '../entities/Jonas.js'
import Leonel from '../entities/Leonel.js'
import CompanionBrain from '../entities/CompanionBrain.js'
import PlatformGraph from '../entities/PlatformGraph.js'
import Controls from '../input/Controls.js'
import TouchButtons from '../ui/TouchButtons.js'

const DEBUG = new URLSearchParams(location.search).has('debug')

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

    // "Boden" ist die Ebene aus Tiled: Sie bestimmt, wo man stehen kann.
    this.groundLayer = map.createLayer('Boden', tiles, 0, 0).setDepth(0)
    this.groundLayer.setCollisionByExclusion([-1])   // jede gesetzte Kachel ist fest

    // Mit echtem Tileset: Boden unsichtbar (nur Kollision), hübsche Grafik-Ebene obendrauf
    if (TILESET.file) {
      this.groundLayer.setVisible(DEBUG)
      this.makeWangLayer(map, tiles)
    }

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
    this.graph = new PlatformGraph(this.groundLayer)     // Landkarte der Stehflächen
    this.brain = new CompanionBrain(this.groundLayer, this.graph)
    this.teleports = 0

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
    if (aiCmd.teleport) this.teleportCompanion()
    else this.companion.applyCommand(aiCmd, time)

    // 5. Pfeil über dem Aktiven
    this.marker.setPosition(Math.round(this.active.x), Math.round(this.active.body.top - 8))

    // 6. Parallax: Hintergrund langsamer, Vordergrund schneller als die Kamera
    const sx = this.cameras.main.scrollX
    this.bgFar.tilePositionX = sx * 0.2
    this.bgMid.tilePositionX = sx * 0.5
    this.fgBushes.tilePositionX = sx * 1.3
  }

  // Zeichnet den Boden mit dem Wang-Tileset (siehe Erklärung in config.js).
  // Für jede ECKE zwischen vier Feldern schauen wir, welche der vier fest
  // sind, und wählen die passende Kachel. Die Ebene ist um 8 px verschoben,
  // damit die Kachelmitte genau auf der Ecke liegt.
  makeWangLayer(map, tiles) {
    const W = map.width, H = map.height
    const solid = (x, y) => {
      if (y < 0) return false                       // über der Welt: Luft
      if (y >= H) return true                       // unter der Welt: Erde
      x = Phaser.Math.Clamp(x, 0, W - 1)            // seitlich: wie am Rand
      return this.groundLayer.getTileAt(x, y) !== null
    }
    const layer = map.createBlankLayer('BodenGrafik', tiles, -GAME.tile / 2, -GAME.tile / 2, W + 1, H + 1)
    for (let vy = 0; vy <= H; vy++) {
      for (let vx = 0; vx <= W; vx++) {
        const idx = (solid(vx, vy) ? 1 : 0) + (solid(vx - 1, vy) ? 2 : 0)
                  + (solid(vx, vy - 1) ? 4 : 0) + (solid(vx - 1, vy - 1) ? 8 : 0)
        if (idx === 0) continue                       // nur Luft → nichts zeichnen
        layer.putTileAt(tiles.firstgid + TILESET.wangFrames[idx], vx, vy)
      }
    }
    layer.setDepth(0)
  }

  // Wechsel: sofort, ohne Animation. Der neue Begleiter bleibt stehen,
  // die Kamera gleitet weich zum neuen Aktiven.
  switchHero() {
    ;[this.active, this.companion] = [this.companion, this.active]
    this.companion.halt()
    this.brain.reset()
    this.active.setDepth(10)
    this.companion.setDepth(9)
    this.cameras.main.startFollow(this.active, true, 0.12, 0.12)
    this.updateNameText()
  }

  // Der Begleiter kommt nicht nach → er "ploppt" neben den Spieler.
  // Füße auf gleiche Höhe wie die des Spielers, kleiner Blubb-Effekt.
  teleportCompanion() {
    this.teleports++
    const me = this.companion, leader = this.active
    const feetOffset = me.body.bottom - me.y
    me.halt()
    me.setVelocity(0, 0)
    me.setPosition(leader.x - leader.facing * 10, leader.body.bottom - feetOffset)
    me.setScale(0.2)
    this.tweens.add({ targets: me, scale: 1, duration: 220, ease: 'Back.Out' })
    const ring = this.add.circle(me.x, me.body.center.y, 6, 0, 0).setStrokeStyle(2, P.eisBlau).setDepth(12)
    this.tweens.add({ targets: ring, radius: 22, alpha: 0, duration: 350, onComplete: () => ring.destroy() })
  }

  updateNameText() {
    this.nameText.setText(`Du bist: ${this.active.cfg.name}`)
  }
}
