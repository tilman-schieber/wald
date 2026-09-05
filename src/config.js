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
    crouchHeight: 22,    // geduckt so hoch → passt NICHT durch 16-px-Spalten
    frame: { w: 48, h: 48 },
    body: { w: 12, h: 30 },
    feet: 41,
    color: P.tiefBlau,         // Platzhalter-Farbe
    accent: P.himmelBlau,
    file: 'assets/sprites/jonas.png',   // PixelLab-Charakter 8e5fc3e2… ("Jonas Locken")
    anims: {
      idle: { frames: [0, 1, 2, 3], rate: 5, repeat: -1 },
      run:  { frames: [4, 5, 6, 7, 8, 9], rate: 10, repeat: -1 },
      jump: { frames: [13, 14, 15], rate: 10, repeat: 0 },
      fall: { frames: [16], rate: 1, repeat: 0 },
      crouch: { frames: [19], rate: 1, repeat: 0 },
      crouchWalk: { frames: [19, 20, 21, 22, 23, 24], rate: 10, repeat: -1 },
      climb: { frames: [25, 26, 27, 28], rate: 6, repeat: -1 },
      attack: { frames: [29, 30, 31, 32, 33, 34], rate: 20, repeat: 0 },
      hurt: { frames: [35, 36, 37], rate: 10, repeat: 0 },
    },
  },
  leonel: {
    key: 'leonel',
    name: 'Leonel',
    speed: 140,          // schneller als Jonas...
    jump: 370,           // ...springt aber ein bisschen weniger hoch
    damage: 1,           // Leonel haut weniger fest …
    attackCooldownMs: 300, // … dafür schneller
    crouchHeight: 12,    // geduckt so klein → kriecht durch 16-px-Spalten
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
      crouch: { frames: [19], rate: 1, repeat: 0 },
      crouchWalk: { frames: [19, 20, 21, 22, 23, 24], rate: 10, repeat: -1 },
      attack: { frames: [25, 26, 27, 28, 29, 30], rate: 22, repeat: 0 },
      hurt: { frames: [31, 32, 33], rate: 10, repeat: 0 },
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
//  Ducken / Kriechen (Pfeil runter)
// ------------------------------------------------------------
export const CROUCH = {
  speedFactor: 0.5,     // geduckt ist man halb so schnell
}

// ------------------------------------------------------------
//  Spezialfähigkeiten (Taste E) – nur der AKTIVE Held, nie der Begleiter
// ------------------------------------------------------------
export const CLIMB = {         // Jonas: klettert an Ranken (Pfeil hoch/runter an einer Ranke)
  reach: 10,                   // so nah (waagerecht) muss die Ranke sein
  speed: 70,                   // Klettergeschwindigkeit
  hop: { x: 90, y: 230 },      // Satz auf die Kante, wenn man oben ankommt
}
export const SWING = {        // Jonas: an Lianen schwingen (Floresta da Tijuca)
  pump: 2.2,                  // wie stark Links/Rechts das Schwingen verstärkt
  daempfung: 0.995,           // ganz leichte Bremse, sonst schwingt es ewig
  absprungBonus: 120,         // zusätzlicher Schwung nach oben beim Loslassen
  greifPause: 350,            // so lange kann man nach dem Loslassen nicht neu greifen
}

export const SLAM = {          // Jonas: Stampfer (E) – springt hoch und knallt auf den Boden
  jump: 260,                   // Absprung nach oben
  fall: 520,                   // dann mit Wucht nach unten
  radius: 72,                  // Gegner in dieser Nähe (waagerecht) werden benommen
  dizzyMs: 1800,               // … so lange
  cooldownMs: 1400,
}
export const SPIRIT = {        // Leonel: Waldgeist rufen
  durationMs: 5000,            // so lange bleibt der Geist
  cooldownMs: 8000,            // Pause bis zum nächsten Ruf
  speed: 110,
  range: 180,                  // Gegner in dieser Nähe werden beruhigt
  calmMs: 4000,                // so lange bleibt ein beruhigter Gegner friedlich
  damage: 1,
  file: 'assets/sprites/geist.png',   // PixelLab 03264b0c… (16×22); null = Platzhalter
  sheet: { file: 'assets/sprites/geist_anim.png', w: 16, h: 20, n: 4, rate: 5 },   // animate_image dc123201…
}

// ------------------------------------------------------------
//  Kampf
// ------------------------------------------------------------
export const COMBAT = {
  heroHp: 3,            // Herzen pro Held
  pitDamage: 1,         // in einen Abgrund gefallen: so viele Herzen, dann zurück auf sicheren Boden
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
    frame: { w: 23, h: 19 },          // Bildgröße von public/assets/sprites/igel.png
    body: { w: 18, h: 12 },
    color: P.rindeBraun,
    accent: P.sandHell,
    file: 'assets/sprites/igel.png',            // PixelLab ccbfcad3… (schaut nach links)
    healedFile: 'assets/sprites/igel_heil.png', // PixelLab 180538dc… (28×26, sitzt zufrieden)
    ballFile: 'assets/sprites/igel_kugel.png',  // PixelLab 40694bf9… (eingerollt)
    walkSheet: { file: 'assets/sprites/igel_lauf.png', w: 24, h: 20, n: 6, rate: 8 },   // animate_image dd740dac…
    alertSheet: { file: 'assets/sprites/igel_einrollen.png', w: 24, h: 20, n: 6, rate: 12 }, // animate_image 513fffff… (rollt sich ein; letztes Bild = Kugel)
    ai: {
      kind: 'roller',       // rollt sich ein und rollt geradeaus los
      spiky: true,          // nur verwundbar, wenn benommen (oder vom Geist beruhigt)
      wanderSpeed: 25,      // beim Stromern
      sight: { x: 150, y: 40 },  // so weit sieht er Helden (waagerecht / Höhenunterschied)
      alertMs: 450,         // "!" – kurzes Erstarren, damit man reagieren kann
      rollSpeed: 140,       // Rollgeschwindigkeit (Helden: 110 / 140) → drüberhüpfen!
      rollMaxMs: 2200,      // spätestens dann hört er auf zu rollen
      dizzyMs: 1600,        // so lange benommen = Zeitfenster zum Zuschlagen
      cooldownMs: 1200,     // danach so lange nicht wieder angreifen
      healedWanderSpeed: 10, // geheilt: schnüffelt gemütlich herum
    },
  },
  eule: {
    key: 'eule',
    name: 'Verwirrte Eule',
    kind: 'flyer',            // eigene Klasse Owl.js
    hp: 3,
    damage: 1,
    frame: { w: 28, h: 29 },          // eule.png (sitzend); eule_flug.png ist 28×16
    body: { w: 22, h: 25 },
    color: P.holzBraun,
    accent: P.sonnenGelb,
    file: 'assets/sprites/eule.png',         // PixelLab 4f54d615… (sitzend, mit Ast – nur auf ihrem Platz)
    groundFile: 'assets/sprites/eule_boden.png', // dieselbe Eule ohne Ast (am Boden / benommen)
    healedFile: 'assets/sprites/eule_heil.png',  // schlafend (animate_image 32eea9ef… aus dem Sitzbild, Ast weg)
    flyFile: 'assets/sprites/eule_flug.png', // erstes Bild der Flug-Animation (aus dem Sitzbild erzeugt)
    flySheet: { file: 'assets/sprites/eule_flug_anim.png', w: 29, h: 25, n: 6, rate: 10 },  // animate_image 0a8c99eb… (aus dem Sitzbild 4f54d615…)
    ai: {
      spiky: true,            // nur verwundbar, wenn sie nach dem Sturzflug am Boden sitzt
      sight: { x: 170, y: 160 },
      alertMs: 500,
      swoopSpeed: 170,        // Sturzflug
      restMs: 1500,           // sitzt nach dem Sturzflug kurz am Boden (benommen)
      returnSpeed: 90,        // fliegt zurück auf ihren Ast
      cooldownMs: 1500,
    },
  },
}

