declare function initShaders(gl: WebGLRenderingContext, vshader: string, fshader: string): boolean

function getWebGL2Context(canvas: HTMLCanvasElement): WebGL2RenderingContext | null {
	return canvas.getContext('webgl2', { preserveDrawingBuffer: true })
}

type WebGL2RenderingContextWithProgram = WebGL2RenderingContext & {
	program: WebGLProgram
}

function initShaders2(
	gl: WebGL2RenderingContext,
	vshader: string,
	fshader: string,
): gl is WebGL2RenderingContextWithProgram {
	return initShaders(gl as WebGLRenderingContext, vshader, fshader)
}

function setupWebGL() {
	let canvas = document.getElementById('webgl')
	if (!(canvas instanceof HTMLCanvasElement) || !canvas) {
		throw new Error('Failed to get the canvas element')
	}

	let gl = getWebGL2Context(canvas)
	if (!gl) {
		throw new Error('Failed to get the rendering context for WebGL2')
	}

	return { canvas, gl }
}

// RotatedTranslatedTriangle.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE =
	'attribute vec4 a_Position;\n' +
	'uniform mat4 u_ModelMatrix;\n' +
	'void main() {\n' +
	'  gl_Position = u_ModelMatrix * a_Position;\n' +
	'}\n'

// Fragment shader program
// oxlint-disable-next-line no-useless-concat
var FSHADER_SOURCE = 'void main() {\n' + '  gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);\n' + '}\n'

// oxlint-disable-next-line no-unused-vars
function main() {
	let { gl } = setupWebGL()

	if (!initShaders2(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
		console.log('Failed to intialize shaders.')
		return -1
	}

	// Write the positions of vertices to a vertex shader
	var n = initVertexBuffers(gl)
	if (n < 0) {
		console.log('Failed to set the positions of the vertices')
		return
	}

	// Create Matrix4 object for model transformation
	var modelMatrix = new Matrix4()

	// Calculate a model matrix
	var ANGLE = 60.0 // The rotation angle
	var Tx = 0.5 // Translation distance
	modelMatrix.setRotate(ANGLE, 0, 0, 1) // Set rotation matrix
	modelMatrix.translate(Tx, 0, 0) // Multiply modelMatrix by the calculated translation matrix

	// Pass the model matrix to the vertex shader
	var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix')
	if (!u_ModelMatrix) {
		console.log('Failed to get the storage location of u_xformMatrix')
		return
	}
	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements)

	// Specify the color for clearing <canvas>
	gl.clearColor(0, 0, 0, 1)

	// Clear <canvas>
	gl.clear(gl.COLOR_BUFFER_BIT)

	// Draw the rectangle
	gl.drawArrays(gl.TRIANGLES, 0, n)
}

function initVertexBuffers(gl: WebGL2RenderingContextWithProgram) {
	var vertices = new Float32Array([0, 0.3, -0.3, -0.3, 0.3, -0.3])
	var n = 3 // The number of vertices

	// Create a buffer object
	var vertexBuffer = gl.createBuffer()
	if (!vertexBuffer) {
		console.log('Failed to create the buffer object')
		return -1
	}

	// Bind the buffer object to target
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
	// Write date into the buffer object
	gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)

	var a_Position = gl.getAttribLocation(gl.program, 'a_Position')
	if (a_Position < 0) {
		console.log('Failed to get the storage location of a_Position')
		return -1
	}
	// Assign the buffer object to a_Position variable
	gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0)

	// Enable the assignment to a_Position variable
	gl.enableVertexAttribArray(a_Position)

	return n
}
