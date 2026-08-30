// ============================================================
//  WORLD — alles, was beim Raumwechsel NICHT vergessen wird
// ============================================================
//  Jede GameScene ist nur ein Raum. Wechselt man den Raum, wird die
//  Szene neu aufgebaut. Damit Herzen, geheilte Tiere und offene Tore
//  erhalten bleiben, stehen sie hier – außerhalb der Szene.
// ============================================================
import { COMBAT } from './config.js'

export const world = {
  active: 'jonas',                               // wer gerade gesteuert wird
  hp: { jonas: COMBAT.heroHp, leonel: COMBAT.heroHp },
  healed: {},                                    // { raumKey: Set(gegnerId) }
  gatesOpen: {},                                 // { raumKey: Set(torName) }  (per Hebel dauerhaft offen)
  leaves: 0,                                     // gesammelte Blätter
  collected: {},                                 // { raumKey: Set(blattId) }
  musicOff: false,
  forest: 'schwarzwald',                         // in welchem Wald wir gerade sind
  finished: {},                                  // welche Wälder schon gerettet sind
}

export function healedIn(room) {
  return (world.healed[room] ??= new Set())
}
export function collectedIn(room) {
  return (world.collected[room] ??= new Set())
}
export function gatesOpenIn(room) {
  return (world.gatesOpen[room] ??= new Set())
}
