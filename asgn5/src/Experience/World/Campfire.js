import * as THREE from 'three'

import Experience from '../Experience.js'

export default class Campfire {
	constructor() {
		this.experience = new Experience()
		this.scene = this.experience.scene
		this.resources = this.experience.resources
		this.time = this.experience.time
		this.debug = this.experience.debug

		// Debug
		if (this.debug.active) {
			this.debugFolder = this.debug.ui.addFolder('campfire')
		}

		// Setup
		this.resource = this.resources.items.campfireModel

		this.setModel()
		this.setLight()
	}

	setModel() {
		this.model = this.resource.scene
		this.model.position.set(-2, 0, 1)
		// this.model.scale.set(0.02, 0.02, 0.02)
		this.scene.add(this.model)

		this.model.traverse((child) => {
			if (child instanceof THREE.Mesh) {
				child.castShadow = true
			}
		})
	}

	setLight() {
		this.lightColor = { color: '#ff7a1a' }
		this.light = new THREE.PointLight('#ff7a1a', 18, 6, 2)
		this.light.position.set(0, 1.4, 0)

		this.model.add(this.light)

		// Debug
		if (this.debug.active) {
			this.debugFolder
				.addColor(this.lightColor, 'color')
				.name('lightColor')
				.onChange(() => {
					this.light.color.set(this.lightColor.color)
				})

			this.debugFolder
				.add(this.light, 'intensity')
				.name('lightIntensity')
				.min(0)
				.max(50)
				.step(0.001)
			this.debugFolder.add(this.light, 'distance').name('lightDistance').min(0).max(20).step(0.001)
			this.debugFolder.add(this.light, 'decay').name('lightDecay').min(0).max(5).step(0.001)
		}
	}
}
