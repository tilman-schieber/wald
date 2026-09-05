// Baut das Level des Lorbeerwalds auf La Palma (260 Kacheln): welliger Vulkanboden mit
// Basalt-Felsen, ein Barranco (Schlucht) mit Wasserfall, eine Lavaröhre, durch die nur
// Leonel kriecht, Luftwurzeln zum Schwingen, Drachenbäume, die vier Inselbewohner
// (Graja, Eidechse, Ziege, Lorbeertaube) und am Ende das Waldherz.
//   node tools/gen-la_palma.mjs [seed]
import fs from 'fs'
const W = 260, H = 17, T = 16
const ERDE = 1, MOOS = 2, BASALT = 17
let seed = Number(process.argv[2] ?? 4001)
const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff }
const between = (a, b) => a + Math.floor(rnd() * (b - a + 1))
const pick = (arr) => arr[Math.floor(rnd() * arr.length)]

// Flache Zonen: Start, Rätsel B (Tor mit Platte), Rätsel C (Lavaröhre), Ziel
const FLAT = [[0, 12], [76, 98], [140, 164], [226, 260]]
const isFlat = (x) => FLAT.some(([a, b]) => x >= a && x < b)

// ---------- Bodenprofil: Insel = auf und ab, aber nie steiler als zwei Kacheln ----------
const g = new Array(W).fill(15)
let x = 0, cur = 15
while (x < W) {
  const len = between(5, 11)
  if (!isFlat(x)) cur = Math.max(11, Math.min(15, cur + pick([-1, -1, 0, 1, 1, -2, 2])))
  for (let i = 0; i < len && x < W; i++, x++) g[x] = isFlat(x) ? 15 : cur
  if (isFlat(x - 1)) cur = 15
}
for (let i = 1; i < W; i++) if (g[i] < g[i - 1] - 2) g[i] = g[i - 1] - 2
for (let i = W - 2; i >= 0; i--) if (g[i] < g[i + 1] - 2) g[i] = g[i + 1] - 2

const data = new Array(W * H).fill(0)
const set = (c, r, v) => { if (c >= 0 && c < W && r >= 0 && r < H) data[r * W + c] = v }
const solid = (c, r) => c >= 0 && c < W && r >= 0 && r < H && data[r * W + c] !== 0
// Vulkanboden: unter dem Moos Erde, tief unten und an steilen Stellen Basalt
for (let c = 0; c < W; c++) for (let r = g[c]; r < H; r++) set(c, r, r === g[c] ? MOOS : r >= g[c] + 3 ? BASALT : ERDE)

// ---------- Plattformen (Lavabänke und moosige Simse) ----------
const plats = []
for (let c = 6; c < W - 8; c += between(6, 11)) {
  if (isFlat(c) && c > 12) continue
  const len = between(3, 6), top = Math.min(...g.slice(c, c + len)) - between(3, 4)
  if (top < 3) continue
  const basalt = rnd() < 0.4                     // ganze Bank aus Basalt oder aus Moos
  for (let i = 0; i < len; i++) set(c + i, top, basalt ? BASALT : MOOS)
  plats.push({ x0: c, x1: c + len - 1, row: top })
  if (rnd() < 0.45 && top - 3 >= 2) { const l2 = between(2, 4), o = between(-1, 2); for (let i = 0; i < l2; i++) set(c + o + i, top - 3, MOOS); plats.push({ x0: c + o, x1: c + o + l2 - 1, row: top - 3 }) }
}

// ---------- Rätsel aus Basalt ----------
for (let r = 9; r <= 11; r++) set(86, r, BASALT)                                 // Torpfosten Zone B
// Zone C: Lavaröhre – eine Basaltwand bis zum Boden, darunter ein EIN Kachel hoher Gang (nur Leonel)
for (let c = 150; c <= 152; c++) for (let r = 0; r <= 13; r++) set(c, r, BASALT)
for (let c = 150; c <= 152; c++) set(c, 14, 0)                                    // der Kriechgang
for (let c = 162; c <= 170; c++) set(c, 4, BASALT)                               // hoher Sims mit Ranke
for (let c = 232; c <= 239; c++) set(c, 12, BASALT)                              // Hügel fürs Waldherz
for (let c = 234; c <= 237; c++) set(c, 11, BASALT)

