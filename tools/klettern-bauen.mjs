// Baut aus EINEM Bild (Figur von hinten) eine Kletter-Animation:
// abwechselnd gespiegelt und um einen Pixel versetzt – das sieht aus,
// als würde sich die Figur Hand über Hand hochziehen. Vorteil gegenüber
// KI-Bildern: die Figur bleibt garantiert immer gleich.
//   node tools/klettern-bauen.mjs <ruecken.png> <ausgabe.png>
import fs from 'fs'
import { PNG } from 'pngjs'
const [,, inp, out] = process.argv
const src = PNG.sync.read(fs.readFileSync(inp))
const W = src.width, H = src.height
const sheet = new PNG({ width: W * 4, height: H })
const posen = [{ flip: false, dy: 0 }, { flip: true, dy: -1 }, { flip: false, dy: -1 }, { flip: true, dy: 0 }]
posen.forEach((p, i) => {
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const sx = p.flip ? W - 1 - x : x
    const sy = y - p.dy
    if (sy < 0 || sy >= H) continue
    const s = ((sy * W) + sx) * 4
    if (src.data[s + 3] === 0) continue
    const d = ((y * sheet.width) + i * W + x) * 4
    sheet.data[d] = src.data[s]; sheet.data[d + 1] = src.data[s + 1]; sheet.data[d + 2] = src.data[s + 2]; sheet.data[d + 3] = 255
  }
})
fs.writeFileSync(out, PNG.sync.write(sheet))
console.log(`${out}: 4 Kletterbilder à ${W}x${H}`)
