'use strict'
// oxlint-disable typescript/no-extraneous-class
// oxlint-disable no-unused-vars
class Sphere extends Geometry {
	constructor(rows = 8, cols = 16) {
		super()
		this.positionSize = 3
		this.colorSize = 3
		this.floatsPerVertex = 6
		const vertices = []
		const pushVertex = (theta, phi) => {
			const radiusAtTheta = 0.5 * Math.sin(theta)
			vertices.push(
				radiusAtTheta * Math.cos(phi),
				0.5 * Math.cos(theta),
				radiusAtTheta * Math.sin(phi),
				1,
				1,
				1,
			)
		}
		for (let row = 0; row < rows; row++) {
			const theta0 = (row / rows) * Math.PI,
				theta1 = ((row + 1) / rows) * Math.PI
			for (let col = 0; col < cols; col++) {
				const phi0 = (col / cols) * Math.PI * 2,
					phi1 = ((col + 1) / cols) * Math.PI * 2
				pushVertex(theta0, phi0)
				pushVertex(theta1, phi0)
				pushVertex(theta1, phi1)
				pushVertex(theta0, phi0)
				pushVertex(theta1, phi1)
				pushVertex(theta0, phi1)
			}
		}
		this.vertices = new Float32Array(vertices)
	}
}
