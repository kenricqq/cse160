import * as THREE from 'three'

import Experience from '../Experience.js'

export default class Rock {
	constructor() {
		this.experience = new Experience()
		this.scene = this.experience.scene
		this.resources = this.experience.resources

		// Setup
		this.rockResources = [
			this.resources.items.rock0Model,
			this.resources.items.rock1Model,
			this.resources.items.rock2Model,
		]

		this.setMeshes()
	}

	setMeshes() {
		const rockSetups = [
			{ type: 0, position: [-4.5, 0, 3], scale: 0.45, rotation: 0.2 },
			{ type: 1, position: [-5, 0, -5], scale: 0.32, rotation: 1.3 },
			{ type: 2, position: [-7, 0, -1], scale: 0.5, rotation: 2.1 },
			{ type: 0, position: [1, 0, 5], scale: 0.28, rotation: 3.6 },
			{ type: 1, position: [0, 0, 6], scale: 0.4, rotation: 4.2 },
			{ type: 2, position: [2, 0, -3], scale: 0.34, rotation: 5.1 },
		]

		this.models = []
		this.dummy = new THREE.Object3D()

		this.rockResources.forEach((resource, type) => {
			const setups = rockSetups.filter((setup) => setup.type === type)
			const sourceMesh = this.getSourceMesh(resource)
			const geometry = sourceMesh.geometry.clone()

			sourceMesh.updateMatrixWorld(true)
			geometry.applyMatrix4(sourceMesh.matrixWorld)

			const mesh = new THREE.InstancedMesh(geometry, sourceMesh.material, setups.length)
			mesh.castShadow = true

			setups.forEach((setup, index) => {
				this.dummy.position.set(...setup.position)
				this.dummy.rotation.set(0, setup.rotation, 0)
				this.dummy.scale.setScalar(setup.scale)
				this.dummy.updateMatrix()
				mesh.setMatrixAt(index, this.dummy.matrix)
			})

			mesh.instanceMatrix.needsUpdate = true

			this.scene.add(mesh)
			this.models.push(mesh)
		})
	}

	getSourceMesh(resource) {
		let sourceMesh = null

		resource.scene.updateMatrixWorld(true)

		resource.scene.traverse((child) => {
			if (!sourceMesh && child instanceof THREE.Mesh) {
				sourceMesh = child
			}
		})

		return sourceMesh
	}
}
