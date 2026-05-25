// Vertex shader program
var VSHADER_SOURCE = `
	attribute vec4 a_Position;
	attribute vec2 a_UV;
	attribute vec3 a_Normal;

	varying vec2 v_UV;
	varying vec3 v_NormalDir;
	varying vec3 v_WorldPos;

	uniform mat4 u_ModelMatrix;
	uniform mat4 u_NormalMatrix;
	uniform mat4 u_viewMatrix;
	uniform mat4 u_projectionMatrix;

	void main() {
	  vec4 worldPos = u_ModelMatrix * a_Position;
	  v_UV = a_UV;
	  v_WorldPos = worldPos.xyz;
	  v_NormalDir = normalize((u_NormalMatrix * vec4(a_Normal, 0.0)).xyz);
	  gl_Position = u_projectionMatrix * u_viewMatrix * worldPos;
	}
`
// Fragment shader program
var FSHADER_SOURCE = `
	precision mediump float;

	varying vec2 v_UV;
	varying vec3 v_NormalDir;
	varying vec3 v_WorldPos;

	uniform sampler2D u_Sampler0;
	uniform sampler2D u_Sampler1;
	uniform int u_TextureIndex;
	uniform vec4 u_baseColor;
	uniform float u_texColorWeight;
	uniform bool u_ShowNormals;
	uniform bool u_LightingEnabled;
	uniform bool u_PointLightEnabled;
	uniform bool u_SpotLightEnabled;
	uniform bool u_Unlit;
	uniform vec3 u_CameraPos;
	uniform vec3 u_PointLightPos;
	uniform vec3 u_PointLightColor;
	uniform vec3 u_SpotLightPos;
	uniform vec3 u_SpotLightDir;
	uniform vec3 u_SpotLightColor;
	uniform float u_SpotCutoffCos;

	vec4 readTexture(vec2 uv) {
		if (u_TextureIndex == 0) {
			return texture2D(u_Sampler0, uv);
		}
		return texture2D(u_Sampler1, uv);
	}

	vec3 phongLight(vec3 baseColor, vec3 normal, vec3 lightDir, vec3 lightColor, vec3 viewDir, float strength) {
		float diffuseAmount = max(dot(normal, lightDir), 0.0);
		vec3 diffuse = baseColor * lightColor * diffuseAmount;
		vec3 reflectDir = reflect(-lightDir, normal);
		float specularAmount = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
		vec3 specular = lightColor * specularAmount * 0.55;
		return (diffuse + specular) * strength;
	}

	void main() {
	  vec4 texColor = readTexture(v_UV);

		vec4 surfaceColor = (1.0 - u_texColorWeight) * u_baseColor + u_texColorWeight * texColor;
		vec3 normal = normalize(v_NormalDir);

		if (u_ShowNormals) {
			gl_FragColor = vec4(normal * 0.5 + 0.5, 1.0);
			return;
		}

		if (!u_LightingEnabled || u_Unlit) {
			gl_FragColor = surfaceColor;
			return;
		}

		vec3 viewDir = normalize(u_CameraPos - v_WorldPos);
		vec3 litColor = surfaceColor.rgb * 0.18;

		if (u_PointLightEnabled) {
			vec3 pointVector = u_PointLightPos - v_WorldPos;
			float pointDistance = length(pointVector);
			float pointAttenuation = 1.0 / (1.0 + 0.04 * pointDistance + 0.015 * pointDistance * pointDistance);
			litColor += phongLight(surfaceColor.rgb, normal, normalize(pointVector), u_PointLightColor, viewDir, pointAttenuation);
		}

		if (u_SpotLightEnabled) {
			vec3 spotVector = u_SpotLightPos - v_WorldPos;
			float spotDistance = length(spotVector);
			vec3 toFragment = normalize(v_WorldPos - u_SpotLightPos);
			float coneAmount = smoothstep(u_SpotCutoffCos, u_SpotCutoffCos + 0.08, dot(normalize(u_SpotLightDir), toFragment));
			float spotAttenuation = coneAmount / (1.0 + 0.02 * spotDistance + 0.01 * spotDistance * spotDistance);
			litColor += phongLight(surfaceColor.rgb, normal, normalize(spotVector), u_SpotLightColor, viewDir, spotAttenuation);
		}

		gl_FragColor = vec4(min(litColor, vec3(1.0)), surfaceColor.a);
	}
`

