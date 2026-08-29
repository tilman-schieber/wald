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
    this.moving = false
  }

  think(me, leader, time) {
    const cmd = { left: false, right: false, jump: false, jumpHeld: false }

    const dx = leader.x - me.x
    const dist = Math.abs(dx)
    const dir = Math.sign(dx) || 1
    const leaderAbove = leader.body.bottom < me.body.bottom - 12

    // Loslaufen erst ab followDistance, anhalten schon bei stopDistance.
    // Zwei verschiedene Zahlen → kein nervöses Hin-und-her-Zappeln.
    if (dist > COMPANION.followDistance) this.moving = true
    if (dist < COMPANION.stopDistance) this.moving = false

    if (this.moving) {
      cmd.left = dir < 0
      cmd.right = dir > 0
    }

    // Springen? Nur am Boden und nicht zu oft.
    if (me.onGround && time - this.lastJumpTime > COMPANION.jumpCooldownMs) {
      const blocked = dir < 0 ? me.body.blocked.left : me.body.blocked.right
      const gapAhead = this.moving && !this.groundAhead(me, dir)

      let jump = false
      if (this.moving && blocked) jump = true               // Wand im Weg
      if (gapAhead && !this.leaderBelow(me, leader)) jump = true  // Loch, Partner nicht unten
      if (leaderAbove && dist < 60) {                        // Partner steht oben
        jump = true
        cmd.left = dir < 0                                   // dabei Richtung Partner
        cmd.right = dir > 0
      }

      if (jump) {
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

  leaderBelow(me, leader) {
    return leader.body.bottom > me.body.bottom + 12
  }
}
