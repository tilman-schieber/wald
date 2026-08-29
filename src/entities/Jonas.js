import Hero from './Hero.js'
import { HEROES } from '../config.js'

// Jonas: älter, stärker. Kletterhaken kommt später hier rein.
export default class Jonas extends Hero {
  constructor(scene, x, y) {
    super(scene, x, y, HEROES.jonas)
  }
}