//  Wildschwein: stürmt geradeaus wie der Igel rollt – aber ohne Stacheln:
//  man kann es jederzeit treffen, nur beim Sturm nicht im Weg stehen!
ENEMIES.wildschwein = {
  key: 'wildschwein',
  name: 'Verwirrtes Wildschwein',
  hp: 5,
  speed: 30,
  damage: 1,
  frame: { w: 30, h: 25 },          // wildschwein.png zugeschnitten
  body: { w: 26, h: 18 },
  color: P.rindeBraun,
  accent: P.erdeDunkel,
  file: 'assets/sprites/wildschwein.png',          // PixelLab 0adf7ee7…
  healedFile: 'assets/sprites/wildschwein_heil.png', // PixelLab b844a0c9… (schläft)
  ballFile: 'assets/sprites/wildschwein_sturm.png',  // PixelLab 42c3513f… (Sturm-Pose; "Kugel"-Slot)
  walkSheet: { file: 'assets/sprites/wildschwein_lauf.png', w: 30, h: 25, n: 6, rate: 8 },   // animate_image c5eb7d6e…
  tiredSheet: { file: 'assets/sprites/wildschwein_mued.png', w: 30, h: 25, n: 4, rate: 5 },  // animate_image a2a6b7c7… (schnauft)
  alertSheet: { file: 'assets/sprites/wildschwein_sturm_anim.png', w: 30, h: 25, n: 6, rate: 10 }, // animate_image 2f593a4e… (schnaubt, senkt den Kopf; letztes Bild = Sturm)
  ai: {
    kind: 'charger',        // stürmt MEHRMALS hin und her, statt einmal zu rollen
    spiky: false,           // immer verwundbar – aber schwer zu erwischen, solange es rennt
    rotate: false,          // beim Stürmen nicht drehen (ist ja keine Kugel)
    wanderSpeed: 30,
    sight: { x: 190, y: 40 },
    alertMs: 700,           // schnaubt und scharrt – Zeit zum Ausweichen
    rollSpeed: 200,         // schneller als beide Helden → drüberhüpfen oder ausweichen
    rollMaxMs: 1300,        // so lange dauert EIN Sturmlauf
    charges: 1,             // danach dreht es um und stürmt noch einmal (also 2 Läufe)
    turnMs: 450,            // Pause beim Umdrehen (kurz verwundbar und ungefährlich)
    dizzyMs: 2200,          // danach völlig außer Puste (Animation wildschwein_mued)
    cooldownMs: 1800,
    healedWanderSpeed: 0,   // geheilt schläft es
  },
}

//  Verwirrter Hase: hüpft in Sätzen auf einen zu. Zwischen den Sprüngen ist er
//  kurz am Boden – da trifft man ihn. Er ist nicht stachelig, aber flink.
ENEMIES.hase = {
  key: 'hase',
  name: 'Verwirrter Hase',
  hp: 3,
  speed: 40,
  damage: 1,
  frame: { w: 24, h: 30 },
  body: { w: 18, h: 22 },
  color: P.hautHell,
  accent: P.sandHell,
  file: 'assets/sprites/hase_wirr.png',        // PixelLab 8865748f… (aus dem Tier-Hasen abgeleitet)
  ballFile: 'assets/sprites/hase_sprung.png',  // Sprung-Pose (Bild 4 der Hüpf-Animation)
  walkSheet: { file: 'assets/sprites/hase_hop.png', w: 26, h: 32, n: 6, rate: 9 },   // animate_image a90366a3…
  healedFile: 'assets/sprites/tier_hase.png',  // geheilt = wieder der friedliche Hase
  ai: {
    kind: 'hopper',
    spiky: false,
    wanderSpeed: 30,
    wanderHopMs: 900,       // beim Stromern alle ~0,9 s ein kleiner Hopser
    sight: { x: 140, y: 60 },
    alertMs: 400,           // duckt sich kurz zusammen
    hops: 3,                // so viele große Sätze
    hopPower: 300,          // Absprungkraft nach oben
    hopSpeed: 120,          // Tempo nach vorn
    dizzyMs: 1200,          // danach sitzt er benommen da
    cooldownMs: 1200,
    healedWanderSpeed: 14,
  },
}

