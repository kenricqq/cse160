'use strict'
// oxlint-disable typescript/no-extraneous-class
// oxlint-disable no-unused-vars
class Geometry {
	constructor() {
		this.vertices = new Float32Array([0, 0.3, -0.3, -0.3, 0.3, -0.3])
		this.modelMatrix = new Matrix4()
		this.translationMatrix = new Matrix4()
		this.rotationMatrix = new Matrix4()
		this.scaleMatrix = new Matrix4()
		this.positionSize = 2
		this.colorSize = 0
		this.floatsPerVertex = 2
	}
	translate(x, y, z) {
		this.translationMatrix.translate(x, y, z)
	}
	rotateX(angle) {
		this.rotationMatrix.rotate(angle, 1, 0, 0)
	}
	rotateY(angle) {
		this.rotationMatrix.rotate(angle, 0, 1, 0)
	}
	rotateZ(angle) {
		this.rotationMatrix.rotate(angle, 0, 0, 1)
	}
	scale(x, y, z) {
		this.scaleMatrix.scale(x, y, z)
	}
}
