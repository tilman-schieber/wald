// Kopiert nur einen weich auslaufenden Ellipsen-Ausschnitt (Jonas' Gesicht)
// aus dem bearbeiteten Bild in das schoene Originalbild.
import fs from 'fs'
import { PNG } from 'pngjs'
const [alt, neu, ziel, cx, cy, rx, ry, feder] = process.argv.slice(2)
const A = PNG.sync.read(fs.readFileSync(alt))
const B = PNG.sync.read(fs.readFileSync(neu))
const [CX, CY, RX, RY, F] = [cx, cy, rx, ry, feder].map(Number)
for (let y = 0; y < A.height; y++) for (let x = 0; x < A.width; x++) {
  const d = Math.hypot((x - CX) / RX, (y - CY) / RY)
  let m = d <= 1 ? 1 : d >= 1 + F ? 0 : 1 - (d - 1) / F   // 1 = neu, 0 = alt
  if (m <= 0) continue
  const i = (y * A.width + x) * 4
  for (let c = 0; c < 3; c++) A.data[i + c] = Math.round(A.data[i + c] * (1 - m) + B.data[i + c] * m)
}
fs.writeFileSync(ziel, PNG.sync.write(A))
console.log('geschrieben:', ziel)
