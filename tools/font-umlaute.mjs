// Ergänzt in einer Pixel-TTF die Umlaute ä ö ü Ä Ö Ü (Buchstabe + zwei Punkte) und ß (aus B).
//   node tools/font-umlaute.mjs <eingabe.ttf> <ausgabe.ttf> [pixelEinheiten=64]
import fs from 'fs'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const opentype = require('/private/tmp/claude-502/-Users-tilman-schieber-fhnw-ch-src-wald/55406b8b-42d2-48fa-a73d-2a1ceeb24fb3/scratchpad/node_modules/opentype.js')

const [,, inp, out, pxArg] = process.argv
const px = Number(pxArg ?? 64)          // so viele Font-Einheiten ist ein Pixel
const font = opentype.loadSync(inp)

function withDots(baseChar, code, name) {
  const base = font.charToGlyph(baseChar)
  const bb = base.getBoundingBox()
  const path = new opentype.Path()
  path.commands = base.path.commands.map((c) => ({ ...c }))   // Kopie der Buchstabenform
  // zwei 2×2-Pixel-Punkte, einen Pixel über dem Buchstaben, links und rechts der Mitte
  const top = bb.y2 + px, size = 2 * px
  const cx = (bb.x1 + bb.x2) / 2
  for (const x0 of [cx - 3 * px, cx + px]) {
    path.moveTo(x0, top); path.lineTo(x0 + size, top); path.lineTo(x0 + size, top + size); path.lineTo(x0, top + size); path.close()
  }
  return new opentype.Glyph({ name, unicode: code, advanceWidth: base.advanceWidth, path })
}

const glyphs = font.glyphs
const list = []
for (let i = 0; i < glyphs.length; i++) list.push(glyphs.get(i))
list.push(withDots('a', 0xE4, 'adieresis'), withDots('o', 0xF6, 'odieresis'), withDots('u', 0xFC, 'udieresis'))
list.push(withDots('A', 0xC4, 'Adieresis'), withDots('O', 0xD6, 'Odieresis'), withDots('U', 0xDC, 'Udieresis'))
// ß: der Einfachheit halber die Form von B (sieht in Pixelschrift akzeptabel aus)
const B = font.charToGlyph('B')
const sz = new opentype.Path(); sz.commands = B.path.commands.map((c) => ({ ...c }))
list.push(new opentype.Glyph({ name: 'germandbls', unicode: 0xDF, advanceWidth: B.advanceWidth, path: sz }))

const neu = new opentype.Font({
  familyName: font.names.fontFamily?.en ?? 'Waldschrift', styleName: font.names.fontSubfamily?.en ?? 'Bold',
  unitsPerEm: font.unitsPerEm, ascender: font.ascender, descender: font.descender, glyphs: list,
})
fs.writeFileSync(out, Buffer.from(neu.toArrayBuffer()))
console.log(`${out}: ${list.length} Glyphen (Umlaute + ß ergänzt)`)
