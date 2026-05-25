// oxlint-disable typescript/no-extraneous-class
// oxlint-disable no-unused-vars
class Geometry {
	vertices
	modelMatrix
	translationMatrix
	rotationMatrix
	scaleMatrix

	positionSize
	colorSize
	uvSize
	normalSize
	floatsPerVertex
	vertexBuffer: WebGLBuffer | null

	baseColor
	texColorWeight
	textureIndex
	unlit

	kind

	constructor() {
		this.vertices = new Float32Array([0, 0.3, -0.3, -0.3, 0.3, -0.3])
		this.modelMatrix = new Matrix4()
		this.translationMatrix = new Matrix4()
		this.rotationMatrix = new Matrix4()
		this.scaleMatrix = new Matrix4()

		this.positionSize = 2
		this.colorSize = 0
		this.uvSize = 2
		this.normalSize = 3
		this.floatsPerVertex = 2
		this.vertexBuffer = null

		this.baseColor = [1, 1, 1, 1]
		this.texColorWeight = 1
		this.textureIndex = 0
		this.unlit = false

		this.kind = 'static'
	}

	translate(x: number, y: number, z: number) {
		this.translationMatrix.setTranslate(x, y, z)
	}

	rotateX(angle: number) {
		this.rotationMatrix.setRotate(angle, 1, 0, 0)
	}

	rotateY(angle: number) {
		this.rotationMatrix.setRotate(angle, 0, 1, 0)
	}

	rotateZ(angle: number) {
		this.rotationMatrix.setRotate(angle, 0, 0, 1)
	}

	scale(x: number, y: number, z: number) {
		this.scaleMatrix.setScale(x, y, z)
	}
}
