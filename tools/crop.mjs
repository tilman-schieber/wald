// Schneidet den durchsichtigen Rand eines PNG weg (auf den Inhalt zuschneiden).
//   node tools/crop.mjs <eingabe.png> <ausgabe.png>
import fs from 'fs'
import { PNG } from 'pngjs'
const [,, inp, out] = process.argv
const p = PNG.sync.read(fs.readFileSync(inp))
let x0 = p.width, y0 = p.height, x1 = -1, y1 = -1
for (let y = 0; y < p.height; y++) for (let x = 0; x < p.width; x++) if (p.data[(y * p.width + x) * 4 + 3] > 0) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y) }
const o = new PNG({ width: x1 - x0 + 1, height: y1 - y0 + 1 })
PNG.bitblt(p, o, x0, y0, o.width, o.height, 0, 0)
fs.writeFileSync(out, PNG.sync.write(o))
console.log(`${out}: ${o.width}x${o.height}`)
