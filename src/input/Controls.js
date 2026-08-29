// ============================================================
//  CONTROLS — Tastatur und Touch werden EIN Kommando
// ============================================================
//  Egal ob Pfeiltaste, WASD oder Finger auf dem Bildschirm:
//  am Ende kommt immer dasselbe Objekt heraus:
//    { left, right, jump, jumpHeld, switch }
//  jump und switch sind nur in dem EINEN Frame wahr, in dem die
//  Taste neu gedrückt wurde. jumpHeld ist wahr, solange man hält.
// ============================================================

export default class Controls {
  constructor(scene) {
    const kb = scene.input.keyboard
    this.cursors = kb.createCursorKeys()
    this.keys = kb.addKeys({
      left: 'A', right: 'D', up: 'W',
      jump: 'SPACE', switch: 'TAB', switch2: 'SHIFT',
    })
    // Tab soll nicht im Browser "weiterspringen"
    kb.addCapture(['TAB', 'SPACE', 'UP', 'DOWN', 'LEFT', 'RIGHT'])

    // Wird von TouchButtons.js jeden Frame gesetzt
    this.touch = { left: false, right: false, jump: false, switch: false }

    this._prevJump = false
    this._prevSwitch = false
  }

  read() {
    const c = this.cursors, k = this.keys, t = this.touch

    const left = c.left.isDown || k.left.isDown || t.left
    const right = c.right.isDown || k.right.isDown || t.right
    const jumpHeld = c.up.isDown || k.up.isDown || k.jump.isDown || c.space?.isDown || t.jump
    const switchHeld = k.switch.isDown || k.switch2.isDown || t.switch

    const jump = jumpHeld && !this._prevJump
    const sw = switchHeld && !this._prevSwitch
    this._prevJump = jumpHeld
    this._prevSwitch = switchHeld

    return { left, right, jump, jumpHeld, switch: sw }
  }
}
