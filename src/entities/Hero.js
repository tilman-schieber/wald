// ============================================================
//  HERO — alles, was beide Helden gemeinsam können
// ============================================================
//  Ein Hero bewegt sich NICHT von selbst. Er bekommt jeden Frame
//  ein "Kommando" (links? rechts? springen? schlagen?) und führt es
//  aus. Wer das Kommando gibt, ist ihm egal:
//    - der Spieler über Tastatur/Touch  (Controls.js)
//    - oder das Begleiter-Gehirn        (CompanionBrain.js)
//  Genau deshalb ist der Wechsel zwischen den Helden so einfach.
// ============================================================
import Phaser from 'phaser'
import { JUMP, COMBAT } from '../config.js'
import { P } from '../palette.js'

export default class Hero extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, cfg) {
    super(scene, x, y, cfg.key, 0)
    this.cfg = cfg
    scene.add.existing(this)
    scene.physics.add.existing(this)

    // Trefferbox: waagerecht mittig, unten an der Fußlinie
    const feet = cfg.file ? cfg.feet ?? cfg.frame.h : cfg.frame.h
    this.body.setSize(cfg.body.w, cfg.body.h)
    this.body.setOffset((cfg.frame.w - cfg.body.w) / 2, feet - cfg.body.h)
    this.setCollideWorldBounds(true)

    this.facing = 1              // 1 = rechts, -1 = links
    this.lastGroundTime = 0      // für die Coyote-Zeit
    this.jumpBufferTime = -1     // für den Sprung-Puffer
    this.jumpCut = false         // wurde dieser Sprung schon abgekürzt?

    // Kampf
    this.hp = COMBAT.heroHp
    this.invulnUntil = 0         // bis wann unverwundbar (nach Treffer)
    this.dazedUntil = 0          // bis wann benommen (nur Begleiter)
    this.attackUntil = 0         // bis wann der aktuelle Schlag "wirkt"
    this.attackReadyAt = 0       // ab wann man wieder schlagen darf
    this.hitThisAttack = new Set()   // wen dieser Schlag schon getroffen hat
    this.slash = scene.add.image(0, 0, 'slash').setVisible(false).setDepth(11)
    this.zzz = scene.add.text(0, 0, 'zzz', { fontFamily: 'monospace', fontSize: '8px', color: '#c0cbdc' }).setOrigin(0.5).setVisible(false).setDepth(11)

    this.play(`${cfg.key}-idle`)
  }

  get onGround() {
    return this.body.blocked.down
  }

  isDazed(time) { return time < this.dazedUntil }
  isInvulnerable(time) { return time < this.invulnUntil }

  // cmd = { left, right, jump, jumpHeld, attack }
  applyCommand(cmd, time) {
    const { speed, jump } = this.cfg

    // Benommen: sitzt nur da und wartet
    if (this.isDazed(time)) {
      this.setVelocityX(0)
      this.zzz.setVisible(true).setPosition(this.x + 8, this.body.top - 6 - Math.sin(time / 200) * 2)
      this.playIfNew('idle')
      return
    }
    if (this.zzz.visible) { this.zzz.setVisible(false); this.clearTint() }

    // --- laufen ---
    if (cmd.left && !cmd.right) {
      this.setVelocityX(-speed)
      this.facing = -1
    } else if (cmd.right && !cmd.left) {
      this.setVelocityX(speed)
      this.facing = 1
    } else {
      this.setVelocityX(0)
    }
    this.setFlipX(this.facing < 0)

    // --- springen ---
    if (this.onGround) this.lastGroundTime = time
    if (cmd.jump) this.jumpBufferTime = time

    const canCoyote = time - this.lastGroundTime <= JUMP.coyoteMs
    const wantsJump = this.jumpBufferTime >= 0 && time - this.jumpBufferTime <= JUMP.bufferMs

    if (wantsJump && canCoyote) {
      this.setVelocityY(-jump)
      this.jumpBufferTime = -1
      this.lastGroundTime = -9999   // kein Doppelsprung
      this.jumpCut = false
    }

    // Taste losgelassen, während man noch steigt → Sprung EINMAL abkürzen
    if (!cmd.jumpHeld && this.body.velocity.y < 0 && !this.jumpCut) {
      this.setVelocityY(this.body.velocity.y * JUMP.cutFactor)
      this.jumpCut = true
    }

    // --- schlagen ---
    if (cmd.attack && time >= this.attackReadyAt) {
      this.attackUntil = time + COMBAT.attackMs
      this.attackReadyAt = time + this.cfg.attackCooldownMs
      this.hitThisAttack.clear()
    }
    const rect = this.attackRect(time)
    this.slash.setVisible(rect !== null)
    if (rect) this.slash.setPosition(rect.centerX, rect.centerY).setFlipX(this.facing < 0)

    // --- unverwundbar → blinken ---
    this.setAlpha(this.isInvulnerable(time) && Math.floor(time / 80) % 2 === 0 ? 0.3 : 1)

    // --- Animation ---
    if (!this.onGround) this.playIfNew(this.body.velocity.y > 0 && this.hasAnim('fall') ? 'fall' : 'jump')
    else if (this.body.velocity.x !== 0) this.playIfNew('run')
    else this.playIfNew('idle')
  }

  // Der Bereich vor der Figur, in dem ein Schlag gerade trifft (oder null)
  attackRect(time) {
    if (time >= this.attackUntil) return null
    const { w, h } = COMBAT.attackBox
    const x = this.facing > 0 ? this.body.right : this.body.left - w
    return new Phaser.Geom.Rectangle(x, this.body.center.y - h / 2, w, h)
  }

  // Getroffen worden. Gibt 'ko' zurück, wenn keine Herzen mehr übrig sind.
  hurt(time, fromX) {
    if (this.isInvulnerable(time) || this.isDazed(time)) return null
    this.hp -= 1
    this.invulnUntil = time + COMBAT.invulnMs
    this.setVelocity(Math.sign(this.x - fromX || 1) * COMBAT.knockback, -COMBAT.knockback * 0.6)
    this.attackUntil = 0
    return this.hp <= 0 ? 'ko' : 'hit'
  }

  // Begleiter ohne Herzen: setzt sich benommen hin, steht mit vollen Herzen wieder auf
  daze(time) {
    this.dazedUntil = time + COMBAT.dazedMs
    this.invulnUntil = this.dazedUntil + 500
    this.hp = COMBAT.heroHp
    this.setTint(P.schieferGrau)
    this.setVelocityX(0)
    this.slash.setVisible(false)
  }

  hasAnim(name) {
    return this.scene.anims.exists(`${this.cfg.key}-${name}`)
  }

  playIfNew(name) {
    const key = `${this.cfg.key}-${name}`
    if (this.anims.currentAnim?.key !== key) this.play(key)
  }

  // Sofort stehen bleiben (beim Wechsel)
  halt() {
    this.setVelocityX(0)
    this.jumpBufferTime = -1
  }
}
