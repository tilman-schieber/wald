# W.A.L.D. — Wächter Aller Lebenden Dinge

2D-Pixel-Art-Action-Adventure, gebaut von Tilman mit seinen Kindern Jonas und Leonel
(die beiden sind auch die Spielfiguren). **Antworte auf Deutsch** und erkläre
Entscheidungen so, dass Kinder mitlesen können.

## Technik
- Phaser 3 + Vite, reines JavaScript (kein TypeScript)
- `npm run dev` startet mit `--host` → im WLAN auf dem Handy testbar
- Tiled-Maps als JSON in `src/levels/`, werden in `BootScene` in den Cache gelegt.
  Der Schwarzwald ist EIN durchgehendes Level (`schwarzwald.json`, 300 Kacheln breit), zusammengesetzt aus
  den Teilstücken `schwarzwald_01…05.json` per `node tools/merge-levels.mjs` (nach Änderungen an Teilstücken neu ausführen).
  Wegweiser-Speicherpunkte (`checkpoint`) an jedem Teilstück-Anfang; kein Bildschirmwechsel mehr (Tilman-Wunsch).
- `?debug` an die URL → Trefferboxen sichtbar; `?touch` → Touch-Knöpfe auch am PC;
  `?raum=schwarzwald_02` → Titelbild überspringen, direkt in den Raum
- `window.__wald.scene` ist die laufende GameScene (zum Nachschauen in der Konsole)
- Tasten: Pfeile/WASD, Leer springen, X/K schlagen, E Fähigkeit, Tab/Shift wechseln, C Komm!, P/Esc Pause, M Musik
- Szenen: Boot → Title → Intro (Geschichte, `INTRO` in config) → Game (ein Raum pro Szene, `{ room, spawn }`); `world.js` hält den Stand
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
- Jonas: älter, stärker; klettert an Ranken (Pfeil hoch/runter), schwingt an Lianen (springt im Flug
  automatisch hin, Leertaste lässt los – echtes Pendel in `Hero.updateSwing`), E = Stampfer.
  Leonel: jünger, schneller, kleiner, kriecht durch Spalten, E = Waldgeist.
- Jeder Gegner muss allein mit Basisangriff + Ausweichen zu schaffen sein.
- **Keine Abgründe** in den Räumen (Tilman-Wunsch). Der Code dafür (fellIntoPit) bleibt als Sicherheitsnetz.
- Deko `bach` (Wasserfall) nie direkt auf der Laufebene platzieren (sieht komisch aus) – nur z. B. in Nischen/tiefer
- **Alle Gegner-Sprites schauen nach LINKS** (der Code spiegelt bei Blickrichtung rechts).
  Schaut ein neues Bild nach rechts: `node tools/spiegeln.mjs <datei> <ziel> <anzahlBilder>`.
- Gegner sollen kleiner sein als die Helden (Jonas ~36 px sichtbar) – lieber gleich klein generieren
  als hinterher verkleinern.
- Posen/Animationen einer Figur IMMER per `animate_image` aus ihrem Hauptbild ableiten, nie separat generieren (sonst passt es nicht zusammen)
- `animate_image` malt jedes Bild neu → bei LAUFZYKLEN wandert die Form. Danach immer
  `node tools/frames-aussortieren.mjs <sheet> <n> <out>` laufen lassen (wirft Ausreißer raus).
  NICHT bei Verwandlungen (Einrollen, Sprung, Wurf) – dort ist die Änderung gewollt.
- Hintergrund-Tiefe: `tiefeZuDepth(scroll) = -60 + scroll*20` gilt für Ebenen UND Kulissen
  (Kulisse +1, damit sie vor der gleich schnellen Ebene liegt). Der Himmel liegt bei -100.
  Kulissen stehen auf `KULISSEN[name].standY` – Fernes gehört an den Horizont, nicht auf die Bodenlinie.
