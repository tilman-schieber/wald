# Woher die Bilder kommen (PixelLab, Standard-Modus, Ansicht "side")

| Datei | PixelLab-ID | Animationen (nur Richtung east, im Spiel gespiegelt) |
|---|---|---|
| sprites/jonas.png  | Charakter `8e5fc3e2-0495-4784-8930-227df5f61650` ("Jonas Locken", ersetzt `46e662b7…`) | idle `85964bb4…` (4), run `e1d9f93a…` (6, walking-6-frames), jump `e1998c40…` (9, jumping-1), crouch `a339a05b…` (6, crouched-walking), climb `22bbd8f1…` (4, v3 "climbing up a vertical rope") |
| sprites/leonel.png | Charakter `9c5a608a-7e57-4e94-a3ad-c07282d2b66c` | idle `c7fc8a1b…` (4), run `41d70798…` (6, running-6-frames), jump `4510190a…` (9, jumping-1), crouch `f1b6c1d4…` (6, crouched-walking) |
| sprites/eule.png | Bild (pixflux, Palette) `4f54d615-7d70-4fba-a573-0d691752d49d`, 28×29 (erster Versuch `ffc1d20a…` war leer) | — |
| sprites/eule_flug.png | Bild (pixflux, Palette) `7e226552-d932-4435-bece-f4c0eae82553`, 28×16 | — |
| music/frozen_sprite_loop.mp3 | "Frozen Sprite Loop.mp3" (Projektordner) durch `~/crush.py --preset snes` (10 bit, 26 kHz, Tiefpass, Kompressor), dann ffmpeg → MP3 | — |
| bg/schwarzwald_berge.png | Bild (pixflux, Palette) `0d73137c-602c-4136-b208-002103d6d003`, 400×272, gespiegelt verdoppelt | — |
| bg/schwarzwald_baeume.png | Bild (pixflux, Palette) `cc8550f5-b788-4f22-a92e-eccbbcdd2c2d`, Zwischenraum per `tools/colorkey.mjs` (139,155,180) durchsichtig, gespiegelt verdoppelt | — |
| bg/wald_fern.png (Titelbild) | Bild (pixflux, Palette erzwungen) `73621b03-5e20-404a-8a5b-cce466f3ca3d`, 400×272, gespiegelt verdoppelt mit `tools/mirror-tile.mjs` | — |
| (nicht benutzt) | Charakter `45abacc1-c316-48b6-a863-8c867759ff81` "Leonel Foto" (dunkelblaues Shirt, braune Hose) – Tilman mag den orangen Leonel lieber | — |
| (nicht benutzt) | Bild `eec3a745-7137-4348-a6ef-8e3c8b09426f` – zwei Comic-Bäume, zu clipart-haft | — |
| sprites/igel.png | Bild (pixflux, Palette) `ccbfcad3-ae72-4ce5-89e4-fdde198bb55f`, zugeschnitten 23×19 | — |
| sprites/igel_heil.png | Bild (pixflux, Palette) `180538dc-88e0-4afb-a5c0-069f5d91234a`, zugeschnitten 28×26 | — |
| sprites/igel_kugel.png | Bild (pixflux, Palette) `40694bf9-8c41-4495-99f3-244ce9e0524b`, zugeschnitten 28×24 | — |
| sprites/deko_farn.png | Bild (pixflux, Palette) `633dedca-c583-41be-a48e-531ad443ae0e`, 24×28 | — |
| sprites/deko_pilze.png | Bild (pixflux, Palette) `120957ca-d095-44da-9d9f-03c4dd824166`, 28×26 | — |
| sprites/deko_stein.png | Bild (pixflux, Palette) `e979ad3d-d7ca-4c8a-a017-49927f7638a6`, 26×20 | — |
| sprites/geist.png | Bild (pixflux, Palette) `03264b0c-ac52-48f8-9553-e7a3e2832233`, zugeschnitten 16×22 | — |
| tiles/schwarzwald.png | Sidescroller-Tileset `f346a925-dd3d-4070-9760-f34eaec9e8e0` (Basis-Kachel `a61fed35…` zum Anschließen weiterer Sets) | — |

