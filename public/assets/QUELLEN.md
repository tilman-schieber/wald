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