- Gegner haben Zustände (`Enemy.js`, Werte in `ENEMIES[x].ai`): stromern → "!" → angreifen → benommen.
  Drei Arten (`ai.kind`): `roller` (Igel: rollt als Kugel geradeaus, nur benommen verwundbar),
  `charger` (Wildschwein: stürmt, dreht um, stürmt nochmal – beim Umdrehen und danach verwundbar),
  `hopper` (Hase: hüpft in Sätzen heran), `thrower` (Affe: wirft Jackfrüchte im Bogen),
  `climber` (Nasenbär: verfolgt und klettert auf Plattformen), `dropper` (Faultier: hängt am Ast und lässt sich fallen),
  `marcher` (Ameisenkolonne: marschiert stur im Gänsemarsch, alle in dieselbe Richtung – dreht eine um,
  drehen alle um; `gruppe` in der Config). Über verwirrten Ameisen schwebt ein "?", ein Treffer auf
  IRGENDEINE heilt die ganze Reihe: über jeder erscheint ein Herz und die Kolonne kehrt um.
  Jeder muss mit Springen + Basisangriff zu schaffen sein.
  Eule (`Owl.js`, kind 'flyer') sitzt in der Luft, stürzt herab, sitzt dann kurz am Boden.
- Hintergrund-Ebenen (`BACKGROUND.layers`): am OBEREN Bildrand darf nichts angeschnitten sein –
  ein abgeschnittener Baum wirkt im Spiel, als hinge er von der Decke. Zeichen-Marker der Gegner
  liegen auf Tiefe 25, also vor Deko und Vordergrund-Ebenen.
- Alles, was auf dem Boden steht, bekommt einen weichen Schatten (`addShadow`) und Deko sitzt 2 px
  im Moos – ohne das wirkt bei diesem Tileset alles schwebend.
- Tore (`tor`-Objekte): der Torflügel wird in `BootScene` gemalt (Bohlen + Eisenband, nahtlos kachelbar),
  darüber sitzt der Steinbalken `torbogen` und an der Säule hängt Efeu – sonst sieht die Mauer aus,
  als hörte sie oben einfach auf. Beim Öffnen rutscht das Tor in den Boden statt zu verschwinden.
- Pause (P/Esc) ist ein kleines Menü: Weiterspielen · Wald neu starten · Zurück zum Menü
  (Pfeile + Leertaste/Enter, auch antippbar)
- Beide Fähigkeiten (E) haben einen Cooldown mit Balken im HUD (`hero.specialReadyAt`)
- Deko sind Tiled-Objekte vom Typ `deko` ohne Physik (`DEKO` in config: haengend/glow/anim), `vorne=true` = vor den Figuren;
  Tiere (`tier`) sind lebendige Deko (hüpfen, flattern); Stein-Material: gids ab 17 im selben Layer `Boden`
- Kulissen (`kulisse`-Objekte, `KULISSEN` in config): große Hintergrundbilder mit eigener Parallax-Tiefe
  (`tiefe` 0.15–0.8), x wird umgerechnet: bild.x = x·tiefe + 240·(1−tiefe); Intro = Folien `INTRO` (Bild + Sätze).
  Weil Kulissen langsamer wandern als der Boden, schieben sie sich im Lauf des Levels über JEDE Bodenhöhe.
  Darum muss `standY` knapp über der höchsten Bodenkante liegen, die vor der Kulisse vorkommt – sonst versinkt
  sie im Hügel (Schwarzwaldhof steckte bis zum Fenster im Boden). Und Kulissen brauchen freigestellte Ränder:
  ein rechteckiges Bild klebt sonst als Kachel im Wald (`node tools/rand-weich.mjs <ein> <aus> [l r o u]`
  blendet die Ränder weich aus)
- Deko mit `vorne=true` wird automatisch halb durchsichtig, sobald ein Held dahintersteht (`vorneDeko` in GameScene)
- Schrift "Waldschrift" (TTF, FontFace in BootScene), Holz-Panel als NineSlice fürs HUD; PixelLab-Abo: 2000/Monat
- Vier Wälder: Schwarzwald (fertig), Floresta da Tijuca (fertig), Lorbeerwald La Palma, Plänterwald.
  Jeder Wald steht in `FORESTS` (config.js) mit Level, Kacheln, Hintergrund, Musik, Schlusssatz und `weiter`.
  Levels bauen: `node tools/gen-schwarzwald.mjs` bzw. `node tools/gen-tijuca.mjs`.

## Sprites (PixelLab MCP)
- Trial: 40 Generierungen, **sehr sparsam** – Stand in `public/assets/QUELLEN.md`
- Charaktere: Standard-Modus, Ansicht "side", 4 Richtungen, Animationen nur Richtung **east**
  (im Spiel gespiegelt); Template-Animationen kosten 1 Generierung pro Richtung
- Import: `node tools/import-character.mjs` (Spritesheet + Fußlinie) → `node tools/palettize.mjs`
  (nur Palettenfarben; bei Kacheln Rottöne ausschließen) → Werte in `config.js` eintragen
