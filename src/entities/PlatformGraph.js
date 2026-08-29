// ============================================================
//  PLATFORM GRAPH — die "Landkarte" der Stehflächen
// ============================================================
//  Eine Stehfläche ist eine Reihe fester Kacheln nebeneinander, über
//  denen Luft ist (Boden, Plattform 1, Plattform 2 …).
//  Wir merken uns für jede Fläche, auf welche anderen man springen
//  kann. Dann können wir den kürzesten Weg von A nach B suchen –
//  genau wie eine Navi-App, nur mit Sprüngen statt Straßen.
// ============================================================
import { GAME, COMPANION } from '../config.js'

export default class PlatformGraph {
  constructor(groundLayer) {
    this.layer = groundLayer
    this.tile = GAME.tile
    this.blockers = []                 // Rechtecke (z.B. geschlossene Tore), die wie Wände wirken
    this.rebuild()
  }

  rebuild() {
    this.platforms = this.findPlatforms()
    this.links = this.platforms.map((a) => this.platforms.filter((b) => b !== a && this.canReach(a, b)))
  }

  // Geschlossene Tore mitteilen → Flächen und Verbindungen neu berechnen.
  // Ein Tor ZERSCHNEIDET eine Fläche: unter dem Tor kann niemand stehen.
  setBlockers(rects) {
    this.blockers = rects
    this.rebuild()
  }

  blockedAt(px, py) {
    return this.blockers.some((r) => px >= r.x && px <= r.x + r.width && py >= r.y && py <= r.y + r.height)
  }

  has(platform) {
    return this.platforms.includes(platform)
  }

  // Alle Stehflächen finden: feste Kachel mit Luft darüber, zusammenhängend in einer Zeile
  findPlatforms() {
    const L = this.layer, W = L.layer.width, H = L.layer.height
    // Stehen kann man, wo eine feste Kachel ist und darüber 2 Kacheln frei sind
    // (der Begleiter kriecht nie durch Spalten) – und kein geschlossenes Tor im Weg steht.
    const free = (x, y) => y < 0 || (L.getTileAt(x, y) === null && !this.blockedAt(x * this.tile + this.tile / 2, y * this.tile + this.tile / 2))
    const standable = (x, y) => L.getTileAt(x, y) !== null && free(x, y - 1) && free(x, y - 2)
    const platforms = []
    for (let y = 0; y < H; y++) {
      let x = 0
      while (x < W) {
        if (!standable(x, y)) { x++; continue }
        const x0 = x
        while (x < W && standable(x, y)) x++
        platforms.push({ id: platforms.length, row: y, x0, x1: x - 1,
          px0: x0 * this.tile, px1: x * this.tile, py: y * this.tile })   // py = Oberkante in Pixeln
      }
    }
    return platforms
  }

  // Kommt man von a nach b?
  canReach(a, b) {
    const up = a.row - b.row                                   // > 0: b liegt höher
    const gap = Math.max(0, b.x0 - a.x1 - 1, a.x0 - b.x1 - 1)  // Lücke in Kacheln (0 = überlappt)
    if (this.wallBetween(a, b)) return false
    if (up > 0) return up <= COMPANION.maxJumpUpTiles && gap <= COMPANION.maxGapUpTiles
    return gap <= COMPANION.maxGapDownTiles                    // runter geht immer, nur nicht zu weit
  }

  // Steht zwischen a und b eine Wand, über die man nicht springen kann?
  // Geprüft werden die Spalten der Lücke, ab der Zeile über a's Boden nach oben.
  wallBetween(a, b) {
    const from = a.x1 < b.x0 ? a.x1 + 1 : b.x1 + 1
    const to = a.x1 < b.x0 ? b.x0 - 1 : a.x0 - 1
    for (let col = from; col <= to; col++) {
      let height = 0
      while (this.layer.getTileAt(col, a.row - 1 - height) !== null) height++
      if (height > COMPANION.maxJumpUpTiles - 1) return true
      if (this.blockedAt(col * this.tile + this.tile / 2, a.row * this.tile - 4)) return true
    }
    return false
  }

  // Auf welcher Fläche steht jemand? (Kachel direkt unter den Füßen)
  platformAt(hero) {
    const col = Math.floor(hero.x / this.tile)
    const row = Math.floor((hero.body.bottom + 1) / this.tile)
    return this.platforms.find((p) => p.row === row && col >= p.x0 && col <= p.x1) ?? null
  }

  // Kürzester Weg von "from" nach "to" (Breitensuche). Gibt die NÄCHSTE Fläche
  // auf dem Weg zurück – oder null, wenn es keinen Weg gibt.
  nextStep(from, to) {
    if (from === to) return null
    const prev = new Map([[from, null]])
    const queue = [from]
    while (queue.length) {
      const p = queue.shift()
      for (const n of this.links[p.id]) {
        if (prev.has(n)) continue
        prev.set(n, p)
        if (n === to) {
          let step = n                                   // von hinten zurücklaufen bis zum ersten Schritt
          while (prev.get(step) !== from) step = prev.get(step)
          return step
        }
        queue.push(n)
      }
    }
    return null
  }
}
