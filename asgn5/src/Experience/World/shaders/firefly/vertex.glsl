uniform float uTime;
uniform float uSize;

attribute float aScale;
attribute float aPhase;
attribute vec3 aDrift;

varying vec3 vColor;
varying float vAlpha;

void main() {
    // Position
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);

    // Slow clustered drift
    modelPosition.x += sin(uTime * 0.7 + aPhase) * aDrift.x;
    modelPosition.y += sin(uTime * 1.4 + aPhase * 1.7) * aDrift.y;
    modelPosition.z += cos(uTime * 0.8 + aPhase) * aDrift.z;

    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;

    gl_Position = projectedPosition;

    // Size
    float flicker = 0.65 + 0.35 * sin(uTime * 5.0 + aPhase * 3.0);
    gl_PointSize = uSize * aScale * (0.8 + flicker * 0.4);
    gl_PointSize *= (1.0 / -viewPosition.z);

    // Color
    vColor = color;
    vAlpha = flicker;
}
