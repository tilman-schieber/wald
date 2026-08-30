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
//    ranke    Rechteck (schmal, hoch): Jonas klettert daran (Pfeil hoch/runter)
//    schwinge Rechteck (schmal, hoch): Liane zum Schwingen – Jonas greift im Sprung
//             automatisch zu, mit Leertaste lässt er wieder los
//    blatt    Punkt: Blatt zum Einsammeln
//    waldherz Punkt: das Ziel eines Waldes – berühren = Wald gerettet
//    checkpoint Punkt: Speicherpunkt (Wegweiser) – berühren = ab hier geht's nach einem Game Over weiter
//    deko     Punkt (Fuß), name = farn/pilze/stein…, Eigenschaft vorne = true → vor den Figuren
//    kulisse  Punkt (Fuß), name = Schlüssel aus KULISSEN, Eigenschaft tiefe = Parallax (0.15 … 0.8):
//             wird HINTER dem Spielfeld gezeichnet und wandert langsamer als die Kamera
// ============================================================
import Phaser from 'phaser'
import { GAME, ENEMIES, COMBAT, CLIMB, SLAM, SPIRIT, MUSIC, DEKO, TIERE, UI, KULISSEN, FORESTS, WURF, tiefeZuDepth } from '../config.js'
import { P } from '../palette.js'
import { world, healedIn, gatesOpenIn, collectedIn } from '../world.js'
import { saveGame, clearSave } from '../save.js'
import Sfx from '../sound.js'
import Jonas from '../entities/Jonas.js'
import Leonel from '../entities/Leonel.js'
import CompanionBrain from '../entities/CompanionBrain.js'
import PlatformGraph from '../entities/PlatformGraph.js'
import Enemy from '../entities/Enemy.js'
import Owl from '../entities/Owl.js'
import Spirit from '../entities/Spirit.js'
import Projectile from '../entities/Projectile.js'
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
    this.roomKey = data.room ?? 'schwarzwald'
    this.spawnName = data.spawn ?? 'start'
    // Welcher Wald ist das? (Der Levelname beginnt mit dem Wald-Schlüssel.)
    this.forestKey = Object.keys(FORESTS).find((k) => this.roomKey.startsWith(k)) ?? 'schwarzwald'
    this.forest = FORESTS[this.forestKey]
    world.forest = this.forestKey
  }

  create() {
    this.shadows = []            // weiche Schatten unter allem, was auf dem Boden steht
    this.sfx = new Sfx(this)
    saveGame(this.roomKey, this.spawnName)      // Checkpoint: jeder Raumeingang
    this.paused = false
    this.input.keyboard.on('keydown-P', () => this.togglePause())
    this.input.keyboard.on('keydown-M', () => this.toggleMusic())
    this.startMusic()
    this.input.keyboard.on('keydown-ESC', () => this.togglePause())

    // ---------- Level ----------
    const map = this.make.tilemap({ key: this.roomKey })
    const T1 = this.forest.tiles, T2 = this.forest.tiles2
    const tiles = map.addTilesetImage('tiles', T1.key)
    // zweites Material (Stein), falls der Raum es kennt und das Bild da ist
    const tiles2 = map.tilesets.some((t) => t.name === (T2?.name ?? 'stein')) && T2 && this.textures.exists(T2.key)
      ? map.addTilesetImage(T2.name, T2.key) : null
    const objects = map.getObjectLayer('Objekte')?.objects ?? []

    // ---------- Parallax: hinten → vorne ----------
    // scrollFactor sagt, wie stark eine Ebene mit der Kamera mitwandert.
    // 0 = bleibt stehen (Himmel), 1 = normal (Spielebene), >1 = schneller (Vordergrund)
    this.add.image(0, 0, 'bg_sky').setOrigin(0).setScrollFactor(0).setDepth(-100)   // ganz hinten – hinter allen Ebenen
    // Jede Ebene ist ein nahtlos wiederholbares Bild, das mit eigenem Tempo wandert
    this.bgLayers = []
    const BG = this.forest.background
    const layers = (BG?.layers ?? []).filter((l) => this.textures.exists(l.key))
    const fallback = [{ key: 'bg_far', scroll: 0.2 }, { key: 'bg_mid', scroll: 0.5 }]
    for (const [i, l] of (layers.length ? layers : fallback).entries()) {
      const ts = this.add.tileSprite(0, l.y ?? 0, GAME.width, l.h ?? GAME.height, l.key).setOrigin(0).setScrollFactor(0).setDepth(l.depth ?? tiefeZuDepth(l.scroll))
      if (l.alpha !== undefined) ts.setAlpha(l.alpha)
      if (l.tint !== undefined) ts.setTint(l.tint)
      this.bgLayers.push({ ts, scroll: l.scroll, offsetX: l.offsetX ?? 0 })
    }
    // Dunst: wie in einem echten Wald wird es nach hinten dunkler und blauer
    if (layers.length) this.add.rectangle(0, 0, GAME.width, GAME.height, P.nachtBlau, BG.haze ?? 0.3).setOrigin(0).setScrollFactor(0).setDepth(-25)
    // die Büsche-Platzhalter vorne nur, wenn keine echte Farn-Ebene da ist
    this.hasFgLayer = layers.some((l) => (l.depth ?? 0) > 20)

    // "Boden" ist die Ebene aus Tiled: Sie bestimmt, wo man stehen kann.
    this.groundLayer = map.createLayer('Boden', tiles2 ? [tiles, tiles2] : tiles, 0, 0).setDepth(0)
    this.groundLayer.setCollisionByExclusion([-1])   // jede gesetzte Kachel ist fest

    // Mit echtem Tileset: Boden unsichtbar (nur Kollision), hübsche Grafik-Ebene obendrauf
    if (T1.file) {
      this.groundLayer.setVisible(DEBUG)
      this.makeWangLayer(map, tiles, tiles2)
    }

    this.fgBushes = this.add.tileSprite(0, 0, GAME.width, GAME.height, 'fg_bushes').setOrigin(0).setScrollFactor(0).setDepth(20).setVisible(!this.hasFgLayer)

    // ---------- Helden ----------
    const spawn = objects.find((o) => (o.type === 'spawn' || o.type === 'checkpoint') && o.name === this.spawnName)
      ?? objects.find((o) => o.type === 'spawn')
    const facing = spawn.x < map.widthInPixels / 2 ? 1 : -1       // links rein → nach rechts schauen
    this.jonas = new Jonas(this, spawn.x, spawn.y).placeFeet(spawn.x, spawn.y)
    this.leonel = new Leonel(this, spawn.x, spawn.y).placeFeet(spawn.x, spawn.y)
    this.active = world.active === 'leonel' ? this.leonel : this.jonas
    this.companion = this.active === this.jonas ? this.leonel : this.jonas
    this.companion.placeFeet(spawn.x + facing * 20, spawn.y)   // Begleiter etwas weiter IM Raum, nie im Ausgang
    this.active.setDepth(10); this.companion.setDepth(9)
    for (const h of [this.jonas, this.leonel]) {
      h.hp = world.hp[h.cfg.key]
      h.facing = facing
      h.setFlipX(facing < 0)
      this.physics.add.collider(h, this.groundLayer)
    }

    for (const hero of [this.jonas, this.leonel]) this.addShadow(hero, 14)
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
      const Klasse = cfg.kind === 'flyer' ? Owl : Enemy
      // Manche Gegner kommen als Gruppe (Ameisenkolonne) aus EINEM Tiled-Punkt
      const anzahl = cfg.gruppe ?? 1
      const gruppe = []
      for (let i = 0; i < anzahl; i++) {
        const e = new Klasse(this, o.x - i * (cfg.gruppeAbstand ?? 20), o.y - cfg.frame.h / 2, cfg).setDepth(8)
        e.objectId = o.id
        e.isLeader = i === 0
        if (anzahl > 1) { e.groupMates = gruppe; gruppe.push(e) }
        if (healedIn(this.roomKey).has(o.id)) e.heal(true)
        this.physics.add.collider(e, this.groundLayer)
        this.addShadow(e, Math.max(12, cfg.body.w))
        this.enemies.push(e)
      }
    }
    for (const hero of [this.jonas, this.leonel]) {
      this.physics.add.overlap(hero, this.enemies, (h, e) => this.onTouchEnemy(h, e))
    }
    this.gameOver = false
    this.leaving = false

    // ---------- Ausgänge, Tore, Platten, Hebel ----------
    const zone = (o) => { const z = this.add.zone(o.x + o.width / 2, o.y + o.height / 2, o.width, o.height); this.physics.add.existing(z, true); return z }
    this.exits = objects.filter((o) => o.type === 'ausgang').map((o) => ({ zone: zone(o), ...props(o) }))
    this.exitsArmed = false   // Ausgänge zählen erst, wenn man nach dem Start einmal keinen berührt

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

    // Lianen zum Schwingen (nur Jonas): Bild hängt vom Ankerpunkt herab
    this.schwingen = objects.filter((o) => o.type === 'schwinge').map((o) => {
      const x = o.x + o.width / 2
      if (this.textures.exists('deko-liane')) this.add.tileSprite(x, o.y, 12, o.height, 'deko-liane').setOrigin(0.5, 0).setDepth(3)
      return { x, top: o.y, len: o.height, zone: this.add.zone(x, o.y + o.height, 26, 30) }
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
    this.projectiles = []
    this.jonas.specialCooldownMs = SLAM.cooldownMs
    this.leonel.specialCooldownMs = SPIRIT.cooldownMs

    // Glühwürmchen: treiben langsam durch den Raum und blinken
    this.fireflies = []
    for (let i = 0; i < 14; i++) {
      const f = this.add.rectangle(Math.random() * map.widthInPixels, 60 + Math.random() * 160, 2, 2, P.hellGelb).setDepth(14)
      this.fireflies.push({ f, phase: Math.random() * 100, vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 0.5) * 6 })
    }

    // Kulissen: große Hintergrundbilder mit eigener Parallax-Tiefe. Damit ein Objekt an
    // seiner Welt-Position erscheint, wenn die Kamera dort steht, wird x umgerechnet:
    //   bild.x = x·tiefe + halbeBildschirmbreite·(1 − tiefe)
    for (const o of objects.filter((o) => o.type === 'kulisse')) {
      const key = 'kulisse-' + o.name
      if (!this.textures.exists(key)) { console.warn('Unbekannte Kulisse:', o.name); continue }
      const tiefe = Number(props(o).tiefe ?? 0.5)
      const k = KULISSEN[o.name] ?? {}
      // WICHTIG: dieselbe Tiefen-Formel wie für die Hintergrund-Ebenen. Sonst liegt
      // eine ferne Kulisse VOR den nahen Bäumen und alles wirkt falsch gestapelt.
      const img = this.add.image(o.x * tiefe + (GAME.width / 2) * (1 - tiefe), k.standY ?? o.y, key)
        .setOrigin(0.5, 1).setScrollFactor(tiefe, 0).setDepth(tiefeZuDepth(tiefe) + 1)   // knapp VOR der gleich schnellen Ebene, aber hinter der nächsten
      img.setAlpha(0.85 + tiefe * 0.15)
      // Fernes wird vom Dunst eingefärbt – genau wie die ferne Baumreihe
      if (tiefe < 0.5) img.setTint(0x8fa0c0)
      if (props(o).spiegeln) img.setFlipX(true)
    }

    // Deko: nur Bilder, keine Physik. Hinter den Figuren (Tiefe 2) oder davor (Tiefe 15).
    // haengend = Ankerpunkt oben; glow = pulsiert leicht; anim = Spritesheet-Animation
    this.glowing = []
    this.vorneDeko = []                 // Deko VOR den Figuren – wird durchsichtig, wenn jemand dahintersteht
    for (const o of objects.filter((o) => o.type === 'deko')) {
      const key = 'deko-' + o.name
      if (!this.textures.exists(key)) { console.warn('Unbekannte Deko:', o.name); continue }
      const p = props(o), d = DEKO[o.name] ?? {}
      // +2 px: die Deko steckt leicht im Moos, sonst sieht sie aus, als schwebe sie
      const img = d.anim ? this.add.sprite(o.x, o.y, key).play(key) : this.add.image(o.x, o.y, key)
      img.setOrigin(0.5, d.haengend ? 0 : 1).setDepth(p.vorne ? 15 : 2).setFlipX(!!p.spiegeln)
      if (!d.haengend) { img.y += 2; if (img.width >= 20) this.addShadow(img, Math.min(30, img.width * 0.8), false).setPosition(img.x, img.y - 1) }
      if (d.glow) { img.istGlow = true; this.glowing.push(img) }
      if (p.vorne) { img.durchsicht = 1; this.vorneDeko.push(img) }
    }

    // Tiere: friedliche Waldbewohner – sitzen, gucken, hüpfen ab und zu ein Stück
    this.tiere = []
    for (const o of objects.filter((o) => o.type === 'tier')) {
      const key = 'tier-' + o.name
      if (!this.textures.exists(key)) { console.warn('Unbekanntes Tier:', o.name); continue }
      const t = TIERE[o.name] ?? {}
      const spr = t.anim ? this.add.sprite(o.x, o.y, key).play(key) : this.add.image(o.x, o.y, key)
      spr.setOrigin(0.5, 1).setDepth(7).setFlipX(Math.random() < 0.5)
      spr.y += 2
      if (!t.flatter) this.addShadow(spr, 14, false).setPosition(spr.x, spr.y - 1)
      this.tiere.push({ spr, cfg: t, home: { x: o.x, y: o.y + 2 }, next: 0 })
    }

    // Speicherpunkte: ein Eichhörnchen, das beim Berühren hüpft und ein Herz zeigt
    this.checkpoints = objects.filter((o) => o.type === 'checkpoint').map((o) => {
      const key = this.textures.exists('tier-eichhoernchen') ? 'tier-eichhoernchen' : 'deko-schild'
      const img = (this.anims.exists(key) ? this.add.sprite(o.x, o.y, key).play(key) : this.add.image(o.x, o.y, key)).setOrigin(0.5, 1).setDepth(7)
      this.physics.add.existing(img, true)
      img.y += 2
      this.addShadow(img, 14, false).setPosition(img.x, img.y - 1)
      const heart = this.add.text(o.x, o.y - 30, '♥', { fontFamily: 'monospace', fontSize: '10px', color: '#f6757a', stroke: '#181425', strokeThickness: 2 }).setOrigin(0.5).setDepth(8).setVisible(o.name === this.spawnName)
      return { img, heart, name: o.name, x: o.x, y: o.y }
    })

    // Waldherz (Ziel)
    this.hearts = objects.filter((o) => o.type === 'waldherz').map((o) => {
      const img = (this.anims.exists('waldherz-anim') ? this.add.sprite(o.x, o.y - 10, 'waldherz').play('waldherz-anim') : this.add.image(o.x, o.y - 10, 'waldherz')).setDepth(6)
      this.physics.add.existing(img, true)
      this.tweens.add({ targets: img, y: o.y - 16, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.InOut' })
      return img
    })

    // ---------- Kamera & Welt ----------
    const worldW = map.widthInPixels, worldH = map.heightInPixels
    this.physics.world.setBounds(0, 0, worldW, worldH + 64)   // unten offen (Abgründe gibt es aktuell keine – Tilman will keine)
    this.worldBottom = worldH
    this.cameras.main.setBounds(0, 0, worldW, worldH)
    this.cameras.main.startFollow(this.active, true, 0.12, 0.12)
    this.cameras.main.fadeIn(250, 0, 0, 0)

    // ---------- Steuerung ----------
    this.controls = new Controls(this)
    const isTouch = this.sys.game.device.input.touch || new URLSearchParams(location.search).has('touch')
    if (isTouch) this.touchButtons = new TouchButtons(this, this.controls)

    // ---------- HUD (fest am Bildschirm) ----------
    const font = this.textures.exists('panel') && document.fonts?.check?.(`8px "${UI.fontFamily}"`) ? UI.fontFamily : 'monospace'
    const hudStyle = { fontFamily: font, fontSize: font === 'monospace' ? '8px' : '10px', stroke: '#181425', strokeThickness: 2 }
    if (this.textures.exists('panel')) {
      // Holz-Rahmen als Neun-Teile-Bild: Ecken bleiben scharf, Mitte wird gestreckt
      this.add.nineslice(2, 2, 'panel', undefined, 268, 40, UI.panelBorder, UI.panelBorder, UI.panelBorder, UI.panelBorder).setOrigin(0).setScrollFactor(0).setDepth(99).setAlpha(0.92)
    } else {
      hudStyle.backgroundColor = 'rgba(24,20,37,0.7)'; hudStyle.padding = { x: 2, y: 1 }
    }
    this.nameText = this.add.text(10, 8, '', { ...hudStyle, color: '#fee761' }).setScrollFactor(0).setDepth(100)
    this.hud = this.add.text(10, 22, '', { ...hudStyle, color: '#ffffff' }).setScrollFactor(0).setDepth(100)
    // Herzen als Bilder (wenn vorhanden): je Held 3 Icons hinter dem Namen
    this.heartIcons = null
    if (this.textures.exists('herz')) {
      // Zeile 2: "Jonas" ♥♥♥   "Leonel" ♥♥♥   🍃 N
      this.heartIcons = { jonas: [], leonel: [] }
      this.hud.setText('Jonas')
      this.hudLeonel = this.add.text(104, 22, 'Leonel', { ...hudStyle, color: '#ffffff' }).setScrollFactor(0).setDepth(100)
      for (let i = 0; i < COMBAT.heroHp; i++) {
        this.heartIcons.jonas.push(this.add.image(56 + i * 12, 30, 'herz').setScale(0.75).setScrollFactor(0).setDepth(101))
        this.heartIcons.leonel.push(this.add.image(160 + i * 12, 30, 'herz').setScale(0.75).setScrollFactor(0).setDepth(101))
      }
      if (this.textures.exists('blatt')) this.add.image(208, 30, 'blatt').setScale(0.5).setScrollFactor(0).setDepth(101)
      this.hudLeaves = this.add.text(218, 22, '0', { ...hudStyle, color: '#ffffff' }).setScrollFactor(0).setDepth(100)
      // Fähigkeits-Anzeige: Balken füllt sich, bis E wieder geht
      this.abilityBack = this.add.rectangle(242, 30, 22, 5, P.schwarz, 0.6).setScrollFactor(0).setDepth(100)
      this.abilityBar = this.add.rectangle(232, 30, 20, 3, P.eisBlau).setOrigin(0, 0.5).setScrollFactor(0).setDepth(101)
      this.add.text(232, 18, 'E', { ...hudStyle, fontSize: '9px', color: '#c0cbdc' }).setScrollFactor(0).setDepth(100)
    }
    // Tastenhilfe: am Anfang gut sichtbar, nach 15 Sekunden blendet sie weg,
    // damit sie nicht dauernd im Wald herumliegt.
    if (!isTouch) {
      const hilfe = this.add.text(GAME.width / 2, GAME.height - 3, 'Pfeile · Leer Sprung · X Schlag · E Fähigkeit · Tab Wechsel · C Komm · M Musik · P Pause', { fontFamily: 'monospace', fontSize: '7px', color: '#c0cbdc', stroke: '#181425', strokeThickness: 2 }).setOrigin(0.5, 1).setScrollFactor(0).setDepth(100).setAlpha(0.7)
      this.tweens.add({ targets: hilfe, alpha: 0, delay: 15000, duration: 1500, onComplete: () => hilfe.destroy() })
    }
    this.updateNameText()

    const pauseFont = this.textures.exists('panel') && document.fonts?.check?.(`8px "${UI.fontFamily}"`) ? UI.fontFamily : 'monospace'
    this.pausePanel = this.textures.exists('panel')
      ? this.add.nineslice(GAME.width / 2, GAME.height / 2, 'panel', undefined, 270, 70, UI.panelBorder, UI.panelBorder, UI.panelBorder, UI.panelBorder).setScrollFactor(0).setDepth(299).setVisible(false)
      : null
    this.pauseText = this.add.text(GAME.width / 2, GAME.height / 2, 'PAUSE\n\nP oder Esc zum Weiterspielen', {
      fontFamily: pauseFont, fontSize: pauseFont === 'monospace' ? '14px' : '13px', color: '#fee761', align: 'center', stroke: '#181425', strokeThickness: 3,
      ...(this.pausePanel ? {} : { backgroundColor: 'rgba(24,20,37,0.85)', padding: { x: 10, y: 8 } }),
    }).setOrigin(0.5).setScrollFactor(0).setDepth(300).setVisible(false)
    // kleiner Pause-Knopf oben rechts (für Touch)
    this.add.text(GAME.width - 4, 3, 'II', { fontFamily: 'monospace', fontSize: '10px', color: '#c0cbdc', backgroundColor: 'rgba(24,20,37,0.7)', padding: { x: 4, y: 1 } })
      .setOrigin(1, 0).setScrollFactor(0).setDepth(100).setInteractive().on('pointerdown', () => this.togglePause())

    // Zum Nachschauen in der Browser-Konsole: __wald.scene.jonas.x usw.
    window.__wald = { scene: this, world }
  }

  update(time) {
    if (this.gameOver || this.leaving || this.paused) return

    // 1. Finger lesen (setzt controls.touch), dann Kommando bauen
    this.touchButtons?.update()
    const cmd = this.controls.read()

    // 2. Wechsel?
    if (cmd.switch) this.switchHero(time)

    // 3. Der Aktive tut, was der Spieler sagt … (E = Spezialfähigkeit, nur der Aktive!)
    if (cmd.special) this.useSpecial(this.active, time)
    this.checkSwings(time)
    this.checkVines(cmd, time)
    this.active.applyCommand(cmd, time)

    // 4. … der Begleiter tut, was sein Gehirn sagt.
    if (cmd.call && this.brain.waiting) this.sfx.play('call')
    const aiCmd = this.brain.think(this.companion, this.active, time, this.enemies, cmd.call)
    this.lastAiCmd = aiCmd   // zum Nachschauen in der Konsole
    if (aiCmd.teleport) this.teleportCompanion()
    else this.companion.applyCommand(aiCmd, time)
    this.waitText.setVisible(this.brain.waiting).setPosition(Math.round(this.companion.x), Math.round(this.companion.body.top - 10))

    // 4a. Sicherer Boden merken & Abgrund prüfen
    for (const h of [this.jonas, this.leonel]) {
      if (h.onGround && h.body.bottom < this.worldBottom - 4) {
        // nur merken, wenn unter den Füßen wirklich eine Kachel ist (nicht auf einem Tor o.ä.)
        const t = this.groundLayer.getTileAtWorldXY(h.x, h.body.bottom + 2)
        if (t) h.lastSafe = { x: h.x, y: h.body.bottom }
      }
      if (h.body.top > this.worldBottom) this.fellIntoPit(h, time)
    }

    // 4b. Glühwürmchen
    for (const w of this.fireflies) {
      w.f.x += w.vx * 0.016 + Math.sin(time / 700 + w.phase) * 0.15
      w.f.y += w.vy * 0.016 + Math.cos(time / 900 + w.phase) * 0.12
      w.f.setAlpha(0.3 + Math.max(0, Math.sin(time / 400 + w.phase)) * 0.7)
    }

    for (const cp of this.checkpoints) if (cp.heart.visible) cp.heart.y = cp.y - 30 + Math.sin(time / 300) * 2
    // 4c. Schatten, Tiere und leuchtende Deko
    this.updateShadows()
    this.updateTiere(time)
    // Deko im Vordergrund wird durchsichtig, sobald ein Held dahintersteht –
    // sonst verschwinden Jonas und Leonel hinter Baumstämmen und Büschen.
    for (const d of this.vorneDeko) {
      const b = d.getBounds()
      const dahinter = Phaser.Geom.Rectangle.Overlaps(b, this.active.getBounds())
        || Phaser.Geom.Rectangle.Overlaps(b, this.companion.getBounds())
      d.durchsicht += ((dahinter ? 0.5 : 1) - d.durchsicht) * 0.18      // weich überblenden
      if (!d.istGlow) d.setAlpha(d.durchsicht)
    }
    for (const g of this.glowing) g.setAlpha((0.85 + Math.sin(time / 300 + g.x) * 0.15) * (g.durchsicht ?? 1))

    // 5. Gegner laufen, Schläge treffen, Rätsel prüfen
    for (const e of this.enemies) e.update(time, this.groundLayer, [this.jonas, this.leonel])
    for (const sp of this.spirits) sp.update(time, this.enemies)
    this.spirits = this.spirits.filter((sp) => sp.active)
    for (const pr of this.projectiles) pr.update(time)
    this.projectiles = this.projectiles.filter((pr) => pr.active)
    this.resolveAttacks(time)
    this.updatePuzzles()
    this.collectLeaves()
    if (this.hearts.some((h) => this.physics.overlap(h, this.active))) this.finishForest()
    for (const cp of this.checkpoints) {
      if (cp.name === this.spawnName || !this.physics.overlap(cp.img, this.active)) continue
      this.spawnName = cp.name
      world.hp.jonas = this.jonas.hp; world.hp.leonel = this.leonel.hp
      saveGame(this.roomKey, cp.name)
      for (const c of this.checkpoints) c.heart.setVisible(false)
      cp.heart.setVisible(true)
      this.tweens.add({ targets: cp.img, y: cp.y - 14, duration: 180, yoyo: true, repeat: 1, ease: 'Quad.Out' })   // Freudenhopser
      this.sparkle(cp.x, cp.y - 20, P.rosaHell, 12)
      this.sfx.play('room')
      this.floatText(this.active, 'Gespeichert!')
    }
    this.checkExits()
    this.updateHud()

    // 6. Pfeil über dem Aktiven
    this.marker.setPosition(Math.round(this.active.x), Math.round(this.active.body.top - 8))

    // 7. Parallax: Hintergrund langsamer, Vordergrund schneller als die Kamera
    const sx = this.cameras.main.scrollX
    for (const l of this.bgLayers) l.ts.tilePositionX = sx * l.scroll + l.offsetX
    this.fgBushes.tilePositionX = sx * 1.3
  }

  // Musik läuft über das ganze Level durch; jeder Wald hat sein eigenes Stück.
  startMusic() {
    const track = this.forest.musik ?? MUSIC.titleTrack
    const key = 'musik-' + track
    if (!this.cache.audio.exists(key)) return
    // läuft schon ein anderes Stück? → leise ausblenden
    for (const other of this.sound.getAllPlaying()) if (other.key !== key && other.key.startsWith('musik-')) { this.tweens.add({ targets: other, volume: 0, duration: 800, onComplete: () => other.stop() }) }
    let m = this.sound.get(key)
    if (!m) m = this.sound.add(key, { loop: true, volume: MUSIC.volume })
    this.music = m
    if (!m.isPlaying && !world.musicOff) { m.setVolume(MUSIC.volume); m.play() }
  }

  toggleMusic() {
    world.musicOff = !world.musicOff
    const m = this.music
    if (m) world.musicOff ? m.pause() : m.resume()
    this.floatText(this.active, world.musicOff ? 'Musik aus' : 'Musik an')
  }

  togglePause() {
    if (this.gameOver || this.leaving) return
    this.paused = !this.paused
    this.pauseText.setVisible(this.paused)
    this.pausePanel?.setVisible(this.paused)
    if (this.paused) { this.physics.pause(); this.anims.pauseAll(); this.tweens.pauseAll() }
    else { this.physics.resume(); this.anims.resumeAll(); this.tweens.resumeAll() }
  }

  // Zeichnet den Boden mit dem Wang-Tileset (siehe Erklärung in config.js).
  // Für jede ECKE zwischen vier Feldern schauen wir, welche der vier fest
  // sind, und wählen die passende Kachel. Die Ebene ist um 8 px verschoben,
  // damit die Kachelmitte genau auf der Ecke liegt.
  makeWangLayer(map, tiles, tiles2 = null) {
    const W = map.width, H = map.height
    // Material einer Zelle: 0 = Luft, 1 = Erde, 2 = Stein (gid im zweiten Tileset)
    const mat = (x, y) => {
      if (y < 0) return 0                           // über der Welt: Luft
      x = Phaser.Math.Clamp(x, 0, W - 1)            // seitlich: wie am Rand
      if (y >= H) return mat(x, H - 1) || 1         // unter der Welt: wie darüber, sonst Erde
      const t = this.groundLayer.getTileAt(x, y)
      if (!t) return 0
      return tiles2 && t.index >= tiles2.firstgid ? 2 : 1
    }
    const sets = [null, { ts: tiles, frames: this.forest.tiles.wangFrames }, tiles2 && this.forest.tiles2?.wangFrames ? { ts: tiles2, frames: this.forest.tiles2.wangFrames } : null]
    const layer = map.createBlankLayer('BodenGrafik', tiles2 ? [tiles, tiles2] : tiles, -GAME.tile / 2, -GAME.tile / 2, W + 1, H + 1)
    for (let vy = 0; vy <= H; vy++) {
      for (let vx = 0; vx <= W; vx++) {
        const m = [mat(vx, vy), mat(vx - 1, vy), mat(vx, vy - 1), mat(vx - 1, vy - 1)]   // SE, SW, NE, NW
        const idx = (m[0] ? 1 : 0) + (m[1] ? 2 : 0) + (m[2] ? 4 : 0) + (m[3] ? 8 : 0)
        if (idx === 0) continue                       // nur Luft → nichts zeichnen
        // Welches Material zeichnen? Das der unteren Zellen zuerst (da steht man drauf)
        const which = m.find((v) => v) || 1
        const set = sets[which] ?? sets[1]
        layer.putTileAt(set.ts.firstgid + set.frames[idx], vx, vy)
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
    this.sfx.play('switch')
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
    this.sfx.play('plopp')
    const me = this.companion, leader = this.active
    me.halt()
    me.placeFeet(leader.x - leader.facing * 10, leader.body.bottom)
    me.setScale(0.2)
    this.tweens.add({ targets: me, scale: 1, duration: 220, ease: 'Back.Out' })
    const ring = this.add.circle(me.x, me.body.center.y, 6, 0, 0).setStrokeStyle(2, P.eisBlau).setDepth(12)
    this.tweens.add({ targets: ring, radius: 22, alpha: 0, duration: 350, onComplete: () => ring.destroy() })
  }

  // Steht ein geschlossenes Tor zwischen zwei Punkten (gleiche Höhe)? Dann geht nichts durch.
  gateBetween(x1, x2, y) {
    const lo = Math.min(x1, x2), hi = Math.max(x1, x2)
    return Object.values(this.gates).some((g) => g.body.enable && g.x >= lo && g.x <= hi && y >= g.y - g.height / 2 - 8 && y <= g.y + g.height / 2 + 8)
  }

  // Trifft ein Schlag gerade einen Gegner? Jeder Schlag trifft jeden Gegner nur einmal.
  // Durch ein geschlossenes Tor geht kein Schlag.
  resolveAttacks(time) {
    for (const hero of [this.active, this.companion]) {
      const rect = hero.attackRect(time)
      if (!rect) continue
      if (Object.values(this.gates).some((g) => g.body.enable && Phaser.Geom.Rectangle.Overlaps(rect, g.getBounds()))) { hero.hitThisAttack.add('tor'); continue }
      const factor = hero === this.active ? 1 : COMBAT.companionDamageFactor
      const damage = Math.max(1, Math.ceil(hero.cfg.damage * factor))
      for (const e of this.enemies) {
        if (e.healed || hero.hitThisAttack.has(e)) continue
        if (!Phaser.Geom.Rectangle.Overlaps(rect, e.getBounds())) continue
        hero.hitThisAttack.add(e)
        const result = e.hit(damage, hero.x, time)
        if (result === null) { this.floatText(hero, 'Stachelig!'); this.sfx.play('hit'); continue }
        if (result) { healedIn(this.roomKey).add(e.objectId); this.sfx.play('heal'); this.sparkle(e.x, e.body.center.y, P.rosaHell, 16) }
        else this.sfx.play('hit')
      }
    }
  }

  // Der verwirrte Affe wirft eine Jackfrucht im Bogen auf ein Ziel.
  // Sie fliegt wie ein geworfener Ball: nach vorn und oben, dann zieht sie die
  // Schwerkraft herunter. Trifft sie den Boden oder einen Helden, zerplatzt sie.
  wirfFrucht(affe, ziel) {
    if (!this.textures.exists(WURF.key)) return
    const dir = ziel ? Math.sign(ziel.x - affe.x) || 1 : affe.dir
    const w = affe.cfg.ai.wurf ?? { x: 130, y: -190 }
    const p = new Projectile(this, affe.x + dir * 8, affe.body.center.y, WURF.key, dir * w.x, w.y)
    this.physics.add.collider(p, this.groundLayer, () => p.zerplatzen())
    for (const held of [this.jonas, this.leonel]) {
      this.physics.add.overlap(p, held, () => {
        if (!p.active) return
        const treffer = held.hurt(this.time.now, p.x)
        if (treffer) this.sfx.play('hurt')
        if (treffer === 'ko') { if (held === this.companion) held.daze(this.time.now); else this.loseRoom() }
        p.zerplatzen()
      })
    }
    this.projectiles.push(p)
    this.sfx.play('attack')
  }

  // Spezialfähigkeit des aktiven Helden (Taste E)
  useSpecial(hero, time) {
    if (hero.isDazed(time) || hero.vine) return
    if (!hero.specialReady(time)) {              // noch nicht aufgeladen → kurze Rückmeldung
      this.sfx.play('nope')
      this.floatText(hero, 'Noch nicht bereit')
      return
    }
    if (hero.cfg.key === 'jonas') {
      // Stampfer: hochspringen und auf den Boden knallen → Gegner ringsum werden benommen
      if (hero.startSlam(time)) this.sfx.play('jump')
    } else if (hero.cfg.key === 'leonel') {
      // Waldgeist rufen – danach muss sich Leonel erst wieder sammeln
      hero.specialReadyAt = time + SPIRIT.cooldownMs
      this.spirits.push(new Spirit(this, hero, time))
      this.sfx.play('spirit')
    }
  }

  // Jonas ist mit dem Stampfer aufgekommen: Erschütterung!
  onSlamLanded(hero, time) {
    this.cameras.main.shake(180, 0.006)
    this.sfx.play('slam')
    const ring = this.add.ellipse(hero.x, hero.body.bottom, 10, 4, 0, 0).setStrokeStyle(2, P.sandHell).setDepth(12)
    this.tweens.add({ targets: ring, width: SLAM.radius * 2, height: 10, alpha: 0, duration: 300, onComplete: () => ring.destroy() })
    for (const e of this.enemies) {
      if (e.healed || Math.abs(e.x - hero.x) > SLAM.radius || Math.abs(e.body.bottom - hero.body.bottom) > 24) continue
      if (this.gateBetween(hero.x, e.x, e.body.center.y)) continue   // Tore halten die Erschütterung auf
      e.stun(time, SLAM.dizzyMs)
    }
  }

  // Springt Jonas gerade in eine Liane? Dann greift er automatisch zu.
  checkSwings(time) {
    const hero = this.active
    if (hero.cfg.key !== 'jonas' || hero.swing || hero.vine || hero.slamming || hero.onGround) return
    for (const sw of this.schwingen) {
      if (Math.abs(hero.x - sw.zone.x) > 20 || Math.abs(hero.body.center.y - sw.zone.y) > 22) continue
      if (hero.startSwing(sw, time)) { this.sfx.play('climb'); this.floatText(hero, 'Halt dich fest!') }
      return
    }
  }

  // Steht Jonas an einer Ranke und drückt hoch (oder runter, wenn er oben davor steht)? → klettern
  checkVines(cmd, time) {
    const hero = this.active
    if (hero.cfg.key !== 'jonas' || hero.vine || hero.slamming) return
    if (!cmd.up && !cmd.crouch) return
    const r = this.ranken.find((r) => Math.abs(r.x - hero.x) <= CLIMB.reach && hero.body.bottom > r.top - 4 && hero.body.top < r.bottom)
    if (r) { hero.startClimb(r); this.sfx.play('hook') }
  }

  // Tiere: alle paar Sekunden ein kleiner Hopser oder ein Blick zur anderen Seite;
  // Schmetterlinge flattern in Achten um ihren Platz.
  updateTiere(time) {
    for (const t of this.tiere) {
      const { spr, cfg, home } = t
      if (cfg.flatter) {
        spr.x = home.x + Math.sin(time / 900 + home.x) * 24
        spr.y = home.y - 20 + Math.sin(time / 350 + home.y) * 8
        spr.setFlipX(Math.cos(time / 900 + home.x) < 0)
        continue
      }
      if (time < t.next) continue
      t.next = time + Phaser.Math.Between(1500, 5000)
      const r = Math.random()
      if (r < 0.4) spr.setFlipX(!spr.flipX)                                   // umschauen
      else if (r < 0.8 && cfg.hop) {                                           // Hopser
        const dx = Phaser.Math.Between(-14, 14)
        this.tweens.add({ targets: spr, y: home.y - 10, duration: 160, yoyo: true, ease: 'Quad.Out' })
        this.tweens.add({ targets: spr, x: Phaser.Math.Clamp(spr.x + dx, home.x - 30, home.x + 30), duration: 320 })
        spr.setFlipX(dx < 0)
      }
    }
  }

  // Ein weicher Schatten macht sichtbar, WO etwas steht – ohne ihn wirkt alles
  // wie schwebend, weil der Moosboden oben rund und dunkel ist.
  addShadow(target, width = 14, follow = true) {
    const sh = this.add.ellipse(target.x, 0, width, Math.max(3, width * 0.3), P.schwarz, 0.28).setDepth(1)
    sh.follow = follow
    sh.target = target
    sh.groundY = (target.body ? target.body.bottom : target.y) + 1
    this.shadows.push(sh)
    return sh
  }

  updateShadows() {
    for (const sh of this.shadows) {
      const t = sh.target
      if (!t.active) { sh.setVisible(false); continue }
      if (!sh.follow) continue
      sh.x = t.x
      if (t.body) {
        if (t.body.blocked.down) sh.groundY = t.body.bottom + 1          // am Boden: Höhe merken
        const hoehe = Math.max(0, sh.groundY - t.body.bottom)             // wie hoch in der Luft?
        sh.setScale(Math.max(0.35, 1 - hoehe / 90))
        sh.setAlpha(0.28 * Math.max(0.25, 1 - hoehe / 90))
      }
      sh.y = sh.groundY
    }
  }

  // Kurzer Text, der über einer Figur aufsteigt
  floatText(target, text) {
    const t = this.add.text(target.x, target.body.top - 6, text, { fontFamily: 'monospace', fontSize: '8px', color: '#fee761', stroke: '#181425', strokeThickness: 2 }).setOrigin(0.5).setDepth(50)
    this.tweens.add({ targets: t, y: t.y - 14, alpha: 0, duration: 800, onComplete: () => t.destroy() })
  }

  // Das Waldherz berührt → dieser Wald ist gerettet
  finishForest() {
    if (this.leaving) return
    this.leaving = true
    this.sfx.play('heal')
    this.active.halt(); this.companion.halt()
    // Der Wald ist geschafft: Der Spielstand wird gelöscht, sonst würde "Weiter"
    // durch den fertigen, leeren Wald führen. (Später: "Weiter" → nächster Wald.)
    world.finished = world.finished ?? {}
    world.finished[this.forestKey] = true
    // Gibt es noch einen Wald? Dann zeigt "Weiter" im Titel dorthin.
    const naechster = this.forest.weiter && FORESTS[this.forest.weiter]
    if (naechster) {
      world.hp.jonas = COMBAT.heroHp; world.hp.leonel = COMBAT.heroHp
      saveGame(naechster.level, 'start')
    } else clearSave()
    this.naechsterWald = naechster
    const W = GAME.width, H = GAME.height
    const font = document.fonts?.check?.(`8px "${UI.fontFamily}"`) ? UI.fontFamily : 'monospace'
    const endeKey = 'ende-' + this.forest.level
    if (this.textures.exists(endeKey)) {
      // Das Jubelbild blendet sich langsam ein
      const pic = this.add.image(0, 0, endeKey).setOrigin(0).setScrollFactor(0).setDepth(250).setAlpha(0)
      this.tweens.add({ targets: pic, alpha: 1, duration: 1200 })
      this.add.rectangle(0, 0, W, 44, P.schwarz, 0.45).setOrigin(0).setScrollFactor(0).setDepth(250)
      this.add.rectangle(0, H - 40, W, 40, P.schwarz, 0.45).setOrigin(0).setScrollFactor(0).setDepth(250)
    } else {
      this.add.rectangle(0, 0, W, H, P.schwarz, 0.6).setOrigin(0).setScrollFactor(0).setDepth(250)
    }
    this.add.text(W / 2, 20, this.forest.endeText, { fontFamily: font, fontSize: '18px', color: '#fee761', stroke: '#181425', strokeThickness: 4 }).setOrigin(0.5).setScrollFactor(0).setDepth(251)
    this.add.text(W / 2, H - 28, `Gesammelte Blätter: ${world.leaves}`, { fontFamily: font, fontSize: '11px', color: '#ffffff', stroke: '#181425', strokeThickness: 3 }).setOrigin(0.5).setScrollFactor(0).setDepth(251)
    if (this.naechsterWald) this.add.text(W / 2, H - 42, `Weiter geht es in die ${this.naechsterWald.name}!`, { fontFamily: font, fontSize: '11px', color: '#63c74d', stroke: '#181425', strokeThickness: 3 }).setOrigin(0.5).setScrollFactor(0).setDepth(251)
    this.add.text(W / 2, H - 12, 'Weiter mit Leertaste / Antippen', { fontFamily: 'monospace', fontSize: '8px', color: '#c0cbdc', stroke: '#181425', strokeThickness: 2 }).setOrigin(0.5).setScrollFactor(0).setDepth(251)
    const back = () => { world.hp.jonas = this.jonas.hp; world.hp.leonel = this.leonel.hp; this.scene.start('Title') }
    this.time.delayedCall(800, () => { this.input.keyboard.once('keydown-SPACE', back); this.input.once('pointerdown', back) })
  }

  // Blätter einsammeln (beide Helden dürfen)
  collectLeaves() {
    for (const leaf of this.leaves) {
      if (!leaf.active) continue
      if (!this.physics.overlap(leaf, this.jonas) && !this.physics.overlap(leaf, this.leonel)) continue
      collectedIn(this.roomKey).add(leaf.objectId)
      world.leaves++
      this.sfx.play('collect')
      this.sparkle(leaf.x, leaf.y, P.wiesenGruen, 8)
      this.tweens.add({ targets: leaf, y: leaf.y - 16, alpha: 0, scale: 1.6, duration: 350, onComplete: () => leaf.destroy() })
      leaf.body.enable = false
    }
    this.leaves = this.leaves.filter((l) => l.active)
  }

  // In einen Abgrund gefallen: ein Herz weniger, zurück auf den letzten sicheren Boden
  fellIntoPit(hero, time) {
    const safe = hero.lastSafe ?? { x: 48, y: 240 }
    hero.stopClimb?.(); hero.slamming = false
    hero.placeFeet(safe.x, safe.y)
    hero.hp -= COMBAT.pitDamage
    hero.invulnUntil = time + COMBAT.invulnMs
    this.sfx.play('hurt')
    this.cameras.main.flash(200, 24, 20, 37)
    if (hero.hp <= 0) { if (hero === this.companion) hero.daze(time); else this.loseRoom() }
  }

  // Ein Held berührt einen (noch nicht geheilten, nicht beruhigten) Gegner
  onTouchEnemy(hero, enemy) {
    if (this.gameOver) return
    const time = this.time.now
    if (!enemy.hurtsOnTouch(time)) return
    const result = hero.hurt(time, enemy.x)
    if (result) this.sfx.play('hurt')
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
        this.sfx.play('gate')
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
      if (this.gateStateKey !== '' || key !== '') this.sfx.play('gate')
      this.gateStateKey = key
      this.graph.setBlockers(closed.map((n) => this.gates[n].getBounds()))
    }
  }

  // Berührt der Aktive einen Ausgang? Dann in den nächsten Raum.
  checkExits() {
    const touching = this.exits.find((ex) => this.physics.overlap(ex.zone, this.active))
    if (!this.exitsArmed) { if (!touching) this.exitsArmed = true; return }
    if (touching) this.goToRoom(touching.ziel, touching.spawn)
  }

  goToRoom(room, spawn) {
    this.leaving = true
    this.sfx.play('room')
    world.hp.jonas = this.jonas.hp
    world.hp.leonel = this.leonel.hp
    this.active.halt(); this.companion.halt()
    this.cameras.main.fadeOut(250, 0, 0, 0)
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.restart({ room, spawn }))
  }

  // Der aktive Held hat keine Herzen mehr → der Raum beginnt von vorn (volle Herzen)
  loseRoom() {
    this.gameOver = true
    this.sfx.play('lose')
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
    if (this.heartIcons) {
      this.hudLeaves.setText(String(world.leaves))
      for (const [key, icons] of Object.entries(this.heartIcons)) icons.forEach((ic, i) => ic.setTexture(i < this[key].hp ? 'herz' : 'herz_leer'))
      const charge = this.active.specialCharge(this.time.now)
      this.abilityBar.width = Math.max(1, 20 * charge)
      this.abilityBar.fillColor = charge >= 1 ? P.eisBlau : P.schieferGrau
      return
    }
    const hearts = (h) => '♥'.repeat(Math.max(0, h.hp)) + '♡'.repeat(Math.max(0, COMBAT.heroHp - h.hp))
    this.hud.setText(`Jonas ${hearts(this.jonas)}   Leonel ${hearts(this.leonel)}   Blätter: ${world.leaves}`)
  }

  // Funkeln: kleine Punkte, die auseinanderfliegen und verblassen
  sparkle(x, y, color = P.hellGelb, n = 10) {
    for (let i = 0; i < n; i++) {
      const dot = this.add.rectangle(x, y, 2, 2, color).setDepth(16)
      const a = Math.random() * Math.PI * 2, d = 10 + Math.random() * 18
      this.tweens.add({ targets: dot, x: x + Math.cos(a) * d, y: y + Math.sin(a) * d - 6, alpha: 0, duration: 400 + Math.random() * 300, onComplete: () => dot.destroy() })
    }
  }

  updateNameText() {
    this.nameText.setText(`Du bist: ${this.active.cfg.name}`)
  }
}
