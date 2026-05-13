// RotatedTranslatedTriangle.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
	attribute vec4 a_Position;
	attribute vec4 a_Color;
	attribute vec2 a_UV;

	varying vec4 v_Color;
	varying vec2 v_UV;

	// uniform mat4 u_GlobalRotation;
	uniform mat4 u_ModelMatrix;
	uniform mat4 u_viewMatrix;
	uniform mat4 u_projectionMatrix;

	void main() {
	  // gl_Position = u_GlobalRotation * u_ModelMatrix * a_Position;

	  v_Color = a_Color;
	  v_UV = a_UV;
	  gl_Position = u_projectionMatrix * u_viewMatrix * u_ModelMatrix * a_Position;
	}
`
// Fragment shader program
var FSHADER_SOURCE = `
	precision mediump float;

	varying vec4 v_Color;
	varying vec2 v_UV;

	uniform sampler2D u_Sampler0;
	uniform sampler2D u_Sampler1;
	uniform int u_TextureIndex;
	uniform vec4 u_baseColor;
	uniform float u_texColorWeight;
	uniform float u_swirlAmount;
	uniform float u_reflectAmount;

	vec4 readTexture(vec2 uv) {
		if (u_TextureIndex == 0) {
			return texture2D(u_Sampler0, uv);
		}
		return texture2D(u_Sampler1, uv);
	}

	void main() {
	  // gl_FragColor = v_Color;
	  vec2 centered = v_UV - vec2(0.5, 0.5);
	  float radius = length(centered);
	  float angle = u_swirlAmount * (1.0 - smoothstep(0.0, 0.75, radius));
	  float s = sin(angle);
	  float c = cos(angle);
	  vec2 swirledUV = vec2(
			centered.x * c - centered.y * s,
			centered.x * s + centered.y * c
	  ) + vec2(0.5, 0.5);
	  swirledUV = clamp(swirledUV, 0.0, 1.0);

	  vec4 texColor = readTexture(swirledUV);
	  vec4 reflectedColor = readTexture(vec2(1.0 - swirledUV.x, swirledUV.y));
	  float reflectionSide = smoothstep(0.45, 0.55, v_UV.x);
	  texColor = mix(texColor, reflectedColor, reflectionSide * u_reflectAmount);

		gl_FragColor = (1.0 - u_texColorWeight) * u_baseColor + u_texColorWeight * texColor;
	}