let shapes: Geometry[] = []
// oxlint-disable-next-line typescript/no-explicit-any
let shaderVars: any
let showNormals = false
let lightingEnabled = true
let pointLightEnabled = true
let spotLightEnabled = true
let pointLightCenterX = 0
let lightAngle = 0
let pointLightPos = [0, 3, 0]
let pointLightColor = [1, 1, 1]
let spotLightPos = [0, 6, -6]
let spotLightDir = [0, -0.65, 0.76]
let spotLightColor = [1, 0.84, 0.62]
let pointLightMarker: Cube | null = null
let spotLightMarker: Cube | null = null
const focusSphereCenter: [number, number, number] = [-0.5, 0.85, 1.5]
const secondarySphereCenter: [number, number, number] = [-1.65, 0.55, 1.5]
const teapotCenter: [number, number, number] = [1.35, -0.45, 1.1]

function loadWorld(
	gl: WebGL2RenderingContextWithProgram,
	src1: string,
	src2: string,
	camera: Camera
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

async function loadObj(src: string) {
	let response = await fetch(src)
	if (!response.ok) throw new Error(`Failed to load OBJ: ${src}`)
	return response.text()
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
		shaderVars.a_UV,
		shape.uvSize,
		gl.FLOAT,
		false,
		stride,
		(shape.positionSize + shape.colorSize) * FLOAT_SIZE
	)
	gl.enableVertexAttribArray(shaderVars.a_UV)

	gl.vertexAttribPointer(
		shaderVars.a_Normal,
		shape.normalSize,
		gl.FLOAT,
		false,
		stride,
		(shape.positionSize + shape.colorSize + shape.uvSize) * FLOAT_SIZE
	)
	gl.enableVertexAttribArray(shaderVars.a_Normal)

	return n
}

function updateLighting(gl: WebGL2RenderingContextWithProgram, camera: Camera) {
	lightAngle += 0.018
	pointLightPos = [
		pointLightCenterX + Math.cos(lightAngle) * 2.5,
		3 + Math.sin(lightAngle * 0.7) * 0.7,
		Math.sin(lightAngle) * 2.5,
	]

	if (pointLightMarker) {
		pointLightMarker.translate(pointLightPos[0], pointLightPos[1], pointLightPos[2])
		pointLightMarker.baseColor = pointLightEnabled
			? [pointLightColor[0], pointLightColor[1], pointLightColor[2], 1]
			: [0.18, 0.18, 0.18, 1]
	}

	if (spotLightMarker) {
		spotLightMarker.baseColor = spotLightEnabled ? [1, 0.84, 0.62, 1] : [0.18, 0.18, 0.18, 1]
	}

	gl.uniform1i(shaderVars.u_ShowNormals, showNormals ? 1 : 0)
	gl.uniform1i(shaderVars.u_LightingEnabled, lightingEnabled ? 1 : 0)
	gl.uniform1i(shaderVars.u_PointLightEnabled, pointLightEnabled ? 1 : 0)
	gl.uniform1i(shaderVars.u_SpotLightEnabled, spotLightEnabled ? 1 : 0)
	gl.uniform3fv(shaderVars.u_CameraPos, new Float32Array(camera.eye.elements))
	gl.uniform3fv(shaderVars.u_PointLightPos, new Float32Array(pointLightPos))
	gl.uniform3fv(shaderVars.u_PointLightColor, new Float32Array(pointLightColor))
	gl.uniform3fv(shaderVars.u_SpotLightPos, new Float32Array(spotLightPos))
	gl.uniform3fv(shaderVars.u_SpotLightDir, new Float32Array(spotLightDir))
	gl.uniform3fv(shaderVars.u_SpotLightColor, new Float32Array(spotLightColor))
	gl.uniform1f(shaderVars.u_SpotCutoffCos, Math.cos((18 * Math.PI) / 180))
}

