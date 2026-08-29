// ============================================================
//  DIE PALETTE — alle 32 Farben des Spiels
// ============================================================
//  Regel: Im ganzen Spiel dürfen NUR diese Farben vorkommen.
//  So sieht alles aus einem Guss aus, egal wer es gemalt hat.
//
//  Grundlage ist die bekannte "Endesga 32"-Palette, die für
//  Pixel-Art-Spiele sehr beliebt ist. Wir haben den Farben
//  deutsche Namen gegeben, damit man sie sich merken kann.
//
//  Benutzen:   import { P } from '../palette.js'
//              graphics.fillStyle(P.moosGruen)
// ============================================================

export const P = {
  // --- Erde, Holz, Rinde ---
  rostRot:      0xbe4a2f,
  lehmOrange:   0xd77643,
  sandHell:     0xead4aa,
  hautHell:     0xe4a672,
  holzBraun:    0xb86f50,
  rindeBraun:   0x733e39,
  erdeDunkel:   0x3e2731,

  // --- Warme Farben (Feuer, Beeren, Herbst) ---
  beerenRot:    0xa22633,
  feuerRot:     0xe43b44,
  fuchsOrange:  0xf77622,
  sonnenGelb:   0xfeae34,
  hellGelb:     0xfee761,

  // --- Grün (der Wald!) ---
  wiesenGruen:  0x63c74d,
  blattGruen:   0x3e8948,
  moosGruen:    0x265c42,
  tannenDunkel: 0x193c3e,

  // --- Blau (Himmel, Wasser) ---
  tiefBlau:     0x124e89,
  himmelBlau:   0x0099db,
  eisBlau:      0x2ce8f5,

  // --- Grau (Stein, Nebel, Nacht) ---
  weiss:        0xffffff,
  nebelHell:    0xc0cbdc,
  steinGrau:    0x8b9bb4,
  schieferGrau: 0x5a6988,
  daemmerBlau:  0x3a4466,
  nachtBlau:    0x262b44,
  schwarz:      0x181425,

  // --- Besondere Farben (Magie, Waldgeister, Blüten) ---
  magiePink:    0xff0044,
  pflaumeLila:  0x68386c,
  bluetenLila:  0xb55088,
  rosaHell:     0xf6757a,
  pfirsich:     0xe8b796,
  kupfer:       0xc28569,
}

// Manchmal braucht Phaser die Farbe als Text ("#181425") statt als Zahl.
export function hex(color) {
  return '#' + color.toString(16).padStart(6, '0')
}

// Alle Farben als Liste — praktisch, um sie z.B. PixelLab mitzugeben.
export const PALETTE_LIST = Object.values(P).map(hex)
