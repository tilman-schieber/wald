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
import { JUMP, COMBAT, CROUCH, HOOK } from '../config.js'
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
    this.crouched = false
    this.hook = null             // { x, y, side } solange der Kletterhaken zieht
    this.hopUntil = 0            // kurz nach dem Haken: Satz zur Seite nicht überschreiben
    this.rope = scene.add.graphics().setDepth(9)
    this.slash = scene.add.image(0, 0, 'slash').setVisible(false).setDepth(11)
    this.zzz = scene.add.text(0, 0, 'zzz', { fontFamily: 'monospace', fontSize: '8px', color: '#c0cbdc' }).setOrigin(0.5).setVisible(false).setDepth(11)

    this.play(`${cfg.key}-idle`)
  }

  get onGround() {
    return this.body.blocked.down
  }

  // Figur so setzen, dass die FÜSSE bei (x, feetY) stehen – egal wie das Bild aufgebaut ist
  placeFeet(x, feetY) {
    this.setPosition(x, feetY - (this.body.bottom - this.y))
    this.setVelocity(0, 0)
    return this
  }

  isDazed(time) { return time < this.dazedUntil }
  isInvulnerable(time) { return time < this.invulnUntil }

  // cmd = { left, right, jump, jumpHeld, attack, crouch }
  applyCommand(cmd, time) {
    const { jump } = this.cfg

    // Am Kletterhaken: nur nach oben ziehen, nichts anderes
    if (this.hook) { this.updateHook(time); return }

    // Benommen: sitzt nur da und wartet
    if (this.isDazed(time)) {
      this.setVelocityX(0)
      this.zzz.setVisible(true).setPosition(this.x + 8, this.body.top - 6 - Math.sin(time / 200) * 2)
      this.playIfNew('idle')
      return
    }
    if (this.zzz.visible) { this.zzz.setVisible(false); this.clearTint() }

    // --- ducken ---
    if (cmd.crouch && this.onGround) this.setCrouched(true)
    else if (this.crouched && !cmd.crouch && this.canStand()) this.setCrouched(false)
    const speed = this.crouched ? this.cfg.speed * CROUCH.speedFactor : this.cfg.speed

    // --- laufen ---
    if (cmd.left && !cmd.right) {
      this.setVelocityX(-speed)
      this.facing = -1
    } else if (cmd.right && !cmd.left) {
      this.setVelocityX(speed)
      this.facing = 1
    } else if (time >= this.hopUntil) {
      this.setVelocityX(0)
    }
    this.setFlipX(this.facing < 0)

    // --- springen ---
    if (this.onGround) this.lastGroundTime = time
    if (cmd.jump) this.jumpBufferTime = time

    const canCoyote = time - this.lastGroundTime <= JUMP.coyoteMs
    const wantsJump = this.jumpBufferTime >= 0 && time - this.jumpBufferTime <= JUMP.bufferMs

    if (wantsJump && canCoyote && !this.crouched) {
      this.setVelocityY(-jump)
      this.scene.sfx?.play('jump')
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
      this.scene.sfx?.play('attack')
      this.hitThisAttack.clear()
    }
    const rect = this.attackRect(time)
    this.slash.setVisible(rect !== null)
    if (rect) this.slash.setPosition(rect.centerX, rect.centerY).setFlipX(this.facing < 0)

    // --- unverwundbar → blinken ---
    this.setAlpha(this.isInvulnerable(time) && Math.floor(time / 80) % 2 === 0 ? 0.3 : 1)

    // --- Animation ---
    if (this.crouched) this.playIfNew('crouch')
    else if (!this.onGround) this.playIfNew(this.body.velocity.y > 0 && this.hasAnim('fall') ? 'fall' : 'jump')
    else if (this.body.velocity.x !== 0) this.playIfNew('run')
    else this.playIfNew('idle')
  }

  // Trefferbox klein machen (ducken) oder wieder groß (aufstehen)
  setCrouched(on) {
    if (this.crouched === on) return
    this.crouched = on
    const feet = this.cfg.file ? this.cfg.feet ?? this.cfg.frame.h : this.cfg.frame.h
    const height = on ? this.cfg.crouchHeight : this.cfg.body.h
    this.body.setSize(this.cfg.body.w, height)
    this.body.setOffset((this.cfg.frame.w - this.cfg.body.w) / 2, feet - height)
  }

  // Ist über mir Platz zum Aufstehen?
  canStand() {
    const extra = this.cfg.body.h - this.cfg.crouchHeight
    const tiles = this.scene.groundLayer.getTilesWithinWorldXY(this.body.left + 1, this.body.top - extra, this.body.width - 2, extra, { isNotEmpty: true })
    const gateAbove = Object.values(this.scene.gates).some((g) => g.body.enable && Phaser.Geom.Rectangle.Overlaps(g.getBounds(), new Phaser.Geom.Rectangle(this.body.left + 1, this.body.top - extra, this.body.width - 2, extra)))
    return tiles.length === 0 && !gateAbove
  }

  // --- Kletterhaken (Jonas) ---
  // Zieht sich zum Ankerpunkt (x, y) hoch; side = auf welcher Seite die Kante ist
  startHook(x, y, side) {
    this.hook = { x, y, side }
    this.setCrouched(false)
    this.body.setAllowGravity(false)
    this.setVelocity(0, 0)
    this.attackUntil = 0
    this.slash.setVisible(false)
  }

  updateHook(time) {
    const { x, y, side } = this.hook
    // Seil zeichnen
    this.rope.clear().lineStyle(1, 0xb86f50).lineBetween(this.x, this.body.top + 4, x, y)
    this.facing = side
    this.setFlipX(side < 0)
    this.playIfNew('jump')
    // Hochziehen, bis die Füße ÜBER der Kante sind (y = Oberkante des Simses)
    const bottomOffset = this.body.bottom - this.y
    if (this.body.bottom > y - 4) {
      this.scene.physics.moveTo(this, x, y - 6 - bottomOffset, HOOK.speed)
    } else {
      // oben angekommen → kleiner Satz auf die Kante
      this.rope.clear()
      this.hook = null
      this.body.setAllowGravity(true)
      this.setVelocity(side * HOOK.hop.x, -HOOK.hop.y)
      this.hopUntil = time + 400
      this.lastGroundTime = -9999
    }
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

  // Beim Verlassen des Raums die Extras wegräumen
  destroy(fromScene) {
    this.rope?.destroy(); this.slash?.destroy(); this.zzz?.destroy()
    super.destroy(fromScene)
  }
}
