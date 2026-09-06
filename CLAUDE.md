# W.A.L.D. — Wächter Aller Lebenden Dinge

2D-Pixel-Art-Action-Adventure, gebaut von Tilman mit seinen Kindern Jonas und Leonel
(die beiden sind auch die Spielfiguren). **Antworte auf Deutsch** und erkläre
Entscheidungen so, dass Kinder mitlesen können.

## Technik
- Phaser 3 + Vite, reines JavaScript (kein TypeScript)
- `npm run dev` startet mit `--host` → im WLAN auf dem Handy testbar
- Tiled-Maps als JSON in `src/levels/`, werden in `BootScene` in den Cache gelegt.
  Jeder Wald ist EIN durchgehendes Level ohne Bildschirmwechsel (Tilman-Wunsch), erzeugt von `tools/gen-<wald>.mjs`
  (Schwarzwald 430, Tijuca 400, La Palma 420 Kacheln). Die Rätsel-Zonen sind im Generator mit festen Kachelspalten
  gebaut; `EXTRA = [[abSpalte, mehrKacheln], …]` schiebt dazwischen freien Wald ein, `X(c)`/`PX(x)` rechnen alte
  Spalten/Pixel um – Levels größer machen = nur EXTRA ändern. Speicherpunkte (`checkpoint`) automatisch alle ~55 Kacheln.
  (`schwarzwald_01…05.json` + `merge-levels.mjs` sind Altbestand aus der Zeit vor dem Generator.)
- `?debug` an die URL → Trefferboxen sichtbar; `?touch` → Touch-Knöpfe auch am PC;
  `?raum=schwarzwald_02` → Titelbild überspringen, direkt in den Raum
- `window.__wald.scene` ist die laufende GameScene (zum Nachschauen in der Konsole)
- Tasten: Pfeile/WASD, Leer springen, X/K schlagen, E Fähigkeit, Tab/Shift wechseln, C Komm!, P/Esc Pause, M Musik
- Szenen: Boot → Title → Intro (Geschichte, `INTRO` in config) → Game (ein Raum pro Szene, `{ room, spawn }`); `world.js` hält den Stand.
  Waldende (`finishForest`) → Jubelbild → direkt Intro des nächsten Waldes (`FORESTS[x].weiter`), mit vollen Herzen; nach dem letzten Wald → Title
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
  `node tools/frames-aussortieren.mjs <sheet> <n> <out> [toleranz]` laufen lassen (wirft Ausreißer raus;
  große Figuren wie die Wächter brauchen Toleranz 0.4, sonst bleiben nur 3 Bilder übrig).
- Braunes Fell (Hirsch) beim Palettisieren OHNE Rottöne: `feuerRot,beerenRot,rosaHell,magiePink,bluetenLila,pflaumeLila`,
  sonst wird es knallrot. `node tools/vergroessern.mjs <ein> <aus> [faktor]` zum Prüfen von Pixelbildern.
  NICHT bei Verwandlungen (Einrollen, Sprung, Wurf) – dort ist die Änderung gewollt.
- Hintergrund-Tiefe: `tiefeZuDepth(scroll) = -60 + scroll*20` gilt für Ebenen UND Kulissen
  (Kulisse +1, damit sie vor der gleich schnellen Ebene liegt). Der Himmel liegt bei -100.
  Kulissen stehen auf `KULISSEN[name].standY` – Fernes gehört an den Horizont, nicht auf die Bodenlinie.
- Gegner haben Zustände (`Enemy.js`, Werte in `ENEMIES[x].ai`): stromern → "!" → angreifen → benommen.
  Drei Arten (`ai.kind`): `roller` (Igel: rollt als Kugel geradeaus, nur benommen verwundbar),
  `charger` (Wildschwein: stürmt, dreht um, stürmt nochmal – beim Umdrehen und danach verwundbar),
  `hopper` (Hase: hüpft in Sätzen heran), `thrower` (Affe: wirft Jackfrüchte im Bogen),
  `climber` (Nasenbär: verfolgt und SPRINGT auf Plattformen – Weg über `PlatformGraph` wie der Begleiter, Absprung
  genau im berechneten Fenster vor der Kante; er schwebt nie), `dropper` (Faultier: hängt am Ast und lässt sich fallen),
  `marcher` (Ameisenkolonne: marschiert stur im Gänsemarsch, alle in dieselbe Richtung – dreht eine um,
  drehen alle um; `gruppe` in der Config). Ein Treffer auf IRGENDEINE Ameise heilt die ganze Reihe:
  über jeder erscheint ein Herz und die Kolonne kehrt um. Jeder muss mit Springen + Basisangriff zu schaffen sein.
- **Ampel über jedem Gegner** (`Enemy.updateMark`, eine Sprache für alle Tiere, Tilman-Wunsch: friedlich/gefährlich
  muss sofort erkennbar sein): `?` weiß = verwirrt, harmlos (stromert/sitzt/hängt) · `!` gelb = hat dich gesehen, gleich
  geht's los (noch harmlos) · `!` rot, pulsierend = GEFAHR, Berühren tut weh · `★` gelb = benommen, jetzt treffen ·
  `♥` = geheilt (bleibt dauerhaft über dem Tier). **Weh tut ein Gegner NUR bei Rot** (`hurtsOnTouch` ⇔ `dangerous`: Zustand `roll`, Eule `swoop`,
  marschierende Ameisen). Der Affe ist nach seiner Salve nicht benommen, sondern schaut sich nur um (`?`).
  Eule (`Owl.js`, kind 'flyer') sitzt in der Luft, stürzt herab, sitzt dann kurz am Boden.
