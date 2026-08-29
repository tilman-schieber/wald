// ============================================================
//  SOUND — kleine Töne, direkt im Browser erzeugt
// ============================================================
//  Keine Sound-Dateien nötig: Wir bauen die Töne aus Schwingungen
//  (Oszillatoren) zusammen, wie ein winziger Synthesizer.
//  Jeder Ton ist eine Liste von Schritten { f: Frequenz, t: Dauer }.
// ============================================================

const SOUNDS = {
  jump:    { type: 'square',   steps: [{ f: 300, t: 0.05 }, { f: 520, t: 0.08 }], vol: 0.12 },
  attack:  { type: 'sawtooth', steps: [{ f: 700, t: 0.03 }, { f: 300, t: 0.05 }], vol: 0.08 },
  hurt:    { type: 'square',   steps: [{ f: 200, t: 0.08 }, { f: 120, t: 0.12 }], vol: 0.14 },
  hit:     { type: 'triangle', steps: [{ f: 440, t: 0.04 }, { f: 330, t: 0.04 }], vol: 0.1 },
  heal:    { type: 'triangle', steps: [{ f: 523, t: 0.08 }, { f: 659, t: 0.08 }, { f: 784, t: 0.08 }, { f: 1047, t: 0.16 }], vol: 0.12 },
  collect: { type: 'sine',     steps: [{ f: 880, t: 0.05 }, { f: 1320, t: 0.1 }], vol: 0.1 },
  switch:  { type: 'square',   steps: [{ f: 600, t: 0.04 }, { f: 900, t: 0.04 }], vol: 0.08 },
  call:    { type: 'sine',     steps: [{ f: 660, t: 0.08 }, { f: 880, t: 0.08 }, { f: 660, t: 0.08 }], vol: 0.1 },
  plopp:   { type: 'sine',     steps: [{ f: 200, t: 0.04 }, { f: 800, t: 0.06 }], vol: 0.12 },
  gate:    { type: 'square',   steps: [{ f: 150, t: 0.1 }, { f: 200, t: 0.1 }], vol: 0.1 },
  spirit:  { type: 'sine',     steps: [{ f: 500, t: 0.1 }, { f: 750, t: 0.1 }, { f: 1000, t: 0.2 }], vol: 0.08 },
  hook:    { type: 'sawtooth', steps: [{ f: 400, t: 0.05 }, { f: 800, t: 0.15 }], vol: 0.08 },
  lose:    { type: 'triangle', steps: [{ f: 392, t: 0.2 }, { f: 330, t: 0.2 }, { f: 262, t: 0.4 }], vol: 0.12 },
  room:    { type: 'sine',     steps: [{ f: 440, t: 0.06 }, { f: 554, t: 0.06 }, { f: 659, t: 0.12 }], vol: 0.08 },
}

export default class Sfx {
  constructor(scene) {
    // Phaser hat schon einen Web-Audio-Kontext, den nutzen wir mit
    this.ctx = scene.sound?.context ?? null
    this.muted = false
  }

  play(name) {
    const s = SOUNDS[name]
    if (!s || !this.ctx || this.muted || this.ctx.state !== 'running') return
    const ctx = this.ctx
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = s.type
    let t = ctx.currentTime
    gain.gain.setValueAtTime(s.vol, t)
    for (const step of s.steps) {
      osc.frequency.setValueAtTime(step.f, t)
      t += step.t
    }
    gain.gain.linearRampToValueAtTime(0.0001, t)   // ausklingen, damit es nicht knackt
    osc.connect(gain).connect(ctx.destination)
    osc.start()
    osc.stop(t + 0.02)
  }
}