function animate(gl: WebGL2RenderingContextWithProgram, camera: Camera) {
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

	gl.uniformMatrix4fv(shaderVars.u_viewMatrix, false, camera.viewMatrix.elements)

	gl.uniformMatrix4fv(shaderVars.u_projectionMatrix, false, camera.projectionMatrix.elements)
	updateLighting(gl, camera)

	for (let s of shapes) {
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

	let normalMatrix = new Matrix4()
	normalMatrix.setInverseOf(shape.modelMatrix)
	normalMatrix.transpose()

	gl.uniformMatrix4fv(shaderVars.u_ModelMatrix, false, shape.modelMatrix.elements)
	gl.uniformMatrix4fv(shaderVars.u_NormalMatrix, false, normalMatrix.elements)

	gl.uniform4fv(shaderVars.u_baseColor, shape.baseColor)
	gl.uniform1f(shaderVars.u_texColorWeight, shape.texColorWeight)
	gl.uniform1i(shaderVars.u_TextureIndex, shape.textureIndex)
	gl.uniform1i(shaderVars.u_Unlit, shape.unlit ? 1 : 0)

	gl.drawArrays(gl.TRIANGLES, 0, n)
	// gl.drawArrays(gl.LINE_LOOP, 0, n) // wireframe}

	shape.modelMatrix.setIdentity()
}

function keydown(ev: KeyboardEvent, camera: Camera) {
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
	}
}

function bindControls() {
	function bindToggle(id: string, label: string, read: () => boolean, write: (value: boolean) => void) {
		let button = document.getElementById(id)
		if (!(button instanceof HTMLButtonElement)) return
		let buttonElement = button

		function sync() {
			buttonElement.textContent = `${label}: ${read() ? 'on' : 'off'}`
		}

		buttonElement.addEventListener('click', () => {
			write(!read())
			sync()
		})
		sync()
	}

	function bindSlider(id: string, onInput: (value: number) => void) {
		let slider = document.getElementById(id)
		if (!(slider instanceof HTMLInputElement)) return
		let sliderElement = slider

		function sync() {
			onInput(Number(sliderElement.value))
		}

		sliderElement.addEventListener('input', sync)
		sync()
	}

	bindToggle('lightingToggle', 'Lighting', () => lightingEnabled, (value) => (lightingEnabled = value))
	bindToggle('normalToggle', 'Normals', () => showNormals, (value) => (showNormals = value))
	bindToggle('pointLightToggle', 'Point light', () => pointLightEnabled, (value) => (pointLightEnabled = value))
	bindToggle('spotLightToggle', 'Spot light', () => spotLightEnabled, (value) => (spotLightEnabled = value))
	bindSlider('pointLightX', (value) => (pointLightCenterX = value))
	bindSlider('lightRed', (value) => (pointLightColor[0] = value / 100))
	bindSlider('lightGreen', (value) => (pointLightColor[1] = value / 100))
	bindSlider('lightBlue', (value) => (pointLightColor[2] = value / 100))
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
				shapes.push(wall)
			}
		}
	}
}

function clearBlocksInArea(minX: number, maxX: number, minZ: number, maxZ: number) {
	for (let x = 0; x < map.length; x++) {
		for (let z = 0; z < map[x].length; z++) {
			let blockX = x - map.length / 2
			let blockZ = z - map.length / 2

			if (blockX >= minX && blockX <= maxX && blockZ >= minZ && blockZ <= maxZ) {
				map[x][z] = 0
			}
		}
	}
}

