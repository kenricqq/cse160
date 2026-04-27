import Stats from 'stats.js'

import { BlockRenderer, FSHADER_SOURCE, VSHADER_SOURCE } from './blockRenderer.js'

type Pose = {
	frontShoulder: number
	frontElbow: number
	frontPaw: number
	rearHip: number
	rearKnee: number
	rearPaw: number
	headTilt: number
}

type BoxSpec = [Vec4, Vec3, Vec3, number?]
type WalkMotion = { bob: number; roll: number; headBob: number; headTilt: number }
type ElementCtor<T extends HTMLElement> = { new (): T }

const POSE_SLIDERS: [keyof Pose, string][] = [
	['frontShoulder', 'frontShoulderSlider'],
	['frontElbow', 'frontElbowSlider'],
	['frontPaw', 'frontPawSlider'],
	['rearHip', 'rearShoulderSlider'],
	['rearKnee', 'rearElbowSlider'],
	['rearPaw', 'rearPawSlider'],
	['headTilt', 'headSlider'],
]

// Fur colors
const WHITE_FUR: Vec4 = [0.95, 0.93, 0.86, 1],
	CREAM_FUR: Vec4 = [1, 0.97, 0.86, 1],
	BLACK_FUR: Vec4 = [0.015, 0.014, 0.018, 1]

// Detail colors
const NOSE: Vec4 = [0, 0, 0, 1],
	PUPIL = NOSE,
	CLAW_COLOR: Vec4 = [0.86, 0.82, 0.68, 1],
	EYE_SHINE: Vec4 = [1, 1, 0.95, 1]

const PANDA_BASE_Y = -0.22,
	TAU = Math.PI * 2,
	WALK_RATE = 0.36

const STEP_PHASE = { rearLeft: 0, frontLeft: 0.23, rearRight: 0.5, frontRight: 0.73 }
const NO_MOTION: WalkMotion = { bob: 0, roll: 0, headBob: 0, headTilt: 0 }

// Body blocks
const BODY_BOXES: BoxSpec[] = [
	[WHITE_FUR, [0.02, 0, 0], [0.98, 0.34, 0.5]],
	[WHITE_FUR, [-0.02, 0.095, 0], [0.78, 0.18, 0.54]],
	[WHITE_FUR, [0.08, -0.13, 0], [0.62, 0.12, 0.4]],
	[BLACK_FUR, [-0.38, 0.02, 0], [0.32, 0.36, 0.55]],
	[BLACK_FUR, [-0.53, -0.02, 0], [0.11, 0.24, 0.38]],
	[WHITE_FUR, [-0.58, -0.02, 0], [0.095, 0.18, 0.34]],
	[BLACK_FUR, [0.35, -0.11, 0], [0.28, 0.2, 0.45]],
	[BLACK_FUR, [0.34, -0.02, -0.255], [0.25, 0.26, 0.07]],
	[BLACK_FUR, [0.34, -0.02, 0.255], [0.25, 0.26, 0.07]],
	[WHITE_FUR, [0.56, 0.055, 0], [0.09, 0.075, 0.15]],
]
// Head blocks
const HEAD_BOXES: BoxSpec[] = [
	[WHITE_FUR, [0, 0, 0], [0.42, 0.36, 0.54]],
	[WHITE_FUR, [-0.025, 0.04, 0], [0.36, 0.32, 0.58]],
	[WHITE_FUR, [-0.035, -0.09, 0], [0.34, 0.18, 0.5]],
	[WHITE_FUR, [-0.02, -0.01, -0.29], [0.25, 0.25, 0.065]],
	[WHITE_FUR, [-0.02, -0.01, 0.29], [0.25, 0.25, 0.065]],
	[CREAM_FUR, [-0.222, -0.025, 0], [0.06, 0.25, 0.43]],
	[WHITE_FUR, [-0.255, -0.07, -0.16], [0.07, 0.13, 0.16]],
	[WHITE_FUR, [-0.255, -0.07, 0.16], [0.07, 0.13, 0.16]],
	[CREAM_FUR, [-0.285, -0.082, 0], [0.055, 0.11, 0.24]],
	[NOSE, [-0.32, -0.045, 0], [0.028, 0.05, 0.095]],
	[NOSE, [-0.328, -0.09, 0], [0.012, 0.042, 0.018]],
	[NOSE, [-0.328, -0.125, 0], [0.01, 0.014, 0.14]],
]

