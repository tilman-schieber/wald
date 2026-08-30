// Baut das Schwarzwald-Level (300 Kacheln) – hügeliger Boden, viele Plattformen,
// feste Rätsel-Zonen, Gegner, Tiere, Deko, Speicherpunkte.
//   node tools/gen-schwarzwald.mjs [seed]
// Der Boden steigt und fällt in Stufen (Arcade-Physik kennt keine Schrägen).
import fs from 'fs'
const W = 300, H = 17, T = 16
const ERDE = 1, GRAS = 2, STEIN = 17
let seed = Number(process.argv[2] ?? 2026)
const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff }
const between = (a, b) => a + Math.floor(rnd() * (b - a + 1))
const pick = (arr) => arr[Math.floor(rnd() * arr.length)]

// ---------- Zonen: hier bleibt der Boden flach (Rätsel brauchen das) ----------
const FLAT = [[0, 12], [80, 100], [136, 150], [176, 216], [262, 300]]
const isFlat = (x) => FLAT.some(([a, b]) => x >= a && x < b)

// ---------- Bodenprofil: Zeile der Oberkante je Spalte (15 = normal, 11 = 4 hoch) ----------
const g = new Array(W).fill(15)
let x = 0, cur = 15
while (x < W) {
  const len = between(5, 13)
  if (!isFlat(x)) {
    const step = pick([-1, -1, 0, 1, 1, -2, 2])              // hoch = kleinere Zeile
    cur = Math.max(11, Math.min(15, cur + step))
  }
  for (let i = 0; i < len && x < W; i++, x++) g[x] = isFlat(x) ? 15 : cur
  if (isFlat(x - 1)) cur = 15
}
// Sanfter Übergang zu flachen Zonen: max. 2 Stufen pro Spalte
for (let i = 1; i < W; i++) { if (g[i] < g[i - 1] - 2) g[i] = g[i - 1] - 2; }
for (let i = W - 2; i >= 0; i--) { if (g[i] < g[i + 1] - 2) g[i] = g[i + 1] - 2; }

const data = new Array(W * H).fill(0)
const set = (c, r, v) => { if (c >= 0 && c < W && r >= 0 && r < H) data[r * W + c] = v }
const solid = (c, r) => c >= 0 && c < W && r >= 0 && r < H && data[r * W + c] !== 0
for (let c = 0; c < W; c++) for (let r = g[c]; r < H; r++) set(c, r, r === g[c] ? GRAS : ERDE)

// ---------- Schwebende Plattformen: 3–6 Kacheln, 3–4 über dem Boden, erreichbar ----------
const plats = []
for (let c = 6; c < W - 8; c += between(7, 13)) {
  if (isFlat(c) && c > 12) continue
  const len = between(3, 6), top = Math.min(...g.slice(c, c + len)) - between(3, 4)
  if (top < 3) continue
  for (let i = 0; i < len; i++) set(c + i, top, rnd() < 0.3 ? STEIN : GRAS)
  plats.push({ x0: c, x1: c + len - 1, row: top })
  // manchmal eine zweite Ebene darüber
  if (rnd() < 0.35 && top - 3 >= 2) { const l2 = between(2, 4), o = between(-1, 2); for (let i = 0; i < l2; i++) set(c + o + i, top - 3, GRAS); plats.push({ x0: c + o, x1: c + o + l2 - 1, row: top - 3 }) }
}

// ---------- Rätsel-Zonen (Kacheln) ----------
// Zone B (80–100): Torbogen; Zone C (136–150): Mauer bis zur Decke mit Spalt; Zone D (176–216): Treppe + Mauer
for (let r = 9; r <= 11; r++) set(90, r, STEIN)                               // Torbogen über Tor B
for (let r = 0; r <= 8; r++) { set(140, r, STEIN); set(141, r, STEIN) }       // Mauer C (Tor darunter, Spalt ganz unten)
for (let c = 176; c <= 179; c++) set(c, 12, STEIN)                             // Treppe D
for (let c = 182; c <= 185; c++) set(c, 9, STEIN)
for (let c = 188; c <= 192; c++) set(c, 6, STEIN)
for (let r = 0; r <= 11; r++) { set(196, r, STEIN); set(197, r, STEIN) }       // Mauer D
for (let c = 206; c <= 210; c++) set(c, 10, STEIN)
for (let c = 268; c <= 275; c++) set(c, 12, STEIN)                             // Hügel fürs Waldherz
for (let c = 270; c <= 273; c++) set(c, 11, STEIN)
// Sims für die Ranke in Zone C
for (let c = 156; c <= 164; c++) set(c, 4, STEIN)

