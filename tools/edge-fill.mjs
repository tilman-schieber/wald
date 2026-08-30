// Entfernt einen hellen Rand (z.B. vom Pro-Modell) und füllt ihn, indem die
// Bildränder nach außen fortgesetzt werden – ZEILENWEISE und SPALTENWEISE,
// weil der Rand nicht überall gleich breit ist. Die Bildgröße bleibt gleich.
//   node tools/edge-fill.mjs <eingabe.png> <ausgabe.png>
import fs from 'fs'
import { PNG } from 'pngjs'
const [,, inp, out] = process.argv
const p = PNG.sync.read(fs.readFileSync(inp)), W = p.width, H = p.height
const MAX = 40
const isLight = (d, i) => d[i] > 150 && d[i + 1] > 150 && d[i + 2] > 150 && Math.abs(d[i] - d[i + 1]) < 30 && Math.abs(d[i + 1] - d[i + 2]) < 30   // hell UND grau/weiß (nicht bunt)
const copy = (d, from, to) => { d[to] = d[from]; d[to + 1] = d[from + 1]; d[to + 2] = d[from + 2]; d[to + 3] = 255 }
let maxL = 0, maxR = 0, maxT = 0, maxB = 0
// Zeilen: von links und rechts
for (let y = 0; y < H; y++) {
  let l = 0; while (l < MAX && isLight(p.data, (y * W + l) * 4)) l++
  let r = 0; while (r < MAX && isLight(p.data, (y * W + (W - 1 - r)) * 4)) r++
  maxL = Math.max(maxL, l); maxR = Math.max(maxR, r)
  for (let x = 0; x < l; x++) copy(p.data, (y * W + l) * 4, (y * W + x) * 4)
  for (let x = 0; x < r; x++) copy(p.data, (y * W + (W - 1 - r)) * 4, (y * W + (W - 1 - x)) * 4)
}
// Spalten: von oben und unten
for (let x = 0; x < W; x++) {
  let t = 0; while (t < MAX && isLight(p.data, (t * W + x) * 4)) t++
  let b = 0; while (b < MAX && isLight(p.data, ((H - 1 - b) * W + x) * 4)) b++
  maxT = Math.max(maxT, t); maxB = Math.max(maxB, b)
  for (let y = 0; y < t; y++) copy(p.data, (t * W + x) * 4, (y * W + x) * 4)
  for (let y = 0; y < b; y++) copy(p.data, ((H - 1 - b) * W + x) * 4, ((H - 1 - y) * W + x) * 4)
}
fs.writeFileSync(out, PNG.sync.write(p))
console.log(`${out}: Rand max. links ${maxL} rechts ${maxR} oben ${maxT} unten ${maxB} px fortgesetzt`)
