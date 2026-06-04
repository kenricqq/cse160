varying vec3 vColor;
varying float vAlpha;

void main() {
    float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
    float strength = 1.0 - smoothstep(0.0, 0.5, distanceToCenter);
    strength = pow(strength, 1.6);

    if (strength < 0.01) {
        discard;
    }

    // Final
    vec3 color = vColor * strength;

    gl_FragColor = vec4(color, strength * vAlpha);

    #include <colorspace_fragment>
}
