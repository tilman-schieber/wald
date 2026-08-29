// Macht EINE Farbe in einem PNG durchsichtig ("Farbschlüssel", wie Greenscreen).
//   node tools/colorkey.mjs <eingabe.png> <ausgabe.png> <r,g,b>
import fs from 'fs'
import { PNG } from 'pngjs'
const [,, inp, out, rgb] = process.argv
const [r, g, b] = rgb.split(',').map(Number)
const p = PNG.sync.read(fs.readFileSync(inp))
let n = 0
for (let i = 0; i < p.data.length; i += 4) if (p.data[i] === r && p.data[i + 1] === g && p.data[i + 2] === b) { p.data[i + 3] = 0; n++ }
fs.writeFileSync(out, PNG.sync.write(p))
console.log(`${out}: ${n} Pixel durchsichtig gemacht`)
