# Woher die Bilder kommen (PixelLab, Standard-Modus, Ansicht "side")

| Datei | PixelLab-ID | Animationen (nur Richtung east, im Spiel gespiegelt) |
|---|---|---|
| sprites/jonas.png  | Charakter `46e662b7-0198-433e-aa4c-0aca2681b06c` | idle `359f2194…` (4), run `841c0ce9…` (6, walking-6-frames), jump `22ed038f…` (9, jumping-1) |
| sprites/leonel.png | Charakter `9c5a608a-7e57-4e94-a3ad-c07282d2b66c` | idle `c7fc8a1b…` (4), run `41d70798…` (6, running-6-frames), jump `4510190a…` (9, jumping-1) |
| tiles/schwarzwald.png | Sidescroller-Tileset `f346a925-dd3d-4070-9760-f34eaec9e8e0` (Basis-Kachel `a61fed35…` zum Anschließen weiterer Sets) | — |

Neu bauen: `node tools/import-character.mjs …` (baut das Spritesheet, richtet die Füße aus),
dann `node tools/palettize.mjs …` (nur Palettenfarben; bei Kacheln die Rottöne ausschließen).
Verbrauch bisher: 11 von 40 Trial-Generierungen.
