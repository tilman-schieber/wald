// ============================================================
//  COMPANION BRAIN — das Gehirn des Begleiters
// ============================================================
//  Der Begleiter ist ein ganz normaler Hero. Nur die Knöpfe drückt
//  nicht der Spieler, sondern dieses Gehirn. Es schaut jeden Frame:
//    "Wo ist mein Partner? Muss ich laufen? Muss ich springen?"
//  und gibt dann ein Kommando zurück, genau wie die Steuerung.
// ============================================================
import { COMPANION } from '../config.js'

export default class CompanionBrain {
  constructor(groundLayer) {
    this.groundLayer = groundLayer
    this.lastJumpTime = 0
    this.moving = false     // laufe ich gerade hinterher?
    this.climbing = false   // versuche ich gerade, zum Partner HOCH zu kommen?
  }

  think(me, leader, time) {
    const cmd = { left: false, right: false, jump: false, jumpHeld: false }

    const dx = leader.x - me.x
    const dist = Math.abs(dx)
    const dir = Math.sign(dx) || 1
    const leaderAbove = leader.body.bottom < me.body.bottom - 12
    const leaderBelow = leader.body.bottom > me.body.bottom + 12

    // Loslaufen erst ab followDistance, anhalten schon bei stopDistance.
    // Zwei verschiedene Zahlen → kein nervöses Hin-und-her-Zappeln.
    if (dist > COMPANION.followDistance) this.moving = true
    if (dist < COMPANION.stopDistance) this.moving = false

    // Partner steht oben? Dann "Klettermodus" (auch mit zwei Zahlen).
    if (leaderAbove && dist < 80) this.climbing = true
    if (!leaderAbove || dist > 120) this.climbing = false

    if (this.moving) {
      cmd.left = dir < 0
      cmd.right = dir > 0
    }

    let wantJump = false

    if (this.climbing) {
      if (this.ceilingAbove(me)) {
        // Ich stehe UNTER der Plattform → erst seitlich rauslaufen
        cmd.left = dir > 0
        cmd.right = dir < 0
      } else {
        // Freie Bahn nach oben → Richtung Partner springen
        cmd.left = dir < 0
        cmd.right = dir > 0
        wantJump = true
      }
    }

    // Springen? Nur am Boden und nicht zu oft.
    if (me.onGround && time - this.lastJumpTime > COMPANION.jumpCooldownMs) {
      const movingDir = cmd.right ? 1 : cmd.left ? -1 : 0
      const blocked = movingDir > 0 ? me.body.blocked.right : movingDir < 0 ? me.body.blocked.left : false
      const gapAhead = movingDir !== 0 && !this.groundAhead(me, movingDir)

      if (blocked) wantJump = true                 // Wand im Weg
      if (gapAhead && !leaderBelow) wantJump = true // Loch, Partner ist nicht unten

      if (wantJump) {
        cmd.jump = true
        this.lastJumpTime = time
      }
    }
    // Sprungtaste "gedrückt halten", solange man steigt → voller Sprung
    cmd.jumpHeld = me.body.velocity.y < 0 || cmd.jump

    return cmd
  }

  // Gibt es ein Stück vor den Füßen noch Boden?
  groundAhead(me, dir) {
    const x = me.x + dir * (me.body.width / 2 + 6)
    const y = me.body.bottom + 2
    return this.groundLayer.getTileAtWorldXY(x, y) !== null
  }

  // Ist über meinem Kopf (in Sprunghöhe) irgendwo eine Kachel?
  // Geprüft wird links, in der Mitte und rechts vom Körper.
  ceilingAbove(me) {
    const xs = [me.body.left - 2, me.x, me.body.right + 2]
    for (const x of xs) {
      for (let y = me.body.top - 4; y > me.body.top - 72; y -= 16) {
        if (this.groundLayer.getTileAtWorldXY(x, y) !== null) return true
      }
    }
    return false
  }
}
