"use strict";
function getWebGL2Context(canvas) {
    return canvas.getContext('webgl2', { preserveDrawingBuffer: true });
}
function initShaders2(gl, vshader, fshader) {
    return initShaders(gl, vshader, fshader);
}
const SQUARE = new Float32Array([-1, -1, 0.0, 1, -1, 0.0, 1, 1, 0.0, -1, 1, 0.0]);
const TRIANGLE = new Float32Array([-1, -1, 0.0, 1, -1, 0.0, 0.0, 1, 0.0]);
const FULL_ROTATION = Math.PI * 2;
const CIRCLE_CACHE = new Map();
let renderState = null;
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
    vertices;
    vertexCount;
    constructor(pos, cfg) {
        const { color, type, size, segments, rotationAngle } = cfg;
        this.color = color.slice();
        this.vertices = transformVertices(getShapeVertices(type, segments), pos, size, rotationAngle);
        this.vertexCount = this.vertices.length / 3;
    }
    render(gl) {
        const { u_Color } = getRenderState();
        gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);
        gl.uniform3f(u_Color, this.color[0], this.color[1], this.color[2]);
        gl.drawArrays(gl.TRIANGLE_FAN, 0, this.vertexCount);
    }
}
function renderAllShapes(gl) {
    clearCanvas(gl);
    const { a_Position, vertexBuffer } = getRenderState();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);
    for (const shape of shapesList) {
        shape.render(gl);
    }
}
function click(e, gl, canvas) {
    if (e.buttons !== 1) {
        return;
    }
    stopLoadingEffect(false, 'Manual drawing mode ready.');
    hideReferenceImage();
    const pos = getCanvasPosition(e, canvas);
    const shape = new Shape(pos, currShape);
    shapesList.push(shape);
    renderAllShapes(gl);
}
function generateCircleOutline(segments = 20, radius = 0.8, size = 0.08) {
    let shapes = [];
    for (let i = 0; i < segments; i++) {
        const angle = (i / segments) * FULL_ROTATION;
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
function main() {
    let { canvas, gl } = setupWebGL();
    if (!initShaders2(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to intialize shaders.');
        return -1;
    }
    renderState = connectVariablesToGLSL(gl);
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
        currShape.rotationAngle = (Number(this.value) / 20) * FULL_ROTATION;
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
    const cachedCircle = CIRCLE_CACHE.get(segments);
    if (cachedCircle) {
        return cachedCircle;
    }
    const vertices = new Float32Array(segments * 3);
    for (let i = 0; i < segments; i++) {
        const angle = (i / segments) * FULL_ROTATION;
        const index = i * 3;
        vertices[index] = Math.sin(angle);
        vertices[index + 1] = Math.cos(angle);
        vertices[index + 2] = 0;
    }
    CIRCLE_CACHE.set(segments, vertices);
    return vertices;
}
function getShapeVertices(type, segments) {
    if (type === 'Circle') {
        return createCircle(segments);
    }
    if (type === 'Square') {
        return SQUARE;
    }
    return TRIANGLE;
}
function transformVertices(vertices, position, size, rotationAngle) {
    const translated = new Float32Array(vertices.length);
    const cos = Math.cos(rotationAngle);
    const sin = Math.sin(rotationAngle);
    for (let i = 0; i < translated.length; i += 3) {
        const x = vertices[i] * size;
        const y = vertices[i + 1] * size;
        translated[i] = x * cos - y * sin + position[0];
        translated[i + 1] = x * sin + y * cos + position[1];
    }
    return translated;
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
    const a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        throw new Error('Failed to get the storage location of a_Position');
    }
    const u_Color = gl.getUniformLocation(gl.program, 'u_Color');
    if (!u_Color) {
        throw new Error('Failed to get the storage location of u_Color');
    }
    const vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
        throw new Error('Failed to create buffer');
    }
    return { a_Position, u_Color, vertexBuffer };
}
function getRenderState() {
    if (!renderState) {
        throw new Error('Render state has not been initialized');
    }
    return renderState;
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
