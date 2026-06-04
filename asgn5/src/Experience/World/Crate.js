import * as THREE from 'three'

import Experience from '../Experience.js'

export default class Crate {
	constructor() {
		this.experience = new Experience()
		this.scene = this.experience.scene
		this.resources = this.experience.resources

		this.setGeometry()
		this.setTexture()
		this.setMaterial()
		this.setMeshes()
	}

	setGeometry() {
		this.geometry = new THREE.BoxGeometry(1, 1, 1)
	}

	setTexture() {
		this.textures = {}

		this.textures.color = this.resources.items.woodColorTexture
		this.textures.color.colorSpace = THREE.SRGBColorSpace
		this.textures.color.repeat.set(1, 1)
		this.textures.color.wrapS = THREE.RepeatWrapping
		this.textures.color.wrapT = THREE.RepeatWrapping

		this.textures.normal = this.resources.items.woodNormalTexture
		this.textures.normal.colorSpace = THREE.SRGBColorSpace
		this.textures.normal.repeat.set(1, 1)
		this.textures.normal.wrapS = THREE.RepeatWrapping
		this.textures.normal.wrapT = THREE.RepeatWrapping
	}

	setMaterial() {
		this.material = new THREE.MeshStandardMaterial({
			map: this.textures.color,
			normalMap: this.textures.normal,
			roughness: 0.8,
		})
	}

	setMeshes() {
		const crateSetups = [
			{ position: [-1.5, 0.35, -2.0], scale: [0.7, 0.7, 0.7], rotation: 0.35 },
			{ position: [-1.35, 0.25, -1.15], scale: [0.5, 0.5, 0.5], rotation: -0.2 },
			{ position: [-0.65, 0.25, -1.55], scale: [0.5, 0.5, 0.5], rotation: 0.9 },
		]

		this.models = crateSetups.map((setup) => {
			const model = new THREE.Mesh(this.geometry, this.material)

			model.position.set(...setup.position)
			model.scale.set(...setup.scale)
			model.rotation.y = setup.rotation
			model.castShadow = true

			this.scene.add(model)

			return model
		})
	}
}
