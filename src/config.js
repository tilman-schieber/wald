// ============================================================
//  CONFIG — alle wichtigen Zahlen an einem Ort
// ============================================================
//  Wenn sich etwas "falsch anfühlt" (zu langsam, springt zu
//  hoch...), ändert man es HIER und nirgendwo sonst.
// ============================================================
import { P } from './palette.js'

export const GAME = {
  width: 480,    // interne Auflösung (16:9). Full-HD ist genau 4x so groß.
  height: 270,
  tile: 16,      // ein Tile ist 16x16 Pixel
}

export const PHYSICS = {
  gravity: 1000,   // wie stark alles nach unten gezogen wird
}

// ------------------------------------------------------------
//  Die beiden Helden
// ------------------------------------------------------------
//  frame:  Größe EINES Bildes im Spritesheet (das Bild darf größer
//          sein als die Figur, z.B. wegen Armen oder dem Kletterhaken)
//  body:   die "Trefferbox" – der Teil, der wirklich mit Boden und
//          Wänden zusammenstößt. Immer unten in der Mitte des Bildes.
//  file:   null = Platzhalter-Rechteck. Später kommt hier der Pfad
//          zum echten Spritesheet von PixelLab hin, z.B.
//          'assets/sprites/jonas.png'. Sonst ändert sich nichts!
//  anims:  welche Bilder (Frame-Nummern) zu welcher Animation gehören.
//          Beim Platzhalter gibt es nur Bild 0.
// ------------------------------------------------------------
export const HEROES = {
  jonas: {
    key: 'jonas',
    name: 'Jonas',
    speed: 110,          // Pixel pro Sekunde
    jump: 380,           // Absprung-Geschwindigkeit → ca. 4,5 Tiles hoch
    frame: { w: 32, h: 32 },
    body: { w: 12, h: 30 },
    color: P.tiefBlau,         // Platzhalter-Farbe
    accent: P.himmelBlau,
    file: null,
    anims: {
      idle: { frames: [0], rate: 6, repeat: -1 },
      run:  { frames: [0], rate: 10, repeat: -1 },
      jump: { frames: [0], rate: 1, repeat: 0 },
    },
  },
  leonel: {
    key: 'leonel',
    name: 'Leonel',
    speed: 140,          // schneller als Jonas...
    jump: 360,           // ...springt aber ein bisschen weniger hoch
    frame: { w: 32, h: 32 },
    body: { w: 10, h: 26 },   // kleiner → passt später durch enge Spalten
    color: P.fuchsOrange,
    accent: P.hellGelb,
    file: null,
    anims: {
      idle: { frames: [0], rate: 6, repeat: -1 },
      run:  { frames: [0], rate: 12, repeat: -1 },
      jump: { frames: [0], rate: 1, repeat: 0 },
    },
  },
}

// ------------------------------------------------------------
//  Sprung-Gefühl
// ------------------------------------------------------------
export const JUMP = {
  coyoteMs: 90,       // so lange darf man noch springen, nachdem man
                      // über eine Kante gelaufen ist ("Coyote-Zeit")
  bufferMs: 100,      // drückt man kurz VOR der Landung, springt man
                      // trotzdem direkt beim Aufkommen
  cutFactor: 0.45,    // lässt man die Taste früh los → kürzerer Sprung
}

// ------------------------------------------------------------
//  Begleiter-KI
// ------------------------------------------------------------
export const COMPANION = {
  followDistance: 40,  // erst ab so viel Abstand läuft der Begleiter los
  stopDistance: 24,    // so nah bleibt er dann stehen
  jumpCooldownMs: 500, // nicht dauernd hüpfen
}

// ------------------------------------------------------------
//  Tileset
// ------------------------------------------------------------
//  file: null = Platzhalter-Kacheln. Später Pfad zum PixelLab-Tileset.
//  Die Kachel-Nummern (0 = Erde, 1 = Gras, 2 = Plattform) müssen dann
//  im Tiled-Level stimmen — oder wir passen die Map an.
export const TILESET = {
  key: 'tiles',
  file: null,
  columns: 3,
}
