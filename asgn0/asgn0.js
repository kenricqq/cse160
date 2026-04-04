const operations = [
	{ value: 'add', label: 'Add' },
	{ value: 'sub', label: 'Subtract' },
	{ value: 'mul', label: 'Multiply' },
	{ value: 'div', label: 'Divide' },
	{ value: 'mag', label: 'Magnitude' },
	{ value: 'norm', label: 'Normalize' },
	{ value: 'angleBtwn', label: 'Angle Between' },
	{ value: 'areaTri', label: 'Area' },
]

let canvas
let ctx
let output
let inputs

function main() {
	canvas = document.getElementById('example')
	output = document.getElementById('output')

	if (!canvas) {
		throw new Error('Canvas element not found')
	}

	ctx = canvas.getContext('2d')
	if (!ctx) {
		throw new Error('2d context not found')
	}

	inputs = {
		v1x: document.getElementById('v1x'),
		v1y: document.getElementById('v1y'),
		v2x: document.getElementById('v2x'),
		v2y: document.getElementById('v2y'),
		scalar: document.getElementById('scalar'),
		ops: document.getElementById('ops'),
		drawBtn: document.getElementById('drawBtn'),
		drawOpBtn: document.getElementById('drawOpBtn'),
	}

	populateOperations()
	inputs.drawBtn.addEventListener('click', handleDrawEvent)
	inputs.drawOpBtn.addEventListener('click', handleDrawOperationEvent)

	clearCanvas()
}

function populateOperations() {
	for (const op of operations) {
		const option = document.createElement('option')
		option.value = op.value
		option.textContent = op.label
		inputs.ops.appendChild(option)
	}

	inputs.ops.value = 'add'
}

function numberFromInput(input) {
	return Number.parseFloat(input.value) || 0
}

function getState() {
	return {
		v1: new Vector3([numberFromInput(inputs.v1x), numberFromInput(inputs.v1y), 0]),
		v2: new Vector3([numberFromInput(inputs.v2x), numberFromInput(inputs.v2y), 0]),
		scalar: numberFromInput(inputs.scalar),
		operation: inputs.ops.value,
	}
}

function drawVector(v, color) {
	if (!ctx || !canvas) return

	const cx = canvas.width / 2
	const cy = canvas.height / 2
	const el = v.elements

	ctx.beginPath()
	ctx.moveTo(cx, cy)
	ctx.lineTo(cx + el[0] * 20, cy - el[1] * 20)
	ctx.strokeStyle = color
	ctx.lineWidth = 2
	ctx.stroke()
}

function clearCanvas() {
	if (!ctx || !canvas) return
	ctx.fillStyle = 'black'
	ctx.fillRect(0, 0, canvas.width, canvas.height)
}

function handleDrawEvent() {
	clearCanvas()

	const { v1, v2 } = getState()
	drawVector(v1, 'red')
	drawVector(v2, 'blue')
}

function handleDrawOperationEvent() {
	clearCanvas()

	const { v1, v2, scalar, operation } = getState()
	drawVector(v1, 'red')
	drawVector(v2, 'blue')

	runOperation(operation, v1, v2, scalar)
}

function runOperation(operation, v1, v2, scalar) {
	switch (operation) {
		case 'add':
			drawVector(v1.add(v2), 'green')
			break
		case 'sub':
			drawVector(v1.sub(v2), 'green')
			break
		case 'mul':
			drawVector(v1.mul(scalar), 'green')
			drawVector(v2.mul(scalar), 'green')
			break
		case 'div':
			drawVector(v1.div(scalar), 'green')
			drawVector(v2.div(scalar), 'green')
			break
		case 'mag': {
			console.log('Magnitude v1: ', v1.magnitude())
			console.log('Magnitude v2: ', v2.magnitude())
			break
		}
		case 'norm':
			drawVector(v1.normalize(), 'green')
			drawVector(v2.normalize(), 'green')
			break
		case 'angleBtwn': {
			const angleRadians = Math.acos(Vector3.dot(v1, v2) / (v1.magnitude() * v2.magnitude()))
			const angleDegrees = angleRadians * (180 / Math.PI)
			console.log('Angle: ', angleDegrees)
			break
		}
		case 'areaTri': {
			const area = Vector3.cross(v1, v2).magnitude() / 2
			console.log('Area of the triangle: ', area)
			break
		}
		default:
			throw new Error(`Operation ${operation} not found`)
	}
}

document.addEventListener('DOMContentLoaded', main)