// ------------------------------------------------------------
//  Die Gegner der Floresta da Tijuca
// ------------------------------------------------------------
//  Verwirrter Kapuzineraffe: sitzt oben und wirft Jackfrüchte im Bogen.
//  Nach zwei Würfen schaut er sich eine Weile nur um (nicht benommen – er ist
//  ja nicht müde): das ist die Zeit, zu ihm hinaufzuklettern.
ENEMIES.affe = {
  key: 'affe', name: 'Verwirrter Kapuzineraffe', hp: 3, speed: 0, damage: 1,
  frame: { w: 21, h: 30 }, body: { w: 13, h: 24 },
  color: P.rindeBraun, accent: P.sandHell,
  file: 'assets/sprites/affe.png',            // PixelLab 722b9a21…
  healedFile: 'assets/sprites/affe_heil.png',
  alertSheet: { file: 'assets/sprites/affe_wurf.png', w: 24, h: 30, n: 6, rate: 10 },   // animate_image ab097341… (holt aus und wirft)
  ai: {
    kind: 'thrower', spiky: false,
    wanderSpeed: 0,                 // er sitzt und schaut sich nur um
    sight: { x: 210, y: 140 },
    alertMs: 500,
    throws: 2, throwEveryMs: 1300,  // zwei Würfe mit Pause (fair auch für kleine Spieler)
    wurf: { x: 130, y: -190 },      // Anfangsgeschwindigkeit der Frucht
    cooldownMs: 1600,               // so lange schaut er sich nach einer Salve nur um
    healedWanderSpeed: 0,
  },
}

//  Verwirrter Nasenbär: gibt nie auf. Läuft hinterher und springt sogar
//  auf Plattformen (Weg über den PlatformGraph, wie der Begleiter).
//  Dafür ist er langsam und immer verwundbar.
ENEMIES.nasenbaer = {
  key: 'nasenbaer', name: 'Verwirrter Nasenbär', hp: 4, speed: 35, damage: 1,
  frame: { w: 40, h: 36 }, body: { w: 26, h: 22 },
  color: P.rostRot, accent: P.erdeDunkel,
  file: 'assets/sprites/nasenbaer.png',       // PixelLab 8d2502b2…
  healedFile: 'assets/sprites/nasenbaer.png',
  walkSheet: { file: 'assets/sprites/nasenbaer_lauf.png', w: 40, h: 36, n: 4, rate: 8 },   // animate_image f7b71e9e…
  ai: {
    kind: 'climber', spiky: false,
    wanderSpeed: 35,
    sight: { x: 200, y: 150 },
    alertMs: 350,
    rollSpeed: 75,                  // Verfolgungstempo (langsamer als die Helden)
    jump: 380,                      // Absprungkraft – wie Jonas, sonst käme er auf keine Plattform
    jumpEveryMs: 600,               // nicht dauernd hüpfen
    rollMaxMs: 7000,                // so lange bleibt er dran
    dizzyMs: 1500, cooldownMs: 1200, healedWanderSpeed: 12,
  },
}

//  Verwirrtes Faultier: hängt am Ast. Läuft jemand darunter durch,
//  lässt es sich fallen. Am Boden braucht es ewig – da heilt man es.
ENEMIES.faultier = {
  key: 'faultier', name: 'Verwirrtes Faultier', hp: 3, speed: 0, damage: 1,
  frame: { w: 30, h: 23 }, body: { w: 22, h: 18 },
  color: P.steinGrau, accent: P.sandHell,
  file: 'assets/sprites/faultier.png',        // PixelLab cf441662…
  healedFile: 'assets/sprites/faultier_heil.png',
  ai: {
    kind: 'dropper', spiky: false,
    dropWidth: 24,                  // so nah muss man darunter sein
    alertMs: 600,                   // es merkt es erst … langsam
    dizzyMs: 3200,                  // liegt lange am Boden
    climbSpeed: 22,                 // und klettert im Schneckentempo zurück
    cooldownMs: 2000, wanderSpeed: 0, sight: { x: 0, y: 0 }, healedWanderSpeed: 0,
  },
}

//  Verwirrte Blattschneiderameisen: marschieren im Gänsemarsch und haben
//  ihre Blätter verloren. Sie greifen nie an, aber anrempeln tut weh –
//  darum tragen sie beim Marschieren das rote "!" (ihr Marsch IST der Angriff).
//  Ein einziger Schlag auf IRGENDEINE Ameise heilt die ganze Reihe:
//  alle drehen sich um, tragen wieder ein Blatt und marschieren heim.
ENEMIES.ameise = {
  key: 'ameise', name: 'Verwirrte Blattschneiderameise', hp: 1, speed: 22, damage: 1,
  frame: { w: 26, h: 23 }, body: { w: 18, h: 14 },
  color: P.rostRot, accent: P.wiesenGruen,
  file: 'assets/sprites/ameise.png',          // PixelLab 12dcce15…
  healedFile: 'assets/sprites/ameise.png',
  walkSheet: { file: 'assets/sprites/ameise_lauf.png', w: 27, h: 26, n: 5, rate: 9 },   // animate_image 5e30cb70…
  gruppe: 5,                                  // fünf Ameisen aus einem Tiled-Punkt
  gruppeAbstand: 20,
  ai: { kind: 'marcher', spiky: false, wanderSpeed: 22, sight: { x: 0, y: 0 }, alertMs: 0, dizzyMs: 0, cooldownMs: 0, healedWanderSpeed: 18 },
}

// ------------------------------------------------------------
//  Die Gegner des Lorbeerwalds auf La Palma
// ------------------------------------------------------------
//  Verwirrte Graja (Alpenkrähe): schwarzer Vogel mit rotem Schnabel, das Wahrzeichen
//  der Insel. Hockt in der Luft und stürzt herab wie die Eule (Owl.js).
ENEMIES.graja = {
  key: 'graja', name: 'Verwirrte Graja', kind: 'flyer', hp: 3, damage: 1,
  frame: { w: 32, h: 32 }, body: { w: 22, h: 22 },
  color: P.schwarz, accent: P.feuerRot,
  file: 'assets/sprites/graja.png',                 // pixen 6c55e90e…
  healedFile: 'assets/sprites/graja_heil.png',      // schläft (animate_image 018a296c…, letztes Bild)
  flyFile: 'assets/sprites/graja_flug.png',
  flySheet: { file: 'assets/sprites/graja_flug_anim.png', w: 32, h: 32, n: 6, rate: 10 },   // animate_image 8a999bc4…
  ai: { spiky: true, sight: { x: 170, y: 160 }, alertMs: 500, swoopSpeed: 180, restMs: 1500, returnSpeed: 100, cooldownMs: 1500 },
}

