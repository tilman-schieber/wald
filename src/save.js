// ============================================================
//  SAVE — Spielstand im Browser merken (localStorage)
// ============================================================
//  Gespeichert wird bei jedem Raumwechsel: Welcher Raum, welcher
//  Eingang, Herzen, geheilte Tiere, offene Tore, Blätter.
//  "Weiter" im Titelbild lädt genau diesen Stand.
// ============================================================
import { world } from './world.js'

const KEY = 'wald-spielstand'

export function saveGame(room, spawn) {
  try {
    const setsToArrays = (obj) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, [...v]]))
    localStorage.setItem(KEY, JSON.stringify({
      room, spawn, active: world.active, hp: world.hp, leaves: world.leaves,
      healed: setsToArrays(world.healed), gatesOpen: setsToArrays(world.gatesOpen), collected: setsToArrays(world.collected),
    }))
  } catch (e) { /* z.B. privates Fenster ohne Speicher – dann eben nicht */ }
}

export function hasSave() {
  try { return localStorage.getItem(KEY) !== null } catch (e) { return false }
}

// Lädt den Stand in "world" und gibt { room, spawn } zurück (oder null)
export function loadGame() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY))
    if (!s) return null
    const arraysToSets = (obj) => Object.fromEntries(Object.entries(obj ?? {}).map(([k, v]) => [k, new Set(v)]))
    world.active = s.active ?? 'jonas'
    world.hp = s.hp
    world.leaves = s.leaves ?? 0
    world.healed = arraysToSets(s.healed)
    world.gatesOpen = arraysToSets(s.gatesOpen)
    world.collected = arraysToSets(s.collected)
    return { room: s.room, spawn: s.spawn }
  } catch (e) { return null }
}

export function clearSave() {
  try { localStorage.removeItem(KEY) } catch (e) { /* egal */ }
}
