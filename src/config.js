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
//          Wänden zusammenstößt. Waagerecht in der Bildmitte, unten an
//          der Fußlinie.
//  feet:   Fußlinie = wie viele Pixel von oben der Boden im Bild ist.
//          (null = ganz unten). Steht in der Ausgabe von tools/import-character.mjs.
//  file:   null = Platzhalter-Rechteck. Später kommt hier der Pfad
//          zum echten Spritesheet von PixelLab hin, z.B.
//          'assets/sprites/jonas.png'. Sonst ändert sich nichts!
//  anims:  welche Bilder (Frame-Nummern) zu welcher Animation gehören.
//          Beim Platzhalter (file: null) wird immer nur Bild 0 benutzt.
//          "fall" ist optional: Bild fürs Runterfallen nach dem Sprung.
// ------------------------------------------------------------
export const HEROES = {
  jonas: {
    key: 'jonas',
    name: 'Jonas',
    speed: 110,          // Pixel pro Sekunde
    jump: 380,           // Absprung-Geschwindigkeit → ca. 4,5 Tiles hoch
    damage: 2,           // Jonas haut fester …
    attackCooldownMs: 450, // … aber nicht so schnell hintereinander
    frame: { w: 48, h: 48 },
    body: { w: 12, h: 30 },
    feet: 42,
    color: P.tiefBlau,         // Platzhalter-Farbe
    accent: P.himmelBlau,
    file: 'assets/sprites/jonas.png',   // PixelLab-Charakter 46e662b7…
    anims: {
      idle: { frames: [0, 1, 2, 3], rate: 5, repeat: -1 },
      run:  { frames: [4, 5, 6, 7, 8, 9], rate: 10, repeat: -1 },
      jump: { frames: [13, 14, 15], rate: 10, repeat: 0 },
      fall: { frames: [16], rate: 1, repeat: 0 },
    },
  },
  leonel: {
    key: 'leonel',
    name: 'Leonel',
    speed: 140,          // schneller als Jonas...
    jump: 370,           // ...springt aber ein bisschen weniger hoch
    damage: 1,           // Leonel haut weniger fest …
    attackCooldownMs: 300, // … dafür schneller
    frame: { w: 40, h: 40 },
    body: { w: 10, h: 26 },   // kleiner → passt später durch enge Spalten
    feet: 35,
    color: P.fuchsOrange,
    accent: P.hellGelb,
    file: 'assets/sprites/leonel.png',  // PixelLab-Charakter 9c5a608a…
    anims: {
      idle: { frames: [0, 1, 2, 3], rate: 5, repeat: -1 },
      run:  { frames: [4, 5, 6, 7, 8, 9], rate: 12, repeat: -1 },
      jump: { frames: [13, 14, 15], rate: 10, repeat: 0 },
      fall: { frames: [16], rate: 1, repeat: 0 },
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
//  Kampf
// ------------------------------------------------------------
export const COMBAT = {
  heroHp: 3,            // Herzen pro Held
  invulnMs: 1000,       // nach einem Treffer so lange unverwundbar (blinkt)
  knockback: 150,       // Rückstoß nach einem Treffer
  dazedMs: 3000,        // Begleiter sitzt so lange benommen, dann volle Herzen
  attackMs: 120,        // so lange "wirkt" ein Schlag
  attackBox: { w: 20, h: 22 },   // Trefferbereich vor der Figur
  companionDamageFactor: 0.5,    // Begleiter macht halben Schaden (mindestens 1)
}

// ------------------------------------------------------------
//  Gegner  (werden nie besiegt, sondern GEHEILT)
// ------------------------------------------------------------
export const ENEMIES = {
  igel: {
    key: 'igel',
    name: 'Verwirrter Igel',
    hp: 4,
    speed: 30,
    damage: 1,
    frame: { w: 20, h: 14 },
    body: { w: 18, h: 12 },
    color: P.rindeBraun,
    accent: P.sandHell,
    file: null,
  },
}

// ------------------------------------------------------------
//  Begleiter-KI
// ------------------------------------------------------------
export const COMPANION = {
  followDistance: 40,  // erst ab so viel Abstand läuft der Begleiter los
  stopDistance: 24,    // so nah bleibt er dann stehen
  jumpCooldownMs: 500, // nicht dauernd hüpfen
  stuckMs: 2500,       // so lange darf er es allein versuchen, während der
                       // Spieler steht und wartet – dann "ploppt" er herbei
  nearX: 48,           // "bei dir" heißt: höchstens so weit weg …
  nearY: 20,           // … und ungefähr auf gleicher Höhe
  // Wegsuche: von welcher Fläche kommt man auf welche?
  maxJumpUpTiles: 4,   // so viele Kacheln hoch schafft ein Sprung
  maxGapUpTiles: 4,    // so breit darf die Lücke sein, wenn es hoch geht
  maxGapDownTiles: 6,  // … und wenn es runter geht (man fällt weiter)
  reach: { x: 26, y: 24 }, // so nah muss ein Gegner sein, damit der Begleiter zuschlägt
}

// ------------------------------------------------------------
//  Tileset
// ------------------------------------------------------------
//  file: null = Platzhalter-Kacheln (0 = Erde, 1 = Gras, 2 = Plattform).
//
//  Mit echtem Tileset (PixelLab "Wang-Set", 16 Kacheln in 4×4):
//  Jede Kachel beschreibt eine ECKE zwischen vier Feldern – die Gras-
//  kante läuft durch die Kachelmitte. Darum zeichnet GameScene eine
//  Grafik-Ebene, die um eine halbe Kachel (8 px) verschoben ist.
//  Welche der 16 Kacheln passt, sagt der "Wang-Index" (Summe):
//     +1 wenn unten-rechts fest, +2 unten-links, +4 oben-rechts, +8 oben-links
//  wangFrames[index] = Bildnummer im Tileset (Zeile für Zeile gezählt).
export const TILESET = {
  key: 'tiles',
  file: 'assets/tiles/schwarzwald.png',   // PixelLab-Tileset f346a925…
  columns: 4,
  wangFrames: [12, 13, 0, 3, 8, 1, 14, 5, 15, 4, 11, 2, 9, 10, 7, 6],
}
