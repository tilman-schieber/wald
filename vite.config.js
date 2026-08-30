import { defineConfig } from 'vite'

// --host steht auch im package.json, hier zur Sicherheit nochmal:
// So kann man das Spiel im WLAN auf dem Handy öffnen.
// base: auf GitHub Pages liegt das Spiel unter https://<name>.github.io/wald/
export default defineConfig({
  base: process.env.GITHUB_PAGES ? '/wald/' : '/',
  server: { host: true, port: 5173 },
})
