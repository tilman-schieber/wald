// Färbt ein PNG so um, dass nur noch Farben aus src/palette.js vorkommen.
//   node tools/palettize.mjs <eingabe.png> <ausgabe.png> [ohneFarbe1,ohneFarbe2]
// Jedes Pixel bekommt die "ähnlichste" Palettenfarbe. Ähnlichkeit messen wir
// nicht nur mit Rot/Grün/Blau, sondern gewichtet, wie das Auge es sieht
// (Grün zählt mehr als Blau).
import fs from 'fs'
import { PNG } from 'pngjs'
import { P } from '../src/palette.js'

const [,, inp, out, ohne = ""] = process.argv   // 3. Argument: Farbnamen, die NICHT benutzt werden sollen
const verboten = new Set(ohne.split(",").filter(Boolean))
const pal = Object.entries(P).filter(([name]) => !verboten.has(name)).map(([, c]) => c).map((c) => [(c >> 16) & 255, (c >> 8) & 255, c & 255])

function nearest(r, g, b) {
  let best = 0, bestD = Infinity
  for (let i = 0; i < pal.length; i++) {
    const [pr, pg, pb] = pal[i]
    const d = 0.3 * (r - pr) ** 2 + 0.59 * (g - pg) ** 2 + 0.11 * (b - pb) ** 2
    if (d < bestD) { bestD = d; best = i }
  }
  return pal[best]
}

const png = PNG.sync.read(fs.readFileSync(inp))
const used = new Set()
for (let i = 0; i < png.data.length; i += 4) {
  if (png.data[i + 3] === 0) continue
  const [r, g, b] = nearest(png.data[i], png.data[i + 1], png.data[i + 2])
  png.data[i] = r; png.data[i + 1] = g; png.data[i + 2] = b; png.data[i + 3] = 255
  used.add(`${r},${g},${b}`)
}
fs.writeFileSync(out, PNG.sync.write(png))
console.log(`${out}: ${used.size} Palettenfarben benutzt`)
