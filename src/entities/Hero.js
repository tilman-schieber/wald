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
import { JUMP, COMBAT, CROUCH, CLIMB, SLAM } from '../config.js'
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
    this.vine = null             // Ranke, an der ich gerade klettere
    this.hopUntil = 0            // kurz nach dem Absprung von der Ranke: Satz nicht überschreiben
    this.slamming = false        // Stampfer läuft (Jonas)
    this.attackAnimUntil = 0
    this.hurtAnimUntil = 0
    this.specialReadyAt = 0      // ab wann die Fähigkeit (E) wieder geht
    this.specialCooldownMs = 1   // wird von der Szene gesetzt (Jonas: Stampfer, Leonel: Geist)
    this.slash = scene.add.image(0, 0, 'slash').setVisible(false).setDepth(11).setAlpha(0.9)
    this.zzz = scene.add.text(0, 0, 'zzz', { fontFamily: 'monospace', fontSize: '8px', color: '#c0cbdc' }).setOrigin(0.5).setVisible(false).setDepth(11)

    this.play(`${cfg.key}-idle`)
  }

  get onGround() {
    return this.body.blocked.down
  }

  // Ist die Spezialfähigkeit (Taste E) bereit? 0…1 = wie weit aufgeladen
  specialReady(time) { return time >= this.specialReadyAt }
  specialCharge(time) {
    if (this.specialReady(time)) return 1
    return Math.max(0, 1 - (this.specialReadyAt - time) / this.specialCooldownMs)
  }

  // Figur so setzen, dass die FÜSSE bei (x, feetY) stehen – egal wie das Bild aufgebaut ist
  placeFeet(x, feetY) {
    this.setPosition(x, feetY - (this.body.bottom - this.y))
    this.setVelocity(0, 0)
    return this
  }

  isDazed(time) { return time < this.dazedUntil }
  isInvulnerable(time) { return time < this.invulnUntil }

  // cmd = { left, right, jump, jumpHeld, attack, crouch, up }
  applyCommand(cmd, time) {
    const { jump } = this.cfg

    // An der Ranke: klettern statt laufen
    if (this.vine) { this.updateClimb(cmd, time); return }
    // Stampfer: fällt mit Wucht, bis er aufkommt
    if (this.slamming) { this.updateSlam(time); return }

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
      this.attackAnimUntil = time + 280
      this.scene.sfx?.play('attack')
      this.hitThisAttack.clear()
    }
    const rect = this.attackRect(time)
    this.slash.setVisible(rect !== null)
    if (rect) this.slash.setPosition(rect.centerX, rect.centerY).setFlipX(this.facing < 0)

    // --- unverwundbar → blinken ---
    this.setAlpha(this.isInvulnerable(time) && Math.floor(time / 80) % 2 === 0 ? 0.3 : 1)

    // --- Animation ---
    if (this.hurtAnimUntil > time && this.hasAnim('hurt')) this.playIfNew('hurt')
    else if (this.attackAnimUntil > time && this.hasAnim('attack')) this.playIfNew('attack')
    else if (this.crouched) this.playIfNew(this.body.velocity.x !== 0 && this.hasAnim('crouchWalk') ? 'crouchWalk' : 'crouch')
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

  // --- Klettern an Ranken (Jonas) ---
  // vine = { x, top, bottom, side }. Man hängt an der Ranke, Schwerkraft aus.
  startClimb(vine) {
    this.vine = vine
    this.setCrouched(false)
    this.body.setAllowGravity(false)
    this.setVelocity(0, 0)
    this.x = vine.x
    this.attackUntil = 0
    this.slash.setVisible(false)
  }

  updateClimb(cmd, time) {
    const v = this.vine
    this.facing = v.side
    this.setFlipX(v.side < 0)
    this.playIfNew('climb')
    // hoch / runter
    if (cmd.up && !cmd.crouch) this.setVelocityY(-CLIMB.speed)
    else if (cmd.crouch && !cmd.up) this.setVelocityY(CLIMB.speed)
    else this.setVelocityY(0)
    if (this.anims.currentAnim && this.body.velocity.y === 0) this.anims.pause()
    else this.anims.resume()
    // Oben angekommen → Satz auf die Kante
    if (this.body.bottom <= v.top - 2) { this.stopClimb(); this.setVelocity(v.side * CLIMB.hop.x, -CLIMB.hop.y); this.hopUntil = time + 400; this.lastGroundTime = -9999; return }
    // Unten angekommen oder Boden unter den Füßen → loslassen
    if (this.body.bottom >= v.bottom + 8 || (cmd.crouch && this.onGround)) { this.stopClimb(); return }
    // Abspringen: Sprungtaste, oder seitlich weg
    if (cmd.jump) { this.stopClimb(); this.setVelocityY(-this.cfg.jump * 0.8); this.lastGroundTime = -9999; return }
    if ((cmd.left && !cmd.right) || (cmd.right && !cmd.left)) {
      this.stopClimb()
      this.setVelocityX(cmd.left ? -this.cfg.speed : this.cfg.speed)
      this.hopUntil = time + 150
    }
  }

  stopClimb() {
    this.vine = null
    this.body.setAllowGravity(true)
    this.anims.resume()
  }

  // --- Stampfer (Jonas) ---
  startSlam(time) {
    if (!this.specialReady(time) || this.vine) return false
    this.slamming = true
    this.slamPhase = 'up'
    this.specialReadyAt = time + SLAM.cooldownMs
    this.setCrouched(false)
    this.setVelocity(0, -SLAM.jump)
    this.attackUntil = 0
    this.slash.setVisible(false)
    return true
  }

  updateSlam(time) {
    this.setVelocityX(0)
    this.setAlpha(1)
    if (this.slamPhase === 'up') {
      this.playIfNew('jump')
      if (this.body.velocity.y >= -40) { this.slamPhase = 'down'; this.setVelocityY(SLAM.fall) }
    } else {
      this.playIfNew(this.hasAnim('fall') ? 'fall' : 'jump')
      this.setVelocityY(SLAM.fall)
      if (this.onGround) {
        this.slamming = false
        this.lastGroundTime = time
        this.scene.onSlamLanded?.(this, time)
      }
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
    this.hurtAnimUntil = time + 350
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
    this.slash?.destroy(); this.zzz?.destroy()
    super.destroy(fromScene)
  }
}
