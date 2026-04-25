"use strict";
let activeAnimationFrame = null;
function createAnimatedShape(pos, color, size, type = 'Circle', rotationAngle = 0, segments = 24) {
    return new Shape(pos, {
        color: [color[0] ?? 1.0, color[1] ?? 1.0, color[2] ?? 1.0, color[3] ?? 1.0],
        size,
        type,
        segments,
        rotationAngle,
    });
}
function normalizedWave(value) {
    return (Math.sin(value) + 1) / 2;
}
function polarToCartesian(angle, radius) {
    return [Math.sin(angle) * radius, Math.cos(angle) * radius];
}
function hideReferenceImage() {
    getImage('refImg').hidden = true;
}
function setActiveEffectButton(buttonId) {
    document.querySelectorAll('.effect-button').forEach((button) => {
        button.classList.toggle('active', button.id === buttonId);
    });
}
function updateEffectStatus(message) {
    const effectStatus = document.getElementById('effectStatus');
    if (effectStatus) {
        effectStatus.textContent = message;
    }
}
function stopLoadingEffect(clearScene = false, statusMessage = 'Choose a loading effect to loop it on the canvas.') {
    if (activeAnimationFrame !== null) {
        cancelAnimationFrame(activeAnimationFrame);
        activeAnimationFrame = null;
    }
    setActiveEffectButton(null);
    if (clearScene) {
        shapesList = [];
    }
    updateEffectStatus(statusMessage);
}
// oxlint-disable-next-line no-unused-vars
function startLoadingEffect(gl, buttonId, label, effect) {
    stopLoadingEffect(false, `Looping ${label}. Click another effect to swap it out.`);
    hideReferenceImage();
    setActiveEffectButton(buttonId);
    const animate = (frameTime) => {
        shapesList = effect(frameTime / 1000);
        renderAllShapes(gl);
        activeAnimationFrame = requestAnimationFrame(animate);
    };
    activeAnimationFrame = requestAnimationFrame(animate);
}
// oxlint-disable-next-line no-unused-vars
function createDNATwistLoader(time) {
    const shapes = [];
    const rows = 14;
    for (let i = 0; i < rows; i++) {
        const t = rows === 1 ? 0 : i / (rows - 1);
        const y = -0.72 + t * 1.44;
        const phase = time * 3.4 + i * 0.58;
        const xOffset = Math.sin(phase) * 0.33;
        const warmGlow = normalizedWave(phase);
        const coolGlow = normalizedWave(phase + Math.PI);
        const left = [xOffset, y];
        const right = [-xOffset, y];
        shapes.push(createAnimatedShape(left, [1.0, 0.34 + warmGlow * 0.32, 0.24 + warmGlow * 0.22, 1.0], 0.03 + warmGlow * 0.03, 'Circle', phase, 24));
        shapes.push(createAnimatedShape(right, [0.24 + coolGlow * 0.18, 0.65 + coolGlow * 0.22, 1.0, 1.0], 0.03 + coolGlow * 0.03, 'Circle', -phase, 24));
        if (i % 2 === 0) {
            const bridgeCount = 5;
            for (let j = 1; j < bridgeCount; j++) {
                const bridgeT = j / bridgeCount;
                const x = left[0] + (right[0] - left[0]) * bridgeT;
                const brightness = 1 - Math.abs(bridgeT - 0.5) * 1.4;
                shapes.push(createAnimatedShape([x, y], [0.55 + brightness * 0.2, 0.45 + brightness * 0.18, 0.88, 1.0], 0.012 + brightness * 0.014, 'Square', phase * 0.5));
            }
        }
    }
    return shapes;
}
// oxlint-disable-next-line no-unused-vars
function createInfinityTrailLoader(time) {
    const shapes = [];
    const dots = 28;
    for (let i = 0; i < dots; i++) {
        const trail = i / dots;
        const angle = time * 2.4 - trail * 4.2;
        const x = Math.sin(angle) * 0.46;
        const y = Math.sin(angle) * Math.cos(angle) * 0.34 + Math.sin(time * 6 + i) * 0.012;
        const brightness = 1 - trail;
        shapes.push(createAnimatedShape([x, y], [1.0 - trail * 0.22, 0.38 + brightness * 0.4, 0.9 - trail * 0.32, 1.0], 0.018 + brightness * 0.045, i % 5 === 0 ? 'Square' : 'Circle', angle, 24));
    }
    const accentAngle = time * 2.4;
    const front = [
        Math.sin(accentAngle) * 0.46,
        Math.sin(accentAngle) * Math.cos(accentAngle) * 0.34,
    ];
    const back = [
        Math.sin(accentAngle + Math.PI) * 0.46,
        Math.sin(accentAngle + Math.PI) * Math.cos(accentAngle + Math.PI) * 0.34,
    ];
    shapes.push(createAnimatedShape(front, [1.0, 0.96, 0.65, 1.0], 0.032, 'Triangle', accentAngle + Math.PI / 2));
    shapes.push(createAnimatedShape(back, [0.45, 0.88, 1.0, 1.0], 0.032, 'Triangle', accentAngle - Math.PI / 2));
    return shapes;
}
// oxlint-disable-next-line no-unused-vars
function createCircleIrisLoader(time) {
    const shapes = [];
    const wedgeCount = 16;
    const pulse = normalizedWave(time * 2.2);
    const opening = 0.02 + (1 - pulse) * 0.22;
    const wedgeSize = 0.11 + pulse * 0.06;
    const spinOffset = time * 0.35;
    for (let i = 0; i < wedgeCount; i++) {
        const angle = (i / wedgeCount) * Math.PI * 2 + spinOffset;
        const [x, y] = polarToCartesian(angle, opening);
        const glow = 0.35 + 0.65 * normalizedWave(time * 4.4 - i * 0.55);
        shapes.push(createAnimatedShape([x, y], [0.45 + glow * 0.35, 0.28 + pulse * 0.42, 0.9 + glow * 0.08, 1.0], wedgeSize, 'Triangle', angle + Math.PI));
    }
    const rimCount = 22;
    const rimRadius = 0.36 + (1 - pulse) * 0.12;
    for (let i = 0; i < rimCount; i++) {
        const angle = (i / rimCount) * Math.PI * 2 - spinOffset * 1.3;
        const [x, y] = polarToCartesian(angle, rimRadius);
        const brightness = 0.3 + 0.7 * pulse;
        shapes.push(createAnimatedShape([x, y], [0.25 + brightness * 0.25, 0.4 + brightness * 0.28, 0.95, 1.0], 0.012 + brightness * 0.015, 'Circle', 0, 24));
    }
    shapes.push(createAnimatedShape([0, 0], [0.95, 0.92, 0.72, 1.0], 0.06 + pulse * 0.06, 'Circle', 0, 32));
    return shapes;
}
