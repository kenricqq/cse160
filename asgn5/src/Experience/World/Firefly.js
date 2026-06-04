import * as THREE from 'three'

import Experience from '../Experience.js'
import fireflyFragmentShader from './shaders/firefly/fragment.glsl?raw'
import fireflyVertexShader from './shaders/firefly/vertex.glsl?raw'

export default class Firefly {
	constructor() {
		this.experience = new Experience()
		this.scene = this.experience.scene
		this.time = this.experience.time
		this.sizes = this.experience.sizes

		this.setGeometry()
		this.setMaterial()
		this.setPoints()

		this.sizes.on('resize.firefly', () => {
			this.resize()
		})
	}

	setGeometry() {
		const clusters = [
			{ center: [-2, 1.0, 1], radius: 2.0, height: 1.5, count: 20 },
			{ center: [3, 0.9, 3], radius: 1.5, height: 1.2, count: 10 },
			{ center: [0, 1.3, -4], radius: 3.0, height: 1.8, count: 8 },
		]

		const count = clusters.reduce((total, cluster) => total + cluster.count, 0)
		const positions = new Float32Array(count * 3)
		const colors = new Float32Array(count * 3)
		const scales = new Float32Array(count)
		const phases = new Float32Array(count)
		const drift = new Float32Array(count * 3)
		const yellow = new THREE.Color('#fff36a')
		const green = new THREE.Color('#8cff6a')

		let index = 0

		for (const cluster of clusters) {
			for (let i = 0; i < cluster.count; i++) {
				const i3 = index * 3
				const angle = Math.random() * Math.PI * 2
				const radius = Math.sqrt(Math.random()) * cluster.radius
				const color = yellow.clone().lerp(green, Math.random() * 0.45)

				positions[i3] = cluster.center[0] + Math.cos(angle) * radius
				positions[i3 + 1] = cluster.center[1] + (Math.random() - 0.5) * cluster.height
				positions[i3 + 2] = cluster.center[2] + Math.sin(angle) * radius

				colors[i3] = color.r
				colors[i3 + 1] = color.g
				colors[i3 + 2] = color.b

				scales[index] = 0.7 + Math.random() * 0.9
				phases[index] = Math.random() * Math.PI * 2

				drift[i3] = 0.08 + Math.random() * 0.28
				drift[i3 + 1] = 0.04 + Math.random() * 0.14
				drift[i3 + 2] = 0.08 + Math.random() * 0.28

				index++
			}
		}

		this.geometry = new THREE.BufferGeometry()
		this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
		this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
		this.geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1))
		this.geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1))
		this.geometry.setAttribute('aDrift', new THREE.BufferAttribute(drift, 3))
	}

	setMaterial() {
		this.material = new THREE.ShaderMaterial({
			depthWrite: false,
			blending: THREE.AdditiveBlending,
			transparent: true,
			vertexColors: true,
			vertexShader: fireflyVertexShader,
			fragmentShader: fireflyFragmentShader,
			uniforms: {
				uTime: { value: 0 },
				uSize: { value: 80 * this.sizes.pixelRatio },
			},
		})
	}

	setPoints() {
		this.points = new THREE.Points(this.geometry, this.material)
		this.points.frustumCulled = false
		this.scene.add(this.points)
	}

	resize() {
		this.material.uniforms.uSize.value = 80 * this.sizes.pixelRatio
	}

	update() {
		this.material.uniforms.uTime.value = this.time.elapsed * 0.001
	}
}
