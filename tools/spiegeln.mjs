// Spiegelt ein Bild (oder jedes Einzelbild eines Spritesheets) waagerecht.
// Alle Gegner müssen in dieselbe Richtung schauen (bei uns: nach LINKS),
// sonst laufen sie im Spiel rückwärts.
//   node tools/spiegeln.mjs <eingabe.png> <ausgabe.png> [anzahlBilder=1]
import fs from 'fs'
import { PNG } from 'pngjs'
const [,, inp, out, nStr] = process.argv
const n = Number(nStr ?? 1)
const src = PNG.sync.read(fs.readFileSync(inp))
const fw = src.width / n
const dst = new PNG({ width: src.width, height: src.height })
for (let i = 0; i < n; i++) {
  for (let y = 0; y < src.height; y++) for (let x = 0; x < fw; x++) {
    const s = ((y * src.width) + i * fw + (fw - 1 - x)) * 4
    const d = ((y * src.width) + i * fw + x) * 4
    dst.data[d] = src.data[s]; dst.data[d + 1] = src.data[s + 1]; dst.data[d + 2] = src.data[s + 2]; dst.data[d + 3] = src.data[s + 3]
  }
}
fs.writeFileSync(out, PNG.sync.write(dst))
console.log(`${out}: ${n} Bild(er) gespiegelt`)
