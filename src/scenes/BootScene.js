// ============================================================
//  BOOT-SZENE — lädt Bilder ODER malt Platzhalter
// ============================================================
//  Idee: Der Rest des Spiels kennt nur Namen wie 'jonas' oder
//  'tiles'. Ob dahinter ein echtes Bild steckt oder ein farbiges
//  Rechteck, entscheidet sich nur hier. So können wir später die
//  PixelLab-Sprites einbauen, ohne den Spielcode anzufassen.
// ============================================================
import Phaser from 'phaser'
import { HEROES, TILESET, GAME, ENEMIES, COMBAT, BACKGROUND } from '../config.js'
import { P } from '../palette.js'

// Alle Räume auf einmal: Vite sammelt jede JSON-Datei aus src/levels/
const LEVELS = import.meta.glob('../levels/*.json', { eager: true, import: 'default' })

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot')
  }

  preload() {
    // Echte Bilder laden — nur wenn in der Config ein Pfad steht.
    for (const hero of Object.values(HEROES)) {
      if (hero.file) {
        this.load.spritesheet(hero.key, hero.file, {
          frameWidth: hero.frame.w,
          frameHeight: hero.frame.h,
        })
      }
    }
    if (TILESET.file) {
      this.load.image(TILESET.key, TILESET.file)
    }
    if (BACKGROUND.file) {
      this.load.image(BACKGROUND.key, BACKGROUND.file)
    }

    // Jeder Raum landet unter seinem Dateinamen im Cache ('schwarzwald_01' …)
    for (const [path, data] of Object.entries(LEVELS)) {
      const key = path.split('/').pop().replace('.json', '')
      this.cache.tilemap.add(key, { format: Phaser.Tilemaps.Formats.TILED_JSON, data })
    }
  }

  create() {
    // Für alles, was NICHT geladen wurde: Platzhalter malen.
    for (const hero of Object.values(HEROES)) {
      if (!this.textures.exists(hero.key)) this.makeHeroPlaceholder(hero)
      this.makeAnimations(hero)
    }
    if (!this.textures.exists(TILESET.key)) this.makeTilesPlaceholder()
    for (const enemy of Object.values(ENEMIES)) {
      if (!this.textures.exists(enemy.key)) this.makeEnemyPlaceholder(enemy)
    }
    this.makeSlash()
    this.makePuzzlePlaceholders()

    this.makeParallaxPlaceholders()
    this.makeMarker()

    this.scene.start('Game')
  }

  // Ein Held als Rechteck: Körper in seiner Farbe, ein helles
  // Quadrat als "Gesicht" oben rechts, damit man sieht, wohin er guckt.
  makeHeroPlaceholder(hero) {
    const { w: fw, h: fh } = hero.frame
    const { w: bw, h: bh } = hero.body
    const g = this.make.graphics({ x: 0, y: 0, add: false })
    const x = Math.floor((fw - bw) / 2)
    const y = fh - bh
    g.fillStyle(hero.color)
    g.fillRect(x, y, bw, bh)
    g.fillStyle(hero.accent)
    g.fillRect(x + bw - 5, y + 3, 3, 3)          // Auge (schaut nach rechts)
    g.generateTexture(hero.key, fw, fh)
    g.destroy()
  }

  // Animationen aus der Config. Beim Platzhalter gibt es nur Bild 0.
  makeAnimations(hero) {
    for (const [name, a] of Object.entries(hero.anims)) {
      const key = `${hero.key}-${name}`
      if (this.anims.exists(key)) continue
      const frames = hero.file ? a.frames : [0]
      this.anims.create({
        key,
        frames: frames.map((f) => ({ key: hero.key, frame: f })),
        frameRate: a.rate,
        repeat: a.repeat,
      })
    }
  }

  // Drei Kacheln nebeneinander: 0 = Erde, 1 = Gras oben, 2 = Holzplattform
  makeTilesPlaceholder() {
    const t = GAME.tile
    const g = this.make.graphics({ x: 0, y: 0, add: false })

    // 0: Erde
    g.fillStyle(P.erdeDunkel); g.fillRect(0, 0, t, t)
    g.fillStyle(P.rindeBraun); g.fillRect(3, 5, 2, 2); g.fillRect(10, 11, 2, 2)

    // 1: Gras (Erde mit grüner Kante)
    g.fillStyle(P.erdeDunkel); g.fillRect(t, 0, t, t)
    g.fillStyle(P.blattGruen); g.fillRect(t, 0, t, 4)
    g.fillStyle(P.wiesenGruen); g.fillRect(t + 2, 0, 3, 2); g.fillRect(t + 9, 0, 2, 2)

    // 2: Holzplattform
    g.fillStyle(P.holzBraun); g.fillRect(2 * t, 0, t, t)
    g.fillStyle(P.rindeBraun); g.fillRect(2 * t, 0, t, 2); g.fillRect(2 * t, 8, t, 1)

    g.generateTexture(TILESET.key, TILESET.columns * t, t)
    g.destroy()
  }

  // Hintergrund-Ebenen als einfache Silhouetten. Jede Ebene ist ein
  // Streifen, der sich nahtlos wiederholen lässt (TileSprite).
  makeParallaxPlaceholders() {
    const W = GAME.width, H = GAME.height

    // Himmel: oben dunkel, unten heller — in Streifen (echte Verläufe gibt es
    // in Pixel-Art nicht, und Phaser kann sie beim Texturen-Malen sowieso nicht)
    let g = this.make.graphics({ x: 0, y: 0, add: false })
    const bands = [P.nachtBlau, P.daemmerBlau, P.schieferGrau, P.steinGrau]
    bands.forEach((c, i) => { g.fillStyle(c); g.fillRect(0, Math.floor(H * i / bands.length), W, Math.ceil(H / bands.length)) })
    g.generateTexture('bg_sky', W, H)
    g.destroy()

    // Ferne Tannen (dunkel, klein)
    g = this.make.graphics({ x: 0, y: 0, add: false })
    g.fillStyle(P.tannenDunkel)
    this.drawTreeRow(g, W, H, 40, 90, 12345)
    g.generateTexture('bg_far', W, H)
    g.destroy()

    // Nahe Tannen (etwas heller, größer)
    g = this.make.graphics({ x: 0, y: 0, add: false })
    g.fillStyle(P.moosGruen)
    this.drawTreeRow(g, W, H, 70, 150, 777)
    g.generateTexture('bg_mid', W, H)
    g.destroy()

    // Vordergrund: Büsche ganz unten, laufen VOR den Figuren vorbei
    g = this.make.graphics({ x: 0, y: 0, add: false })
    g.fillStyle(P.tannenDunkel)
    let rnd = new Phaser.Math.RandomDataGenerator([4242])
    for (let x = 0; x < W; x += 60) {
      const r = rnd.between(10, 18)
      g.fillCircle(x + rnd.between(0, 20), H + 4, r)
    }
    g.generateTexture('fg_bushes', W, H)
    g.destroy()
  }

  // Eine Reihe Dreiecke ("Tannen") mit fester Zufallszahl, damit sie
  // bei jedem Start gleich aussehen.
  drawTreeRow(g, W, H, minH, maxH, seed) {
    const rnd = new Phaser.Math.RandomDataGenerator([seed])
    let x = 0
    while (x < W) {
      const h = rnd.between(minH, maxH)
      const w = Math.floor(h * 0.6)
      g.fillTriangle(x, H, x + w / 2, H - h, x + w, H)
      x += Math.floor(w * 0.7)
    }
  }

  // Gegner-Platzhalter: flacher Körper mit Stacheln obendrauf, Auge vorne links
  makeEnemyPlaceholder(enemy) {
    const { w, h } = enemy.frame
    const g = this.make.graphics({ x: 0, y: 0, add: false })
    g.fillStyle(enemy.color)
    g.fillRect(1, 4, w - 2, h - 4)
    g.fillStyle(enemy.accent)
    for (let x = 2; x < w - 2; x += 4) g.fillTriangle(x, 4, x + 2, 0, x + 4, 4)
    g.fillStyle(P.schwarz)
    g.fillRect(3, 7, 2, 2)
    g.generateTexture(enemy.key, w, h)
    g.destroy()
  }

  // Der "Schlag": ein heller Halbmond vor der Figur
  makeSlash() {
    const { w, h } = COMBAT.attackBox
    const g = this.make.graphics({ x: 0, y: 0, add: false })
    g.fillStyle(P.hellGelb, 0.9)
    g.slice(2, h / 2, h / 2 - 1, Phaser.Math.DegToRad(-60), Phaser.Math.DegToRad(60), false)
    g.fillPath()
    g.fillStyle(P.weiss, 0.6)
    g.slice(4, h / 2, h / 2 - 5, Phaser.Math.DegToRad(-40), Phaser.Math.DegToRad(40), false)
    g.fillPath()
    g.generateTexture('slash', w, h)
    g.destroy()
  }

  // Tor (Holzbalken), Bodenplatte, Hebel
  makePuzzlePlaceholders() {
    const t = GAME.tile
    let g = this.make.graphics({ x: 0, y: 0, add: false })
    g.fillStyle(P.holzBraun); g.fillRect(0, 0, t, t)
    g.fillStyle(P.rindeBraun); g.fillRect(0, 3, t, 2); g.fillRect(0, 11, t, 2); g.fillRect(7, 0, 2, t)
    g.generateTexture('tor', t, t); g.destroy()

    g = this.make.graphics({ x: 0, y: 0, add: false })
    g.fillStyle(P.steinGrau); g.fillRect(0, 0, t, 4)
    g.fillStyle(P.nebelHell); g.fillRect(1, 0, t - 2, 1)
    g.generateTexture('platte', t, 4); g.destroy()

    g = this.make.graphics({ x: 0, y: 0, add: false })
    g.fillStyle(P.steinGrau); g.fillRect(2, 12, 8, 4)          // Sockel
    g.fillStyle(P.holzBraun); g.fillRect(5, 2, 2, 11)          // Stange
    g.fillStyle(P.feuerRot); g.fillRect(4, 0, 4, 4)            // Knauf
    g.generateTexture('hebel', 12, 16); g.destroy()

    // Ranke: grüner Strang mit Blättchen (wiederholbar nach unten)
    g = this.make.graphics({ x: 0, y: 0, add: false })
    g.fillStyle(P.moosGruen); g.fillRect(3, 0, 2, t)
    g.fillStyle(P.blattGruen); g.fillRect(1, 3, 2, 2); g.fillRect(5, 10, 2, 2)
    g.generateTexture('ranke', 8, t); g.destroy()

    // Blatt zum Sammeln
    g = this.make.graphics({ x: 0, y: 0, add: false })
    g.fillStyle(P.wiesenGruen); g.fillTriangle(1, 9, 5, 1, 9, 9); g.fillRect(2, 5, 6, 4)
    g.fillStyle(P.blattGruen); g.fillRect(4, 3, 1, 7)
    g.generateTexture('blatt', 10, 10); g.destroy()

    // Waldgeist: leuchtender Tropfen mit Gesicht
    g = this.make.graphics({ x: 0, y: 0, add: false })
    g.fillStyle(P.eisBlau, 0.5); g.fillCircle(7, 8, 7)
    g.fillStyle(P.eisBlau); g.fillCircle(7, 8, 5); g.fillTriangle(4, 6, 7, 0, 10, 6)
    g.fillStyle(P.weiss); g.fillRect(5, 6, 1, 2); g.fillRect(8, 6, 1, 2)
    g.generateTexture('geist', 14, 16); g.destroy()
  }

  // Kleiner Pfeil über dem aktiven Helden
  makeMarker() {
    const g = this.make.graphics({ x: 0, y: 0, add: false })
    g.fillStyle(P.hellGelb)
    g.fillTriangle(0, 0, 8, 0, 4, 5)
    g.generateTexture('marker', 8, 5)
    g.destroy()
  }
}
