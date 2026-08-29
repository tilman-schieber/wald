// ============================================================
//  GAME-SZENE — EIN Raum des Waldes
// ============================================================
//  Jeder Raum ist eine Tiled-Map. Beim Raumwechsel wird die Szene mit
//  { room, spawn } neu gestartet. Was bleiben muss (Herzen, geheilte
//  Tiere, offene Tore), steht in world.js.
//
//  Objekte in Tiled (Ebene "Objekte"), erkannt am "type":
//    spawn    Punkt, name = Name des Eingangs ('start', 'von_links' …)
//    enemy    Punkt, name = Gegner-Art aus config ENEMIES ('igel')
//    ausgang  Rechteck, Eigenschaften ziel (Raum) und spawn (Eingang dort)
//    tor      Rechteck, name = Torname; fest, solange es zu ist
//    platte   Rechteck, Eigenschaft oeffnet = Torname; offen, solange jemand draufsteht
//    hebel    Rechteck, Eigenschaft oeffnet = Torname; öffnet dauerhaft
//    ranke    Rechteck (schmal, hoch): Jonas zieht sich mit dem Haken (E) hoch
//    blatt    Punkt: Blatt zum Einsammeln
// ============================================================
import Phaser from 'phaser'
import { GAME, TILESET, ENEMIES, COMBAT, HOOK, SPIRIT, BACKGROUND } from '../config.js'
import { P } from '../palette.js'
import { world, healedIn, gatesOpenIn, collectedIn } from '../world.js'
import Jonas from '../entities/Jonas.js'
import Leonel from '../entities/Leonel.js'
import CompanionBrain from '../entities/CompanionBrain.js'
import PlatformGraph from '../entities/PlatformGraph.js'
import Enemy from '../entities/Enemy.js'
import Spirit from '../entities/Spirit.js'
import Controls from '../input/Controls.js'
import TouchButtons from '../ui/TouchButtons.js'

