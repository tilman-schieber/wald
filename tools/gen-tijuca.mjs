// Baut das Level der Floresta da Tijuca (240 Kacheln): hügeliger Lehmboden,
// viele Plattformen, Lianen zum Schwingen, Bambus-Tunnel für Leonel,
// die vier tropischen Gegner, Kulissen aus Rio und am Ende das Waldherz.
//   node tools/gen-tijuca.mjs [seed]
import fs from 'fs'
const W = 240, H = 17, T = 16
const ERDE = 1, GRAS = 2, STEIN = 17
let seed = Number(process.argv[2] ?? 3001)
const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff }
const between = (a, b) => a + Math.floor(rnd() * (b - a + 1))
const pick = (arr) => arr[Math.floor(rnd() * arr.length)]

// Flache Zonen: hier stehen Rätsel und das Ziel
const FLAT = [[0, 12], [70, 92], [128, 150], [206, 240]]
const isFlat = (x) => FLAT.some(([a, b]) => x >= a && x < b)

// ---------- Bodenprofil ----------
const g = new Array(W).fill(15)
let x = 0, cur = 15
while (x < W) {
  const len = between(5, 12)
  if (!isFlat(x)) cur = Math.max(11, Math.min(15, cur + pick([-1, -1, 0, 1, 1, -2, 2])))
  for (let i = 0; i < len && x < W; i++, x++) g[x] = isFlat(x) ? 15 : cur
  if (isFlat(x - 1)) cur = 15
}
for (let i = 1; i < W; i++) if (g[i] < g[i - 1] - 2) g[i] = g[i - 1] - 2
for (let i = W - 2; i >= 0; i--) if (g[i] < g[i + 1] - 2) g[i] = g[i + 1] - 2

const data = new Array(W * H).fill(0)
const set = (c, r, v) => { if (c >= 0 && c < W && r >= 0 && r < H) data[r * W + c] = v }
const solid = (c, r) => c >= 0 && c < W && r >= 0 && r < H && data[r * W + c] !== 0
for (let c = 0; c < W; c++) for (let r = g[c]; r < H; r++) set(c, r, r === g[c] ? GRAS : ERDE)

// ---------- Plattformen (im Regenwald gibt es mehr Ebenen) ----------
const plats = []
for (let c = 6; c < W - 8; c += between(6, 11)) {
  if (isFlat(c) && c > 12) continue
  const len = between(3, 6), top = Math.min(...g.slice(c, c + len)) - between(3, 4)
  if (top < 3) continue
  for (let i = 0; i < len; i++) set(c + i, top, rnd() < 0.25 ? STEIN : GRAS)
  plats.push({ x0: c, x1: c + len - 1, row: top })
  if (rnd() < 0.45 && top - 3 >= 2) { const l2 = between(2, 4), o = between(-1, 2); for (let i = 0; i < l2; i++) set(c + o + i, top - 3, GRAS); plats.push({ x0: c + o, x1: c + o + l2 - 1, row: top - 3 }) }
}

// ---------- Rätsel: Aquädukt-Mauern aus Stein ----------
for (let r = 9; r <= 11; r++) set(80, r, STEIN)                                  // Torbogen Zone B
for (let c = 138; c <= 139; c++) for (let r = 0; r <= 8; r++) set(c, r, STEIN)   // Mauer Zone C (Bambus-Tunnel darunter)
for (let c = 150; c <= 158; c++) set(c, 4, STEIN)                                // hoher Sims mit Ranke
for (let c = 212; c <= 219; c++) set(c, 12, STEIN)                               // Hügel fürs Waldherz
for (let c = 214; c <= 217; c++) set(c, 11, STEIN)

// ---------- Objekte ----------
const objs = []
const point = (name, type, x, y, props) => objs.push({ name, type, point: true, x, y, width: 0, height: 0, rotation: 0, visible: true, properties: props })
const rect = (name, type, x, y, w, h, props) => objs.push({ name, type, x, y, width: w, height: h, rotation: 0, visible: true, properties: props ? Object.entries(props).map(([n, v]) => ({ name: n, type: typeof v === 'boolean' ? 'bool' : 'string', value: v })) : undefined })
const prop = (name, value) => ({ name, type: typeof value === 'boolean' ? 'bool' : 'string', value })
const boden = (c) => g[c] * T
const top = (c) => { for (let r = 0; r < H; r++) if (solid(c, r)) return r * T; return 240 }

point('start', 'spawn', 48, 240)
// Zone B: Platte hält das Tor, Hebel öffnet es dauerhaft
rect('b_tor', 'tor', 80 * T, 192, 16, 48); rect('b_platte', 'platte', 74 * T, 236, 16, 4, { oeffnet: 'b_tor' }); rect('b_hebel', 'hebel', 87 * T, 224, 12, 16, { oeffnet: 'b_tor' })
// Zone C: Bambus-Tunnel unter dem Tor (nur Leonel kriecht durch), Hebel dahinter
rect('c_tor', 'tor', 138 * T, 144, 32, 80); rect('c_hebel', 'hebel', 145 * T, 224, 12, 16, { oeffnet: 'c_tor' })
rect('c_ranke', 'ranke', 149 * T - 4, 64, 8, 160)
point('blatt', 'blatt', 153 * T, 48); point('blatt', 'blatt', 156 * T, 48)
// Waldherz
point('waldherz', 'waldherz', 215.5 * T, 176)