// ---------- Objekte ----------
const objs = []
const point = (name, type, x, y, props) => objs.push({ name, type, point: true, x, y, width: 0, height: 0, rotation: 0, visible: true, properties: props })
const rect = (name, type, x, y, w, h, props) => objs.push({ name, type, x, y, width: w, height: h, rotation: 0, visible: true, properties: props ? Object.entries(props).map(([n, v]) => ({ name: n, type: typeof v === 'boolean' ? 'bool' : 'string', value: v })) : undefined })
const top = (c) => { for (let r = 0; r < H; r++) if (solid(c, r)) return r * T; return 240 }   // Oberkante in px
point('start', 'spawn', 48, 240)
// Zone B: Platte hält Tor, Hebel öffnet dauerhaft
rect('b_tor', 'tor', 90 * T, 192, 16, 48); rect('b_platte', 'platte', 84 * T, 236, 16, 4, { oeffnet: 'b_tor' }); rect('b_hebel', 'hebel', 97 * T, 224, 12, 16, { oeffnet: 'b_tor' })
point('eule', 'enemy', 95 * T, 130)
// Zone C: Tor (Spalt darunter für Leonel), Hebel rechts, Ranke zum Sims
rect('c_tor', 'tor', 140 * T, 144, 32, 80); rect('c_hebel', 'hebel', 147 * T, 224, 12, 16, { oeffnet: 'c_tor' })
rect('c_ranke', 'ranke', 155 * T - 4, 64, 8, 160); point('blatt', 'blatt', 159 * T, 48); point('blatt', 'blatt', 162 * T, 48)
point('wildschwein', 'enemy', 170 * T, top(170))
// Zone D: Treppe zur Platte, Tor unten, Hebel, Ranke
rect('d_tor', 'tor', 196 * T, 192, 32, 48); rect('d_platte', 'platte', 190 * T, 92, 16, 4, { oeffnet: 'd_tor' }); rect('d_hebel', 'hebel', 213 * T, 224, 12, 16, { oeffnet: 'd_tor' })
rect('d_ranke', 'ranke', 187 * T - 4, 96, 8, 128); point('blatt', 'blatt', 192 * T, 80); point('blatt', 'blatt', 208 * T, 144)
point('eule', 'enemy', 205 * T, 120); point('wildschwein', 'enemy', 212 * T, 240)
// Zone E: Waldherz
point('waldherz', 'waldherz', 271.5 * T, 176)
// Ranken an hohen Plattformen (jede 3. Plattform, wenn sie 4 hoch ist)
plats.filter((p, i) => i % 3 === 1).forEach((p) => { const gx = p.x0 - 1; if (top(gx) - p.row * T >= 48) rect('ranke_' + p.x0, 'ranke', gx * T + 4, p.row * T, 8, top(gx) - p.row * T - 16) })
// Igel auf Boden-Plateaus, Blätter auf Plattformen
for (let c = 20; c < 260; c += between(22, 34)) { if (isFlat(c) && c > 12) continue; point('igel', 'enemy', c * T, top(c)) }
plats.forEach((p, i) => { if (i % 2 === 0) point('blatt', 'blatt', ((p.x0 + p.x1) / 2 + 0.5) * T, p.row * T - 20) })
// Kulissen im Hintergrund (Schwarzwald bei Freiburg): weit weg = kleine tiefe
const kulisse = (name, x, tiefe, spiegeln = false) => objs.push({ name, type: 'kulisse', point: true, x, y: 240, width: 0, height: 0, rotation: 0, visible: true, properties: [{ name: 'tiefe', type: 'string', value: String(tiefe) }, { name: 'spiegeln', type: 'bool', value: spiegeln }] })
kulisse('muenster', 260, 0.15)          // ganz am Anfang: Freiburg liegt hinter uns
kulisse('schwarzwaldhof', 900, 0.55)
kulisse('hochsitz', 1700, 0.7)
kulisse('schauinsland', 3300, 0.4)
kulisse('schwarzwaldhof', 4000, 0.5, true)
kulisse('hochsitz', 4550, 0.65, true)
// Speicherpunkte (Eichhörnchen) am Anfang jeder Zone
for (const [i, c] of [[2, 62], [3, 118], [4, 172], [5, 240]]) point('speicher' + i, 'checkpoint', c * T, top(c))

