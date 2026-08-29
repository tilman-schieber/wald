// Baut aus Einzelbildern ein Spritesheet. Alle Bilder werden auf den gemeinsamen
// Inhalts-Rahmen zugeschnitten, damit nichts wackelt.
//   node tools/frames-to-sheet.mjs <ausgabe.png> <bild1.png> <bild2.png> …
import fs from 'fs'
import { PNG } from 'pngjs'
const [,, out, ...files] = process.argv
const frames = files.map((f) => PNG.sync.read(fs.readFileSync(f)))
let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1
for (const p of frames) for (let y = 0; y < p.height; y++) for (let x = 0; x < p.width; x++) if (p.data[(y * p.width + x) * 4 + 3] > 0) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y) }
const w = x1 - x0 + 1, h = y1 - y0 + 1
const sheet = new PNG({ width: w * frames.length, height: h })
frames.forEach((p, i) => PNG.bitblt(p, sheet, x0, y0, w, h, i * w, 0))
fs.writeFileSync(out, PNG.sync.write(sheet))
console.log(`${out}: ${frames.length} Bilder à ${w}x${h}`)
