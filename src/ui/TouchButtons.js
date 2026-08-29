// ============================================================
//  TOUCH BUTTONS — Knöpfe fürs Handy
// ============================================================
//  Links: ◀ ▶     Rechts: Springen (groß) und Wechseln (klein)
//
//  Trick: Wir hören nicht auf "Klick"-Ereignisse, sondern schauen
//  jeden Frame nach, WO gerade Finger auf dem Bildschirm sind.
//  So funktioniert auch: Finger von ◀ nach ▶ rüberziehen, oder
//  mit zwei Fingern gleichzeitig laufen und springen.
// ============================================================
import { GAME } from '../config.js'
import { P } from '../palette.js'

export default class TouchButtons {
  constructor(scene, controls) {
    this.scene = scene
    this.controls = controls
    const W = GAME.width, H = GAME.height

    this.buttons = [
      { name: 'left',   x: 34,      y: H - 34, r: 24, label: '◀' },
      { name: 'right',  x: 94,      y: H - 34, r: 24, label: '▶' },
      { name: 'jump',   x: W - 36,  y: H - 36, r: 26, label: '▲' },
      { name: 'switch', x: W - 96,  y: H - 26, r: 18, label: '⇄' },
    ]

    for (const b of this.buttons) {
      // Kreis
      b.gfx = scene.add.circle(b.x, b.y, b.r, P.nebelHell, 0.25)
        .setStrokeStyle(1, P.weiss, 0.6)
        .setScrollFactor(0).setDepth(1000)
      // Zeichen
      b.text = scene.add.text(b.x, b.y, b.label, {
        fontFamily: 'monospace', fontSize: '16px', color: '#ffffff',
      }).setOrigin(0.5).setAlpha(0.8).setScrollFactor(0).setDepth(1001)
    }
  }

  update() {
    const t = this.controls.touch
    for (const b of this.buttons) t[b.name] = false

    // Alle Finger durchgehen, die gerade unten sind
    for (const p of this.scene.input.manager.pointers) {
      if (!p.isDown) continue
      for (const b of this.buttons) {
        const dx = p.x - b.x, dy = p.y - b.y
        // etwas größer als der Kreis → leichter zu treffen
        if (dx * dx + dy * dy <= (b.r + 8) * (b.r + 8)) t[b.name] = true
      }
    }

    // Gedrückte Knöpfe leuchten
    for (const b of this.buttons) b.gfx.setFillStyle(P.nebelHell, t[b.name] ? 0.6 : 0.25)
  }
}