const zeroPose = (): Pose => ({
	frontShoulder: 0,
	frontElbow: 0,
	frontPaw: 0,
	rearHip: 0,
	rearKnee: 0,
	rearPaw: 0,
	headTilt: 0,
})
const idleHeadTilt = (seconds: number) => 1.2 * Math.sin(TAU * (seconds * WALK_RATE * 2 + 0.18))

// App state
class App {
	readonly renderer: BlockRenderer
	readonly stats = new Stats()

	baseRotationY = -41
	dragRotationX = -0.5
	dragRotationY = 0

	elapsedSeconds = 0
	private readonly startTime = performance.now() / 1000

	walking = false
	private poking = false
	private pokeStartSeconds = 0

	private isDragging = false
	private lastPointerX = 0
	private lastPointerY = 0

	private sliderPose = zeroPose()
	currentPose = zeroPose()

	constructor(
		private readonly canvas: HTMLCanvasElement,
		readonly gl: WebGL2RenderingContextWithProgram,
	) {
		this.renderer = new BlockRenderer(gl)
		Object.assign(this.stats.dom.style, { left: 'auto', right: '0', zIndex: '10000' })
		this.stats.showPanel(0)
		document.body.appendChild(this.stats.dom)

		for (const [key, id] of POSE_SLIDERS)
			this.range(id, (value) => {
				this.sliderPose[key] = value
			})
		this.range('rotationSlider', (value) => {
			this.baseRotationY = value
		})
		this.el('animationOnButton', HTMLButtonElement).addEventListener('click', () => {
			this.walking = true
		})
		this.el('animationOffButton', HTMLButtonElement).addEventListener('click', () => {
			this.walking = false
		})

		canvas.addEventListener('mousedown', (event) => this.mouseDown(event))
		canvas.addEventListener('mousemove', (event) => this.mouseMove(event))
		canvas.addEventListener('mouseup', () => {
			this.isDragging = false
		})
		canvas.addEventListener('mouseleave', () => {
			this.isDragging = false
		})
	}

	start() {
		requestAnimationFrame(this.tick)
	}

	private tick = (now: number) => {
		this.elapsedSeconds = now / 1000 - this.startTime
		this.currentPose = this.walking
			? { ...zeroPose(), headTilt: idleHeadTilt(this.elapsedSeconds) }
			: { ...this.sliderPose }

		if (this.poking) this.applyPokePose()

		renderScene(this)
		requestAnimationFrame(this.tick)
	}

	private applyPokePose() {
		const t = this.elapsedSeconds - this.pokeStartSeconds

		if (t > 1.2) this.poking = false
		else {
			const wiggle = Math.sin(t * Math.PI * 5) * (1 - t / 1.2)
			this.currentPose.headTilt += 18 * wiggle
			this.currentPose.frontPaw += 45 * Math.abs(wiggle)
		}
	}

	private mouseDown(event: MouseEvent) {
		if (event.shiftKey) {
			this.poking = true
			this.pokeStartSeconds = this.elapsedSeconds
		} else {
			this.isDragging = true
			this.lastPointerX = event.clientX
			this.lastPointerY = event.clientY
		}
	}

	private mouseMove(event: MouseEvent) {
		if (!this.isDragging) return
		this.dragRotationY += (event.clientX - this.lastPointerX) * 0.5
		this.dragRotationX += (event.clientY - this.lastPointerY) * 0.5
		this.lastPointerX = event.clientX
		this.lastPointerY = event.clientY
	}

	private range(id: string, f: (value: number) => void) {
		const input = this.el(id, HTMLInputElement)
		input.addEventListener('input', () => f(Number(input.value)))
	}

	private el<T extends HTMLElement>(id: string, ctor: ElementCtor<T>): T {
		const el = document.getElementById(id)
		if (!(el instanceof ctor)) throw new Error(`Failed to get ${id}`)

		return el
	}
}

