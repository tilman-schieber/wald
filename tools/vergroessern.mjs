// Vergrößert ein Pixelbild ohne Weichzeichnen (nur zum Anschauen/Prüfen).
//   node tools/vergroessern.mjs <eingabe.png> <ausgabe.png> [faktor=4]
import fs from 'fs'
import { PNG } from 'pngjs'
const [,, inp, out, f = '4'] = process.argv
const k = Number(f)
const p = PNG.sync.read(fs.readFileSync(inp))
const o = new PNG({ width: p.width * k, height: p.height * k })
for (let y = 0; y < o.height; y++) for (let x = 0; x < o.width; x++) { const si = ((y / k | 0) * p.width + (x / k | 0)) * 4, di = (y * o.width + x) * 4; o.data[di] = p.data[si]; o.data[di + 1] = p.data[si + 1]; o.data[di + 2] = p.data[si + 2]; o.data[di + 3] = p.data[si + 3] }
fs.writeFileSync(out, PNG.sync.write(o))
