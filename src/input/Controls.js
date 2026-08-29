// ============================================================
//  CONTROLS — Tastatur und Touch werden EIN Kommando
// ============================================================
//  Egal ob Pfeiltaste, WASD oder Finger auf dem Bildschirm:
//  am Ende kommt immer dasselbe Objekt heraus:
//    { left, right, jump, jumpHeld, attack, switch }
//  jump, attack und switch sind nur in dem EINEN Frame wahr, in dem
//  die Taste neu gedrückt wurde. jumpHeld ist wahr, solange man hält.
// ============================================================
import Phaser from 'phaser'

const JustDown = Phaser.Input.Keyboard.JustDown

export default class Controls {
  constructor(scene) {
    const kb = scene.input.keyboard
    this.cursors = kb.createCursorKeys()
    this.keys = kb.addKeys({
      left: 'A', right: 'D', up: 'W',
      jump: 'SPACE', switch: 'TAB', switch2: 'SHIFT',
      attack: 'X', attack2: 'K',
    })
    // Tab soll nicht im Browser "weiterspringen", Leertaste nicht scrollen
    kb.addCapture(['TAB', 'SPACE', 'UP', 'DOWN', 'LEFT', 'RIGHT'])

    this.jumpKeys = [this.cursors.up, this.keys.up, this.keys.jump]
    this.switchKeys = [this.keys.switch, this.keys.switch2]
    this.attackKeys = [this.keys.attack, this.keys.attack2]

    // Wird von TouchButtons.js jeden Frame gesetzt
    this.touch = { left: false, right: false, jump: false, attack: false, switch: false }
    this._prevTouchJump = false
    this._prevTouchSwitch = false
    this._prevTouchAttack = false
  }

  read() {
    const c = this.cursors, k = this.keys, t = this.touch

    const left = c.left.isDown || k.left.isDown || t.left
    const right = c.right.isDown || k.right.isDown || t.right

    // Tastatur: JustDown merkt sich jeden Druck, auch ganz kurze.
    // (Wichtig: für JEDE Taste aufrufen, sonst bleibt ein Druck "hängen".)
    let jump = false
    for (const key of this.jumpKeys) if (JustDown(key)) jump = true
    let sw = false
    for (const key of this.switchKeys) if (JustDown(key)) sw = true
    let attack = false
    for (const key of this.attackKeys) if (JustDown(key)) attack = true

    // Touch: neu gedrückt = jetzt unten, vorher nicht
    if (t.jump && !this._prevTouchJump) jump = true
    if (t.switch && !this._prevTouchSwitch) sw = true
    if (t.attack && !this._prevTouchAttack) attack = true
    this._prevTouchJump = t.jump
    this._prevTouchSwitch = t.switch
    this._prevTouchAttack = t.attack

    const jumpHeld = this.jumpKeys.some((key) => key.isDown) || t.jump

    return { left, right, jump, jumpHeld, attack, switch: sw }
  }
}