- **Wächter (Endgegner, `Boss.js`, `boss: true` in ENEMIES)** am Ende jedes Waldes, in einer flachen `arena`
  (Rechteck-Objekt aus dem Generator, davor ein Speicherpunkt). Regeln (Tilman-Wunsch): Er erscheint ERST, wenn
  alle Blätter des Waldes gesammelt sind (HUD zeigt `x/y`; in der Arena und am Farn sagt der Wald sonst
  „bleibt stumm … euch fehlen noch N Blätter"). Das Farn (Waldherz) ist grau und stumm, bis der Wächter geheilt
  ist – dann leuchtet es und Berühren beendet den Wald. `ai.schild` = Schutzstücke (Geweih/Steinschuppen):
  solange eins dran ist, prallt jeder Schlag ab (`abprallText` sagt, was hilft), nur Jonas' Stampfer bricht
  eins ab (Bild wechselt auf `varianten.s1`/`.s0`, Bruchstück `stueckFile` fliegt). `ai.ruf` = Röhren
  (gelb warnen, dann rote Schallringe, näher als `radius` = ein Herz weg). `ai.nurBeruhigt` = nur verwundbar,
  solange Leonels Waldgeist wirkt; `ai.schildNurBeruhigt` = der Stampfer wirkt nur beruhigt (beide Helden nötig).
  Zusätzliches Ampel-Zeichen `✕` weiß = jetzt bringt Schlagen nichts. Lebensleiste oben rechts.
  Schwarzwald: Hirsch (Geweih ×2, Röhren) · Tijuca: Onça/Jaguar (springt, nur beruhigt verwundbar) ·
  La Palma: Rieseneidechse (Steinschuppen ×2, nur beruhigt zu sprengen). Geheilt-Zustand wird in `Enemy.heal`
  gemerkt (`healedMerken`), damit auch ein Waldgeist-Treffer zählt.
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
  Darum stehen Kulissen mit `boden: true` (Haus, Hochsitz, Wasserfall …) nicht auf einer festen Höhe, sondern
  `GameScene.updateKulissen` stellt sie jeden Frame auf die tiefste Bodenkante unter ihrem Bild (`bodenOben`,
  weich nachgeführt) – ein festes `standY` schwebte über Senken oder steckte im Hügel (Tilman hat beides gesehen).
  `standY` nur noch für Horizont-Kulissen (Berge, Vulkan, Cristo), die auf nichts stehen. Und Kulissen brauchen freigestellte Ränder:
  ein rechteckiges Bild klebt sonst als Kachel im Wald (`node tools/rand-weich.mjs <ein> <aus> [l r o u]`
  blendet die Ränder weich aus)
- Deko mit `vorne=true` wird automatisch halb durchsichtig, sobald ein Held dahintersteht (`vorneDeko` in GameScene)
- Schrift "Waldschrift" (TTF, FontFace in BootScene), Holz-Panel als NineSlice fürs HUD; PixelLab-Abo: 2000/Monat
- Vier Wälder: Schwarzwald (fertig), Floresta da Tijuca (fertig), Lorbeerwald La Palma (fertig, Ostern), Plänterwald.
  Jeder Wald steht in `FORESTS` (config.js) mit Level, Kacheln, Hintergrund, Musik, Schlusssatz und `weiter`.
  Levels bauen: `node tools/gen-schwarzwald.mjs`, `node tools/gen-tijuca.mjs`, `node tools/gen-la_palma.mjs`.
- La Palma: Gegner Graja (`flyer` wie die Eule), Eidechse (`charger` mit `ai.laufAnim` = Lauf-Animation statt Kugel),
  Ziege (`hopper`), Lorbeertaube (`thrower` mit eigenem Geschoss: `wurfFile` → Textur `<key>-wurf`). Lavaröhre = ein
  Kachel hoher Kriechgang unter der Basaltwand (nur Leonel). Sechs Ostereier liegen als Deko `osterei` versteckt.
  Ostereier sind Sammelobjekte (`osterei`, `ITEMS`): selten (4 pro Wald), jedes gibt dem Finder ein Herz zurück.
  Blätter liegen in allen Wäldern auf jeder zweiten Plattform (+ Rätselzonen), ~26–30 pro Wald – alle nötig für den Wächter.
  **Ein Tier ist entweder Gegner oder friedliches Deko-Tier, nie beides** (Tilman-Wunsch) – Graja/Eidechse sind Gegner.
  Neuer Wald = Kachelsets (pixflux `create_sidescroller_tileset`, 2–3 Gen.), 4 Hintergrund-Ebenen, 3–4 Kulissen, ~8 Deko,
  4 Gegner mit je Grundbild + Animation + Schlafbild (`animate_image`, letztes Bild), 3 Intro-Folien (Pro) – zusammen ~200 Generierungen.

## Sprites (PixelLab MCP)
- Trial: 40 Generierungen, **sehr sparsam** – Stand in `public/assets/QUELLEN.md`
- Charaktere: Standard-Modus, Ansicht "side", 4 Richtungen, Animationen nur Richtung **east**
  (im Spiel gespiegelt); Template-Animationen kosten 1 Generierung pro Richtung
- Import: `node tools/import-character.mjs` (Spritesheet + Fußlinie) → `node tools/palettize.mjs`
  (nur Palettenfarben; bei Kacheln Rottöne ausschließen) → Werte in `config.js` eintragen