//  Verwirrte Kanaren-Eidechse: klein, flach, blitzschnell. Flitzt wie das Wildschwein
//  hin und her – aber sie läuft dabei richtig (Lauf-Animation) statt zu "rollen".
ENEMIES.eidechse = {
  key: 'eidechse', name: 'Verwirrte Eidechse', hp: 3, speed: 40, damage: 1,
  frame: { w: 40, h: 19 }, body: { w: 30, h: 12 },
  color: P.steinGrau, accent: P.eisBlau,
  file: 'assets/sprites/eidechse.png',               // pixflux 53cbdecc…
  healedFile: 'assets/sprites/eidechse_heil.png',    // sonnt sich (animate_image 90cde710…, letztes Bild)
  walkSheet: { file: 'assets/sprites/eidechse_lauf.png', w: 41, h: 20, n: 4, rate: 12 },   // animate_image b94fa6c5…
  ai: {
    kind: 'charger', spiky: false, rotate: false, laufAnim: true,
    wanderSpeed: 35, sight: { x: 160, y: 40 }, alertMs: 500,
    rollSpeed: 190, rollMaxMs: 900, charges: 2, turnMs: 350,   // drei kurze Sprints, dazwischen kurz verwundbar
    dizzyMs: 1800, cooldownMs: 1500, healedWanderSpeed: 12,
  },
}

//  Verwirrte Ziege: auf La Palma laufen überall Ziegen herum. Sie springt in
//  großen Sätzen heran wie der Hase – nur schwerer.
ENEMIES.ziege = {
  key: 'ziege', name: 'Verwirrte Ziege', hp: 4, speed: 35, damage: 1,
  frame: { w: 26, h: 30 }, body: { w: 20, h: 24 },
  color: P.holzBraun, accent: P.sandHell,
  file: 'assets/sprites/ziege.png',                  // pixen 319586f5…
  ballFile: 'assets/sprites/ziege_sprung.png',       // Sprung-Pose (Bild 4 der Hüpf-Animation)
  walkSheet: { file: 'assets/sprites/ziege_hop.png', w: 26, h: 30, n: 6, rate: 9 },    // animate_image b951e3e1…
  healedFile: 'assets/sprites/ziege_heil.png',       // liegt und döst (animate_image cb57782e…, letztes Bild)
  ai: {
    kind: 'hopper', spiky: false, wanderSpeed: 28, wanderHopMs: 1100,
    sight: { x: 150, y: 60 }, alertMs: 450, hops: 3, hopPower: 320, hopSpeed: 110,
    dizzyMs: 1300, cooldownMs: 1300, healedWanderSpeed: 0,
  },
}

//  Verwirrte Lorbeertaube: gibt es nur auf den Kanaren. Sitzt oben im Lorbeer
//  und lässt Lorbeeren fallen – wie der Affe, nur mit kürzerem Wurf.
ENEMIES.taube = {
  key: 'taube', name: 'Verwirrte Lorbeertaube', hp: 3, speed: 0, damage: 1,
  frame: { w: 30, h: 31 }, body: { w: 18, h: 24 },
  color: P.schieferGrau, accent: P.rosaHell,
  file: 'assets/sprites/taube.png',                  // pixen 5503605b…
  healedFile: 'assets/sprites/taube_heil.png',       // döst (animate_image 745d3174…, letztes Bild)
  alertSheet: { file: 'assets/sprites/taube_wurf.png', w: 30, h: 31, n: 7, rate: 10 },   // animate_image 0bdf7bc9…
  wurfFile: 'assets/sprites/lorbeere.png',           // ihr Geschoss: eine Lorbeere (pixen fc490212…)
  ai: {
    kind: 'thrower', spiky: false, wanderSpeed: 0,
    sight: { x: 180, y: 140 }, alertMs: 600,
    throws: 2, throwEveryMs: 1200, wurf: { x: 90, y: -140 },
    cooldownMs: 1800, healedWanderSpeed: 0,
  },
}

