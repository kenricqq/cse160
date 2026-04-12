declare function initShaders(gl: WebGLRenderingContext, vshader: string, fshader: string): boolean

type ShapeType = 'Circle' | 'Triangle' | 'Square'

type ShapeCfg = {
	color: number[]
	size: number
	type: ShapeType
	segments: number
	rotationAngle: number
}

type WebGL2RenderingContextWithProgram = WebGL2RenderingContext & {
	program: WebGLProgram
}

function getWebGL2Context(canvas: HTMLCanvasElement): WebGL2RenderingContext | null {
	return canvas.getContext('webgl2', { preserveDrawingBuffer: true })
}

function initShaders2(
	gl: WebGL2RenderingContext,
	vshader: string,
	fshader: string,
): gl is WebGL2RenderingContextWithProgram {
	return initShaders(gl as WebGLRenderingContext, vshader, fshader)
}

const SQUARE = new Float32Array([-1, -1, 0.0, 1, -1, 0.0, 1, 1, 0.0, -1, 1, 0.0])
const TRIANGLE = new Float32Array([-1, -1, 0.0, 1, -1, 0.0, 0.0, 1, 0.0])

// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
	attribute vec4 a_Position;
	void main() {
	  gl_Position = a_Position;
	  gl_PointSize = 10.0;
	}
`

// Fragment shader program
var FSHADER_SOURCE = `
	precision mediump float;
	// uniform vec4 u_FragColor; // uniform変数
	uniform vec3 u_Color;
	void main() {
	  // gl_FragColor = u_FragColor;
	  gl_FragColor = vec4(u_Color, 1.0);
	}
