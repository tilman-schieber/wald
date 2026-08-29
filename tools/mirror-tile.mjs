// Hängt ein Bild gespiegelt neben sich selbst → lässt sich nahtlos wiederholen.
//   node tools/mirror-tile.mjs <eingabe.png> <ausgabe.png>
import fs from 'fs'
import { PNG } from 'pngjs'
const [,, inp, out] = process.argv
const src = PNG.sync.read(fs.readFileSync(inp))
const dst = new PNG({ width: src.width * 2, height: src.height })
PNG.bitblt(src, dst, 0, 0, src.width, src.height, 0, 0)
for (let y = 0; y < src.height; y++) for (let x = 0; x < src.width; x++) {
  const si = (y * src.width + x) * 4, di = (y * dst.width + (dst.width - 1 - x)) * 4
  dst.data[di] = src.data[si]; dst.data[di + 1] = src.data[si + 1]; dst.data[di + 2] = src.data[si + 2]; dst.data[di + 3] = src.data[si + 3]
}
fs.writeFileSync(out, PNG.sync.write(dst))
console.log(`${out}: ${dst.width}x${dst.height}`)