// ---------- Deko + Tiere auf allen Stehflächen ----------
const busy = (px, ty) => objs.some((o) => ['tor', 'platte', 'hebel', 'waldherz', 'checkpoint', 'spawn'].includes(o.type) && Math.abs((o.x + (o.width || 0) / 2) - px) < 36 && Math.abs((o.y + (o.height || 0)) - ty) < 24)
const runs = []
for (let r = 0; r < H; r++) { let c = 0; while (c < W) { if (!(solid(c, r) && !solid(c, r - 1))) { c++; continue } const c0 = c; while (c < W && solid(c, r) && !solid(c, r - 1)) c++; runs.push({ x0: c0 * T, x1: c * T, top: r * T, ground: r >= 11 && solid(c0, r + 1) }) } }
let tiere = 0
for (const run of runs) {
  let px = run.x0 + 8 + rnd() * 24
  while (px < run.x1 - 8) {
    if (!busy(px, run.top) && rnd() < 0.8) {
      const name = pick(run.x1 - run.x0 > 40 ? ['farn', 'farn', 'gras', 'gras', 'pilze', 'blumen', 'stein', 'stamm', 'holz', 'busch', 'laub', 'leuchtpilze', 'wurzeln', 'fels', 'schild'] : ['farn', 'gras', 'pilze', 'blumen', 'leuchtpilze', 'laub'])
      point(name, 'deko', Math.round(px), run.top, [{ name: 'vorne', type: 'bool', value: rnd() < 0.3 }, { name: 'spiegeln', type: 'bool', value: rnd() < 0.5 }])
    }
    px += 34 + rnd() * 50
  }
  if (!run.ground) { for (let hx = run.x0 + 12; hx < run.x1 - 8; hx += 28 + rnd() * 30) if (rnd() < 0.6) point(rnd() < 0.15 ? 'laterne' : 'moos', 'deko', Math.round(hx), run.top + 16, [{ name: 'vorne', type: 'bool', value: rnd() < 0.4 }]) }
}
// Tiere (keine Eichhörnchen – die sind Speicherpunkte)
const wide = runs.filter((r) => r.x1 - r.x0 >= 64)
for (let i = 0; i < 12; i++) { const r = pick(wide); const tx = r.x0 + 20 + rnd() * (r.x1 - r.x0 - 40); if (!busy(tx, r.top)) point(pick(['hase', 'schmetterling', 'hase']), 'tier', Math.round(tx), r.top) }

const map = {
  compressionlevel: -1, height: H, width: W, infinite: false, orientation: 'orthogonal', renderorder: 'right-down',
  tiledversion: '1.11.0', version: '1.10', type: 'map', tilewidth: T, tileheight: T, nextlayerid: 3, nextobjectid: objs.length + 1,
  tilesets: [
    { firstgid: 1, name: 'tiles', image: '../../public/assets/tiles/schwarzwald.png', imagewidth: 64, imageheight: 64, tilewidth: 16, tileheight: 16, tilecount: 16, columns: 4, margin: 0, spacing: 0 },
    { firstgid: STEIN, name: 'stein', image: '../../public/assets/tiles/schwarzwald_stein.png', imagewidth: 64, imageheight: 64, tilewidth: 16, tileheight: 16, tilecount: 16, columns: 4, margin: 0, spacing: 0 },
  ],
  layers: [
    { id: 1, name: 'Boden', type: 'tilelayer', width: W, height: H, x: 0, y: 0, visible: true, opacity: 1, data },
    { id: 2, name: 'Objekte', type: 'objectgroup', visible: true, opacity: 1, x: 0, y: 0, draworder: 'topdown', objects: objs.map((o, i) => ({ ...o, id: i + 1 })) },
  ],
}
fs.writeFileSync('src/levels/schwarzwald.json', JSON.stringify(map, null, 1))
console.log(`schwarzwald.json: ${plats.length} Plattformen, ${objs.filter((o) => o.type === 'enemy').length} Gegner, ${objs.filter((o) => o.type === 'deko').length} Deko, ${objs.filter((o) => o.type === 'tier').length} Tiere, Bodenhöhen ${Math.min(...g)}–${Math.max(...g)}`)
