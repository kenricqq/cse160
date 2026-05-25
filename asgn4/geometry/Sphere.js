"use strict";
// oxlint-disable typescript/no-extraneous-class
// oxlint-disable no-unused-vars
class Sphere extends Geometry {
    vertices;
    constructor(latitudeBands = 18, longitudeBands = 24) {
        super();
        this.positionSize = 3;
        this.colorSize = 3;
        this.floatsPerVertex = 11;
        this.texColorWeight = 0;
        let data = [];
        let color = [0.75, 0.85, 1.0];
        function point(lat, lon) {
            let theta = (lat * Math.PI) / latitudeBands;
            let phi = (lon * 2 * Math.PI) / longitudeBands;
            let sinTheta = Math.sin(theta);
            let normal = [sinTheta * Math.cos(phi), Math.cos(theta), sinTheta * Math.sin(phi)];
            return {
                position: [normal[0] * 0.5, normal[1] * 0.5, normal[2] * 0.5],
                normal,
                uv: [lon / longitudeBands, 1 - lat / latitudeBands],
            };
        }
        function addVertex(vertex) {
            data.push(...vertex.position, ...color, ...vertex.uv, ...vertex.normal);
        }
        for (let lat = 0; lat < latitudeBands; lat++) {
            for (let lon = 0; lon < longitudeBands; lon++) {
                let topLeft = point(lat, lon);
                let bottomLeft = point(lat + 1, lon);
                let bottomRight = point(lat + 1, lon + 1);
                let topRight = point(lat, lon + 1);
                addVertex(topLeft);
                addVertex(bottomLeft);
                addVertex(bottomRight);
                addVertex(topLeft);
                addVertex(bottomRight);
                addVertex(topRight);
            }
        }
        this.vertices = new Float32Array(data);
    }
}
