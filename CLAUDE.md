# W.A.L.D. — Wächter Aller Lebenden Dinge

2D-Pixel-Art-Action-Adventure, gebaut von Tilman mit seinen Kindern Jonas und Leonel
(die beiden sind auch die Spielfiguren). **Antworte auf Deutsch** und erkläre
Entscheidungen so, dass Kinder mitlesen können.

## Technik
- Phaser 3 + Vite, reines JavaScript (kein TypeScript)
- `npm run dev` startet mit `--host` → im WLAN auf dem Handy testbar
- Tiled-Maps als JSON in `src/levels/`, werden in `BootScene` in den Cache gelegt
- `?debug` an die URL → Trefferboxen sichtbar; `?touch` → Touch-Knöpfe auch am PC;
  `?raum=schwarzwald_02` → Titelbild überspringen, direkt in den Raum
- `window.__wald.scene` ist die laufende GameScene (zum Nachschauen in der Konsole)
- Tasten: Pfeile/WASD, Leer springen, X/K schlagen, E Fähigkeit, Tab/Shift wechseln, C Komm!, P/Esc Pause, M Musik
- Szenen: Boot → Title → Game (ein Raum pro Szene, `{ room, spawn }`); `world.js` hält den Stand
  zwischen Räumen, `save.js` speichert ihn bei jedem Raumeingang in localStorage
- Sounds werden in `sound.js` synthetisch erzeugt (keine Dateien); Musik: `MUSIC.file` (MP3, mit
  `~/crush.py` im SNES-Stil bearbeitet), läuft über alle Räume durch

## Feste Grafik-Regeln
- Interne Auflösung **480×270** (16:9, Full-HD = genau 4×), `pixelArt: true`
- Figuren 32 px hoch, Tiles 16×16
- **Nur Farben aus `src/palette.js`** (32 Farben, Endesga-32, deutsche Namen) – einzige Ausnahme:
  das gemalte Titelbild `public/assets/bg/titel.png` (Pro-Bild, palettisiert sah es matschig aus)
- Seitenansicht mit Parallax, Ebenen als Liste in `BACKGROUND.layers` (config.js):
  Himmel (0) → Berge (0.1) → Bäume fern (0.3, bläulich) → Bäume nah (0.55) → Dunst → Spielebene (1) → Büsche (1.3)

## Architektur (bitte beibehalten)
- Alle Zahlen (Tempo, Sprung, Größen) in `src/config.js`, nirgendwo sonst
- Grafik-Austausch: `HEROES[x].file` / `TILESET.file` in `config.js` (`null` = Platzhalter,
  sonst Pfad unter `public/`) → `BootScene` lädt das Bild statt den Platzhalter zu malen. Der
  Spielcode kennt nur Texturnamen (`'jonas'`, `'leonel'`, `'tiles'`) und Animationsnamen (`'jonas-run'`).
- Bilder liegen in `public/assets/`; Herkunft und PixelLab-IDs in `public/assets/QUELLEN.md`
- Das Tileset ist ein Wang-Set (Ecken-Kacheln): `GameScene.makeWangLayer` zeichnet die Grafik
  um 8 px versetzt, die Tiled-Ebene `Boden` ist nur Kollision (sichtbar mit `?debug`)
- Ein `Hero` bewegt sich nie selbst: er bekommt jeden Frame ein Kommando
  `{ left, right, jump, jumpHeld }`. Spieler-Kommandos kommen aus `Controls`,
  Begleiter-Kommandos aus `CompanionBrain`. Wechseln = nur tauschen, wer welches Kommando bekommt.

## Spielregeln (Design)
- Kein Blut, keine Grausamkeit; besiegte Gegner werden geheilt
- Zwei Helden, immer einer aktiv, der andere KI-Begleiter. Wechsel sofort, ohne Animation,
  Kamera springt nicht. Begleiter kann nie ein Game Over verursachen.
- Jonas: älter, stärker; klettert an Ranken (Pfeil hoch/runter), E = Stampfer (macht Gegner
  ringsum benommen). Leonel: jünger, schneller, kleiner, kriecht durch Spalten, E = Waldgeist.
- Jeder Gegner muss allein mit Basisangriff + Ausweichen zu schaffen sein.
- Gegner haben Zustände (`Enemy.js`, Werte in `ENEMIES[x].ai`): stromern → "!" → angreifen →
  benommen (nur dann verwundbar). Igel rollt als Kugel; man hüpft drüber und schlägt danach.
  Eule (`Owl.js`, kind 'flyer') sitzt in der Luft, stürzt herab, sitzt dann kurz am Boden.
- Deko sind Tiled-Objekte vom Typ `deko` ohne Physik (`DEKO` in config: haengend/glow/anim), `vorne=true` = vor den Figuren;
  Tiere (`tier`) sind lebendige Deko (hüpfen, flattern); Stein-Material: gids ab 17 im selben Layer `Boden`
- Schrift "Waldschrift" (TTF, FontFace in BootScene), Holz-Panel als NineSlice fürs HUD; PixelLab-Abo: 2000/Monat
- Vier Wälder: Schwarzwald (Start), Floresta da Tijuca, Lorbeerwald La Palma, Plänterwald

## Sprites (PixelLab MCP)
- Trial: 40 Generierungen, **sehr sparsam** – Stand in `public/assets/QUELLEN.md`
- Charaktere: Standard-Modus, Ansicht "side", 4 Richtungen, Animationen nur Richtung **east**
  (im Spiel gespiegelt); Template-Animationen kosten 1 Generierung pro Richtung
- Import: `node tools/import-character.mjs` (Spritesheet + Fußlinie) → `node tools/palettize.mjs`
  (nur Palettenfarben; bei Kacheln Rottöne ausschließen) → Werte in `config.js` eintragen