// ---------- Lianen zum Schwingen: über breite Lücken zwischen Plattformen ----------
let schwingen = 0
for (let i = 0; i < plats.length - 1 && schwingen < 6; i++) {
  const a = plats[i], b = plats[i + 1]
  const luecke = (b.x0 - a.x1 - 1) * T
  if (luecke < 60 || luecke > 150 || Math.abs(a.row - b.row) > 2) continue
  const mx = ((a.x1 + b.x0) / 2 + 0.5) * T
  const oben = (Math.min(a.row, b.row) - 5) * T
  if (oben < 8) continue
  rect('schwinge' + schwingen, 'schwinge', mx - 6, oben, 12, Math.max(48, (a.row * T) - oben - 12))
  schwingen++
}

// ---------- Gegner ----------
// Affen sitzen auf Plattformen (von oben werfen sie), Nasenbären und Ameisen unten
plats.filter((p, i) => i % 3 === 0 && p.row < 11).forEach((p) => point('affe', 'enemy', ((p.x0 + p.x1) / 2 + 0.5) * T, p.row * T))
let nr = 0
for (let c = 22; c < 205; c += between(18, 26)) {
  if (isFlat(c) && c > 12) continue
  point(['nasenbaer', 'ameise', 'nasenbaer'][nr++ % 3], 'enemy', c * T, boden(c))
}
// Faultiere hängen unter breiten Plattformen
plats.filter((p, i) => i % 4 === 2 && p.x1 - p.x0 >= 4).slice(0, 5).forEach((p) => point('faultier', 'enemy', ((p.x0 + p.x1) / 2 + 0.5) * T, (p.row + 2) * T))

// ---------- Kulissen aus Rio ----------
const kulisse = (name, x, tiefe, spiegeln = false) => point(name, 'kulisse', x, 240, [prop('tiefe', String(tiefe)), prop('spiegeln', spiegeln)])
kulisse('cristo', 700, 0.12)
kulisse('cascatinha', 1500, 0.45)
kulisse('pavillon', 2600, 0.55)
kulisse('cascatinha', 3200, 0.35, true)

// ---------- Speicherpunkte ----------
for (const [i, c] of [[2, 55], [3, 105], [4, 165]]) point('speicher' + i, 'checkpoint', c * T, boden(c))

// ---------- Deko und Tiere ----------
const busy = (px, ty) => objs.some((o) => ['tor', 'platte', 'hebel', 'waldherz', 'checkpoint', 'spawn', 'schwinge'].includes(o.type) && Math.abs((o.x + (o.width || 0) / 2) - px) < 36 && Math.abs((o.y + (o.height || 0)) - ty) < 24)
const runs = []
for (let r = 0; r < H; r++) { let c = 0; while (c < W) { if (!(solid(c, r) && !solid(c, r - 1))) { c++; continue } const c0 = c; while (c < W && solid(c, r) && !solid(c, r - 1)) c++; runs.push({ x0: c0 * T, x1: c * T, top: r * T, ground: r >= 11 && solid(c0, r + 1) }) } }
for (const run of runs) {
  let px = run.x0 + 10 + rnd() * 24
  while (px < run.x1 - 8) {
    if (!busy(px, run.top) && rnd() < 0.85) {
      const name = pick(run.x1 - run.x0 > 40
        ? ['farn', 'farn', 'bromelie', 'monstera', 'bambus', 'gras', 'pilze', 'busch', 'laub', 'fels', 'holz', 'leuchtpilze', 'wurzeln']
        : ['farn', 'bromelie', 'gras', 'monstera', 'leuchtpilze'])
      point(name, 'deko', Math.round(px), run.top, [prop('vorne', rnd() < 0.3), prop('spiegeln', rnd() < 0.5)])
    }
    px += 32 + rnd() * 46
  }
  if (!run.ground) { for (let hx = run.x0 + 12; hx < run.x1 - 8; hx += 26 + rnd() * 28) if (rnd() < 0.7) point(rnd() < 0.5 ? 'liane' : 'moos', 'deko', Math.round(hx), run.top + 16, [prop('vorne', rnd() < 0.4)]) }
}
const wide = runs.filter((r) => r.x1 - r.x0 >= 64)
for (let i = 0; i < 10; i++) { const r = pick(wide); const tx = r.x0 + 20 + rnd() * (r.x1 - r.x0 - 40); if (!busy(tx, r.top)) point('schmetterling', 'tier', Math.round(tx), r.top) }

const map = {
  compressionlevel: -1, height: H, width: W, infinite: false, orientation: 'orthogonal', renderorder: 'right-down',
  tiledversion: '1.11.0', version: '1.10', type: 'map', tilewidth: T, tileheight: T, nextlayerid: 3, nextobjectid: objs.length + 1,
  tilesets: [
    { firstgid: 1, name: 'tiles', image: '../../public/assets/tiles/tijuca.png', imagewidth: 64, imageheight: 64, tilewidth: 16, tileheight: 16, tilecount: 16, columns: 4, margin: 0, spacing: 0 },
    { firstgid: STEIN, name: 'stein', image: '../../public/assets/tiles/tijuca_stein.png', imagewidth: 64, imageheight: 64, tilewidth: 16, tileheight: 16, tilecount: 16, columns: 4, margin: 0, spacing: 0 },
  ],
  layers: [
    { id: 1, name: 'Boden', type: 'tilelayer', width: W, height: H, x: 0, y: 0, visible: true, opacity: 1, data },
    { id: 2, name: 'Objekte', type: 'objectgroup', visible: true, opacity: 1, x: 0, y: 0, draworder: 'topdown', objects: objs.map((o, i) => ({ ...o, id: i + 1 })) },
  ],
}
fs.writeFileSync('src/levels/tijuca.json', JSON.stringify(map, null, 1))
const zaehl = (t) => objs.filter((o) => o.type === t).length
console.log(`tijuca.json: ${plats.length} Plattformen, ${zaehl('enemy')} Gegner, ${schwingen} Lianen, ${zaehl('deko')} Deko, ${zaehl('tier')} Tiere, ${zaehl('kulisse')} Kulissen`)