const DEBUG = new URLSearchParams(location.search).has('debug')
// Tiled speichert Eigenschaften als Liste → einfaches Objekt daraus machen
const props = (o) => Object.fromEntries((o.properties ?? []).map((p) => [p.name, p.value]))

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('Game')
  }

  init(data) {
    this.roomKey = data.room ?? 'schwarzwald_01'
    this.spawnName = data.spawn ?? 'start'
  }

  create() {
    // ---------- Level ----------
    const map = this.make.tilemap({ key: this.roomKey })
    const tiles = map.addTilesetImage('tiles', TILESET.key)
    const objects = map.getObjectLayer('Objekte')?.objects ?? []

    // ---------- Parallax: hinten → vorne ----------
    // scrollFactor sagt, wie stark eine Ebene mit der Kamera mitwandert.
    // 0 = bleibt stehen (Himmel), 1 = normal (Spielebene), >1 = schneller (Vordergrund)
    this.add.image(0, 0, 'bg_sky').setOrigin(0).setScrollFactor(0).setDepth(-40)
    if (this.textures.exists(BACKGROUND.key)) {
      // Echte Waldkulisse: ein nahtlos wiederholbares Bild, das langsamer als die Kamera wandert
      this.bgForest = this.add.tileSprite(0, 0, GAME.width, GAME.height, BACKGROUND.key).setOrigin(0).setScrollFactor(0).setDepth(-30)
      // Dunst: wie in einem echten Wald wird es nach hinten dunkler und blauer
      this.add.rectangle(0, 0, GAME.width, GAME.height, P.nachtBlau, BACKGROUND.haze).setOrigin(0).setScrollFactor(0).setDepth(-25)
    } else {
      this.bgFar = this.add.tileSprite(0, 0, GAME.width, GAME.height, 'bg_far').setOrigin(0).setScrollFactor(0).setDepth(-30)
      this.bgMid = this.add.tileSprite(0, 0, GAME.width, GAME.height, 'bg_mid').setOrigin(0).setScrollFactor(0).setDepth(-20)
    }

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
    const spawn = objects.find((o) => o.type === 'spawn' && o.name === this.spawnName)
      ?? objects.find((o) => o.type === 'spawn')
    const facing = spawn.x < map.widthInPixels / 2 ? 1 : -1       // links rein → nach rechts schauen
    this.jonas = new Jonas(this, spawn.x, spawn.y).placeFeet(spawn.x, spawn.y)
    this.leonel = new Leonel(this, spawn.x, spawn.y).placeFeet(spawn.x - facing * 20, spawn.y)
    this.active = world.active === 'leonel' ? this.leonel : this.jonas
    this.companion = this.active === this.jonas ? this.leonel : this.jonas
    this.active.setDepth(10); this.companion.setDepth(9)
    for (const h of [this.jonas, this.leonel]) {
      h.hp = world.hp[h.cfg.key]
      h.facing = facing
      h.setFlipX(facing < 0)
      this.physics.add.collider(h, this.groundLayer)
    }

    this.graph = new PlatformGraph(this.groundLayer)     // Landkarte der Stehflächen
    this.brain = new CompanionBrain(this.groundLayer, this.graph)
    this.teleports = 0
    this.marker = this.add.image(0, 0, 'marker').setDepth(11)
    this.waitText = this.add.text(0, 0, 'wartet', { fontFamily: 'monospace', fontSize: '8px', color: '#c0cbdc' }).setOrigin(0.5).setDepth(11).setVisible(false)

    // ---------- Gegner (schon geheilte bleiben geheilt) ----------
    this.enemies = []
    for (const o of objects) {
      if (o.type !== 'enemy') continue
      const cfg = ENEMIES[o.name]
      if (!cfg) { console.warn('Unbekannter Gegner:', o.name); continue }
      const e = new Enemy(this, o.x, o.y - cfg.frame.h / 2, cfg).setDepth(8)
      e.objectId = o.id
      if (healedIn(this.roomKey).has(o.id)) e.heal(true)
      this.physics.add.collider(e, this.groundLayer)
      this.enemies.push(e)
    }
    for (const hero of [this.jonas, this.leonel]) {
      this.physics.add.overlap(hero, this.enemies, (h, e) => this.onTouchEnemy(h, e))
    }
    this.gameOver = false
    this.leaving = false

    // ---------- Ausgänge, Tore, Platten, Hebel ----------
    const zone = (o) => { const z = this.add.zone(o.x + o.width / 2, o.y + o.height / 2, o.width, o.height); this.physics.add.existing(z, true); return z }
    this.exits = objects.filter((o) => o.type === 'ausgang').map((o) => ({ zone: zone(o), ...props(o) }))

    this.gates = {}
    for (const o of objects.filter((o) => o.type === 'tor')) {
      const g = this.add.tileSprite(o.x + o.width / 2, o.y + o.height / 2, o.width, o.height, 'tor').setDepth(5)
      this.physics.add.existing(g, true)
      for (const body of [this.jonas, this.leonel, ...this.enemies]) this.physics.add.collider(body, g)
      g.permanentlyOpen = gatesOpenIn(this.roomKey).has(o.name)
      this.gates[o.name] = g
    }
    this.plates = objects.filter((o) => o.type === 'platte').map((o) => ({
      zone: zone(o), gate: props(o).oeffnet,
      sprite: this.add.image(o.x + o.width / 2, o.y + o.height - 2, 'platte').setDepth(4),
    }))
    this.levers = objects.filter((o) => o.type === 'hebel').map((o) => ({
      zone: zone(o), gate: props(o).oeffnet, name: o.name,
      sprite: this.add.image(o.x + o.width / 2, o.y + o.height - 8, 'hebel').setDepth(4),
      flipped: gatesOpenIn(this.roomKey).has(props(o).oeffnet),
    }))
    for (const l of this.levers) if (l.flipped) l.sprite.setFlipX(true)
    this.gateStateKey = ''

    // Ranken (für Jonas' Kletterhaken) – die Kante ist auf der Seite, wo oben Boden ist
    this.ranken = objects.filter((o) => o.type === 'ranke').map((o) => {
      const x = o.x + o.width / 2
      const side = this.groundLayer.getTileAtWorldXY(x + 24, o.y + 4) ? 1 : -1
      this.add.tileSprite(x, o.y + o.height / 2, 8, o.height, 'ranke').setDepth(3)
      return { x, top: o.y, bottom: o.y + o.height, side }
    })

    // Blätter zum Sammeln (schon eingesammelte fehlen)
    this.leaves = []
    for (const o of objects.filter((o) => o.type === 'blatt')) {
      if (collectedIn(this.roomKey).has(o.id)) continue
      const img = this.add.image(o.x, o.y, 'blatt').setDepth(6)
      this.physics.add.existing(img, true)
      img.objectId = o.id
      this.tweens.add({ targets: img, y: o.y - 3, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.InOut' })
      this.leaves.push(img)
    }
    this.spirits = []
    this.spiritReadyAt = 0

    // ---------- Kamera & Welt ----------
    const worldW = map.widthInPixels, worldH = map.heightInPixels
    this.physics.world.setBounds(0, 0, worldW, worldH)
    this.cameras.main.setBounds(0, 0, worldW, worldH)
    this.cameras.main.startFollow(this.active, true, 0.12, 0.12)
    this.cameras.main.fadeIn(250, 0, 0, 0)

    // ---------- Steuerung ----------
    this.controls = new Controls(this)
    const isTouch = this.sys.game.device.input.touch || new URLSearchParams(location.search).has('touch')
    if (isTouch) this.touchButtons = new TouchButtons(this, this.controls)

    // ---------- HUD (fest am Bildschirm) ----------
    const hudStyle = { fontFamily: 'monospace', fontSize: '8px', backgroundColor: 'rgba(24,20,37,0.7)', padding: { x: 2, y: 1 } }
    this.add.text(2, 2, 'Pfeile laufen/ducken · Leer springen · X schlagen · E Fähigkeit · Tab wechseln · C Komm!', { ...hudStyle, color: '#c0cbdc' }).setScrollFactor(0).setDepth(100)
    this.nameText = this.add.text(2, 13, '', { ...hudStyle, color: '#fee761' }).setScrollFactor(0).setDepth(100)
    this.hud = this.add.text(2, 24, '', { ...hudStyle, color: '#ffffff' }).setScrollFactor(0).setDepth(100)
    this.updateNameText()

    // Zum Nachschauen in der Browser-Konsole: __wald.scene.jonas.x usw.
    window.__wald = { scene: this, world }
  }

  update(time) {
    if (this.gameOver || this.leaving) return

    // 1. Finger lesen (setzt controls.touch), dann Kommando bauen
    this.touchButtons?.update()
    const cmd = this.controls.read()

    // 2. Wechsel?
    if (cmd.switch) this.switchHero(time)

    // 3. Der Aktive tut, was der Spieler sagt … (E = Spezialfähigkeit, nur der Aktive!)
    if (cmd.special) this.useSpecial(this.active, time)
    this.active.applyCommand(cmd, time)

    // 4. … der Begleiter tut, was sein Gehirn sagt.
    const aiCmd = this.brain.think(this.companion, this.active, time, this.enemies, cmd.call)
    if (aiCmd.teleport) this.teleportCompanion()
    else this.companion.applyCommand(aiCmd, time)
    this.waitText.setVisible(this.brain.waiting).setPosition(Math.round(this.companion.x), Math.round(this.companion.body.top - 10))

    // 5. Gegner laufen, Schläge treffen, Rätsel prüfen
    for (const e of this.enemies) e.update(time, this.groundLayer)
    for (const sp of this.spirits) sp.update(time, this.enemies)
    this.spirits = this.spirits.filter((sp) => sp.active)
    this.resolveAttacks(time)
    this.updatePuzzles()
    this.collectLeaves()
    this.checkExits()
    this.updateHud()

    // 6. Pfeil über dem Aktiven
    this.marker.setPosition(Math.round(this.active.x), Math.round(this.active.body.top - 8))

    // 7. Parallax: Hintergrund langsamer, Vordergrund schneller als die Kamera
    const sx = this.cameras.main.scrollX
    if (this.bgForest) this.bgForest.tilePositionX = sx * BACKGROUND.scroll
    else { this.bgFar.tilePositionX = sx * 0.2; this.bgMid.tilePositionX = sx * 0.5 }
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

  // Wechsel: sofort, ohne Animation. Der neue Begleiter bleibt stehen und
  // WARTET, bis man ihn abholt oder ruft. Die Kamera gleitet weich rüber.
  switchHero(time = this.time.now) {
    if (this.companion.isDazed(time)) {          // zu einem Benommenen kann man nicht wechseln
      this.tweens.add({ targets: this.nameText, alpha: 0.2, yoyo: true, repeat: 2, duration: 80 })
      return
    }
    ;[this.active, this.companion] = [this.companion, this.active]
    this.companion.halt()
    this.brain.reset(true)
    this.active.setDepth(10)
    this.companion.setDepth(9)
    world.active = this.active.cfg.key
    this.cameras.main.startFollow(this.active, true, 0.12, 0.12)
    this.updateNameText()
  }

  // Der Begleiter kommt nicht nach → er "ploppt" neben den Spieler.
  // Füße auf gleiche Höhe wie die des Spielers, kleiner Blubb-Effekt.
  teleportCompanion() {
    this.teleports++
    const me = this.companion, leader = this.active
    me.halt()
    me.placeFeet(leader.x - leader.facing * 10, leader.body.bottom)
    me.setScale(0.2)
    this.tweens.add({ targets: me, scale: 1, duration: 220, ease: 'Back.Out' })
    const ring = this.add.circle(me.x, me.body.center.y, 6, 0, 0).setStrokeStyle(2, P.eisBlau).setDepth(12)
    this.tweens.add({ targets: ring, radius: 22, alpha: 0, duration: 350, onComplete: () => ring.destroy() })
  }

  // Trifft ein Schlag gerade einen Gegner? Jeder Schlag trifft jeden Gegner nur einmal.
  resolveAttacks(time) {
    for (const hero of [this.active, this.companion]) {
      const rect = hero.attackRect(time)
      if (!rect) continue
      const factor = hero === this.active ? 1 : COMBAT.companionDamageFactor
      const damage = Math.max(1, Math.ceil(hero.cfg.damage * factor))
      for (const e of this.enemies) {
        if (e.healed || hero.hitThisAttack.has(e)) continue
        if (!Phaser.Geom.Rectangle.Overlaps(rect, e.getBounds())) continue
        hero.hitThisAttack.add(e)
        if (e.hit(damage, hero.x, time)) healedIn(this.roomKey).add(e.objectId)
      }
    }
  }

  // Spezialfähigkeit des aktiven Helden (Taste E)
  useSpecial(hero, time) {
    if (hero.isDazed(time) || hero.hook) return
    if (hero.cfg.key === 'jonas') {
      // Kletterhaken: gibt es eine Ranke in Reichweite, deren oberes Ende über mir ist?
      const r = this.ranken.find((r) => Math.abs(r.x - hero.x) <= HOOK.reach && hero.body.top > r.top && hero.body.bottom <= r.bottom + 40)
      if (r) hero.startHook(r.x, r.top, r.side)
      else this.tweens.add({ targets: this.nameText, alpha: 0.2, yoyo: true, duration: 80 })
    } else if (hero.cfg.key === 'leonel') {
      // Waldgeist rufen (mit Pause dazwischen)
      if (time < this.spiritReadyAt) return
      this.spiritReadyAt = time + SPIRIT.cooldownMs
      this.spirits.push(new Spirit(this, hero, time))
    }
  }

  // Blätter einsammeln (beide Helden dürfen)
  collectLeaves() {
    for (const leaf of this.leaves) {
      if (!leaf.active) continue
      if (!this.physics.overlap(leaf, this.jonas) && !this.physics.overlap(leaf, this.leonel)) continue
      collectedIn(this.roomKey).add(leaf.objectId)
      world.leaves++
      this.tweens.add({ targets: leaf, y: leaf.y - 16, alpha: 0, scale: 1.6, duration: 350, onComplete: () => leaf.destroy() })
      leaf.body.enable = false
    }
    this.leaves = this.leaves.filter((l) => l.active)
  }

  // Ein Held berührt einen (noch nicht geheilten, nicht beruhigten) Gegner
  onTouchEnemy(hero, enemy) {
    if (enemy.healed || this.gameOver) return
    const time = this.time.now
    if (enemy.isCalm(time)) return
    const result = hero.hurt(time, enemy.x)
    if (result !== 'ko') return
    if (hero === this.companion) hero.daze(time)   // Begleiter: nur benommen, nie Game Over
    else this.loseRoom()
  }

  // Platten öffnen ihr Tor, solange jemand draufsteht; Hebel öffnen dauerhaft.
  updatePuzzles() {
    const bodies = [this.jonas, this.leonel, ...this.enemies]
    const open = new Set(gatesOpenIn(this.roomKey))
    for (const p of this.plates) {
      const pressed = bodies.some((b) => this.physics.overlap(p.zone, b))
      p.sprite.y = p.zone.y + p.zone.height / 2 - (pressed ? 0 : 2)
      if (pressed) open.add(p.gate)
    }
    for (const l of this.levers) {
      if (!l.flipped && this.physics.overlap(l.zone, this.active)) {
        l.flipped = true
        l.sprite.setFlipX(true)
        gatesOpenIn(this.roomKey).add(l.gate)
        open.add(l.gate)
      }
    }
    const closed = []
    for (const [name, g] of Object.entries(this.gates)) {
      const isOpen = open.has(name)
      g.setVisible(!isOpen)
      g.body.enable = !isOpen
      if (!isOpen) closed.push(name)
    }
    // Geschlossene Tore sind für die Wegsuche des Begleiters wie Wände
    const key = closed.join(',')
    if (key !== this.gateStateKey) {
      this.gateStateKey = key
      this.graph.setBlockers(closed.map((n) => this.gates[n].getBounds()))
    }
  }

  // Berührt der Aktive einen Ausgang? Dann in den nächsten Raum.
  checkExits() {
    for (const ex of this.exits) {
      if (this.physics.overlap(ex.zone, this.active)) { this.goToRoom(ex.ziel, ex.spawn); return }
    }
  }

  goToRoom(room, spawn) {
    this.leaving = true
    world.hp.jonas = this.jonas.hp
    world.hp.leonel = this.leonel.hp
    this.active.halt(); this.companion.halt()
    this.cameras.main.fadeOut(250, 0, 0, 0)
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.restart({ room, spawn }))
  }

  // Der aktive Held hat keine Herzen mehr → der Raum beginnt von vorn (volle Herzen)
  loseRoom() {
    this.gameOver = true
    this.active.setVelocity(0, 0)
    this.companion.setVelocity(0, 0)
    world.hp.jonas = COMBAT.heroHp
    world.hp.leonel = COMBAT.heroHp
    this.add.text(GAME.width / 2, GAME.height / 2, 'Der Wald ruft euch zurück …', {
      fontFamily: 'monospace', fontSize: '12px', color: '#fee761',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(200)
    this.cameras.main.fadeOut(900, 0, 0, 0)
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.restart({ room: this.roomKey, spawn: this.spawnName }))
  }

  updateHud() {
    const hearts = (h) => '♥'.repeat(Math.max(0, h.hp)) + '♡'.repeat(Math.max(0, COMBAT.heroHp - h.hp))
    this.hud.setText(`Jonas ${hearts(this.jonas)}   Leonel ${hearts(this.leonel)}   Blätter: ${world.leaves}`)
  }

  updateNameText() {
    this.nameText.setText(`Du bist: ${this.active.cfg.name}`)
  }
}
