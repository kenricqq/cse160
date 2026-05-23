"use strict";
// oxlint-disable typescript/no-extraneous-class
// oxlint-disable no-unused-vars
class Geometry {
    vertices;
    modelMatrix;
    translationMatrix;
    rotationMatrix;
    scaleMatrix;
    positionSize;
    colorSize;
    uvSize;
    floatsPerVertex;
    vertexBuffer;
    baseColor;
    texColorWeight;
    textureIndex;
    swirlAmount;
    reflectAmount;
    kind;
    constructor() {
        this.vertices = new Float32Array([0, 0.3, -0.3, -0.3, 0.3, -0.3]);
        this.modelMatrix = new Matrix4();
        this.translationMatrix = new Matrix4();
        this.rotationMatrix = new Matrix4();
        this.scaleMatrix = new Matrix4();
        this.positionSize = 2;
        this.colorSize = 0;
        this.uvSize = 2;
        this.floatsPerVertex = 2;
        this.vertexBuffer = null;
        this.baseColor = [1, 1, 1, 1];
        this.texColorWeight = 1;
        this.textureIndex = 0;
        this.swirlAmount = 0;
        this.reflectAmount = 0;
        this.kind = 'static';
    }
    translate(x, y, z) {
        this.translationMatrix.setTranslate(x, y, z);
    }
    rotateX(angle) {
        this.rotationMatrix.setRotate(angle, 1, 0, 0);
    }
    rotateY(angle) {
        this.rotationMatrix.setRotate(angle, 0, 1, 0);
    }
    rotateZ(angle) {
        this.rotationMatrix.setRotate(angle, 0, 0, 1);
    }
    scale(x, y, z) {
        this.scaleMatrix.setScale(x, y, z);
    }
}
