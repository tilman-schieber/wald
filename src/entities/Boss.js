// ============================================================
//  BOSS — der Wächter eines Waldes (Endgegner)
// ============================================================
//  Am Ende jedes Waldes wartet ein großes, besonders verwirrtes Tier.
//  Es ist nicht böse – es ist so durcheinander, dass es das Farn
//  (Waldherz) bewacht, ohne zu wissen, warum. Erst wenn es geheilt
//  ist, leuchtet das Farn wieder.
//
//  Regeln (Werte in ENEMIES[x].ai, siehe config.js):
//   - Es erscheint erst, wenn ALLE Blätter des Waldes gesammelt sind
//     (`erscheinen`), vorher ist es unsichtbar und tut nichts.
//   - Es bleibt in seiner Arena (`arena` = { x0, x1 }): am Rand dreht es um.
//   - ai.schild: so viele Schutzstücke hat es (Geweih, Steinschuppen).
//     Solange eins dran ist, prallt JEDER Schlag ab – nur Jonas' Stampfer
//     bricht pro Landung ein Stück ab. Danach wechselt das Bild
//     (varianten s1 → s0 in der Config), und das Stück fliegt davon.
//   - ai.schildNurBeruhigt: der Stampfer wirkt nur, solange Leonels Waldgeist
//     das Tier beruhigt (es zappelt sonst zu sehr).
//   - ai.nurBeruhigt: überhaupt nur verwundbar, solange es beruhigt ist.
//   - ai.ruf (Röhren): erst warnMs lang gelbes "!", dann dauerMs lang Schall-
//     ringe – wer näher als radius ist, verliert ein Herz. Also: weglaufen!
//   - Ampel wie bei allen Tieren, plus "✕" weiß = jetzt bringt Schlagen nichts
//     (Schild dran / nicht beruhigt), damit niemand vergeblich draufhaut.
//  Alles andere (stromern, stürmen, hüpfen, benommen) erbt es vom Enemy.
// ============================================================
import Phaser from 'phaser'
import Enemy from './Enemy.js'
import { P } from '../palette.js'

const MARK = { weiss: '#ffffff', gelb: '#fee761', rot: '#e43b44' }

export default class Boss extends Enemy {
  constructor(scene, x, y, cfg) {
    super(scene, x, y, cfg)
    this.grundCfg = cfg
    this.schildLeft = cfg.ai.schild ?? 0
    this.arena = null
    this.erschienen = false
    this.rufPhase = null          // null | 'warn' | 'schrei'
    this.rufUntil = 0
    this.nextRufAt = 0
    this.setDepth(9)
    // Versteckt, bis alle Blätter da sind: unsichtbar, keine Physik, kein Zeichen
    this.setVisible(false).setActive(false)
    this.body.enable = false
    this.mark.setVisible(false)
  }

  // Alle Blätter gesammelt und jemand betritt die Arena → der Wächter erwacht
  erscheinen(time) {
    if (this.erschienen) return
    this.erschienen = true
    this.setVisible(true).setActive(true)
    this.body.enable = true
    this.state = 'wander'; this.stateUntil = time + 900; this.wanderPause = true
    this.alertReadyAt = time + 2000
    this.nextRufAt = time + (this.cfg.ai.ruf?.everyMs ?? 0) * 0.5
    this.dir = -1
    this.setAlpha(0)
    this.scene.tweens.add({ targets: this, alpha: 1, duration: 700 })
  }

  // Welches Bild gehört zu so vielen Schutzstücken? (voll = Grundbild, sonst -s1, -s0 …)
  get variantKey() {
    const alle = this.grundCfg.ai.schild ?? 0
    return this.schildLeft < alle ? this.grundCfg.key + '-s' + this.schildLeft : this.grundCfg.key
  }

  isVulnerable(time) {
    if (!this.erschienen) return false
    if (this.schildLeft > 0) return false
    if (this.cfg.ai.nurBeruhigt) return this.isCalm(time)
    return super.isVulnerable(time)
  }
  get dangerous() { return super.dangerous || this.rufPhase === 'schrei' }
  hit(damage, fromX, time) { return this.erschienen ? super.hit(damage, fromX, time) : false }
  calm(time, ms) { if (this.erschienen) super.calm(time, ms) }