//  Tore (Rätsel): der Torflügel selbst wird gemalt (siehe BootScene),
//  der Steinbalken darüber macht aus der Mauer einen richtigen Durchgang.
// ------------------------------------------------------------
//  WÄCHTER – der Endgegner jedes Waldes (Klasse Boss.js, erkannt an `boss: true`)
//  Ein großes, besonders verwirrtes Tier bewacht das Farn. Es erscheint erst, wenn
//  ALLE Blätter des Waldes gesammelt sind, und erst nach seiner Heilung leuchtet das Farn.
//   ai.schild            so viele Schutzstücke (Geweih, Steinschuppen) – solange eins dran
//                        ist, prallt jeder Schlag ab; Jonas' Stampfer bricht pro Landung eins ab
//   varianten.s1/.s0     Bild (+ Lauf-Animation) mit 1 / 0 Schutzstücken → Texturen '<key>-s1', '<key>-s0'
//   ai.schildNurBeruhigt der Stampfer wirkt nur, solange Leonels Waldgeist das Tier beruhigt
//   ai.nurBeruhigt       überhaupt nur verwundbar, solange es beruhigt ist
//   ai.ruf               Röhren: warnMs gelb warnen, dann dauerMs Schallringe – näher als radius = ein Herz weg
//   stueckFile           das Bruchstück, das beim Stampfer davonfliegt ('<key>-stueck')
// ------------------------------------------------------------
//  Schwarzwald: der verwirrte Hirsch mit dem riesigen Geweih. Solange er das Geweih hat, ist er
//  unverwundbar. Jonas' Stampfer bricht ein Stück ab, der zweite das zweite – dann kann man ihn
//  treffen. Ab und zu röhrt er: wer dann zu nah steht, verliert ein Herz (erst gelb warnen!).
//  (Hirsche werfen ihr Geweih jedes Jahr ab – es wächst wieder. Ihm fehlt also nichts.)
ENEMIES.hirsch = {
  key: 'hirsch',
  name: 'Der verwirrte Hirsch',
  boss: true,
  hp: 6,
  damage: 1,
  frame: { w: 58, h: 68 }, body: { w: 40, h: 38 },
  color: P.rindeBraun, accent: P.sandHell,
  file: 'assets/sprites/hirsch.png',                    // pixen 87a94653…
  healedFile: 'assets/sprites/hirsch_heil.png',         // animate_image 6db471d8… (letztes Bild: döst ohne Geweih)
  walkSheet: { file: 'assets/sprites/hirsch_lauf.png', w: 59, h: 68, n: 6, rate: 8 },   // animate_image 642a93c5…
  rufSheet: { file: 'assets/sprites/hirsch_ruf.png', w: 59, h: 69, n: 6, rate: 8 },     // animate_image 936addbf… (Kopf hoch, Maul auf)
  stueckFile: 'assets/sprites/geweih_stueck.png',       // pixen 6facb661…
  varianten: {
    s1: { file: 'assets/sprites/hirsch_s1.png', walkSheet: { file: 'assets/sprites/hirsch_s1_lauf.png', w: 50, h: 68, n: 6, rate: 8 } },   // edit_image_pixen fe4795a3… / 3cac0fc8…
    s0: { file: 'assets/sprites/hirsch_s0.png', walkSheet: { file: 'assets/sprites/hirsch_s0_lauf.png', w: 51, h: 43, n: 6, rate: 8 } },   // edit_image_pixen dc435542… / 46252c9f…
  },
  ai: {
    kind: 'charger',        // stürmt hin und her wie das Wildschwein …
    spiky: false,           // … ohne Geweih jederzeit verwundbar
    rotate: false,
    laufAnim: true,         // beim Sturm laufen die Beine
    schild: 2,              // zwei Geweihstangen – je ein Stampfer
    abprallText: 'Das Geweih schützt ihn! Jonas: Stampfer (E)',
    bruchText: 'Krach! Ein Stück Geweih bricht ab!',
    freiText: 'Das Geweih ist ab – jetzt trefft ihn!',
    wanderSpeed: 35,
    sight: { x: 240, y: 60 },
    alertMs: 800,           // scharrt – Zeit zum Ausweichen
    rollSpeed: 170,         // Sturm: schneller als Jonas, langsamer als ein Hase springt
    rollMaxMs: 1500,
    charges: 1,             // stürmt zweimal
    turnMs: 500,
    dizzyMs: 2000,          // danach außer Puste – das Fenster für Stampfer und Schläge
    cooldownMs: 2500,
    ruf: { everyMs: 7000, warnMs: 1000, dauerMs: 700, radius: 96 },
    healedWanderSpeed: 0,   // geheilt döst er
  },
}
//  Floresta da Tijuca: die verwirrte Onça (Jaguar). Springt in riesigen Sätzen und ist viel zu wild,
//  um sie zu treffen – nur solange Leonels Waldgeist sie beruhigt, hält sie still und ist verwundbar.
ENEMIES.jaguar = {
  key: 'jaguar',
  name: 'Die verwirrte Onça',
  boss: true,
  hp: 6,
  damage: 1,
  frame: { w: 68, h: 37 }, body: { w: 50, h: 28 },
  color: P.fuchsOrange, accent: P.schwarz,
  file: 'assets/sprites/jaguar.png',                    // pixen 99ae9eb8…
  healedFile: 'assets/sprites/jaguar_heil.png',         // schläft (siehe QUELLEN.md)
  sprungFile: 'assets/sprites/jaguar_sprung.png',       // animate_image 894df6eb… Bild 3 (gestreckt in der Luft)
  walkSheet: { file: 'assets/sprites/jaguar_lauf.png', w: 69, h: 37, n: 6, rate: 8 },   // animate_image 8a0e9962… (schleicht)
  ai: {
    kind: 'hopper',
    spiky: true,
    nurBeruhigt: true,      // nur verwundbar, solange der Waldgeist wirkt
    sprungBild: true,       // in der Luft das Sprungbild
    abprallText: 'Zu wild! Leonel: Waldgeist (E)',
    wanderSpeed: 40,
    sight: { x: 240, y: 70 },
    alertMs: 700,           // duckt sich – gleich springt sie
    hops: 3,                // drei große Sätze
    hopPower: 330,
    hopSpeed: 170,
    rollMaxMs: 3200,
    dizzyMs: 1500,          // danach schnauft sie (aber: ✕ – erst beruhigen!)
    cooldownMs: 2000,
    healedWanderSpeed: 0,
  },
}
//  La Palma: die verwirrte Rieseneidechse (die Riesenechse von La Palma galt lange als ausgestorben!).
//  Ihr Rücken ist mit Steinschuppen gepanzert. Nur wenn Leonels Waldgeist sie beruhigt, hält sie
//  still genug, dass Jonas' Stampfer eine Schuppe absprengt – zwei Schuppen, dann ist sie verwundbar.
//  Beide Helden müssen zusammenarbeiten (Tab!).
ENEMIES.riesenechse = {
  key: 'riesenechse',
  name: 'Die verwirrte Rieseneidechse',
  boss: true,
  hp: 6,
  damage: 1,
  frame: { w: 78, h: 35 }, body: { w: 56, h: 26 },
  color: P.moosGruen, accent: P.schieferGrau,
  file: 'assets/sprites/riesenechse.png',               // pixen 79f962e5…
  healedFile: 'assets/sprites/riesenechse_heil.png',    // animate_image 872513b6… (letztes Bild: schläft, ohne Schuppen)
  stueckFile: 'assets/sprites/schuppe_stueck.png',      // pixen 07020b16…
  walkSheet: { file: 'assets/sprites/riesenechse_lauf.png', w: 78, h: 36, n: 6, rate: 8 },   // animate_image a14b3be2…
  alertSheet: { file: 'assets/sprites/riesenechse_zisch.png', w: 79, h: 36, n: 4, rate: 8 }, // animate_image 1ccc4385… (zischt, Maul auf)
  varianten: {
    s1: { file: 'assets/sprites/riesenechse_s1.png', walkSheet: { file: 'assets/sprites/riesenechse_s1_lauf.png', w: 78, h: 37, n: 6, rate: 8 } },   // Original+410aa8f3… zusammengesetzt / ba1c5751…
    s0: { file: 'assets/sprites/riesenechse_s0.png', walkSheet: { file: 'assets/sprites/riesenechse_s0_lauf.png', w: 81, h: 32, n: 6, rate: 8 } },   // edit_image_pixen 410aa8f3… / a09dd4e7…
  },
  ai: {
    kind: 'charger',
    spiky: false,
    rotate: false,
    laufAnim: true,
    schild: 2,
    schildNurBeruhigt: true,
    abprallText: 'Steinschuppen! Erst beruhigen, dann stampfen',
    zappelText: 'Sie zappelt zu sehr! Leonel: Waldgeist (E)',
    bruchText: 'Knack! Eine Steinschuppe springt ab!',
    freiText: 'Die Schuppen sind ab – jetzt trefft sie!',
    wanderSpeed: 30,
    sight: { x: 240, y: 60 },
    alertMs: 900,
    rollSpeed: 150,
    rollMaxMs: 1600,
    charges: 2,             // stürmt dreimal hin und her
    turnMs: 500,
    dizzyMs: 2000,
    cooldownMs: 2500,
    healedWanderSpeed: 0,
  },
}

