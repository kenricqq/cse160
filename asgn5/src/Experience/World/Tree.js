import * as THREE from 'three'

import Experience from '../Experience.js'

export default class Tree {
	constructor() {
		this.experience = new Experience()
		this.scene = this.experience.scene
		this.resources = this.experience.resources
		this.time = this.experience.time
		this.debug = this.experience.debug

		// Debug
		if (this.debug.active) {
			this.debugFolder = this.debug.ui.addFolder('tree')
		}

		// Setup
		this.resource = this.resources.items.treeModel

		this.setModel()
	}

	setModel() {
		this.model = this.resource.scene
		this.model.rotation.y = 1.75
		this.model.scale.set(15, 15, 15)
		this.scene.add(this.model)

		// Debug
		if (this.debug.active) {
			this.debugFolder
				.add(this.model.rotation, 'y')
				.name('rotationY')
				.min(0)
				.max(Math.PI * 2)
				.step(0.001)
		}
	}

	update() {}
}
