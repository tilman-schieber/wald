// ============================================================
//  SOUND — kleine Töne, direkt im Browser erzeugt
// ============================================================
//  Keine Sound-Dateien nötig: Wir bauen die Töne aus Schwingungen
//  (Oszillatoren) zusammen, wie ein winziger Synthesizer.
//
//  Damit es nicht piepsig-schrill klingt:
//   - weiche Wellenformen (sine/triangle) statt square/sawtooth
//   - ein Tiefpass-Filter nimmt die harten Höhen weg (wie ein Kissen davor)
//   - jeder Ton wird sanft ein- und ausgeblendet (kein Knacken)
//   - "noise" = Rauschen für natürliche Geräusche (Rascheln, Erde)
// ============================================================

// type: sine | triangle | square | sawtooth | noise
// steps: [{ f: Frequenz, t: Dauer in Sekunden }]
// vol:   Lautstärke, cutoff: Tiefpass-Grenze in Hz (kleiner = dumpfer)
const SOUNDS = {
  jump:    { type: 'triangle', steps: [{ f: 280, t: 0.05 }, { f: 440, t: 0.07 }], vol: 0.10, cutoff: 2200 },
  attack:  { type: 'noise',    steps: [{ f: 1200, t: 0.06 }], vol: 0.10, cutoff: 1800, sweep: 0.4 },
  hurt:    { type: 'triangle', steps: [{ f: 220, t: 0.07 }, { f: 130, t: 0.13 }], vol: 0.14, cutoff: 1400 },
  hit:     { type: 'triangle', steps: [{ f: 380, t: 0.05 }, { f: 300, t: 0.05 }], vol: 0.10, cutoff: 1600 },
  heal:    { type: 'sine',     steps: [{ f: 523, t: 0.09 }, { f: 659, t: 0.09 }, { f: 784, t: 0.09 }, { f: 1047, t: 0.2 }], vol: 0.11, cutoff: 3000 },
  collect: { type: 'sine',     steps: [{ f: 784, t: 0.06 }, { f: 1175, t: 0.11 }], vol: 0.09, cutoff: 3000 },
  switch:  { type: 'sine',     steps: [{ f: 520, t: 0.05 }, { f: 700, t: 0.06 }], vol: 0.08, cutoff: 2600 },
  call:    { type: 'sine',     steps: [{ f: 600, t: 0.09 }, { f: 800, t: 0.09 }, { f: 600, t: 0.1 }], vol: 0.09, cutoff: 2600 },
  plopp:   { type: 'sine',     steps: [{ f: 180, t: 0.05 }, { f: 620, t: 0.08 }], vol: 0.10, cutoff: 2400 },
  gate:    { type: 'triangle', steps: [{ f: 120, t: 0.12 }, { f: 90, t: 0.14 }], vol: 0.11, cutoff: 900 },
  spirit:  { type: 'sine',     steps: [{ f: 440, t: 0.12 }, { f: 660, t: 0.12 }, { f: 880, t: 0.24 }], vol: 0.08, cutoff: 3200 },
  // Klettern: leises Rascheln an der Ranke statt Sirene
  climb:   { type: 'noise',    steps: [{ f: 700, t: 0.14 }], vol: 0.06, cutoff: 900, sweep: 0.6 },
  // Stampfer: dumpfer Erdschlag
  slam:    { type: 'noise',    steps: [{ f: 300, t: 0.22 }], vol: 0.16, cutoff: 500, sweep: 0.3 },
  step:    { type: 'noise',    steps: [{ f: 500, t: 0.05 }], vol: 0.04, cutoff: 800, sweep: 0.5 },
  nope:    { type: 'triangle', steps: [{ f: 200, t: 0.07 }, { f: 150, t: 0.09 }], vol: 0.08, cutoff: 1200 },
  lose:    { type: 'triangle', steps: [{ f: 392, t: 0.22 }, { f: 330, t: 0.22 }, { f: 262, t: 0.45 }], vol: 0.12, cutoff: 1600 },
  room:    { type: 'sine',     steps: [{ f: 440, t: 0.07 }, { f: 554, t: 0.07 }, { f: 659, t: 0.14 }], vol: 0.08, cutoff: 3000 },
}

export default class Sfx {
  constructor(scene) {
    // Phaser hat schon einen Web-Audio-Kontext, den nutzen wir mit
    this.ctx = scene.sound?.context ?? null
    this.muted = false
    this.noiseBuffer = null
  }

  // Rauschen = lauter Zufallswerte; einmal erzeugt und dann wiederverwendet
  getNoise() {
    if (this.noiseBuffer) return this.noiseBuffer
    const len = Math.floor(this.ctx.sampleRate * 0.4)
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
    this.noiseBuffer = buf
    return buf
  }

  play(name) {
    const s = SOUNDS[name]
    if (!s || !this.ctx || this.muted || this.ctx.state !== 'running') return
    const ctx = this.ctx
    const t0 = ctx.currentTime
    const dauer = s.steps.reduce((a, x) => a + x.t, 0)

    // Tiefpass: nimmt die schrillen Höhen weg
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(s.cutoff ?? 2000, t0)
    if (s.sweep) filter.frequency.exponentialRampToValueAtTime(Math.max(120, (s.cutoff ?? 2000) * s.sweep), t0 + dauer)

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.0001, t0)
    gain.gain.exponentialRampToValueAtTime(s.vol, t0 + 0.012)          // sanft einblenden
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dauer + 0.03)  // sanft ausklingen

    let quelle
    if (s.type === 'noise') {
      quelle = ctx.createBufferSource()
      quelle.buffer = this.getNoise()
    } else {
      quelle = ctx.createOscillator()
      quelle.type = s.type
      let t = t0
      for (const step of s.steps) { quelle.frequency.setValueAtTime(step.f, t); t += step.t }
    }
    quelle.connect(filter).connect(gain).connect(ctx.destination)
    quelle.start(t0)
    quelle.stop(t0 + dauer + 0.06)
  }
}