  // Jonas' Stampfer: bricht ein Schutzstück ab (oder macht ihn benommen, wenn keins mehr dran ist)
  stun(time, ms) {
    if (this.healed || !this.erschienen) return
    const ai = this.cfg.ai
    if (this.schildLeft > 0) {
      if (ai.schildNurBeruhigt && !this.isCalm(time)) {
        this.scene.floatText(this, ai.zappelText ?? 'Zappelt zu sehr!')
        return
      }
      this.schildLeft--
      this.rufPhase = null
      this.cfg = { ...this.grundCfg, key: this.variantKey }     // ab jetzt das Bild ohne dieses Stück
      this.anims.stop()
      this.bruchstueck()
      this.scene.cameras.main.shake(260, 0.01)
      this.scene.sfx?.play('bruch')
      this.scene.floatText(this, this.schildLeft > 0 ? (ai.bruchText ?? 'Krach!') : (ai.freiText ?? 'Jetzt ist es verwundbar!'))
      this.calmUntil = 0
      this.clearTint()
    }
    super.stun(time, ms)          // ruft stopRolling → Bild = this.cfg.key (die neue Variante)
  }

  // Das abgebrochene Stück fliegt in hohem Bogen davon und verblasst
  bruchstueck() {
    const key = this.grundCfg.key + '-stueck'
    if (!this.scene.textures.exists(key)) return
    const st = this.scene.add.image(this.x - this.dir * 6, this.body.top + 6, key).setDepth(16)
    const dx = -this.dir * (40 + Math.random() * 30)
    this.scene.tweens.add({ targets: st, x: st.x + dx, angle: 540 * Math.sign(dx), duration: 900, ease: 'Quad.Out' })
    this.scene.tweens.add({ targets: st, y: st.y - 46, duration: 380, ease: 'Quad.Out', yoyo: true, hold: 0, onComplete: () => {
      this.scene.tweens.add({ targets: st, alpha: 0, duration: 900, delay: 600, onComplete: () => st.destroy() })
    } })
    this.scene.sparkle(this.x, this.body.top + 6, P.sandHell, 10)
  }

  // Arena: kurz vor dem Rand ist für ihn "kein Boden mehr" → er dreht um wie an einer Kante
  groundAhead(groundLayer, tiefe = 1) {
    if (this.arena) {
      const ahead = this.x + this.dir * (this.body.width / 2 + 6)
      if (ahead < this.arena.x0 || ahead > this.arena.x1) return false
    }
    return super.groundAhead(groundLayer, tiefe)
  }

  update(time, groundLayer, heroes = []) {
    if (!this.erschienen) { this.setVelocity(0, 0); return }
    if (this.healed) { super.update(time, groundLayer, heroes); return }
    const ai = this.cfg.ai
    if (this.isCalm(time)) {
      // Beruhigt: steht still. Zeichen bleibt sichtbar – ★ wenn man jetzt treffen kann, sonst ✕
      super.update(time, groundLayer, heroes)
      this.rufPhase = null
      // ★ auch, wenn jetzt der Stampfer eine Schuppe absprengen kann – das ist der Moment zum Handeln
      const kann = this.isVulnerable(time) || (this.schildLeft > 0 && !!ai.schildNurBeruhigt)
      this.showMark(true, kann ? '★' : '✕', kann ? MARK.gelb : MARK.weiss)
      this.mark.setAngle(kann ? Math.sin(time / 100) * 20 : 0).setPosition(this.x, this.body.top - 8)
      return
    }
    if (this.rufPhase) { this.updateRuf(time, heroes); return }
    // Zeit zu röhren? Nur aus dem Stromern heraus, nie mitten im Sturm
    if (ai.ruf && this.state === 'wander' && time >= this.nextRufAt) {
      this.state = 'ruf'
      this.rufPhase = 'warn'
      this.rufUntil = time + ai.ruf.warnMs
      this.setVelocityX(0)
      this.anims.stop()
      if (this.scene.anims.exists(this.grundCfg.key + '-ruf')) { this.useTexture(this.grundCfg.key + '-ruf'); this.play(this.grundCfg.key + '-ruf') }
      this.updateRuf(time, heroes)
      return
    }
    super.update(time, groundLayer, heroes)
    // Hüpfer (Jaguar) könnten aus der Arena springen → sanft zurückhalten
    if (this.arena) {
      if (this.x < this.arena.x0) { this.x = this.arena.x0; this.dir = 1; if (this.body.velocity.x < 0) this.setVelocityX(-this.body.velocity.x) }
      if (this.x > this.arena.x1) { this.x = this.arena.x1; this.dir = -1; if (this.body.velocity.x > 0) this.setVelocityX(-this.body.velocity.x) }
    }
  }

