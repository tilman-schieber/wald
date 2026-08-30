// Hängt mehrere Tiled-Räume nebeneinander zu EINEM langen Level.
//   node tools/merge-levels.mjs <ausgabe.json> <raum1.json> <raum2.json> …
// - Ausgänge (type "ausgang") fallen weg, Eingänge (spawn) außer "start" auch
// - Tore/Platten/Hebel bekommen den Raum als Vorsilbe, damit Namen eindeutig bleiben
// - Am Anfang jedes weiteren Raums steht ein Speicherpunkt (type "checkpoint")
import fs from 'fs'
const [,, out, ...files] = process.argv
const maps = files.map((f) => JSON.parse(fs.readFileSync(f)))
const H = maps[0].height, W = maps.reduce((a, m) => a + m.width, 0)
const data = new Array(W * H).fill(0)
const objects = []
let xOff = 0, id = 1
maps.forEach((m, i) => {
  const L = m.layers[0]
  for (let y = 0; y < H; y++) for (let x = 0; x < m.width; x++) data[y * W + xOff + x] = L.data[y * m.width + x]
  const px = xOff * m.tilewidth
  for (const o of m.layers[1].objects) {
    if (o.type === 'ausgang') continue
    if (o.type === 'spawn' && !(i === 0 && o.name === 'start')) continue
    const n = { ...o, id: id++, x: o.x + px }
    if (['tor', 'platte', 'hebel'].includes(o.type)) {
      n.name = `r${i + 1}_${o.name}`
      if (n.properties) n.properties = n.properties.map((p) => p.name === 'oeffnet' ? { ...p, value: `r${i + 1}_${p.value}` } : p)
    }
    objects.push(n)
  }
  if (i > 0) objects.push({ id: id++, name: `speicher${i + 1}`, type: 'checkpoint', point: true, x: px + 48, y: 240, width: 0, height: 0, rotation: 0, visible: true })
  xOff += m.width
})
const merged = { ...maps[0], width: W, nextobjectid: id, layers: [
  { ...maps[0].layers[0], width: W, data },
  { ...maps[0].layers[1], objects },
] }
fs.writeFileSync(out, JSON.stringify(merged, null, 1))
console.log(`${out}: ${W}x${H} Kacheln, ${objects.length} Objekte, ${objects.filter((o) => o.type === 'checkpoint').length} Speicherpunkte`)
