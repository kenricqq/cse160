"use strict";
function getWebGL2Context(canvas) {
    return canvas.getContext('webgl2', { preserveDrawingBuffer: true });
}
function initShaders2(gl, vshader, fshader) {
    return initShaders(gl, vshader, fshader);
}
function setupWebGL(canvasId = 'webgl') {
    let canvas = document.getElementById(canvasId);
    if (!(canvas instanceof HTMLCanvasElement)) {
        throw new Error('Failed to get the canvas element');
    }
    let gl = getWebGL2Context(canvas);
    if (!gl) {
        throw new Error('Failed to get the rendering context for WebGL2');
    }
    return { canvas, gl };
}