// oxlint-disable-next-line no-unused-vars
async function main() {
	let { gl } = setupWebGL()

	gl.enable(gl.DEPTH_TEST)
	gl.clearColor(0, 0, 0, 1)

	if (!initShaders2(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
		console.log('Failed to intialize shaders.')
		return -1
	}

	shaderVars = {
		a_Position: gl.getAttribLocation(gl.program, 'a_Position'),
		a_UV: gl.getAttribLocation(gl.program, 'a_UV'),
		a_Normal: gl.getAttribLocation(gl.program, 'a_Normal'),

		u_Sampler0: gl.getUniformLocation(gl.program, 'u_Sampler0'),
		u_Sampler1: gl.getUniformLocation(gl.program, 'u_Sampler1'),

		u_TextureIndex: gl.getUniformLocation(gl.program, 'u_TextureIndex'),
		u_baseColor: gl.getUniformLocation(gl.program, 'u_baseColor'),
		u_texColorWeight: gl.getUniformLocation(gl.program, 'u_texColorWeight'),
		u_ShowNormals: gl.getUniformLocation(gl.program, 'u_ShowNormals'),
		u_LightingEnabled: gl.getUniformLocation(gl.program, 'u_LightingEnabled'),
		u_PointLightEnabled: gl.getUniformLocation(gl.program, 'u_PointLightEnabled'),
		u_SpotLightEnabled: gl.getUniformLocation(gl.program, 'u_SpotLightEnabled'),
		u_Unlit: gl.getUniformLocation(gl.program, 'u_Unlit'),
		u_CameraPos: gl.getUniformLocation(gl.program, 'u_CameraPos'),
		u_PointLightPos: gl.getUniformLocation(gl.program, 'u_PointLightPos'),
		u_PointLightColor: gl.getUniformLocation(gl.program, 'u_PointLightColor'),
		u_SpotLightPos: gl.getUniformLocation(gl.program, 'u_SpotLightPos'),
		u_SpotLightDir: gl.getUniformLocation(gl.program, 'u_SpotLightDir'),
		u_SpotLightColor: gl.getUniformLocation(gl.program, 'u_SpotLightColor'),
		u_SpotCutoffCos: gl.getUniformLocation(gl.program, 'u_SpotCutoffCos'),

		u_viewMatrix: gl.getUniformLocation(gl.program, 'u_viewMatrix'),
		u_projectionMatrix: gl.getUniformLocation(gl.program, 'u_projectionMatrix'),
		u_ModelMatrix: gl.getUniformLocation(gl.program, 'u_ModelMatrix'),
		u_NormalMatrix: gl.getUniformLocation(gl.program, 'u_NormalMatrix'),
	}

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
	bindControls()

	// GROUND and SKY
	let ground = new Cube()
	ground.translate(0, -0.5, 0)
	ground.scale(32, 0.1, 32)
	ground.rotateY(0)
	ground.textureIndex = 1
	ground.texColorWeight = 1

	shapes.push(ground)

	let sky = new Cube()
	// sky.translate(0,0,0)
	sky.scale(1000, 1000, 1000)
	sky.baseColor = [0.3, 0.6, 1.0, 1.0]
	sky.texColorWeight = 0
	sky.unlit = true

	shapes.push(sky)

	let sphereA = new Sphere()
	sphereA.translate(focusSphereCenter[0], focusSphereCenter[1], focusSphereCenter[2])
	sphereA.scale(1.4, 1.4, 1.4)
	sphereA.baseColor = [0.2, 0.65, 0.95, 1]
	shapes.push(sphereA)

	let sphereB = new Sphere()
	sphereB.translate(secondarySphereCenter[0], secondarySphereCenter[1], secondarySphereCenter[2])
	sphereB.scale(0.8, 0.8, 0.8)
	sphereB.baseColor = [0.95, 0.72, 0.22, 1]
	shapes.push(sphereB)

	let teapot = new ObjModel(await loadObj('../textures/utah_teapot.obj'))
	teapot.translate(teapotCenter[0], teapotCenter[1], teapotCenter[2])
	teapot.rotateY(-25)
	teapot.scale(0.25, 0.25, 0.25)
	teapot.baseColor = [0.82, 0.62, 0.38, 1]
	shapes.push(teapot)

	pointLightMarker = new Cube()
	pointLightMarker.scale(0.25, 0.25, 0.25)
	pointLightMarker.texColorWeight = 0
	pointLightMarker.unlit = true
	shapes.push(pointLightMarker)

	spotLightMarker = new Cube()
	spotLightMarker.translate(spotLightPos[0], spotLightPos[1], spotLightPos[2])
	spotLightMarker.scale(0.35, 0.35, 0.35)
	spotLightMarker.texColorWeight = 0
	spotLightMarker.unlit = true
	shapes.push(spotLightMarker)

	// WALL
	clearBlocksInArea(-3, 3, -3, 4)
	buildWalls()

	// Camera
	let canvas = getCanvas()
	let camera = new Camera(canvas.width / canvas.height, 0.1, 1000)
	camera.eye = new Vector3([focusSphereCenter[0], focusSphereCenter[1], -3.2])
	camera.at = new Vector3(focusSphereCenter)
	camera.updateView()

	document.addEventListener('keydown', (ev) => {
		keydown(ev, camera)
	})

	loadWorld(gl, '../textures/brick.jpg', '../textures/rock.jpg', camera)
}

window.addEventListener('load', main)
