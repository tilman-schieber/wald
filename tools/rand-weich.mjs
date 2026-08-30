// Macht die Ränder eines Bildes weich (durchsichtig), damit ein rechteckiges
// Hintergrundbild nicht wie ein aufgeklebtes Rechteck im Wald hängt.
//   node tools/rand-weich.mjs <ein.png> <aus.png> [links rechts oben unten]
import fs from 'fs'
import { PNG } from 'pngjs'
const [,, inp, out, ...r] = process.argv
const [L, R, O, U] = (r.length === 4 ? r : [24, 24, 18, 12]).map(Number)
const p = PNG.sync.read(fs.readFileSync(inp))
const weich = (d, w) => (w <= 0 ? 1 : Math.min(1, d / w))
for (let y = 0; y < p.height; y++) for (let x = 0; x < p.width; x++) {
  const f = Math.min(weich(x, L), weich(p.width - 1 - x, R), weich(y, O), weich(p.height - 1 - y, U))
  if (f >= 1) continue
  const i = (y * p.width + x) * 4
  // sanft ausblenden (quadratisch, damit die Mitte lange voll bleibt)
  p.data[i + 3] = Math.round(p.data[i + 3] * f * f)
}
fs.writeFileSync(out, PNG.sync.write(p))
console.log(`${out}: ${p.width}x${p.height}, Ränder weich (${L}/${R}/${O}/${U})`)