// Main render
function renderScene(app: App) {
	app.stats.begin()
	app.gl.clear(app.gl.COLOR_BUFFER_BIT | app.gl.DEPTH_BUFFER_BIT)
	app.renderer.setGlobalRotation(
		new Matrix4()
			.setRotate(app.baseRotationY + app.dragRotationY, 0, 1, 0)
			.rotate(app.dragRotationX, 1, 0, 0),
	)
	drawPanda(app.renderer, app.elapsedSeconds, app.currentPose, app.walking)
	app.stats.end()
}

// Panda root
function drawPanda(r: BlockRenderer, seconds: number, pose: Pose, walking: boolean) {
	const cycle = seconds * WALK_RATE,
		gait = walking ? walkMotion(cycle) : NO_MOTION
	const root = new Matrix4().translate(0.03, PANDA_BASE_Y + gait.bob, 0).scale(0.82, 0.82, 0.82)
	root.rotate(gait.roll, 1, 0, 0)
	drawBoxes(r, root, BODY_BOXES)
	drawHead(r, root, gait, pose)
	drawLegs(r, root, cycle, pose, walking)
}

// Head group
function drawHead(r: BlockRenderer, root: Matrix4, gait: WalkMotion, pose: Pose) {
	const head = new Matrix4(root).translate(-0.75, 0.025 + gait.headBob, -0.055)
	head.rotate(-2 + pose.headTilt + gait.headTilt, 0, 0, 1).rotate(-gait.roll * 0.45, 1, 0, 0)
	drawBoxes(r, head, HEAD_BOXES)
	for (const side of [-1, 1]) {
		drawEar(r, head, side)
		drawEye(r, head, side)
	}
}

// Leg groups
function drawLegs(r: BlockRenderer, root: Matrix4, cycle: number, pose: Pose, walking: boolean) {
	const legData: [number, number, Vec3, boolean][] = [
		[
			-0.39,
			-0.26,
			walking
				? limbPose(cycle, STEP_PHASE.frontLeft, -1, true)
				: [210 - pose.frontShoulder, 42 + pose.frontElbow, -30 + pose.frontPaw],
			true,
		],
		[
			0.31,
			0.25,
			walking
				? limbPose(cycle, STEP_PHASE.rearRight, 1, false)
				: [235 - pose.rearHip, 48 - pose.rearKnee, -35 - pose.rearPaw],
			false,
		],
		[
			-0.36,
			0.25,
			walking
				? limbPose(cycle, STEP_PHASE.frontRight, 1, true)
				: [285 + pose.frontShoulder, -48 - pose.frontElbow, 25 - pose.frontPaw],
			true,
		],
		[
			0.34,
			-0.26,
			walking
				? limbPose(cycle, STEP_PHASE.rearLeft, -1, false)
				: [330 + pose.rearHip, -40 + pose.rearKnee, -28 + pose.rearPaw],
			false,
		],
	]
	for (const [x, z, angles, frontLeg] of legData) drawLeg(r, root, x, z, angles, frontLeg)
}

// Ear sphere
function drawEar(r: BlockRenderer, head: Matrix4, side: number) {
	r.sphere(head, BLACK_FUR, [0.005, 0.255, 0.225 * side], [0.2, 0.2, 0.2], 8 * side)
}

// Eye details
function drawEye(r: BlockRenderer, head: Matrix4, side: number) {
	const z = 0.118 * side
	r.boxRot(head, BLACK_FUR, [-0.252, 0.075, z], [0.032, 0.155, 0.12], [-12 * side, 0, 0])
	r.boxRot(
		head,
		BLACK_FUR,
		[-0.259, 0.005, z + 0.018 * side],
		[0.024, 0.075, 0.09],
		[-12 * side, 0, 0],
	)
	r.box(head, PUPIL, [-0.278, 0.088, z], [0.014, 0.034, 0.04])
	r.box(head, EYE_SHINE, [-0.288, 0.1, z - 0.014 * side], [0.008, 0.011, 0.012])
}

