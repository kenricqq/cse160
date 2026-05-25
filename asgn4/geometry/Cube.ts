// oxlint-disable typescript/no-extraneous-class
// oxlint-disable no-unused-vars
class Cube extends Geometry {
	vertices

	constructor() {
		super()

		this.positionSize = 3
		this.colorSize = 3
		this.floatsPerVertex = 11

		let data: number[] = []

		function addVertex(
			position: number[],
			color: number[],
			uv: number[],
			normal: number[],
		) {
			data.push(...position, ...color, ...uv, ...normal)
		}

		function addFace(
			normal: number[],
			color: number[],
			p0: number[],
			p1: number[],
			p2: number[],
			p3: number[],
		) {
			addVertex(p0, color, [0, 0], normal)
			addVertex(p1, color, [1, 0], normal)
			addVertex(p2, color, [1, 1], normal)
			addVertex(p0, color, [0, 0], normal)
			addVertex(p2, color, [1, 1], normal)
			addVertex(p3, color, [0, 1], normal)
		}

		addFace([0, 0, 1], [1, 0, 0], [-0.5, -0.5, 0.5], [0.5, -0.5, 0.5], [0.5, 0.5, 0.5], [-0.5, 0.5, 0.5])
		addFace([0, 0, -1], [0, 1, 0], [0.5, -0.5, -0.5], [-0.5, -0.5, -0.5], [-0.5, 0.5, -0.5], [0.5, 0.5, -0.5])
		addFace([1, 0, 0], [0, 0, 1], [0.5, -0.5, 0.5], [0.5, -0.5, -0.5], [0.5, 0.5, -0.5], [0.5, 0.5, 0.5])
		addFace([-1, 0, 0], [0, 1, 1], [-0.5, -0.5, -0.5], [-0.5, -0.5, 0.5], [-0.5, 0.5, 0.5], [-0.5, 0.5, -0.5])
		addFace([0, 1, 0], [1, 1, 0], [-0.5, 0.5, 0.5], [0.5, 0.5, 0.5], [0.5, 0.5, -0.5], [-0.5, 0.5, -0.5])
		addFace([0, -1, 0], [1, 0, 1], [-0.5, -0.5, -0.5], [0.5, -0.5, -0.5], [0.5, -0.5, 0.5], [-0.5, -0.5, 0.5])

		this.vertices = new Float32Array(data)
	}
}