Neu bauen: `node tools/import-character.mjs …` (baut das Spritesheet, richtet die Füße aus),
dann `node tools/palettize.mjs …` (nur Palettenfarben; bei Kacheln die Rottöne ausschließen).
## Große Welle (Abo, 29.08.2026)
- Titelbild: `create_image_pro` 480×270 `8297bda1…` (bg/titel.png, **unpalettisiert** – bewusste Ausnahme) und 688×384 `cc2204f2…` (bg/titel_gross.png), Referenzen: Jonas/Leonel-South-Bilder
- Schrift: `create_font` "Waldschrift" `f3280c5e…` → fonts/waldschrift.ttf
- UI: `create_ui_asset` Holzpanel `febcf655…` → ui/holzpanel.png (großes Panel aus dem Sheet geschnitten, 268×59, Neun-Teile-Rand 24)
- Stein-Tileset: `create_sidescroller_tileset` `e020a554…` (Basis `49c699ba…`) → tiles/schwarzwald_stein.png
- Helden-Animationen: Jonas attack `233da9e6…` hurt `10e00c2e…`; Leonel attack `6e6fdafe…` hurt `e5512368…` (cross-punch / taking-punch)
- `animate_image`: Igel laufen `dd740dac…` (6), Eule Flügelschlag `35c0c0be…` (4), Geist schweben `dc123201…` (4) → tools/frames-to-sheet.mjs
- Deko (pixflux, Palette): holz `bfdcc6c3…`, fels `283387d2…`, busch `f5d3c0d8…`, leuchtpilze `92bee441…`, wurzeln `1d467ba3…`, moos `39a0ab06…`, stamm `4f3d9fbe…`, schild `a78c15b4…`, laterne `7a71c4b4…`, gras `175f42e3…`, blumen `64852263…`, laub `7abbdc41…`, bach `7434a3bd…`, baumhaus `1c45390c…`, hohlbaum `3581bfef…`
- Tiere: eichhoernchen `1acb2811…`, hase `dcf1244f…`, schmetterling `9874205a…`
- Vordergrund-Ebenen: kronen `7e51d395…` (weiß freigestellt, unter Zeile 100 gelöscht), farne `7dba52d7…`
- Gegenstände: blatt `36b527a3…`, waldherz `4d392a56…`
- Runde 2: Jubelbild `create_image_pro` `ae7c4e14…` → bg/schwarzwald_ende.png (unpalettisiert); Wildschwein `0adf7ee7…` / Sturm `42c3513f…` / schlafend `b844a0c9…` + Lauf `c5eb7d6e…`; Schlag-Effekt `d47f7c28…`; Herzen (pixen) `3bb1d083…` / `5914ab12…`; Tier-Animationen Eichhörnchen `28597ae5…`, Hase `d69dca68…`, Schmetterling `c15efac9…`; Waldherz-Leuchten `5ab23adc…`
- Eule Flug neu: `animate_image` `0a8c99eb…` aus dem Sitzbild (die separate Flug-Eule `7e226552…`/`35c0c0be…` passte nicht dazu); Schrift: Umlaute/ß per `tools/font-umlaute.mjs` ergänzt
- Runde 3: Intro-Bild `create_image_pro` `2de0e962…` → bg/schwarzwald_intro.png (unpalettisiert); Igel einrollen `513fffff…` (Alarm-Animation, letztes Bild = Kugel), Wildschwein schnauben/stürmen `2f593a4e…` (letztes Bild = Sturm-Pose)
- Musik: "Maple Mode.mp3" → music/tijuca.mp3, "Moonlit Save Point.mp3" → music/la_palma.mp3 (beide `~/crush.py --preset snes`, ffmpeg → MP3). Zuordnung in `MUSIC.tracks` (Schlüssel = Anfang des Levelnamens).
- Runde 4: Intro-Folien (Pro, unpalettisiert, Rand per tools/edge-fill.mjs): Freiburg `71cf3ca3…`, S1 Titisee `e14a8aab…` (ersetzt `ff459aae…`, Kinder statt Teenager), Titisee-Wald `77bbe80c…`; Kulissen (pixflux, Palette): schwarzwaldhof `d84d321d…`, schauinsland `c0170a03…`, titisee `45d3d9df…` (Wolken per colorkey weg), muenster `039d9fd1…`, hochsitz `e3992daf…`
- Runde 5: verwirrter Hase `8865748f…` (img2img aus `tier_hase.png`, strength 200) + Hüpf-Animation `a90366a3…`; Wildschwein schnaufend `a2a6b7c7…`

## Floresta da Tijuca (30.08.2026)
- Kacheln: `create_sidescroller_tileset` Lehmboden `c35edd34…` → tiles/tijuca.png, Aquädukt-Quader `db7bb68f…` → tiles/tijuca_stein.png
- Hintergrund: Berge/Zuckerhut `156c065e…` (erster Versuch `70402aa9…` sah nach Schwarzwald aus), Bäume `fc80e03f…` (Versuch `19c6e885…` hatte Wasserzeichen; hellblau per colorkey freigestellt), Farne `1e0bd52a…`, Kronen `82362121…` → ersetzt durch pixflux `af86430f…` (nur hängende Wedel, KEINE Stämme – die alten hingen wie Bäume von der Decke; palettisiert, ab Zeile 85 weich ausgeblendet, per mirror-tile.mjs auf 800 px)
- Kulissen: Cascatinha `53e9775d…`, Vista Chinesa `a4858ee5…`, Cristo Redentor `ceffa730…`
- Torbogen (Steinbalken über den Toren): pixen `0975c40a…`, freigestellt + palettisiert, Ranken von Hand grün gefärbt.
  Ein zweiter Versuch für eine wiederholbare Tor-Holzkachel (`b6790206…`) taugte nichts – der Torflügel wird jetzt in BootScene gemalt.
