# W.A.L.D. — Wächter Aller Lebenden Dinge

Ein 2D-Pixel-Art-Abenteuer, gebaut von Tilman mit Jonas und Leonel – die beiden sind auch die Helden.
Der Wald verstummt, und die zwei Brüder bringen ihn zurück: Verwirrte Tiere werden nicht besiegt, sondern **geheilt**.

**Spielen:** https://tilman-schieber.github.io/wald/

- Pfeile/WASD laufen, Leertaste springen, X schlagen, E Fähigkeit (Jonas: Stampfer, Leonel: Waldgeist),
  Tab wechseln, C „Komm!“, ↑ an Ranken klettern (Jonas), ↓ ducken, P Pause, M Musik
- Läuft auch auf dem Handy (Touch-Knöpfe)

## Entwickeln
```
npm install
npm run dev      # http://localhost:5173 – mit --host auch im WLAN
```
Phaser 3 + Vite, reines JavaScript. Grafik von PixelLab (Herkunft in `public/assets/QUELLEN.md`), alle Zahlen in `src/config.js`.
