"use strict";
function getWebGL2Context(canvas) {
    return canvas.getContext('webgl2', { preserveDrawingBuffer: true });
}
function initShaders2(gl, vshader, fshader) {
    return initShaders(gl, vshader, fshader);
}
const SQUARE = new Float32Array([-1, -1, 0.0, 1, -1, 0.0, 1, 1, 0.0, -1, 1, 0.0]);
const TRIANGLE = new Float32Array([-1, -1, 0.0, 1, -1, 0.0, 0.0, 1, 0.0]);
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
	uniform vec3 u_Color;
	void main() {
	  gl_FragColor = vec4(u_Color, 1.0);
	}
`;
var currShape = {
    color: [0.5, 0.5, 0.5, 1.0],
    size: 0.2,
    type: 'Triangle',
    segments: 20,
    rotationAngle: 0,
};
var shapesList = [];
class Shape {
    color;
    position;
    type;
    size;
    rotationAngle;
    vertices;
    constructor(pos, cfg) {
        const { color, type, size, segments, rotationAngle: rotation } = cfg;
        this.position = pos;
        this.color = color.slice();
        this.type = type;
        this.size = size;
        this.rotationAngle = rotation;
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
        const cos = Math.cos(this.rotationAngle);
        const sin = Math.sin(this.rotationAngle);
        for (let i = 0; i < translated.length; i += 3) {
            const x = translated[i] * this.size;
            const y = translated[i + 1] * this.size;
            translated[i] = x * cos - y * sin + this.position[0];
            translated[i + 1] = x * sin + y * cos + this.position[1];
        }
        let vertexBuffer = gl.createBuffer();
        if (!vertexBuffer) {
            console.log('Failed to create Buffer');
            return -1;
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        let { a_Position, u_Color } = connectVariablesToGLSL(gl);
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);
        gl.bufferData(gl.ARRAY_BUFFER, translated, gl.STATIC_DRAW);
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
function click(e, gl, canvas) {
    if (e.buttons === 1) {
        stopLoadingEffect(false, 'Manual drawing mode ready.');
        hideReferenceImage();
        const pos = getCanvasPosition(e, canvas);
        const shape = new Shape(pos, currShape);
        shapesList.push(shape);
        renderAllShapes(gl);
    }
}
function generateCircleOutline(segments = 20, radius = 0.8, size = 0.08) {
    let shapes = [];
    for (let i = 0; i < segments; i++) {
        const angle = (i / segments) * 2 * Math.PI;
        const x = Math.sin(angle) * radius;
        const y = Math.cos(angle) * radius;
        shapes.push(new Shape([x, y], {
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
        }));
    }
    return shapes;
}
function generateSquareLines(start, end, count = 10) {
    let shapes = [];
    for (let i = 0; i < count; i++) {
        const t = count === 1 ? 0 : i / (count - 1);
        const x = start[0] + (end[0] - start[0]) * t;
        const y = start[1] + (end[1] - start[1]) * t;
        shapes.push(new Shape([x, y], {
            color: [0.7, 0.7, 0.8, 1.0],
            size: 1 / 20,
            type: 'Square',
            segments: 20,
            rotationAngle: 0,
        }));
    }
    return shapes;
}
function getSpecialShape() {
    return [
        ...generateCircleOutline(),
        ...generateSquareLines([-0.7, -0.7], [-0.7, 0]),
        ...generateSquareLines([-0.6, -0.4], [-0.2, 0], 6),
        ...generateSquareLines([-0.6, -0.4], [-0.2, -0.7], 6),
        ...generateSquareLines([-0.2, 0], [0.3, 0.0], 6),
        ...generateSquareLines([0, 0], [0, -0.7]),
    ];
}
// oxlint-disable-next-line no-unused-vars
function main() {
    let { canvas, gl } = setupWebGL();
    if (!initShaders2(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to intialize shaders.');
        return -1;
    }
    clearCanvas(gl);
    canvas.addEventListener('mousedown', function (e) {
        click(e, gl, canvas);
    });
    canvas.addEventListener('mousemove', function (e) {
        click(e, gl, canvas);
    });
    const clearCanvasBtn = getButton('clearCanvas');
    clearCanvasBtn.addEventListener('click', function () {
        stopLoadingEffect(true, 'Canvas cleared.');
        hideReferenceImage();
        clearCanvas(gl);
    });
    // DRAWING MODE
    const shapesType = ['Square', 'Triangle', 'Circle'];
    for (const shape of shapesType) {
        const shapeBtn = getButton(shape.toLowerCase());
        shapeBtn.addEventListener('mouseup', function () {
            currShape.type = shape;
        });
    }
    // SHAPE COLORS
    const colorSliders = ['redSlider', 'greenSlider', 'blueSlider'];
    for (const [i, id] of colorSliders.entries()) {
        const colorSlider = getInput(id);
        colorSlider.addEventListener('mouseup', function () {
            currShape.color[i] = Number(this.value) / 20;
        });
    }
    // SHAPE SIZE
    const shapeSizeSlider = getInput('shapeSize');
    shapeSizeSlider.addEventListener('mouseup', function () {
        currShape.size = Number(this.value) / 50;
    });
    // SHAPE SEGMENTS
    const segmentSlider = getInput('segmentCount');
    segmentSlider.addEventListener('mouseup', function () {
        currShape.segments = Number(this.value);
    });
    // SHAPE ROTATION
    const rotationSlider = getInput('rotation');
    rotationSlider.addEventListener('mouseup', function () {
        currShape.rotationAngle = (Number(this.value) / 20) * Math.PI * 2;
    });
    // SPECIAL SHAPE
    const specialShape = getButton('special');
    const refImg = getImage('refImg');
    specialShape.addEventListener('click', function () {
        stopLoadingEffect(false, 'KT Special loaded.');
        refImg.hidden = false;
        shapesList = getSpecialShape();
        renderAllShapes(gl);
    });
    // AWESOMENESS: SPECIAL LOADER EFFECTS
    const loadingEffects = [
        { id: 'dnaTwist', label: 'DNA Twist', effect: createDNATwistLoader },
        { id: 'infinityTrail', label: 'Infinity Trail', effect: createInfinityTrailLoader },
        { id: 'circleIris', label: 'Circle Iris', effect: createCircleIrisLoader },
    ];
    for (const { id, label, effect } of loadingEffects) {
        const button = getButton(id);
        button.addEventListener('click', function () {
            startLoadingEffect(gl, id, label, effect);
        });
    }
    const stopEffects = getButton('stopEffects');
    stopEffects.addEventListener('click', function () {
        stopLoadingEffect(false, 'Animation stopped.');
    });
}
// UTILS
function clearCanvas(gl) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
}
function createCircle(segments) {
    let vertices = [];
    for (let i = 0; i < segments; i++) {
        const angle = (i / segments) * 2 * Math.PI;
        const x = Math.sin(angle);
        const y = Math.cos(angle);
        vertices.push(x, y, 0);
    }
    return new Float32Array(vertices);
}
function setupWebGL() {
    let canvas = document.getElementById('webgl');
    if (!(canvas instanceof HTMLCanvasElement) || !canvas) {
        throw new Error('Failed to get the canvas element');
    }
    let gl = getWebGL2Context(canvas);
    if (!gl) {
        throw new Error('Failed to get the rendering context for WebGL2');
    }
    return { canvas, gl };
}
function connectVariablesToGLSL(gl) {
    let a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        throw new Error('Failed to get the storage location of a_Position');
    }
    let u_Color = gl.getUniformLocation(gl.program, 'u_Color');
    return { a_Position, u_Color };
}
function getCanvasPosition(e, canvas) {
    let x = e.clientX;
    let y = e.clientY;
    let rect = canvas.getBoundingClientRect();
    x = (x - rect.left - canvas.width / 2) / (canvas.width / 2);
    y = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2);
    return [x, y];
}
function getButton(id) {
    const btn = document.getElementById(id);
    if (!(btn instanceof HTMLButtonElement))
        throw new Error(`Failed to get button with id ${id}`);
    return btn;
}
function getInput(id) {
    const input = document.getElementById(id);
    if (!(input instanceof HTMLInputElement))
        throw new Error(`Failed to get input with id ${id}`);
    return input;
}
function getImage(id) {
    const image = document.getElementById(id);
    if (!(image instanceof HTMLImageElement))
        throw new Error(`Failed to get image with id ${id}`);
    return image;
}
