// ============================================================
//  BOOT-SZENE — lädt Bilder ODER malt Platzhalter
// ============================================================
//  Idee: Der Rest des Spiels kennt nur Namen wie 'jonas' oder
//  'tiles'. Ob dahinter ein echtes Bild steckt oder ein farbiges
//  Rechteck, entscheidet sich nur hier. So können wir später die
//  PixelLab-Sprites einbauen, ohne den Spielcode anzufassen.
// ============================================================
import Phaser from 'phaser'
import { HEROES, TILESET, GAME } from '../config.js'
import { P } from '../palette.js'
import level1 from '../levels/schwarzwald_01.json'

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

    // Das Level kommt direkt aus der JSON-Datei (Vite bündelt es mit).
    this.cache.tilemap.add('schwarzwald_01', { format: Phaser.Tilemaps.Formats.TILED_JSON, data: level1 })
  }

  create() {
    // Für alles, was NICHT geladen wurde: Platzhalter malen.
    for (const hero of Object.values(HEROES)) {
      if (!this.textures.exists(hero.key)) this.makeHeroPlaceholder(hero)
      this.makeAnimations(hero)
    }
    if (!this.textures.exists(TILESET.key)) this.makeTilesPlaceholder()

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

  // Animationen: heute nur Bild 0 — später echte Bildfolgen aus der Config.
  makeAnimations(hero) {
    for (const [name, a] of Object.entries(hero.anims)) {
      const key = `${hero.key}-${name}`
      if (this.anims.exists(key)) continue
      this.anims.create({
        key,
        frames: a.frames.map((f) => ({ key: hero.key, frame: f })),
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

  // Kleiner Pfeil über dem aktiven Helden
  makeMarker() {
    const g = this.make.graphics({ x: 0, y: 0, add: false })
    g.fillStyle(P.hellGelb)
    g.fillTriangle(0, 0, 8, 0, 4, 5)
    g.generateTexture('marker', 8, 5)
    g.destroy()
  }
}
