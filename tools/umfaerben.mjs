// Färbt ein PNG um: Palettenfarbe → Palettenfarbe (nur die genannten, alles andere bleibt).
//   node tools/umfaerben.mjs <ein.png> <aus.png> alt=neu[,alt=neu…]     (Farbnamen aus src/palette.js)
// Beispiel: node tools/umfaerben.mjs a.png b.png rindeBraun=erdeDunkel,wiesenGruen=blattGruen
import fs from 'fs'
import { PNG } from 'pngjs'
import { P } from '../src/palette.js'

const [,, inp, out, regeln = ''] = process.argv
const rgb = (c) => [(c >> 16) & 255, (c >> 8) & 255, c & 255]
const map = new Map()
for (const r of regeln.split(',').filter(Boolean)) {
  const [alt, neu] = r.split('=')
  if (!(alt in P) || !(neu in P)) { console.error('Unbekannte Farbe:', r); process.exit(1) }
  map.set(rgb(P[alt]).join(','), rgb(P[neu]))
}
const png = PNG.sync.read(fs.readFileSync(inp))
let n = 0
for (let i = 0; i < png.data.length; i += 4) {
  if (png.data[i + 3] === 0) continue
  const neu = map.get(`${png.data[i]},${png.data[i + 1]},${png.data[i + 2]}`)
  if (neu) { [png.data[i], png.data[i + 1], png.data[i + 2]] = neu; n++ }
}
fs.writeFileSync(out, PNG.sync.write(png))
console.log(`${out}: ${n} Pixel umgefärbt`)
