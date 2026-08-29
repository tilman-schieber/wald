# W.A.L.D. — Wächter Aller Lebenden Dinge

2D-Pixel-Art-Action-Adventure, gebaut von Tilman mit seinen Kindern Jonas und Leonel
(die beiden sind auch die Spielfiguren). **Antworte auf Deutsch** und erkläre
Entscheidungen so, dass Kinder mitlesen können.

## Technik
- Phaser 3 + Vite, reines JavaScript (kein TypeScript)
- `npm run dev` startet mit `--host` → im WLAN auf dem Handy testbar
- Tiled-Maps als JSON in `src/levels/`, werden in `BootScene` in den Cache gelegt
- `?debug` an die URL → Trefferboxen sichtbar; `?touch` → Touch-Knöpfe auch am PC
- `window.__wald.scene` ist die laufende GameScene (zum Nachschauen in der Konsole)

## Feste Grafik-Regeln
- Interne Auflösung **480×270** (16:9, Full-HD = genau 4×), `pixelArt: true`
- Figuren 32 px hoch, Tiles 16×16
- **Nur Farben aus `src/palette.js`** (32 Farben, Endesga-32, deutsche Namen)
- Seitenansicht mit Parallax: Himmel (0) → ferne Tannen (0.2) → nahe Tannen (0.5) → Spielebene (1) → Büsche (1.3)

## Architektur (bitte beibehalten)
- Alle Zahlen (Tempo, Sprung, Größen) in `src/config.js`, nirgendwo sonst
- Grafik-Austausch: `HEROES[x].file` / `TILESET.file` in `config.js` von `null` auf einen
  Pfad setzen → `BootScene` lädt das Bild statt den Platzhalter zu malen. Der Spielcode
  kennt nur Texturnamen (`'jonas'`, `'leonel'`, `'tiles'`) und Animationsnamen (`'jonas-run'`).
- Ein `Hero` bewegt sich nie selbst: er bekommt jeden Frame ein Kommando
  `{ left, right, jump, jumpHeld }`. Spieler-Kommandos kommen aus `Controls`,
  Begleiter-Kommandos aus `CompanionBrain`. Wechseln = nur tauschen, wer welches Kommando bekommt.

## Spielregeln (Design)
- Kein Blut, keine Grausamkeit; besiegte Gegner werden geheilt
- Zwei Helden, immer einer aktiv, der andere KI-Begleiter. Wechsel sofort, ohne Animation,
  Kamera springt nicht. Begleiter kann nie ein Game Over verursachen.
- Jonas: älter, stärker, Kletterhaken. Leonel: jünger, schneller, kleiner, ruft Waldgeister.
- Jeder Gegner muss allein mit Basisangriff + Ausweichen zu schaffen sein.
- Vier Wälder: Schwarzwald (Start), Floresta da Tijuca, Lorbeerwald La Palma, Plänterwald

## Sprites (PixelLab MCP)
- Free-Tier: **sehr sparsam** generieren, nur das Nötigste
- Charaktere: Ansicht "side", Frame passend zu `HEROES[x].frame`, Animationen idle/run/jump
- Frame-Nummern der Animationen dann in `config.js` unter `anims` eintragen
