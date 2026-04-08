"use strict";
// oxlint-disable-next-line typescript/triple-slash-reference
/// <reference path="../lib/cuon-matrix-cse160.ts" />
function getWebGL2Context(canvas) {
    return canvas.getContext('webgl2');
}
function initShaders2(gl, vshader, fshader) {
    return initShaders(gl, vshader, fshader);
}
const SQUARE = new Float32Array([-0.5, -0.5, 0.0, 0.5, -0.5, 0.0, 0.5, 0.5, 0.0, -0.5, 0.5, 0.0]);
const TRIANGLE = new Float32Array([-0.5, -0.5, 0.0, 0.5, -0.5, 0.0, 0.0, 0.5, 0.0]);
// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
	attribute vec4 a_Position;
	void main() {
	  gl_Position = a_Position;
	  gl_PointSize = 10.0;
	}
`;
// Fragment shader program
var FSHADER_SOURCE = `
	precision mediump float;
	// uniform vec4 u_FragColor; // uniform変数
	uniform vec3 u_Color;
	void main() {
	  // gl_FragColor = u_FragColor;
	  gl_FragColor = vec4(u_Color, 1.0);
	}
`;
var shapeCfg = {
    color: [0.5, 0.5, 0.5, 1.0],
    size: 0.5,
    type: 'Triangle',
    segments: 5,
};
var shapesList = [];
class Shape {
    color;
    position;
    type;
    size;
    vertices;
    constructor(pos, cfg) {
        const { color, type, size, segments } = cfg;
        this.position = pos;
        this.color = color;
        this.type = type;
        this.size = size;
        if (type === 'Circle') {
            this.vertices = createCircle(segments);
        }
        else if (type === 'Square') {
            this.vertices = SQUARE;
        }
        else {
            this.vertices = TRIANGLE;
        }
    }
    render(gl) {
        const translated = new Float32Array(this.vertices);
        for (let i = 0; i < translated.length; i += 3) {
            translated[i] *= this.size;
            translated[i + 1] *= this.size;
            translated[i] += this.position[0];
            translated[i + 1] += this.position[1];
        }
        let vertexBuffer = gl.createBuffer();
        if (!vertexBuffer) {
            console.log('Failed to create Buffer');
            return -1;
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        let glslVariables = connectVariablesToGLSL(gl);
        let { a_Position } = glslVariables;
        // var a_Position = gl.getAttribLocation(gl.program, 'a_Position')
        // if (a_Position < 0) {
        // 	console.log('Failed to get the storage location of a_Position')
        // 	return -1
        // }
        // gl.vertexAttrib3f(a_Position, this.position[0], this.position[1], 0.0)
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);
        gl.bufferData(gl.ARRAY_BUFFER, translated, gl.STATIC_DRAW);
        let u_Color = gl.getUniformLocation(gl.program, 'u_Color');
        gl.uniform3f(u_Color, this.color[0], this.color[1], this.color[2]);
        gl.drawArrays(gl.TRIANGLE_FAN, 0, translated.length / 3);
    }
}
function renderAllShapes(gl) {
    clearCanvas(gl);
    for (const shape of shapesList) {
        shape.render(gl);
    }
}
function handleClicks(e, gl, canvas) {
    let x = e.clientX; // x coordinate of a mouse pointer
    let y = e.clientY; // y coordinate of a mouse pointer
    let rect = canvas.getBoundingClientRect();
    x = (x - rect.left - canvas.width / 2) / (canvas.width / 2);
    y = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2);
    const pos = [x, y];
    console.log(x, y);
    // create Shape
    const shape = new Shape(pos, shapeCfg);
    shapesList.push(shape);
    // draw Shapes
    renderAllShapes(gl);
}
function main() {
    let canvas = document.getElementById('webgl');
    if (!(canvas instanceof HTMLCanvasElement) || !canvas) {
        return -1;
    }
    let gl = getWebGL2Context(canvas);
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL2');
        return -1;
    }
    if (!initShaders2(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to intialize shaders.');
        return -1;
    }
    clearCanvas(gl);
    canvas.addEventListener('mousedown', function (e) {
        handleClicks(e, gl, canvas);
    });
    // canvas.onmousedown = function (ev) {
    // 	click(ev, gl, canvas, a_Position, u_FragColor)
    // }
    const clearCanvasBtn = document.getElementById('clearCanvas');
    if (!(clearCanvasBtn instanceof HTMLButtonElement))
        return -1;
    clearCanvasBtn.addEventListener('click', function () {
        shapesList = [];
        clearCanvas(gl);
    });
    // DRAWING MODE
    const square = document.getElementById('square');
    if (!(square instanceof HTMLButtonElement))
        return -1;
    square.addEventListener('click', function () {
        shapeCfg.type = 'Square';
    });
    const triangle = document.getElementById('triangle');
    if (!(triangle instanceof HTMLButtonElement))
        return -1;
    triangle.addEventListener('click', function () {
        shapeCfg.type = 'Triangle';
    });
    const circle = document.getElementById('circle');
    if (!(circle instanceof HTMLButtonElement))
        return -1;
    circle.addEventListener('click', function () {
        shapeCfg.type = 'Circle';
    });
    // SHAPE COLORS
    const redSlider = document.getElementById('redSlider');
    if (!(redSlider instanceof HTMLInputElement))
        return -1;
    redSlider.addEventListener('mouseup', function () {
        shapeCfg.color[0] = Number(this.value) / 20;
    });
    const greenSlider = document.getElementById('greenSlider');
    if (!(greenSlider instanceof HTMLInputElement))
        return -1;
    greenSlider.addEventListener('mouseup', function () {
        shapeCfg.color[1] = Number(this.value) / 20;
    });
    const blueSlider = document.getElementById('blueSlider');
    if (!(blueSlider instanceof HTMLInputElement))
        return -1;
    blueSlider.addEventListener('mouseup', function () {
        shapeCfg.color[2] = Number(this.value) / 20;
    });
    // SHAPE SIZE
    const shapeSizeSlider = document.getElementById('shapeSize');
    if (!(shapeSizeSlider instanceof HTMLInputElement))
        return -1;
    shapeSizeSlider.addEventListener('mouseup', function () {
        console.log(this.value);
        shapeCfg.size = Number(this.value) / 20;
    });
    // SHAPE SEGMENTS
    const segmentSlider = document.getElementById('segmentCount');
    if (!(segmentSlider instanceof HTMLInputElement))
        return -1;
    segmentSlider.addEventListener('mouseup', function () {
        console.log(this.value);
        shapeCfg.segments = Number(this.value);
    });
}
function clearCanvas(gl) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
}
function createCircle(sides) {
    console.log('side', sides);
    let vertices = [];
    for (let i = 0; i < sides; i++) {
        const angle = (i / sides) * 2 * Math.PI;
        const x = Math.sin(angle);
        const y = Math.cos(angle);
        vertices.push(x, y, 0);
    }
    return new Float32Array(vertices);
}
// function draw(gl: WebGL2RenderingContext, vertices: Float32Array, _size: number = shapeCfg.size) {
// 	console.log(vertices)
// 	if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
// 		console.log('Failed to intialize shaders.')
// 		return -1
// 	}
// 	let vertexBuffer = gl.createBuffer()
// 	if (!vertexBuffer) {
// 		console.log('Failed to create Buffer')
// 		return -1
// 	}
// 	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
// 	var a_Position = gl.getAttribLocation(gl.program, 'a_Position')
// 	if (a_Position < 0) {
// 		console.log('Failed to get the storage location of a_Position')
// 		return -1
// 	}
// 	gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0)
// 	gl.enableVertexAttribArray(a_Position)
// 	gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)
// 	let u_Color = gl.getUniformLocation(gl.program, 'u_Color')
// 	gl.uniform3f(u_Color, ShapeColor[0], ShapeColor[1], ShapeColor[2])
// 	gl.drawArrays(gl.TRIANGLE_FAN, 0, vertices.length / 3)
// gl.drawArrays(gl.TRIANGLES, 0, square.length / 3)
// Get the storage location of u_FragColor
// var u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor')
// if (!u_FragColor) {
// 	console.log('Failed to get the storage location of u_FragColor')
// 	return -1
// }
// }
// var g_points = [] // The array for the position of a mouse press
// var g_colors = [] // The array to store the color of a point
// function click(ev, gl, canvas, a_Position, u_FragColor) {
// 	var x = ev.clientX // x coordinate of a mouse pointer
// 	var y = ev.clientY // y coordinate of a mouse pointer
// 	var rect = ev.target.getBoundingClientRect()
// 	x = (x - rect.left - canvas.width / 2) / (canvas.width / 2)
// 	y = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2)
// 	// Store the coordinates to g_points array
// 	g_points.push([x, y])
// 	// Store the coordinates to g_points array
// 	if (x >= 0.0 && y >= 0.0) {
// 		// First quadrant
// 		g_colors.push([1.0, 0.0, 0.0, 1.0]) // Red
// 	} else if (x < 0.0 && y < 0.0) {
// 		// Third quadrant
// 		g_colors.push([0.0, 1.0, 0.0, 1.0]) // Green
// 	} else {
// 		// Others
// 		g_colors.push([1.0, 1.0, 1.0, 1.0]) // White
// 	}
// 	// Clear <canvas>
// 	gl.clear(gl.COLOR_BUFFER_BIT)
// 	var len = g_points.length
// 	for (var i = 0; i < len; i++) {
// 		var xy = g_points[i]
// 		var rgba = g_colors[i]
// 		// Pass the position of a point to a_Position variable
// 		gl.vertexAttrib3f(a_Position, xy[0], xy[1], 0.0)
// 		// Pass the color of a point to u_FragColor variable
// 		gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3])
// 		// Draw
// 		gl.drawArrays(gl.POINTS, 0, 1)
// 	}
// }
//
// let glslVariables = connectVariablesToGLSL(gl)
// let { a_Position, u_FragColor } = glslVariables
// function setupWebGL() {
// 	let canvas = document.getElementById('webgl')
// 	let gl = getWebGLContext(canvas)
// 	if (!gl) {
// 		console.log('Failed to get the rendering context for WebGL')
// 		return -1
// 	}
// 	return { canvas, gl }
// }
function connectVariablesToGLSL(gl) {
    // Get the storage location of a_Position
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        throw new Error('Failed to get the storage location of a_Position');
    }
    // Get the storage location of u_FragColor
    // var u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor')
    // if (!u_FragColor) {
    // 	console.log('Failed to get the storage location of u_FragColor')
    // 	throw new Error('Failed to get the storage location of u_FragColor')
    // }
    // return { a_Position, u_FragColor }
    return { a_Position };
}
