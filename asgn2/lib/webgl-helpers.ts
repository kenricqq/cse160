// oxlint-disable no-unused-vars
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

function setupWebGL(canvasId = 'webgl') {
	let canvas = document.getElementById(canvasId)
	if (!(canvas instanceof HTMLCanvasElement)) {
		throw new Error('Failed to get the canvas element')
	}

	let gl = getWebGL2Context(canvas)
	if (!gl) {
		throw new Error('Failed to get the rendering context for WebGL2')
	}

	return { canvas, gl }
}
