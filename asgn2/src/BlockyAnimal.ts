// oxlint-disable typescript/triple-slash-reference
/// <reference path="../lib/cuon-matrix-cse160.ts" />
/// <reference path="../lib/webgl-helpers.ts" />
/// <reference path="../geometry/Geometry.ts" />
/// <reference path="../geometry/Triangle.ts" />
/// <reference path="../geometry/Cube.ts" />

// RotatedTranslatedTriangle.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
	attribute vec4 a_Position;

	attribute vec4 a_Color;
	varying vec4 v_Color;

	// uniform mat4 u_GlobalRotation;
	uniform mat4 u_ModelMatrix;

	void main() {
	  // gl_Position = u_GlobalRotation * u_ModelMatrix * a_Position;
	  gl_Position = u_ModelMatrix * a_Position;
	  v_Color = a_Color;
	}
`
// Fragment shader program
var FSHADER_SOURCE = `
	precision mediump float;

	varying vec4 v_Color;

	void main() {
	  gl_FragColor = v_Color;
	}
`

let shapes: Geometry[] = []
let gAnimalGlobalRotation = 0

function initVertexBuffers(gl: WebGL2RenderingContextWithProgram, shape: Geometry) {
	var n = shape.vertices.length / shape.floatsPerVertex // The number of vertices

	// Create a buffer object
	var vertexBuffer = gl.createBuffer()
	if (!vertexBuffer) {
		console.log('Failed to create the buffer object')
		return -1
	}

	// Bind the buffer object to target
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
	// Write date into the buffer object
	gl.bufferData(gl.ARRAY_BUFFER, shape.vertices, gl.STATIC_DRAW)

	const FLOAT_SIZE = Float32Array.BYTES_PER_ELEMENT
	const stride = shape.floatsPerVertex * FLOAT_SIZE

	let a_Position = gl.getAttribLocation(gl.program, 'a_Position')
	if (a_Position < 0) {
		console.log('Failed to get the storage location of a_Position')
		return -1
	}
	gl.vertexAttribPointer(a_Position, shape.positionSize, gl.FLOAT, false, stride, 0)
	gl.enableVertexAttribArray(a_Position)

	let a_Color = gl.getAttribLocation(gl.program, 'a_Color')
	if (a_Color < 0) {
		console.log('Failed to get the storage location of a_Color')
		return -1
	}
	gl.vertexAttribPointer(
		a_Color,
		shape.colorSize,
		gl.FLOAT,
		false,
		stride,
		shape.positionSize * FLOAT_SIZE,
	)
	gl.enableVertexAttribArray(a_Color)

	return n
}

function animate(gl: WebGL2RenderingContextWithProgram) {
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

	gAnimalGlobalRotation += 1
	for (let s of shapes) {
		s.rotateY(gAnimalGlobalRotation)
		draw(gl, s)
	}

	requestAnimationFrame(() => animate(gl))
}

function draw(gl: WebGL2RenderingContextWithProgram, shape: Geometry) {
	// Write the positions of vertices to a vertex shader
	let n = initVertexBuffers(gl, shape)
	if (n < 0) {
		console.log('Failed to set the positions of the vertices')
		return
	}

	shape.modelMatrix
		.multiply(shape.translationMatrix)
		.multiply(shape.rotationMatrix)
		.multiply(shape.scaleMatrix)

	// Pass the model matrix to the vertex shader
	let u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix')
	if (!u_ModelMatrix) {
		console.log('Failed to get the storage location of u_ModelMatrix')
		return
	}
	gl.uniformMatrix4fv(u_ModelMatrix, false, shape.modelMatrix.elements)

	// Pass the model matrix to the vertex shader
	// let u_GlobalRotation = gl.getUniformLocation(gl.program, 'u_GlobalRotation')
	// if (!gAnimalGlobalRotation) {
	// 	console.log('Failed to get the storage location of u_GlobalRotation')
	// 	return
	// }
	// gl.uniformMatrix4fv(u_GlobalRotation, false, shape.modelMatrix.elements)

	gl.drawArrays(gl.TRIANGLES, 0, n)
	// gl.drawArrays(gl.LINE_LOOP, 0, n) // wireframe}

	shape.modelMatrix.setIdentity()
}

// oxlint-disable-next-line no-unused-vars
function main() {
	let { gl } = setupWebGL()

	gl.enable(gl.DEPTH_TEST)
	gl.clearColor(0, 0, 0, 1)

	if (!initShaders2(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
		console.log('Failed to intialize shaders.')
		return -1
	}

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

	let cube1 = new Cube()
	cube1.rotateY(45)
	cube1.translate(0, 0.2, 0)

	shapes.push(cube1)

	let tri1 = new Triangle()
	tri1.translate(0, -0.2, 0)
	tri1.rotateY(45)

	shapes.push(tri1)

	animate(gl)
}

window.addEventListener('load', main)