`

let shapes: Geometry[] = []
// oxlint-disable-next-line typescript/no-explicit-any
let shaderVars: any
let gAnimalGlobalRotation = 0
let crazyEffectEnabled = false

function loadWorld(
	gl: WebGL2RenderingContextWithProgram,
	src1: string,
	src2: string,
	camera: Camera,
) {
	var texture0 = gl.createTexture()
	var texture1 = gl.createTexture()

	var img1 = new Image()
	var img2 = new Image()

	let loaded = 0

	function markLoaded() {
		loaded++
		if (loaded === 2) animate(gl, camera)
	}

	img1.addEventListener('load', () => {
		gl.activeTexture(gl.TEXTURE0)

		gl.bindTexture(gl.TEXTURE_2D, texture0)

		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)

		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img1)

		gl.uniform1i(shaderVars.u_Sampler0, 0)

		markLoaded()
	})

	img2.addEventListener('load', () => {
		gl.activeTexture(gl.TEXTURE1)

		gl.bindTexture(gl.TEXTURE_2D, texture1)

		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)

		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img2)

		gl.uniform1i(shaderVars.u_Sampler1, 1)

		markLoaded()
	})

	img1.src = src1
	img2.src = src2
}

function initVertexBuffers(gl: WebGL2RenderingContextWithProgram, shape: Geometry) {
	var n = shape.vertices.length / shape.floatsPerVertex // The number of vertices

	if (!shape.vertexBuffer) {
		// Create a buffer object
		shape.vertexBuffer = gl.createBuffer()
		if (!shape.vertexBuffer) {
			console.log('Failed to create the buffer object')
			return -1
		}

		// Bind the buffer object to target
		gl.bindBuffer(gl.ARRAY_BUFFER, shape.vertexBuffer)
		// Write date into the buffer object
		gl.bufferData(gl.ARRAY_BUFFER, shape.vertices, gl.STATIC_DRAW)
	} else {
		gl.bindBuffer(gl.ARRAY_BUFFER, shape.vertexBuffer)
	}

	const FLOAT_SIZE = Float32Array.BYTES_PER_ELEMENT
	const stride = shape.floatsPerVertex * FLOAT_SIZE

	gl.vertexAttribPointer(shaderVars.a_Position, shape.positionSize, gl.FLOAT, false, stride, 0)
	gl.enableVertexAttribArray(shaderVars.a_Position)

	gl.vertexAttribPointer(
		shaderVars.a_Color,
		shape.colorSize,
		gl.FLOAT,
		false,
		stride,
		shape.positionSize * FLOAT_SIZE,
	)
	gl.enableVertexAttribArray(shaderVars.a_Color)

	gl.vertexAttribPointer(
		shaderVars.a_UV,
		2,
		gl.FLOAT,
		false,
		stride,
		(shape.positionSize + shape.colorSize) * FLOAT_SIZE,
	)
	gl.enableVertexAttribArray(shaderVars.a_UV)

	return n
}

function animate(gl: WebGL2RenderingContextWithProgram, camera: Camera) {
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

	gl.uniformMatrix4fv(shaderVars.u_viewMatrix, false, camera.viewMatrix.elements)

	gl.uniformMatrix4fv(shaderVars.u_projectionMatrix, false, camera.projectionMatrix.elements)

	gAnimalGlobalRotation += 1
	for (let s of shapes) {
		// s.rotateY(gAnimalGlobalRotation)
		draw(gl, s)
	}

	requestAnimationFrame(() => animate(gl, camera))
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

	gl.uniformMatrix4fv(shaderVars.u_ModelMatrix, false, shape.modelMatrix.elements)

	gl.uniform4fv(shaderVars.u_baseColor, shape.baseColor)
	gl.uniform1f(shaderVars.u_texColorWeight, shape.texColorWeight)
	gl.uniform1i(shaderVars.u_TextureIndex, shape.textureIndex)
	gl.uniform1f(shaderVars.u_swirlAmount, crazyEffectEnabled ? shape.swirlAmount : 0)
	gl.uniform1f(shaderVars.u_reflectAmount, crazyEffectEnabled ? shape.reflectAmount : 0)

	gl.drawArrays(gl.TRIANGLES, 0, n)
	// gl.drawArrays(gl.LINE_LOOP, 0, n) // wireframe}

	shape.modelMatrix.setIdentity()
}

function keydown(ev: KeyboardEvent, camera: Camera, paused: boolean) {
	if (paused) return

	switch (ev.key) {
		case 'w':
			camera.moveForward(0.05)
			break
		case 'a':
			camera.moveLeft(0.05)
			break
		case 's':
			camera.moveBackwards(0.05)
			break
		case 'd':
			camera.moveRight(0.05)
			break
		case 'q':
			camera.panLeft(5)
			break
		case 'e':
			camera.panRight(5)
			break
		case 'f':
			addBlock(camera)
			break
		case 'r':
			deleteBlock(camera)
			break
		case 'x':
			crazyEffectEnabled = !crazyEffectEnabled
			console.log('crazy effect', crazyEffectEnabled ? 'on' : 'off')
			break
	}
}

function addBlock(camera: Camera) {
	let { mapX, mapZ } = getCellInFront(camera)

	if (mapX < 0 || mapX >= map.length) return
	if (mapZ < 0 || mapZ >= map[mapX].length) return

	map[mapX][mapZ] = Math.min(map[mapX][mapZ] + 1, 4)
	buildWalls()
}

function deleteBlock(camera: Camera) {
	let { mapX, mapZ } = getCellInFront(camera)

	if (mapX < 0 || mapX >= map.length) return
	if (mapZ < 0 || mapZ >= map[mapX].length) return

	map[mapX][mapZ] = Math.max(map[mapX][mapZ] - 1, 0)
	buildWalls()
}

function getCellInFront(camera: Camera) {
	let fx = camera.at.elements[0] - camera.eye.elements[0]
	let fz = camera.at.elements[2] - camera.eye.elements[2]

	let len = Math.sqrt(fx * fx + fz * fz)
	fx /= len
	fz /= len

	let worldX = camera.eye.elements[0] + fx * 2
	let worldZ = camera.eye.elements[2] + fz * 2

	let mapX = Math.round(worldX + map.length / 2)
	let mapZ = Math.round(worldZ + map.length / 2)

	return { mapX, mapZ }
}

function buildWalls() {
	shapes = shapes.filter((shape) => shape.kind !== 'wall')

	for (let x = 0; x < map.length; x++) {
		for (let z = 0; z < map[x].length; z++) {
			let height = map[x][z]

			for (let y = 0; y < height; y++) {
				let wall = new Cube()
				wall.kind = 'wall'
				wall.translate(x - map.length / 2, y, z - map.length / 2)
				wall.textureIndex = 0
				wall.texColorWeight = 1
				wall.swirlAmount = (Math.random() * 2 - 1) * 1.8
				wall.reflectAmount = Math.random() * 0.8
				shapes.push(wall)
			}
		}
	}
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

	shaderVars = {
		a_Position: gl.getAttribLocation(gl.program, 'a_Position'),
		a_Color: gl.getAttribLocation(gl.program, 'a_Color'),
		a_UV: gl.getAttribLocation(gl.program, 'a_UV'),

		u_Sampler0: gl.getUniformLocation(gl.program, 'u_Sampler0'),
		u_Sampler1: gl.getUniformLocation(gl.program, 'u_Sampler1'),

		u_TextureIndex: gl.getUniformLocation(gl.program, 'u_TextureIndex'),
		u_baseColor: gl.getUniformLocation(gl.program, 'u_baseColor'),
		u_texColorWeight: gl.getUniformLocation(gl.program, 'u_texColorWeight'),
		u_swirlAmount: gl.getUniformLocation(gl.program, 'u_swirlAmount'),
		u_reflectAmount: gl.getUniformLocation(gl.program, 'u_reflectAmount'),

		u_viewMatrix: gl.getUniformLocation(gl.program, 'u_viewMatrix'),
		u_projectionMatrix: gl.getUniformLocation(gl.program, 'u_projectionMatrix'),
		u_ModelMatrix: gl.getUniformLocation(gl.program, 'u_ModelMatrix'),
	}

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

	// GROUND and SKY
	let ground = new Cube()
	ground.translate(0, -0.5, 0)
	ground.scale(32, 0.1, 32)
	ground.rotateY(0)
	ground.textureIndex = 1
	ground.texColorWeight = 1
	ground.swirlAmount = 0.15
	ground.reflectAmount = 0.15

	shapes.push(ground)

	let sky = new Cube()
	// sky.translate(0,0,0)
	sky.scale(1000, 1000, 1000)
	sky.baseColor = [0.3, 0.6, 1.0, 1.0]
	sky.texColorWeight = 0

	shapes.push(sky)

	// WALL
	buildWalls()

	// Camera
	let canvas = getCanvas()
	let camera = new Camera(canvas.width / canvas.height, 0.1, 1000)
	let pauseOverlay = document.getElementById('pauseOverlay')
	let paused = false

	function setPaused(nextPaused: boolean) {
		paused = nextPaused
		pauseOverlay?.toggleAttribute('hidden', !paused)
	}

	function enterGame() {
		setPaused(false)
		canvas.requestPointerLock()
	}

	document.addEventListener('pointerlockchange', () => {
		setPaused(document.pointerLockElement !== canvas)
	})

	document.addEventListener('keydown', (ev) => {
		if (ev.key === 'Escape') {
			setPaused(true)
			document.exitPointerLock()
			return
		}

		if (ev.key === ' ') {
			ev.preventDefault()
			enterGame()
			return
		}

		keydown(ev, camera, paused)
	})

	canvas.addEventListener('click', enterGame)

	// Mouse
	canvas.addEventListener('mousemove', (ev) => {
		if (paused || document.pointerLockElement !== canvas) return

		camera.panRight(ev.movementX * 0.3)
	})

	loadWorld(gl, '../textures/brick.jpg', '../textures/rock.jpg', camera)
}

window.addEventListener('load', main)