export const TOR = { bogen: 'assets/sprites/torbogen.png' }   // PixelLab pixen 0975c40a…

//  Die Jackfrucht, die der Affe wirft
export const WURF = { key: 'frucht', file: 'assets/sprites/frucht.png', damage: 1 }

export const SLASH = { file: 'assets/sprites/schlag.png' }   // PixelLab d47f7c28… (null = gelber Halbmond)
export const HEARTS = { full: 'assets/sprites/herz.png', empty: 'assets/sprites/herz_leer.png' }   // pixen 3bb1d083… / 5914ab12…

// Geschichte vor jedem Wald: jede Folie = Bild + Sätze (jeder Satz ein Tastendruck)
export const INTROS = {
 schwarzwald: [
  { image: 'assets/bg/intro_freiburg.png', lines: ['Jonas und Leonel wohnen in Freiburg.', 'Eines Morgens fällt ihnen etwas auf:', 'Aus dem Schwarzwald kommt kein Vogelruf mehr.'] },
  { image: 'assets/bg/intro_titisee_bahn.png', lines: ['Mit der S1 fahren sie hinauf zum Titisee.', 'Am Bahnhof ist es seltsam ruhig.'] },
  { image: 'assets/bg/intro_titisee_wald.png', lines: ['Am See beginnt der Wald.', 'Die beiden nehmen ihren Mut zusammen und gehen hinein.'] },
  { image: 'assets/bg/schwarzwald_intro.png', lines: ['Im Schwarzwald ist es still geworden.', 'Die Tiere sind verwirrt.', 'Sie haben vergessen, wer sie sind.', 'Zwei Brüder können den Wald zurückbringen:', 'Jonas und Leonel – die Wächter Aller Lebenden Dinge!'] },
 ],
 tijuca: [
  { image: 'assets/bg/tijuca_intro_flug.png', lines: ['In den Sommerferien geht es weit weg:', 'Jonas und Leonel fliegen nach Rio de Janeiro.', 'Unten liegt das Meer – und mitten in der Stadt ein Wald.'] },
  { image: 'assets/bg/tijuca_intro_wald.png', lines: ['Die Floresta da Tijuca ist der größte Stadtwald der Welt.', 'Früher war hier alles abgeholzt.', 'Menschen haben sie Baum für Baum zurückgepflanzt.', 'Doch auch hier ruft jetzt kein Vogel mehr …'] },
 ],
 la_palma: [
  { image: 'assets/bg/la_palma_intro_flug.png', lines: ['Osterferien! Diesmal geht es weit hinaus in den Atlantik.', 'Unter dem Flugzeug taucht eine grüne Insel auf –', 'mit einem riesigen Krater in der Mitte: La Palma.'] },
  { image: 'assets/bg/la_palma_intro_stadt.png', lines: ['Alle nennen sie die Isla Bonita, die schöne Insel.', 'Im Norden wächst ein Wald wie vor Millionen Jahren:', 'der Lorbeerwald, voller Nebel, Farne und Drachenbäume.', 'Dort rufen die Grajas – schwarze Vögel mit roten Schnäbeln.'] },
  { image: 'assets/bg/la_palma_intro_wald.png', lines: ['Doch heute ruft keine Graja.', 'Zwischen den Drachenbäumen ist es still.', 'Jonas und Leonel wissen, was das heißt:', 'Der Wald braucht seine Wächter.'] },
 ],
}

// ------------------------------------------------------------
//  Kulissen: große Hintergrund-Bilder mit eigener Parallax-Tiefe.
//  In Tiled: type "kulisse", name = Schlüssel, Eigenschaft tiefe = 0.15 … 0.8
//  (0 = ganz weit weg, 1 = auf der Spielebene). Ankerpunkt unten-mittig.
// ------------------------------------------------------------
//  standY = auf welcher Höhe die Kulisse steht. Weit entferntes gehört an den
//  Horizont (kleinere Zahl), Nahes auf die Bodenlinie (240).
export const KULISSEN = {
  schwarzwaldhof: { file: 'assets/bg/kulisse_schwarzwaldhof.png', standY: 190 },
  schauinsland:   { file: 'assets/bg/kulisse_schauinsland.png', standY: 200 },
  titisee:        { file: 'assets/bg/kulisse_titisee.png', standY: 205 },
  muenster:       { file: 'assets/bg/kulisse_muenster.png', standY: 190 },
  hochsitz:       { file: 'assets/bg/kulisse_hochsitz.png', standY: 244 },
  cristo:         { file: 'assets/bg/kulisse_cristo.png', standY: 150 },        // Floresta da Tijuca
  cascatinha:     { file: 'assets/bg/kulisse_cascatinha.png', standY: 236 },
  pavillon:       { file: 'assets/bg/kulisse_pavillon.png', standY: 244 },
  vulkan:         { file: 'assets/bg/kulisse_vulkan.png', standY: 200 },        // La Palma: Cumbre Vieja (fern)
  lostilos:       { file: 'assets/bg/kulisse_lostilos.png', standY: 236 },      // Wasserfall in der Schlucht von Los Tilos
  haus:           { file: 'assets/bg/kulisse_haus.png', standY: 205 },          // Haus mit Holzbalkonen (Santa Cruz)
  drachenbaum:    { file: 'assets/sprites/deko_drachenbaum.png', standY: 236 }, // ein ferner Drachenbaum (dasselbe Bild wie die Deko)
}

//  Wie tief im Bild etwas liegt, hängt allein am Scroll-Tempo:
//  je langsamer es wandert, desto weiter hinten wird es gezeichnet.
export const tiefeZuDepth = (scroll) => -60 + scroll * 20

//  Musik je Wald (alle mit ~/crush.py --preset snes bearbeitet). Der Schlüssel ist der
//  Anfang des Raum-/Level-Namens ("schwarzwald", "tijuca", "la_palma", "plaenterwald").
export const MUSIC = {
  tracks: {
    schwarzwald: 'assets/music/frozen_sprite_loop.mp3',   // "Frozen Sprite Loop"
    tijuca:      'assets/music/tijuca.mp3',               // "Maple Mode"
    la_palma:    'assets/music/la_palma.mp3',             // "Moonlit Save Point"
  },
  titleTrack: 'schwarzwald',
  volume: 0.35,
}