// ---------- Objekte ----------
const objs = []
const point = (name, type, x, y, props) => objs.push({ name, type, point: true, x, y, width: 0, height: 0, rotation: 0, visible: true, properties: props })
const rect = (name, type, x, y, w, h, props) => objs.push({ name, type, x, y, width: w, height: h, rotation: 0, visible: true, properties: props ? Object.entries(props).map(([n, v]) => ({ name: n, type: typeof v === 'boolean' ? 'bool' : 'string', value: v })) : undefined })
const prop = (name, value) => ({ name, type: typeof value === 'boolean' ? 'bool' : 'string', value })
const boden = (c) => g[c] * T

point('start', 'spawn', 48, 240)
// Zone B: Platte hält das Tor, Hebel öffnet es dauerhaft
rect('b_tor', 'tor', 86 * T, 192, 16, 48); rect('b_platte', 'platte', 80 * T, 236, 16, 4, { oeffnet: 'b_tor' }); rect('b_hebel', 'hebel', 93 * T, 224, 12, 16, { oeffnet: 'b_tor' })
// Zone C: Lavaröhre – Leonel kriecht durch, zieht den Hebel, das Tor daneben geht für Jonas auf
rect('c_tor', 'tor', 153 * T, 144, 16, 96); rect('c_hebel', 'hebel', 158 * T, 224, 12, 16, { oeffnet: 'c_tor' })
rect('c_ranke', 'ranke', 161 * T - 4, 64, 8, 160)
point('blatt', 'blatt', 165 * T, 48); point('blatt', 'blatt', 168 * T, 48)
// Waldherz
point('waldherz', 'waldherz', 235.5 * T, 176)

// ---------- Luftwurzeln zum Schwingen: über breite Lücken zwischen Plattformen ----------
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
// Lorbeertauben sitzen auf Plattformen (werfen Beeren), Grajas hocken in der Luft
// (stürzen herab), Eidechsen und Ziegen laufen unten
plats.filter((p, i) => i % 3 === 0 && p.row < 11).forEach((p) => point('taube', 'enemy', ((p.x0 + p.x1) / 2 + 0.5) * T, p.row * T))
let nr = 0
for (let c = 22; c < 225; c += between(18, 26)) {
  if (isFlat(c) && c > 12) continue
  point(['eidechse', 'ziege', 'eidechse'][nr++ % 3], 'enemy', c * T, boden(c))
}
for (const c of [40, 118, 186, 214]) if (!isFlat(c)) point('graja', 'enemy', c * T, (Math.min(...g.slice(c - 4, c + 5)) - 6) * T)

// ---------- Kulissen von der Insel ----------
const kulisse = (name, x, tiefe, spiegeln = false) => point(name, 'kulisse', x, 240, [prop('tiefe', String(tiefe)), prop('spiegeln', spiegeln)])
kulisse('vulkan', 900, 0.12)
kulisse('lostilos', 1900, 0.4)
kulisse('drachenbaum', 2500, 0.55)
kulisse('haus', 3300, 0.5)
kulisse('drachenbaum', 3900, 0.45, true)

// ---------- Speicherpunkte ----------
for (const [i, c] of [[2, 60], [3, 112], [4, 178]]) point('speicher' + i, 'checkpoint', c * T, boden(c))