`

var shapeCfg: ShapeCfg = {
	color: [0.5, 0.5, 0.5, 1.0],
	size: 0.2,
	type: 'Triangle',
	segments: 20,
	rotationAngle: 0,
}

var shapesList: Shape[] = []

class Shape {
	color
	position
	type
	size
	rotationAngle
	vertices

	constructor(pos: [number, number], cfg: ShapeCfg) {
		const { color, type, size, segments, rotationAngle: rotation } = cfg

		this.position = pos
		this.color = color.slice()
		this.type = type
		this.size = size
		this.rotationAngle = rotation

		if (type === 'Circle') {
			this.vertices = createCircle(segments)
		} else if (type === 'Square') {
			this.vertices = SQUARE
		} else {
			this.vertices = TRIANGLE
		}
	}

	render(gl: WebGL2RenderingContextWithProgram) {
		const translated = new Float32Array(this.vertices)
		const cos = Math.cos(this.rotationAngle)
		const sin = Math.sin(this.rotationAngle)

		for (let i = 0; i < translated.length; i += 3) {
			const x = translated[i] * this.size
			const y = translated[i + 1] * this.size

			translated[i] = x * cos - y * sin + this.position[0]
			translated[i + 1] = x * sin + y * cos + this.position[1]
		}

		let vertexBuffer = gl.createBuffer()
		if (!vertexBuffer) {
			console.log('Failed to create Buffer')
			return -1
		}

		gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)

		let glslVariables = connectVariablesToGLSL(gl)

		let { a_Position } = glslVariables

		gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0)
		gl.enableVertexAttribArray(a_Position)

		gl.bufferData(gl.ARRAY_BUFFER, translated, gl.STATIC_DRAW)

		let u_Color = gl.getUniformLocation(gl.program, 'u_Color')

		gl.uniform3f(u_Color, this.color[0], this.color[1], this.color[2])

		gl.drawArrays(gl.TRIANGLE_FAN, 0, translated.length / 3)
	}
}

function renderAllShapes(gl: WebGL2RenderingContextWithProgram) {
	clearCanvas(gl)

	for (const shape of shapesList) {
		shape.render(gl)
	}

	console.log(shapesList)
}

function click(e: MouseEvent, gl: WebGL2RenderingContextWithProgram, canvas: HTMLCanvasElement) {
	let x = e.clientX // x coordinate of a mouse pointer
	let y = e.clientY // y coordinate of a mouse pointer

	if (e.buttons === 1) {
		let rect = canvas.getBoundingClientRect()
		x = (x - rect.left - canvas.width / 2) / (canvas.width / 2)
		y = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2)

		const pos = [x, y] as [number, number]
		console.log(x, y)

		// create Shape
		const shape = new Shape(pos, shapeCfg)
		shapesList.push(shape)

		// draw Shapes
		renderAllShapes(gl)
	}
}

function generateCircleOutline(segments = 20, radius = 0.8, size = 0.08): Shape[] {
	let shapes: Shape[] = []

	for (let i = 0; i < segments; i++) {
		const angle = (i / segments) * 2 * Math.PI
		const x = Math.sin(angle) * radius
		const y = Math.cos(angle) * radius
		shapes.push(
			new Shape([x, y], {
				color: [
					Math.cos(angle) * 0.5 + 0.5,
					Math.cos(angle) * 0.7 + 0.1 * Math.random(),
					Math.sin(angle) * 0.7 + 0.1 * Math.random(),
					1.0,
				],
				size,
				type: 'Triangle',
				segments: 20,
				rotationAngle: -angle,
			}),
		)
	}

	return shapes
}

function generateSquareLines(start: [number, number], end: [number, number], count = 10): Shape[] {
	let shapes: Shape[] = []

	for (let i = 0; i < count; i++) {
		const t = count === 1 ? 0 : i / (count - 1)
		const x = start[0] + (end[0] - start[0]) * t
		const y = start[1] + (end[1] - start[1]) * t
		shapes.push(
			new Shape([x, y], {
				color: [0.7, 0.7, 0.8, 1.0],
				size: 1 / 20,
				type: 'Square',
				segments: 20,
				rotationAngle: 0,
			}),
		)
	}

	return shapes
}

function getSpecialShape(): Shape[] {
	return [
		...generateCircleOutline(),
		...generateSquareLines([-0.7, -0.7], [-0.7, 0]),
		...generateSquareLines([-0.6, -0.4], [-0.2, 0], 6),
		...generateSquareLines([-0.6, -0.4], [-0.2, -0.7], 6),
		...generateSquareLines([-0.2, 0], [0.3, 0.0], 6),
		...generateSquareLines([0, 0], [0, -0.7]),
	]
}

function main() {
	let { canvas, gl } = setupWebGL()

	if (!initShaders2(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
		console.log('Failed to intialize shaders.')
		return -1
	}

	clearCanvas(gl)

	canvas.addEventListener('mousedown', function (e) {
		click(e, gl, canvas)
	})
	canvas.addEventListener('mousemove', function (e) {
		click(e, gl, canvas)
	})
	// canvas.onmousedown = function (ev) {
	// 	click(ev, gl, canvas, a_Position, u_FragColor)
	// }

	const clearCanvasBtn = document.getElementById('clearCanvas')
	if (!(clearCanvasBtn instanceof HTMLButtonElement)) return -1
	clearCanvasBtn.addEventListener('click', function () {
		shapesList = []
		clearCanvas(gl)
	})

	// DRAWING MODE
	const square = document.getElementById('square')
	if (!(square instanceof HTMLButtonElement)) return -1
	square.addEventListener('click', function () {
		shapeCfg.type = 'Square'
	})

	const triangle = document.getElementById('triangle')
	if (!(triangle instanceof HTMLButtonElement)) return -1
	triangle.addEventListener('click', function () {
		shapeCfg.type = 'Triangle'
	})

	const circle = document.getElementById('circle')
	if (!(circle instanceof HTMLButtonElement)) return -1
	circle.addEventListener('click', function () {
		shapeCfg.type = 'Circle'
	})

	// SHAPE COLORS
	const redSlider = document.getElementById('redSlider')
	if (!(redSlider instanceof HTMLInputElement)) return -1
	redSlider.addEventListener('mouseup', function () {
		shapeCfg.color[0] = Number(this.value) / 20
	})

	const greenSlider = document.getElementById('greenSlider')
	if (!(greenSlider instanceof HTMLInputElement)) return -1
	greenSlider.addEventListener('mouseup', function () {
		shapeCfg.color[1] = Number(this.value) / 20
	})

	const blueSlider = document.getElementById('blueSlider')
	if (!(blueSlider instanceof HTMLInputElement)) return -1
	blueSlider.addEventListener('mouseup', function () {
		shapeCfg.color[2] = Number(this.value) / 20
	})

	// SHAPE SIZE
	const shapeSizeSlider = document.getElementById('shapeSize')
	if (!(shapeSizeSlider instanceof HTMLInputElement)) return -1
	shapeSizeSlider.addEventListener('mouseup', function () {
		console.log(this.value)
		shapeCfg.size = Number(this.value) / 50
	})

	// SHAPE SEGMENTS
	const segmentSlider = document.getElementById('segmentCount')
	if (!(segmentSlider instanceof HTMLInputElement)) return -1
	segmentSlider.addEventListener('mouseup', function () {
		console.log(this.value)
		shapeCfg.segments = Number(this.value)
	})

	// SHAPE ROTATION
	const rotationSlider = document.getElementById('rotation')
	if (!(rotationSlider instanceof HTMLInputElement)) return -1
	rotationSlider.addEventListener('mouseup', function () {
		console.log(this.value)
		shapeCfg.rotationAngle = (Number(this.value) / 20) * Math.PI * 2
	})

	// SPECAIL SHAPE
	const specialShape = document.getElementById('special')
	const refImg = document.getElementById('refImg')
	if (!(refImg instanceof HTMLImageElement)) return -1
	if (!(specialShape instanceof HTMLButtonElement)) return -1
	specialShape.addEventListener('click', function () {
		refImg.hidden = false
		shapesList = getSpecialShape()
		renderAllShapes(gl)
	})
}

function clearCanvas(gl: WebGL2RenderingContext) {
	gl.clearColor(0.0, 0.0, 0.0, 1.0)
	gl.clear(gl.COLOR_BUFFER_BIT)
}

function createCircle(segments: number): Float32Array {
	let vertices = []
	for (let i = 0; i < segments; i++) {
		const angle = (i / segments) * 2 * Math.PI
		const x = Math.sin(angle)
		const y = Math.cos(angle)
		vertices.push(x, y, 0)
	}

	return new Float32Array(vertices)
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

function connectVariablesToGLSL(gl: WebGL2RenderingContextWithProgram) {
	// Get the storage location of a_Position
	var a_Position = gl.getAttribLocation(gl.program, 'a_Position')
	if (a_Position < 0) {
		console.log('Failed to get the storage location of a_Position')
		throw new Error('Failed to get the storage location of a_Position')
	}

	// Get the storage location of u_FragColor
	// var u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor')
	// if (!u_FragColor) {
	// 	console.log('Failed to get the storage location of u_FragColor')
	// 	throw new Error('Failed to get the storage location of u_FragColor')
	// }

	// return { a_Position, u_FragColor }
	return { a_Position }
}
