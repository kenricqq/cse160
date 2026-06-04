import Experience from '../Experience.js'
import Campfire from './Campfire.js'
import Crate from './Crate.js'
import Environment from './Environment.js'
import Firefly from './Firefly.js'
import Floor from './Floor.js'
import Flower from './Flower.js'
import Fox from './Fox.js'
import Rock from './Rock.js'
import Tree from './Tree.js'

export default class World {
	constructor() {
		this.experience = new Experience()
		this.scene = this.experience.scene
		this.resources = this.experience.resources

		this.resources.on('ready', () => {
			// Setup
			this.floor = new Floor()
			this.fox = new Fox()
			this.campfire = new Campfire()
			this.tree = new Tree()
			this.rock = new Rock()
			this.crate = new Crate()
			this.flower = new Flower()
			this.firefly = new Firefly()
			this.environment = new Environment()
		})
	}

	update() {
		if (this.fox) {
			this.fox.update()
		}

		if (this.firefly) {
			this.firefly.update()
		}
	}
}
