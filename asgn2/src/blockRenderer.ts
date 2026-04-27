export const VSHADER_SOURCE = `
	attribute vec4 a_Position;
	uniform mat4 u_GlobalRotation;
	uniform mat4 u_ModelMatrix;
	void main() { gl_Position = u_GlobalRotation * u_ModelMatrix * a_Position; }
`
export const FSHADER_SOURCE = `
	precision mediump float;
	uniform vec4 u_FragColor;
	void main() { gl_FragColor = u_FragColor; }
`

// Cube shading
const FACE_SHADE = [0.82, 0.7, 0.95, 0.78, 1.08, 0.66]

function extractPositions(source: Float32Array) {
	const positions: number[] = []
	for (let i = 0; i < source.length; i += 6) positions.push(source[i], source[i + 1], source[i + 2])
	return new Float32Array(positions)
}

// Shape renderer
export class BlockRenderer {
	private readonly cubeBuffer: WebGLBuffer
	private readonly sphereBuffer: WebGLBuffer
	private readonly sphereVertexCount: number
	private readonly positionAttribute: number
	private readonly modelMatrix: WebGLUniformLocation
	private readonly globalRotation: WebGLUniformLocation
	private readonly fragmentColor: WebGLUniformLocation

	constructor(private readonly gl: WebGL2RenderingContextWithProgram) {
		const modelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix')
		const globalRotation = gl.getUniformLocation(gl.program, 'u_GlobalRotation')
		const fragmentColor = gl.getUniformLocation(gl.program, 'u_FragColor')
		const cubeBuffer = gl.createBuffer(),
			sphereBuffer = gl.createBuffer()
		this.positionAttribute = gl.getAttribLocation(gl.program, 'a_Position')
		if (
			this.positionAttribute < 0 ||
			!modelMatrix ||
			!globalRotation ||
			!fragmentColor ||
			!cubeBuffer ||
			!sphereBuffer
		)
			throw new Error('Failed to init renderer')

		this.modelMatrix = modelMatrix
		this.globalRotation = globalRotation
		this.fragmentColor = fragmentColor
		this.cubeBuffer = cubeBuffer
		this.sphereBuffer = sphereBuffer

		const sphere = new Sphere()
		this.sphereVertexCount = sphere.vertices.length / 6

		this.upload(cubeBuffer, extractPositions(new Cube().vertices))
		this.upload(sphereBuffer, extractPositions(sphere.vertices))
	}

	setGlobalRotation(m: Matrix4) {
		this.gl.uniformMatrix4fv(this.globalRotation, false, m.elements)
	}
	box(base: Matrix4, color: Vec4, translate: Vec3, scale: Vec3, rotateZ = 0) {
		this.boxRot(base, color, translate, scale, [0, 0, rotateZ])
	}

	sphere(base: Matrix4, color: Vec4, translate: Vec3, scale: Vec3, rotateZ = 0) {
		this.drawShape(this.sphereBuffer, this.sphereVertexCount, base, color, translate, scale, [
			0,
			0,
			rotateZ,
		])
	}
	boxRot(base: Matrix4, color: Vec4, translate: Vec3, scale: Vec3, rotation: Vec3 = [0, 0, 0]) {
		this.drawShape(this.cubeBuffer, 36, base, color, translate, scale, rotation, true)
	}

	private upload(buffer: WebGLBuffer, vertices: Float32Array) {
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer)
		this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW)
	}

	// Draw primitive
	private drawShape(
		buffer: WebGLBuffer,
		count: number,
		base: Matrix4,
		color: Vec4,
		translate: Vec3,
		scale: Vec3,
		rotation: Vec3,
		shadePerFace = false,
	) {
		const model = new Matrix4(base).translate(translate[0], translate[1], translate[2])
		if (rotation[0]) model.rotate(rotation[0], 1, 0, 0)
		if (rotation[1]) model.rotate(rotation[1], 0, 1, 0)
		if (rotation[2]) model.rotate(rotation[2], 0, 0, 1)
		model.scale(scale[0], scale[1], scale[2])

		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer)
		this.gl.vertexAttribPointer(this.positionAttribute, 3, this.gl.FLOAT, false, 0, 0)
		this.gl.enableVertexAttribArray(this.positionAttribute)
		this.gl.uniformMatrix4fv(this.modelMatrix, false, model.elements)

		if (!shadePerFace) {
			this.gl.uniform4f(this.fragmentColor, color[0], color[1], color[2], color[3])
			this.gl.drawArrays(this.gl.TRIANGLES, 0, count)
			return
		}
		for (let face = 0; face < 6; face++) {
			const shade = FACE_SHADE[face],
				lift = color[0] < 0.08 ? Math.max(0, shade - 0.75) * 0.04 : 0
			this.gl.uniform4f(
				this.fragmentColor,
				Math.min(1, color[0] * shade + lift),
				Math.min(1, color[1] * shade + lift),
				Math.min(1, color[2] * shade + lift),
				color[3],
			)
			this.gl.drawArrays(this.gl.TRIANGLES, face * 6, 6)
		}
	}
}
