# Woher die Bilder kommen (PixelLab, Standard-Modus, Ansicht "side")

| Datei | PixelLab-ID | Animationen (nur Richtung east, im Spiel gespiegelt) |
|---|---|---|
| sprites/jonas.png  | Charakter `46e662b7-0198-433e-aa4c-0aca2681b06c` | idle `359f2194…` (4), run `841c0ce9…` (6, walking-6-frames), jump `22ed038f…` (9, jumping-1) |
| sprites/leonel.png | Charakter `9c5a608a-7e57-4e94-a3ad-c07282d2b66c` | idle `c7fc8a1b…` (4), run `41d70798…` (6, running-6-frames), jump `4510190a…` (9, jumping-1) |
| bg/schwarzwald_berge.png | Bild (pixflux, Palette) `0d73137c-602c-4136-b208-002103d6d003`, 400×272, gespiegelt verdoppelt | — |
| bg/schwarzwald_baeume.png | Bild (pixflux, Palette) `cc8550f5-b788-4f22-a92e-eccbbcdd2c2d`, Zwischenraum per `tools/colorkey.mjs` (139,155,180) durchsichtig, gespiegelt verdoppelt | — |
| bg/wald_fern.png (Titelbild) | Bild (pixflux, Palette erzwungen) `73621b03-5e20-404a-8a5b-cce466f3ca3d`, 400×272, gespiegelt verdoppelt mit `tools/mirror-tile.mjs` | — |
| (nicht benutzt) | Bild `eec3a745-7137-4348-a6ef-8e3c8b09426f` – zwei Comic-Bäume, zu clipart-haft | — |
| sprites/igel.png | Bild (pixflux, Palette) `ccbfcad3-ae72-4ce5-89e4-fdde198bb55f`, zugeschnitten 23×19 | — |
| sprites/igel_heil.png | Bild (pixflux, Palette) `180538dc-88e0-4afb-a5c0-069f5d91234a`, zugeschnitten 28×26 | — |
| sprites/geist.png | Bild (pixflux, Palette) `03264b0c-ac52-48f8-9553-e7a3e2832233`, zugeschnitten 16×22 | — |
| tiles/schwarzwald.png | Sidescroller-Tileset `f346a925-dd3d-4070-9760-f34eaec9e8e0` (Basis-Kachel `a61fed35…` zum Anschließen weiterer Sets) | — |

Neu bauen: `node tools/import-character.mjs …` (baut das Spritesheet, richtet die Füße aus),
dann `node tools/palettize.mjs …` (nur Palettenfarben; bei Kacheln die Rottöne ausschließen).
Verbrauch bisher: 18 von 40 Trial-Generierungen.
Parallax-Ebenen: "no_background" liefert bei Szenen oft eine gemalte Fläche statt Transparenz → häufigste Farbe mit colorkey.mjs entfernen.
Kleine Sprites: `create_image_pixflux` 32×32 mit `no_background` und Paletten-PNG als `color_image_url`, dann `tools/crop.mjs` + `tools/palettize.mjs`.