// ---------- Deko und Tiere ----------
const busy = (px, ty) => objs.some((o) => ['tor', 'platte', 'hebel', 'waldherz', 'checkpoint', 'spawn', 'schwinge'].includes(o.type) && Math.abs((o.x + (o.width || 0) / 2) - px) < 36 && Math.abs((o.y + (o.height || 0)) - ty) < 24)
const runs = []
for (let r = 0; r < H; r++) { let c = 0; while (c < W) { if (!(solid(c, r) && !solid(c, r - 1))) { c++; continue } const c0 = c; while (c < W && solid(c, r) && !solid(c, r - 1)) c++; runs.push({ x0: c0 * T, x1: c * T, top: r * T, ground: r >= 11 && solid(c0, r + 1) }) } }
// Drachenbäume: groß, hinten, auf breiten Bodenstücken – das Wahrzeichen des Levels
const breit = runs.filter((r) => r.ground && r.x1 - r.x0 >= 96)
for (let i = 0; i < 7; i++) { const r = breit[Math.floor(i * breit.length / 7)]; if (!r) continue; const tx = r.x0 + 40 + rnd() * (r.x1 - r.x0 - 80); if (!busy(tx, r.top)) point('drachenbaum', 'deko', Math.round(tx), r.top, [prop('vorne', false), prop('spiegeln', rnd() < 0.5)]) }
for (const run of runs) {
  let px = run.x0 + 10 + rnd() * 24
  while (px < run.x1 - 8) {
    if (!busy(px, run.top) && rnd() < 0.85) {
      const name = pick(run.x1 - run.x0 > 40
        ? ['farn', 'farn', 'lorbeerbusch', 'lorbeerbusch', 'glockenblume', 'lavafels', 'tajinaste', 'kiefer', 'gras', 'pilze', 'wurzeln', 'laub', 'holz', 'blumen']
        : ['farn', 'glockenblume', 'gras', 'lavafels', 'lorbeerbusch'])
      point(name, 'deko', Math.round(px), run.top, [prop('vorne', rnd() < 0.3), prop('spiegeln', rnd() < 0.5)])
    }
    px += 32 + rnd() * 46
  }
  if (!run.ground) { for (let hx = run.x0 + 12; hx < run.x1 - 8; hx += 26 + rnd() * 28) if (rnd() < 0.6) point(rnd() < 0.5 ? 'moos' : 'flechte', 'deko', Math.round(hx), run.top + 16, [prop('vorne', rnd() < 0.4)]) }
}
// Ostern! Ein paar Ostereier liegen versteckt im Gras – auch oben auf Plattformen
for (let i = 0; i < 6; i++) { const r = pick(runs); const tx = r.x0 + 10 + rnd() * Math.max(8, r.x1 - r.x0 - 20); if (!busy(tx, r.top)) point('osterei', 'deko', Math.round(tx), r.top, [prop('vorne', false), prop('spiegeln', false)]) }
const wide = runs.filter((r) => r.x1 - r.x0 >= 64)
for (let i = 0; i < 8; i++) { const r = pick(wide); const tx = r.x0 + 20 + rnd() * (r.x1 - r.x0 - 40); if (!busy(tx, r.top)) point(i % 2 ? 'eidechse' : 'graja', 'tier', Math.round(tx), r.top) }

const map = {
  compressionlevel: -1, height: H, width: W, infinite: false, orientation: 'orthogonal', renderorder: 'right-down',
  tiledversion: '1.11.0', version: '1.10', type: 'map', tilewidth: T, tileheight: T, nextlayerid: 3, nextobjectid: objs.length + 1,
  tilesets: [
    { firstgid: 1, name: 'tiles', image: '../../public/assets/tiles/la_palma.png', imagewidth: 64, imageheight: 64, tilewidth: 16, tileheight: 16, tilecount: 16, columns: 4, margin: 0, spacing: 0 },
    { firstgid: BASALT, name: 'stein', image: '../../public/assets/tiles/la_palma_stein.png', imagewidth: 64, imageheight: 64, tilewidth: 16, tileheight: 16, tilecount: 16, columns: 4, margin: 0, spacing: 0 },
  ],
  layers: [
    { id: 1, name: 'Boden', type: 'tilelayer', width: W, height: H, x: 0, y: 0, visible: true, opacity: 1, data },
    { id: 2, name: 'Objekte', type: 'objectgroup', visible: true, opacity: 1, x: 0, y: 0, draworder: 'topdown', objects: objs.map((o, i) => ({ ...o, id: i + 1 })) },
  ],
}
fs.writeFileSync('src/levels/la_palma.json', JSON.stringify(map, null, 1))
const zaehl = (t) => objs.filter((o) => o.type === t).length
console.log(`la_palma.json: ${plats.length} Plattformen, ${zaehl('enemy')} Gegner, ${schwingen} Luftwurzeln, ${zaehl('deko')} Deko, ${zaehl('tier')} Tiere, ${zaehl('kulisse')} Kulissen`)
