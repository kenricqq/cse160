"use strict";
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
`;
// Fragment shader program
var FSHADER_SOURCE = `
	precision mediump float;

	varying vec4 v_Color;
	varying vec2 v_UV;

	uniform sampler2D u_Sampler;

	void main() {
	  // gl_FragColor = v_Color;
	  vec4 texColor = texture2D(u_Sampler, v_UV);
	  // gl_FragColor = texColor;

	  vec4 baseColor = vec4(0,1,0,1);

		// t = u_texColorWeight;
		float t = 0.8;
		gl_FragColor = (1.0 - t) * baseColor + t * texColor;
	}
`;
let shapes = [];
let gAnimalGlobalRotation = 0;
function loadWorld(gl, src, camera) {
    var texture = gl.createTexture();
    var img = new Image();
    img.addEventListener('load', () => {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
        let u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');
        gl.uniform1i(u_Sampler, 0);
        animate(gl, camera);
    });
    img.src = src;
}
function initVertexBuffers(gl, shape, camera) {
    var n = shape.vertices.length / shape.floatsPerVertex; // The number of vertices
    if (!shape.vertexBuffer) {
        // Create a buffer object
        shape.vertexBuffer = gl.createBuffer();
        if (!shape.vertexBuffer) {
            console.log('Failed to create the buffer object');
            return -1;
        }
        // Bind the buffer object to target
        gl.bindBuffer(gl.ARRAY_BUFFER, shape.vertexBuffer);
        // Write date into the buffer object
        gl.bufferData(gl.ARRAY_BUFFER, shape.vertices, gl.STATIC_DRAW);
    }
    else {
        gl.bindBuffer(gl.ARRAY_BUFFER, shape.vertexBuffer);
    }
    const FLOAT_SIZE = Float32Array.BYTES_PER_ELEMENT;
    const stride = shape.floatsPerVertex * FLOAT_SIZE;
    let a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return -1;
    }
    gl.vertexAttribPointer(a_Position, shape.positionSize, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(a_Position);
    let a_Color = gl.getAttribLocation(gl.program, 'a_Color');
    if (a_Color < 0) {
        console.log('Failed to get the storage location of a_Color');
        return -1;
    }
    gl.vertexAttribPointer(a_Color, shape.colorSize, gl.FLOAT, false, stride, shape.positionSize * FLOAT_SIZE);
    gl.enableVertexAttribArray(a_Color);
    let a_UV = gl.getAttribLocation(gl.program, 'a_UV');
    gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, stride, (shape.positionSize + shape.colorSize) * FLOAT_SIZE);
    gl.enableVertexAttribArray(a_UV);
    let u_viewMatrix = gl.getUniformLocation(gl.program, 'u_viewMatrix');
    gl.uniformMatrix4fv(u_viewMatrix, false, camera.viewMatrix.elements);
    let u_projectionMatrix = gl.getUniformLocation(gl.program, 'u_projectionMatrix');
    gl.uniformMatrix4fv(u_projectionMatrix, false, camera.projectionMatrix.elements);
    return n;
}
function animate(gl, camera) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gAnimalGlobalRotation += 1;
    for (let s of shapes) {
        // s.rotateY(gAnimalGlobalRotation)
        draw(gl, s, camera);
    }
    requestAnimationFrame(() => animate(gl, camera));
}
function draw(gl, shape, camera) {
    // Write the positions of vertices to a vertex shader
    let n = initVertexBuffers(gl, shape, camera);
    if (n < 0) {
        console.log('Failed to set the positions of the vertices');
        return;
    }
    shape.modelMatrix
        .multiply(shape.translationMatrix)
        .multiply(shape.rotationMatrix)
        .multiply(shape.scaleMatrix);
    let u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    gl.uniformMatrix4fv(u_ModelMatrix, false, shape.modelMatrix.elements);
    gl.drawArrays(gl.TRIANGLES, 0, n);
    // gl.drawArrays(gl.LINE_LOOP, 0, n) // wireframe}
    shape.modelMatrix.setIdentity();
}
function keydown(ev, camera) {
    switch (ev.key) {
        case 'w':
            camera.moveForward(0.05);
            break;
        case 'a':
            camera.moveLeft(0.05);
            break;
        case 's':
            camera.moveBackwards(0.05);
            break;
        case 'd':
            camera.moveRight(0.05);
            break;
        case 'q':
            camera.panLeft(5);
            break;
        case 'e':
            camera.panRight(5);
            break;
    }
}
// oxlint-disable-next-line no-unused-vars
function main() {
    let { gl } = setupWebGL();
    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0, 0, 0, 1);
    if (!initShaders2(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to intialize shaders.');
        return -1;
    }
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    // GROUND and SKY
    let ground = new Cube();
    ground.translate(0, -0.5, 0);
    ground.scale(32, 0.1, 32);
    ground.rotateY(0);
    shapes.push(ground);
    let sky = new Cube();
    // sky.translate(0,0,0)
    sky.scale(1000, 1000, 1000);
    shapes.push(sky);
    // WALL
    // let walls = []
    for (let x = 0; x < map.length; x++) {
        for (let z = 0; z < map[x].length; z++) {
            let height = map[x][z];
            for (let y = 0; y < height; y++) {
                let w = new Cube();
                w.translate(x - map.length / 2, y, z - map.length / 2);
                // walls.push(w)
                shapes.push(w);
            }
        }
    }
    // Camera
    let canvas = getCanvas();
    let camera = new Camera(canvas.width / canvas.height, 0.1, 1000);
    document.addEventListener('keydown', (ev) => {
        keydown(ev, camera);
    });
    loadWorld(gl, '../textures/town.png', camera);
}
window.addEventListener('load', main);