// ------------------------------------------------------------
//  Deko – nur Bilder, keine Trefferbox. In Tiled: type "deko", name = Schlüssel,
//  Eigenschaft vorne = true → wird VOR den Figuren gezeichnet.
// ------------------------------------------------------------
//  Optionen je Deko: haengend = Ankerpunkt oben (hängt von einer Kante herab),
//  anim = { frames, rate } wenn das Bild ein Spritesheet ist (frame = Bildgröße),
//  glow = leuchtet leicht (pulsierende Helligkeit)
export const DEKO = {
  farn:     { file: 'assets/sprites/deko_farn.png' },       // PixelLab 633dedca…
  pilze:    { file: 'assets/sprites/deko_pilze.png' },      // PixelLab 120957ca…
  stein:    { file: 'assets/sprites/deko_stein.png' },      // PixelLab e979ad3d…
  stamm:    { file: 'assets/sprites/deko_stamm.png' },      // Baumstumpf
  holz:     { file: 'assets/sprites/deko_holz.png' },       // liegender Baumstamm
  schild:   { file: 'assets/sprites/deko_schild.png' },     // Wegweiser
  laterne:  { file: 'assets/sprites/deko_laterne.png', haengend: true, glow: true },
  gras:     { file: 'assets/sprites/deko_gras.png' },
  blumen:   { file: 'assets/sprites/deko_blumen.png' },
  fels:     { file: 'assets/sprites/deko_fels.png' },
  busch:    { file: 'assets/sprites/deko_busch.png' },
  leuchtpilze: { file: 'assets/sprites/deko_leuchtpilze.png', glow: true },
  wurzeln:  { file: 'assets/sprites/deko_wurzeln.png' },
  laub:     { file: 'assets/sprites/deko_laub.png' },
  moos:     { file: 'assets/sprites/deko_moos.png', haengend: true },
  bach:     { file: 'assets/sprites/deko_bach.png' },       // Bachlauf (liegt im Boden, vorne)
  baumhaus: { file: 'assets/sprites/deko_baumhaus.png' },   // Baumhaus (hinten, groß)
  hohlbaum: { file: 'assets/sprites/deko_hohlbaum.png' },   // hohler Baumstamm (hinten, groß)
  bromelie: { file: 'assets/sprites/deko_bromelie.png' },   // ab hier: Floresta da Tijuca
  bambus:   { file: 'assets/sprites/deko_bambus.png' },
  liane:    { file: 'assets/sprites/deko_liane.png', haengend: true },
  monstera: { file: 'assets/sprites/deko_monstera.png' },
  drachenbaum:  { file: 'assets/sprites/deko_drachenbaum.png' },   // ab hier: Lorbeerwald La Palma (pixen e8fee217…)
  lorbeerbusch: { file: 'assets/sprites/deko_lorbeerbusch.png' },  // pixen bac06cdb…
  glockenblume: { file: 'assets/sprites/deko_glockenblume.png' },  // Kanarische Glockenblume, pixen 1a077d65…
  lavafels:     { file: 'assets/sprites/deko_lavafels.png' },      // pixen 87f2d275…
  tajinaste:    { file: 'assets/sprites/deko_tajinaste.png' },     // pixen 9bac276a…
  kiefer:       { file: 'assets/sprites/deko_kiefer.png' },        // Kanarische Kiefer, pixen 4b9a4f4b…
  flechte:      { file: 'assets/sprites/deko_flechte.png', haengend: true },   // Bartflechte, pixen 3c811622…
}

// ------------------------------------------------------------
//  Tiere – friedliche Waldbewohner, nur Deko mit Leben: sitzen, gucken,
//  hüpfen manchmal ein Stück. In Tiled: type "tier", name = Schlüssel.
// ------------------------------------------------------------
export const TIERE = {
  eichhoernchen: { file: 'assets/sprites/tier_eichhoernchen_anim.png', anim: { w: 22, h: 24, n: 4, rate: 5 }, hop: true },   // animate_image 28597ae5…
  hase:          { file: 'assets/sprites/tier_hase_anim.png', anim: { w: 21, h: 29, n: 4, rate: 5 }, hop: true },            // animate_image d69dca68…
  schmetterling: { file: 'assets/sprites/tier_schmetterling_anim.png', anim: { w: 26, h: 19, n: 4, rate: 10 }, flatter: true }, // animate_image c15efac9…
}

// ------------------------------------------------------------
//  Gegenstände: Blatt (sammeln) und Waldherz (Ziel)
// ------------------------------------------------------------
export const ITEMS = {
  blatt:    { file: 'assets/sprites/blatt.png' },       // PixelLab 36b527a3…
  waldherz: { file: 'assets/sprites/waldherz_anim.png', anim: { w: 28, h: 44, n: 4, rate: 4 } },    // PixelLab 4d392a56… + animate_image 5ab23adc…
  osterei:  { file: 'assets/sprites/deko_osterei.png' },   // La Palma: seltenes Osterei, gibt ein Herz zurück (pixen 97c2a7ce…)
}