// Joint chain
function drawLeg(
	r: BlockRenderer,
	root: Matrix4,
	x: number,
	z: number,
	angles: Vec3,
	frontLeg: boolean,
) {
	const [upper, lower, paw, upperHeight, lowerHeight, depth] = frontLeg
		? [0.12, 0.21, 0.16, 0.13, 0.105, 0.155]
		: [0.14, 0.17, 0.2, 0.16, 0.12, 0.18]

	// Hip block
	const joint = new Matrix4(root).translate(x, frontLeg ? -0.12 : -0.11, z)
	r.box(joint, BLACK_FUR, [0, 0, 0], [frontLeg ? 0.13 : 0.16, upperHeight, depth])

	// Shoulder joint
	const shoulder = new Matrix4(joint).rotate(angles[0], 0, 0, 1)
	r.box(shoulder, BLACK_FUR, [upper / 2, 0, 0], [upper, upperHeight, depth])

	// Elbow joint
	const elbow = new Matrix4(shoulder).translate(upper, 0, 0).rotate(angles[1], 0, 0, 1)
	r.box(elbow, BLACK_FUR, [lower / 2, 0, 0], [lower, lowerHeight, depth - 0.01])

	// Paw joint
	const foot = new Matrix4(elbow).translate(lower, 0, 0).rotate(angles[2], 0, 0, 1)
	r.box(foot, BLACK_FUR, [paw / 2, 0.02, 0], [paw, frontLeg ? 0.075 : 0.085, frontLeg ? 0.19 : 0.2])

	// Toe claws
	for (const dz of [frontLeg ? -0.055 : -0.065, 0, frontLeg ? 0.055 : 0.065])
		r.box(foot, CLAW_COLOR, [paw + 0.018, 0.036, dz], [0.035, 0.018, frontLeg ? 0.021 : 0.024])
	if (frontLeg)
		r.box(foot, CLAW_COLOR, [paw * 0.72, 0.052, Math.sign(z) * 0.095], [0.03, 0.018, 0.028])
}

// Walk cycle
function walkMotion(cycle: number): WalkMotion {
	const phases = [
		phase(cycle, STEP_PHASE.rearLeft),
		phase(cycle, STEP_PHASE.frontLeft),
		phase(cycle, STEP_PHASE.rearRight),
		phase(cycle, STEP_PHASE.frontRight),
	]
	const lifts = phases.map(lift),
		swing = lifts[2] + lifts[3] - lifts[0] - lifts[1],
		foreLift = lifts[1] + lifts[3]
	return {
		bob: -0.0025 * foreLift + 0.0012 * Math.sin(TAU * (cycle * 4 + 0.08)),
		roll: 0.9 * support(phases) - 0.9 * swing,
		headBob: -0.002 * foreLift + 0.002 * Math.sin(TAU * (cycle * 2 + 0.36)),
		headTilt: 0.7 * Math.sin(TAU * (cycle * 2 + 0.58)) - 0.25 * swing,
	}
}

// Limb angles
function limbPose(cycle: number, start: number, side: number, frontLeg: boolean): Vec3 {
	const p = phase(cycle, start),
		l = lift(p),
		shoulder =
			(frontLeg ? 267 : 286) + (frontLeg ? 31 : 34) * Math.cos(p) + (frontLeg ? 1.2 : -1.2) * side,
		elbow = (frontLeg ? 13 : -7) + (frontLeg ? -10 : -17) * Math.cos(p) + (frontLeg ? 18 : -16) * l
	return [shoulder, elbow, (frontLeg ? 188 : 190) - shoulder - elbow + (frontLeg ? 7 : -5) * l]
}

function drawBoxes(r: BlockRenderer, base: Matrix4, boxes: BoxSpec[]) {
	for (const [color, translate, scale, rotateZ = 0] of boxes)
		r.box(base, color, translate, scale, rotateZ)
}
function phase(cycle: number, start: number) {
	return TAU * (cycle - start)
}

function lift(p: number) {
	return Math.max(0, Math.sin(p)) ** 2
}

function support(phases: number[]) {
	const load = phases.map((p) => 1 - 0.55 * lift(p))
	return (-load[0] - load[1] + load[2] + load[3]) / load.reduce((a, b) => a + b, 0)
}

function main() {
	const { canvas, gl } = setupWebGL()
	gl.enable(gl.DEPTH_TEST)
	gl.clearColor(0.78, 0.84, 0.9, 1)
	if (initShaders2(gl, VSHADER_SOURCE, FSHADER_SOURCE)) new App(canvas, gl).start()
	else console.error('Failed to initialize shaders.')
}

window.addEventListener('load', main)
