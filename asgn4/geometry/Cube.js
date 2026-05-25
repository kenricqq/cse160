"use strict";
// oxlint-disable typescript/no-extraneous-class
// oxlint-disable no-unused-vars
class Cube extends Geometry {
    vertices;
    constructor() {
        super();
        this.positionSize = 3;
        this.colorSize = 3;
        this.floatsPerVertex = 11;
        let data = [];
        function addVertex(position, color, uv, normal) {
            data.push(...position, ...color, ...uv, ...normal);
        }
        function addFace(normal, color, p0, p1, p2, p3) {
            addVertex(p0, color, [0, 0], normal);
            addVertex(p1, color, [1, 0], normal);
            addVertex(p2, color, [1, 1], normal);
            addVertex(p0, color, [0, 0], normal);
            addVertex(p2, color, [1, 1], normal);
            addVertex(p3, color, [0, 1], normal);
        }
        addFace([0, 0, 1], [1, 0, 0], [-0.5, -0.5, 0.5], [0.5, -0.5, 0.5], [0.5, 0.5, 0.5], [-0.5, 0.5, 0.5]);
        addFace([0, 0, -1], [0, 1, 0], [0.5, -0.5, -0.5], [-0.5, -0.5, -0.5], [-0.5, 0.5, -0.5], [0.5, 0.5, -0.5]);
        addFace([1, 0, 0], [0, 0, 1], [0.5, -0.5, 0.5], [0.5, -0.5, -0.5], [0.5, 0.5, -0.5], [0.5, 0.5, 0.5]);
        addFace([-1, 0, 0], [0, 1, 1], [-0.5, -0.5, -0.5], [-0.5, -0.5, 0.5], [-0.5, 0.5, 0.5], [-0.5, 0.5, -0.5]);
        addFace([0, 1, 0], [1, 1, 0], [-0.5, 0.5, 0.5], [0.5, 0.5, 0.5], [0.5, 0.5, -0.5], [-0.5, 0.5, -0.5]);
        addFace([0, -1, 0], [1, 0, 1], [-0.5, -0.5, -0.5], [0.5, -0.5, -0.5], [0.5, -0.5, 0.5], [-0.5, -0.5, 0.5]);
        this.vertices = new Float32Array(data);
    }
}
