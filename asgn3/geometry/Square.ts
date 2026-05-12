// oxlint-disable typescript/no-extraneous-class
// oxlint-disable no-unused-vars
class Square extends Geometry {
	vertices

	constructor() {
		super()
		// prettier-ignore
		this.vertices = new Float32Array([
			// first 3 elems: position (x, y, z)
			// next 3 elems: color (r, g, b)
			// next 2 elems: texture coords (u, v)

			// -0.5, -0.5, 0,  1.0, 0.0, 0.0,  0.0, 0.0, // bottom left
			//  0.5, -0.5, 0,  0.0, 1.0, 0.0,  1.0, 0.0,// bottom right
			//  0.0,  0.5, 0,  0.0, 0.0, 1.0,  0.5, 1.0,// top point

			// Triangle 1
			-1.0,  1.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0,
			-1.0, -1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0,
			 1.0, -1.0, 0.0, 0.0, 0.0, 1.0, 1.0, 0.0,

			// Triangle 2
			-1.0,  1.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0,
			 1.0,  1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0,
			 1.0, -1.0, 0.0, 0.0, 0.0, 1.0, 1.0, 0.0,
		])
		this.positionSize = 3
		this.colorSize = 3
		this.floatsPerVertex = 8
	}
}
