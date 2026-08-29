// Holt die Animationsbilder eines PixelLab-Charakters und baut EIN Spritesheet.
//   node tools/import-character.mjs <name> <characterId> '<animationen-json>' <ausgabe.png>
//   animationen-json: {"idle":{"id":"<animId>","n":4},"run":{...},"jump":{...}}
//   (animId und Bildanzahl stehen in get_character unter "animations")
// Trick: Manche Sprungbilder sind im Bild nach oben gerückt. Wir schieben jedes
// Bild so, dass die Füße immer auf derselben Zeile stehen – die Höhe im Spiel
// macht dann allein die Physik.
import fs from 'fs'
import { PNG } from 'pngjs'

const [,, name, charId, animSpec, out] = process.argv
const spec = JSON.parse(animSpec)
const base = `https://backblaze.pixellab.ai/file/pixellab-characters/62e70f4a-aef2-4b60-8f04-e58e599bb27c/${charId}/animations`

const frames = [], index = {}
for (const [anim, { id, n }] of Object.entries(spec)) {
  index[anim] = []
  for (let i = 0; i < n; i++) {
    const res = await fetch(`${base}/${id}/east/${i}.png`)
    if (!res.ok) throw new Error(`${anim} ${i}: HTTP ${res.status}`)
    index[anim].push(frames.length)
    frames.push(PNG.sync.read(Buffer.from(await res.arrayBuffer())))
  }
}
const fw = frames[0].width, fh = frames[0].height
if (frames.some((f) => f.width !== fw || f.height !== fh)) throw new Error('Bilder unterschiedlich groß!')

// Fußzeile = unterste sichtbare Zeile. Ziel = häufigste Fußzeile aller Bilder.
const feet = frames.map((f) => { let m = 0; for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) if (f.data[(y * fw + x) * 4 + 3] > 0) m = Math.max(m, y); return m })
const target = [...feet].sort((a, b) => feet.filter((v) => v === b).length - feet.filter((v) => v === a).length)[0]

const sheet = new PNG({ width: fw * frames.length, height: fh })
frames.forEach((f, i) => {
  const shift = target - feet[i]                        // >0 → nach unten schieben
  PNG.bitblt(f, sheet, 0, 0, fw, fh - Math.max(shift, 0), i * fw, Math.max(shift, 0))
})
fs.writeFileSync(out, PNG.sync.write(sheet))
console.log(`${name}: ${frames.length} Bilder à ${fw}x${fh} → ${out}`)
console.log(`frames: ${JSON.stringify(index)}`)
console.log(`Füße auf Zeile ${target} → in config.js: frame {w:${fw}, h:${fh}}, feet: ${target + 1}`)