// ------------------------------------------------------------
//  Schrift & UI (PixelLab): null = Standard-Monospace / schlichte Kästen
// ------------------------------------------------------------
export const UI = {
  fontFile: 'assets/fonts/waldschrift.ttf',   // PixelLab-Font "Waldschrift"
  fontFamily: 'Waldschrift',
  panelFile: 'assets/ui/holzpanel.png',       // PixelLab-UI-Panel, Neun-Teile-Rahmen
  panelBorder: 7,                             // so breit ist der Rahmen im Panelbild (95×25-Panel aus dem Sheet)
  titleFile: 'assets/bg/titel.png',           // Pro-Titelbild 480×270
  finishFile: 'assets/bg/schwarzwald_ende.png', // Pro-Jubelbild fürs Waldherz (null = nur Text)
  introFile: 'assets/bg/schwarzwald_intro.png', // Pro-Bild für die Geschichte am Anfang (null = nur Text)
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
//  Hintergrund (Parallax) – eine Liste von Ebenen, hinten → vorne.
//  scroll = wie stark die Ebene mit der Kamera mitwandert
//           (0 = steht still wie der Himmel, 1 = wie die Spielebene).
//  Je kleiner scroll, desto weiter weg wirkt die Ebene.
//  Alle Bilder sind gespiegelt verdoppelt (tools/mirror-tile.mjs) → nahtlos.
//  Leere Liste = Dreiecks-Tannen als Platzhalter.
// ------------------------------------------------------------
export const BACKGROUND = {
  layers: [
    { key: 'bg_berge',  file: 'assets/bg/schwarzwald_berge.png', scroll: 0.1 },                 // PixelLab 0d73137c…
    { key: 'bg_baeume', file: 'assets/bg/schwarzwald_baeume.png', scroll: 0.3, tint: 0x8fa0c0, alpha: 0.9 }, // PixelLab cc8550f5…, fern = blasser/bläulicher
    { key: 'bg_baeume', scroll: 0.55, offsetX: 300 },                                            // dieselben Bäume nochmal, näher & kräftig
    // Vordergrund (vor der Spielebene): Baumkronen oben, Farne unten – wandern SCHNELLER als die Kamera
    { key: 'bg_kronen', file: 'assets/bg/schwarzwald_kronen.png', scroll: 1.2, h: 160, depth: 22, alpha: 0.9 },   // PixelLab 7e51d395…
    { key: 'bg_farne',  file: 'assets/bg/schwarzwald_farne.png', scroll: 1.1, y: 214, h: 96, depth: 21, alpha: 0.9 },        // PixelLab 7dba52d7…
  ],
  haze: 0.3,                          // dunkler "Dunst" über allem, damit die Figuren vorne bleiben
  titleKey: 'bg_forest',              // Kulisse fürs Titelbild (PixelLab 73621b03…)
  titleFile: 'assets/bg/wald_fern.png',
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
//  Zweites Material im selben Tiled-Layer "Boden": Kacheln mit gid ab 17 sind Stein.
//  (In Tiled: zweites Tileset "stein" mit firstgid 17.)
export const TILESET2 = {
  key: 'tiles_stein',
  name: 'stein',
  file: 'assets/tiles/schwarzwald_stein.png',   // PixelLab-Tileset e020a554…
  columns: 4,
  wangFrames: [12, 13, 0, 3, 8, 1, 14, 5, 15, 4, 11, 2, 9, 10, 7, 6],   // gleiche Anordnung wie das Erde-Set
}

// ------------------------------------------------------------
//  DIE WÄLDER
// ------------------------------------------------------------
//  Jeder Wald bringt mit, was ihn ausmacht: sein Level, seine Kacheln,
//  seine Hintergrund-Ebenen, seine Musik und seinen Schlusssatz.
//  Der Schlüssel ist zugleich der Anfang des Levelnamens.
//  `weiter` = welcher Wald danach kommt (null = das Spiel ist durch).
// ------------------------------------------------------------
export const FORESTS = {
  schwarzwald: {
    name: 'Schwarzwald',
    level: 'schwarzwald',
    tiles: TILESET,
    tiles2: TILESET2,
    background: BACKGROUND,
    musik: 'schwarzwald',
    endeText: 'Der Schwarzwald singt wieder!',
    endeBild: 'assets/bg/schwarzwald_ende.png',
    weiter: 'tijuca',
  },
  tijuca: {
    name: 'Floresta da Tijuca',
    level: 'tijuca',
    tiles: {
      key: 'tiles_tijuca',
      file: 'assets/tiles/tijuca.png',            // PixelLab c35edd34…
      columns: 4,
      wangFrames: [12, 13, 0, 3, 8, 1, 14, 5, 15, 4, 11, 2, 9, 10, 7, 6],
    },
    tiles2: {
      key: 'tiles_tijuca2',
      name: 'stein',
      file: 'assets/tiles/tijuca_stein.png',      // PixelLab db7bb68f… (Aquädukt-Quader)
      columns: 4,
      wangFrames: [12, 13, 0, 3, 8, 1, 14, 5, 15, 4, 11, 2, 9, 10, 7, 6],
    },
    background: {
      layers: [
        { key: 'tj_berge',  file: 'assets/bg/tijuca_berge.png', scroll: 0.1 },
        { key: 'tj_baeume', file: 'assets/bg/tijuca_baeume.png', scroll: 0.3, tint: 0x8fa0c0, alpha: 0.9 },
        { key: 'tj_baeume', scroll: 0.55, offsetX: 300 },
        { key: 'tj_kronen', file: 'assets/bg/tijuca_kronen.png', scroll: 1.2, h: 160, depth: 22, alpha: 0.9 },
        { key: 'tj_farne',  file: 'assets/bg/tijuca_farne.png', scroll: 1.1, y: 214, h: 96, depth: 21, alpha: 0.9 },
      ],
      haze: 0.22,      // in Rio ist es heller als im Schwarzwald
    },
    musik: 'tijuca',
    endeText: 'Die Floresta da Tijuca lebt wieder!',
    endeBild: null,
    weiter: 'la_palma',
  },
  la_palma: {
    name: 'Lorbeerwald von La Palma',
    level: 'la_palma',
    tiles: {
      key: 'tiles_la_palma',
      file: 'assets/tiles/la_palma.png',          // PixelLab e3e41c50… (Vulkanboden mit Moos)
      columns: 4,
      wangFrames: [12, 13, 0, 3, 8, 1, 14, 5, 15, 4, 11, 2, 9, 10, 7, 6],
    },
    tiles2: {
      key: 'tiles_la_palma2',
      name: 'stein',
      file: 'assets/tiles/la_palma_stein.png',    // PixelLab 946d9759… (Basalt)
      columns: 4,
      wangFrames: [12, 13, 0, 3, 8, 1, 14, 5, 15, 4, 11, 2, 9, 10, 7, 6],
    },
    background: {
      layers: [
        { key: 'lp_berge',  file: 'assets/bg/la_palma_berge.png', scroll: 0.1 },                              // Caldera + Sternwarten
        { key: 'lp_baeume', file: 'assets/bg/la_palma_baeume.png', scroll: 0.3, tint: 0x9fb0c8, alpha: 0.9 },
        { key: 'lp_baeume', scroll: 0.55, offsetX: 300 },
        { key: 'lp_kronen', file: 'assets/bg/la_palma_kronen.png', scroll: 1.2, h: 160, depth: 22, alpha: 0.9 },
        { key: 'lp_farne',  file: 'assets/bg/la_palma_farne.png', scroll: 1.1, y: 214, h: 96, depth: 21, alpha: 0.9 },
      ],
      haze: 0.26,      // Nebelwald: etwas mehr Dunst als in Rio
    },
    musik: 'la_palma',
    endeText: 'Der Lorbeerwald von La Palma rauscht wieder!',
    endeBild: 'assets/bg/la_palma_ende.png',      // Pro 6376c1d7…
    weiter: null,
  },
}
