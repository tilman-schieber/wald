// ============================================================
//  HERO — alles, was beide Helden gemeinsam können
// ============================================================
//  Ein Hero bewegt sich NICHT von selbst. Er bekommt jeden Frame
//  ein "Kommando" (links? rechts? springen?) und führt es aus.
//  Wer das Kommando gibt, ist ihm egal:
//    - der Spieler über Tastatur/Touch  (Controls.js)
//    - oder das Begleiter-Gehirn        (CompanionBrain.js)
//  Genau deshalb ist der Wechsel zwischen den Helden so einfach.
// ============================================================
import Phaser from 'phaser'
import { JUMP } from '../config.js'

export default class Hero extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, cfg) {
    super(scene, x, y, cfg.key, 0)
    this.cfg = cfg
    scene.add.existing(this)
    scene.physics.add.existing(this)

    // Trefferbox unten in der Bildmitte
    this.body.setSize(cfg.body.w, cfg.body.h)
    this.body.setOffset((cfg.frame.w - cfg.body.w) / 2, cfg.frame.h - cfg.body.h)
    this.setCollideWorldBounds(true)

    this.facing = 1              // 1 = rechts, -1 = links
    this.lastGroundTime = 0      // für die Coyote-Zeit
    this.jumpBufferTime = -1     // für den Sprung-Puffer

    this.play(`${cfg.key}-idle`)
  }

  get onGround() {
    return this.body.blocked.down
  }

  // cmd = { left, right, jump, jumpHeld }
  applyCommand(cmd, time) {
    const { speed, jump } = this.cfg

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
    }

    // Taste losgelassen, während man noch steigt → Sprung abkürzen
    if (!cmd.jumpHeld && this.body.velocity.y < 0) {
      this.setVelocityY(this.body.velocity.y * JUMP.cutFactor)
    }

    // --- Animation ---
    if (!this.onGround) this.playIfNew('jump')
    else if (this.body.velocity.x !== 0) this.playIfNew('run')
    else this.playIfNew('idle')
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
