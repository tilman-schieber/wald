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
    this.platforms = this.findPlatforms()
    this.links = this.platforms.map((a) => this.platforms.filter((b) => b !== a && this.canReach(a, b)))
  }

  // Alle Stehflächen finden: feste Kachel mit Luft darüber, zusammenhängend in einer Zeile
  findPlatforms() {
    const L = this.layer, W = L.layer.width, H = L.layer.height
    const standable = (x, y) => L.getTileAt(x, y) !== null && (y === 0 || L.getTileAt(x, y - 1) === null)
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
    if (up > 0) return up <= COMPANION.maxJumpUpTiles && gap <= COMPANION.maxGapUpTiles
    return gap <= COMPANION.maxGapDownTiles                    // runter geht immer, nur nicht zu weit
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
