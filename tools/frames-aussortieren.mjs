// Sortiert aus einem Spritesheet die Bilder aus, die zu stark vom Rest abweichen.
// KI-Animationen malen jedes Bild neu – manchmal wird das Tier dabei dicker,
// kleiner oder verrutscht. Solche Ausreißer lassen die Bewegung "flackern".
//   node tools/frames-aussortieren.mjs <sheet.png> <anzahlBilder> <ausgabe.png> [maxAbweichung=0.22]
import fs from 'fs'
import { PNG } from 'pngjs'
const [,, inp, nStr, out, tolStr] = process.argv
const n = Number(nStr), tol = Number(tolStr ?? 0.22)
const sheet = PNG.sync.read(fs.readFileSync(inp))
const fw = sheet.width / n, fh = sheet.height

// jedes Bild als Silhouette (welche Pixel sind da?) einlesen
const bilder = []
for (let i = 0; i < n; i++) {
  const m = new Uint8Array(fw * fh)
  let x0 = fw, x1 = -1, y0 = fh, y1 = -1, anzahl = 0
  for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) {
    const a = sheet.data[((y * sheet.width) + i * fw + x) * 4 + 3]
    if (a > 0) { m[y * fw + x] = 1; anzahl++; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y) }
  }
  bilder.push({ i, m, anzahl, w: x1 - x0 + 1, h: y1 - y0 + 1 })
}

// Wie ähnlich sind sich zwei Silhouetten? (0 = gleich, 1 = völlig verschieden)
const abstand = (a, b) => {
  let anders = 0
  for (let k = 0; k < a.m.length; k++) if (a.m[k] !== b.m[k]) anders++
  return anders / Math.max(1, (a.anzahl + b.anzahl) / 2)
}
// Das "typischste" Bild ist das mit dem kleinsten mittleren Abstand zu allen anderen
const mittel = bilder.map((b) => bilder.reduce((s, o) => s + abstand(b, o), 0) / bilder.length)
const referenz = bilder[mittel.indexOf(Math.min(...mittel))]
const behalten = bilder.filter((b) => abstand(b, referenz) <= tol)
const raus = bilder.filter((b) => !behalten.includes(b)).map((b) => b.i + 1)

const ziel = behalten.length >= 2 ? behalten : bilder
const o = new PNG({ width: fw * ziel.length, height: fh })
ziel.forEach((b, k) => PNG.bitblt(sheet, o, b.i * fw, 0, fw, fh, k * fw, 0))
fs.writeFileSync(out, PNG.sync.write(o))
console.log(`${out}: ${ziel.length} von ${n} Bildern behalten${raus.length ? ' (aussortiert: ' + raus.join(', ') + ')' : ''}`)