- Gegner: Affe `722b9a21…` (+ beruhigt `b3dec16c…`), Nasenbär `8d2502b2…` (+ Lauf `f7b71e9e…`), Faultier `cf441662…` (+ schlafend `09083a31…`), Ameise `12dcce15…` (+ Lauf `5e30cb70…`), Jackfrucht `61cd7fe8…` → ersetzt durch pixen `07973072…` (grün, knubbelig, 16×18)
- Deko: Bromelie `22653618…`, Bambus `095f2e62…`, Liane `60db5b2e…`, Monstera `516084f6…`
- Nachbesserung: Nasenbär `e6ec27a6…` und Kapuzineraffe `64e3b8e5…` neu (die ersten sahen nicht nach den Tieren aus);
  Animationen dazu: Nasenbär-Lauf `af1e73b3…`, Affe beruhigt `78ac5772…`, Affe wirft `ab097341…`;
  Tijuca-Intro: Flug `1fa2d8b4…` (Jonas' Gesicht nachträglich froh gemacht: `edit_image` `2372e8dc…`, nur das Gesicht per Ellipsen-Blende ins Original kopiert), Waldrand `37a215c6…`; Jonas klettert (Rückansicht) `64f53502…`
- Nachbesserung 2: böser Hase `388ff465…` (img2img aus dem freundlichen Hasen, strength 110) + Hüpfen `34893bc5…`;
  kleinerer Kapuzineraffe `829cc473…` (32×32 statt 44×48) + Wurf `beeeaf04…` + beruhigt `975ef13d…`;
  Nasenbär-Bilder mit `tools/spiegeln.mjs` nach links gedreht (er war als einziger nach rechts gezeichnet);
  Tijuca-Musik: "Frozen Sprite Loop (1).mp3" durch `~/crush.py --preset snes`

## Lorbeerwald La Palma (05.09.2026)
- Kacheln: `create_sidescroller_tileset` Vulkanboden mit Moos `e3e41c50…` (Basis `43a34f40…`) → tiles/la_palma.png (palettisiert OHNE Rottöne/Pink, sonst wurde die Erde knallrot),
  Basalt `946d9759…` (Basis `ed65ac11…`) → tiles/la_palma_stein.png
- Hintergrund (pixflux, palettisiert, per mirror-tile.mjs auf 800 px): Caldera + Sternwarten `501202c2…`, Lorbeerbäume `139a2e21…` (erster Versuch `0e85bdb2…` war pechschwarz),
  Kronen `c05f8d17…` (ab Zeile 85 weich ausgeblendet), Farne `d0401ab8…` (erster Versuch `824bc276…` zu klein, mit Erdstreifen)
- Kulissen (pixflux, palettisiert, zugeschnitten): Vulkan Cumbre Vieja `0e344d50…`, Haus mit Balkonen `1576fa22…`, Los-Tilos-Wasserfall `dd5f1afc…` (erster Versuch `7aa5ef46…` hatte Himmel drin)
- Deko (pixen): Drachenbaum `e8fee217…` (auch als Kulisse), Lorbeerbusch `bac06cdb…`, Glockenblume `1a077d65…`, Lavafels `87f2d275…`, Tajinaste `9bac276a…`, Kiefer `4b9a4f4b…`, Bartflechte `3c811622…`, Osterei `97c2a7ce…`
- Gegner (alle nach links): Graja `6c55e90e…` (pixen) + Flug `8a999bc4…` + Schlaf `018a296c…`; Eidechse `53cbdecc…` (pixflux 48×32; pixen-Versuch `6c63b885…` sah aus wie eine Katze)
  + Lauf `b94fa6c5…` (2 Ausreißer aussortiert) + Sonnen `90cde710…`; Ziege `319586f5…` + Hüpfen `b951e3e1…` (Bild 4 = Sprung-Pose) + Schlaf `cb57782e…`;
  Lorbeertaube `5503605b…` + Wurf `0bdf7bc9…` + Dösen `745d3174…`; Lorbeere (Geschoss) `fc490212…`
- Intro (Pro, 480×270, Rand per edge-fill.mjs): Flugzeugfenster `59b5092b…`, Santa Cruz `2120368c…`, Los Tilos mit Drachenbaum `678e4ec0…`
  (erster Anlauf `52103814…`/`431a4f32…`/`3dcea938…` blieb hängen und wurde als "failed" markiert)
- Musik: music/la_palma.mp3 ("Moonlit Save Point", war schon da)
- Jubelbild (Pro, 480×270, ohne edge-fill): `6376c1d7…` → bg/la_palma_ende.png
