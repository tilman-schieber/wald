import { defineConfig } from 'vite'

// --host steht auch im package.json, hier zur Sicherheit nochmal:
// So kann man das Spiel im WLAN auf dem Handy öffnen.
export default defineConfig({
  server: { host: true, port: 5173 },
})
