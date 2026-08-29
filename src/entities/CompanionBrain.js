// ============================================================
//  COMPANION BRAIN — das Gehirn des Begleiters
// ============================================================
//  Der Begleiter ist ein ganz normaler Hero. Nur die Knöpfe drückt
//  nicht der Spieler, sondern dieses Gehirn. Es schaut jeden Frame:
//    1. Auf welcher Fläche stehe ich, auf welcher der Partner?
//    2. Welche Fläche ist der nächste Schritt dorthin? (PlatformGraph)
//    3. Dorthin laufen, bei Bedarf springen.
//  Klappt das lange nicht, während der Partner wartet → "Teleport".
// ============================================================
import Phaser from 'phaser'
import { COMPANION } from '../config.js'

export default class CompanionBrain {
  constructor(groundLayer, graph) {
    this.groundLayer = groundLayer
    this.graph = graph
    this.reset()
  }

  // waiting = true: nach einem Wechsel bleibt der Begleiter stehen, bis man
  // ihn abholt (nah herangeht) oder ruft (Taste C). Daraus entstehen Rätsel.
  reset(waiting = false) {
    this.waiting = waiting
    this.leaderWentAway = false   // war der Partner seit dem Wechsel schon mal richtig weg?
    this.lastJumpTime = 0
    this.moving = false        // laufe ich gerade?
    this.climbing = false      // versuche ich gerade, HOCH zu kommen?
    this.stuckSince = null     // seit wann komme ich nicht zum wartenden Partner?
    this.myPlatform = null     // zuletzt bekannte Fläche (auch in der Luft)
    this.leaderPlatform = null
  }

  think(me, leader, time, enemies = [], called = false) {
    const cmd = { left: false, right: false, jump: false, jumpHeld: false, attack: false, teleport: false }

    // Wartet er? Rufen (C) beendet das Warten – oder Abholen: aber nur, wenn der
    // Partner vorher richtig weg war (direkt nach dem Wechsel steht man ja nebeneinander).
    const distNow = Math.abs(leader.x - me.x)
    const nearLeader = distNow <= COMPANION.nearX && Math.abs(leader.body.bottom - me.body.bottom) <= COMPANION.nearY
    if (distNow > COMPANION.nearX * 2) this.leaderWentAway = true
    if (this.waiting && (called || (nearLeader && this.leaderWentAway))) this.waiting = false

    // --- 0. Gegner in Reichweite? Dann hinschauen und zuschlagen (nur Basisangriff) ---
    const foe = enemies.find((e) => !e.healed
      && Math.abs(e.x - me.x) <= COMPANION.reach.x + e.body.width / 2
      && Math.abs(e.body.center.y - me.body.center.y) <= COMPANION.reach.y)
    if (foe && me.onGround) {
      const toward = Math.sign(foe.x - me.x)
      if (toward !== me.facing) { cmd.left = toward < 0; cmd.right = toward > 0 }  // umdrehen
      else cmd.attack = true
      cmd.jumpHeld = false
      return cmd
    }
    if (this.waiting) return cmd                  // stehen bleiben (aber Gegner abwehren, s.o.)

    // --- 1. Wo sind wir? (alte Flächen vergessen, wenn die Landkarte neu ist) ---
    if (this.myPlatform && !this.graph.has(this.myPlatform)) this.myPlatform = null
    if (this.leaderPlatform && !this.graph.has(this.leaderPlatform)) this.leaderPlatform = null
    if (me.onGround) this.myPlatform = this.graph.platformAt(me)
    if (leader.onGround) this.leaderPlatform = this.graph.platformAt(leader)

    // --- 2. Ziel: der Partner – oder die nächste Fläche auf dem Weg zu ihm ---
    let target = { x: leader.x, bottom: leader.body.bottom, platform: this.leaderPlatform }
    let hasPath = true
    if (this.myPlatform && this.leaderPlatform && this.myPlatform !== this.leaderPlatform) {
      const next = this.graph.nextStep(this.myPlatform, this.leaderPlatform)
      if (next && next !== this.leaderPlatform) {
        // Zwischenziel: der Punkt auf der nächsten Fläche, der mir am nächsten ist
        target = { x: Phaser.Math.Clamp(me.x, next.px0 + 8, next.px1 - 8), bottom: next.py, platform: next }
      }
      hasPath = next !== null
    }
    // Kein Weg? Dann bleibe ich einfach stehen – das gehört zum Rätsel.
    if (!hasPath) { this.stuckSince = null; this.moving = false; this.climbing = false; return cmd }

    // --- Stecke ich fest? Uhr läuft nur, wenn der Partner steht und wartet ---
    const distLeader = Math.abs(leader.x - me.x)
    const dyLeader = Math.abs(leader.body.bottom - me.body.bottom)
    const near = distLeader <= COMPANION.nearX && dyLeader <= COMPANION.nearY
    const leaderWaits = leader.onGround && Math.abs(leader.body.velocity.x) < 5
    if (near || !leaderWaits) this.stuckSince = null
    else if (this.stuckSince === null) this.stuckSince = time
    else if (time - this.stuckSince > COMPANION.stuckMs * 3 && me.onGround) {
      cmd.teleport = true
      this.stuckSince = null
      return cmd
    }

    // --- 3. Zum Ziel bewegen ---
    const dx = target.x - me.x
    const dist = Math.abs(dx)
    const dir = Math.sign(dx) || 1
    const targetAbove = target.bottom < me.body.bottom - 12
    const targetBelow = target.bottom > me.body.bottom + 12

    // In der Luft: immer Richtung Ziel lenken, Sprungtaste halten solange es hochgeht
    if (!me.onGround) {
      cmd.left = dx < -4
      cmd.right = dx > 4
      cmd.jumpHeld = me.body.velocity.y < 0
      return cmd
    }

    // Loslaufen erst ab followDistance, anhalten schon bei stopDistance.
    // Zwei verschiedene Zahlen → kein nervöses Hin-und-her-Zappeln.
    if (dist > COMPANION.followDistance) this.moving = true
    if (dist < COMPANION.stopDistance) this.moving = false

    // Ziel liegt oben? Dann "Klettermodus" (auch mit zwei Zahlen).
    if (targetAbove && dist < 80) this.climbing = true
    if (!targetAbove || dist > 120) this.climbing = false

    if (this.moving) {
      cmd.left = dir < 0
      cmd.right = dir > 0
    }

    let wantJump = false

    // Stehe ich direkt UNTER der Zielfläche? Dann erst zur näheren Kante rauslaufen.
    // (gleicher Rand wie bei ceilingAbove, sonst gibt es eine Lücke, in der er nichts tut)
    const tp = target.platform
    const margin = me.body.width / 2 + 3
    const underTarget = targetAbove && tp && me.x >= tp.px0 - margin && me.x <= tp.px1 + margin
    if (underTarget) {
      const out = (me.x - tp.px0) < (tp.px1 - me.x) ? -1 : 1
      cmd.left = out < 0
      cmd.right = out > 0
    } else if (this.climbing) {
      if (this.ceilingAbove(me)) {
        // Eine ANDERE Fläche über mir → einfach weiter Richtung Ziel, nicht springen
        cmd.left = dir < 0
        cmd.right = dir > 0
      } else {
        // Freie Bahn nach oben → Richtung Ziel springen
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

      if (blocked) wantJump = true                  // Wand im Weg
      if (gapAhead && !targetBelow) wantJump = true // Loch, Ziel ist nicht unten → rüberspringen

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
