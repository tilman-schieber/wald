import Hero from './Hero.js'
import { HEROES } from '../config.js'

// Leonel: jünger, schneller, kleiner. Waldgeister kommen später hier rein.
export default class Leonel extends Hero {
  constructor(scene, x, y) {
    super(scene, x, y, HEROES.leonel)
  }
}