  // Röhren: warnen (gelb), dann schreien (rot, Schallringe, Herz weg in der Nähe)
  updateRuf(time, heroes) {
    const ruf = this.cfg.ai.ruf
    this.setVelocityX(0)
    if (this.rufPhase === 'warn' && time >= this.rufUntil) {
      this.rufPhase = 'schrei'
      this.rufUntil = time + ruf.dauerMs
      this.scene.schallwelle?.(this, ruf)
      this.scene.sfx?.play('roehren')
      this.scene.cameras.main.shake(ruf.dauerMs, 0.004)
      for (const h of heroes) {
        if (Phaser.Math.Distance.Between(this.x, this.body.center.y, h.x, h.body.center.y) <= ruf.radius) this.scene.hurtHero?.(h, this.x)
      }
    } else if (this.rufPhase === 'schrei' && time >= this.rufUntil) {
      this.rufPhase = null
      this.state = 'wander'; this.stateUntil = time; this.wanderPause = true
      this.nextRufAt = time + ruf.everyMs
      this.alertReadyAt = Math.max(this.alertReadyAt, time + 700)
      this.anims.stop(); this.useTexture(this.cfg.key)
    }
    if (this.rufPhase && this.scene.anims.exists(this.grundCfg.key + '-ruf') && this.frame && this.anims.currentAnim?.key === this.grundCfg.key + '-ruf') {
      // Die Röhr-Animation: erste Hälfte = Kopf hoch (warnen), zweite Hälfte = Maul auf (schreien)
      const n = this.anims.currentAnim.frames.length
      const ges = ruf.warnMs + ruf.dauerMs
      const t = this.rufPhase === 'warn' ? (ruf.warnMs - (this.rufUntil - time)) : ruf.warnMs + (ruf.dauerMs - (this.rufUntil - time))
      this.anims.pause(this.anims.currentAnim.frames[Phaser.Math.Clamp(Math.floor(t / ges * n), 0, n - 1)])
    }
    this.setFlipX(this.dir > 0)
    if (time > this.flashUntil) this.clearTint()
    this.updateMark(time)
  }

  updateMark(time) {
    if (this.state === 'ruf') {
      const schrei = this.rufPhase === 'schrei'
      this.showMark(true, '!', schrei ? MARK.rot : MARK.gelb)
      this.mark.setScale(schrei ? 1.2 + Math.sin(time / 90) * 0.25 : 1 + Math.sin(time / 150) * 0.1).setPosition(this.x, this.body.top - 8)
      return
    }
    super.updateMark(time)
    // Benommen, aber NICHT verwundbar (Schild dran / nicht beruhigt) → ✕ statt ★
    const benommen = this.state === 'dizzy' || this.state === 'turn'
    if (benommen && !this.isVulnerable(time)) { this.mark.setText('✕').setColor(MARK.weiss).setAngle(0); this.markFarbe = MARK.weiss }
  }

  heal(vonDerGruppe = false) {
    // Schon geheilt geladen (Raum neu aufgebaut): dann liegt er sichtbar und friedlich da
    if (!this.erschienen) { this.erschienen = true; this.setVisible(true).setActive(true).setAlpha(1); this.body.enable = true }
    super.heal(vonDerGruppe)
    this.rufPhase = null
    if (this.scene.textures.exists(this.grundCfg.key + '-heil')) this.useTexture(this.grundCfg.key + '-heil')
    this.scene.bossGeheilt?.(this)
  }
}
