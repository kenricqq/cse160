// oxlint-disable typescript/no-extraneous-class
// oxlint-disable no-unused-vars
class Triangle extends Geometry {
	vertices

	constructor() {
		super()
		// prettier-ignore
		this.vertices = new Float32Array([
			-0.5, -0.5, 0,  1.0, 0.0, 0.0,
			 0.5, -0.5, 0,  0.0, 1.0, 0.0,
			 0.0,  0.5, 0,  0.0, 0.0, 1.0,
		])
		this.positionSize = 3
		this.colorSize = 3
		this.floatsPerVertex = 6
	}
}
