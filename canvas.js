// =====================================================================
// Rendering engine
//
// Every layer gets its own canvas. A single master clock decides which
// global frame is shown; each layer derives its own frameCount from it.
// Layer code is compiled into an isolated scope bound to that layer's own
// p5 instance, so layers never draw into each other's canvases, and every
// frame is a pure function of its frame number (seeded random), which makes
// loops seamless and lets the exporter render frames offline.
// =====================================================================

let isRunning = false;
let isPaused = false;
let loopFrameCount = 0;
let framesPerLoop = 120;
let autoFrames = true;
let animationFPS = 60;
let animationSpeed = 1;
let virtualFrameCount = 0;
let canvasRatio = '1:1'; // '1:1', '4:3', or '3:4'
let baseSize = 300;
let canvasWidth = 300;
let canvasHeight = 300;
let animationLoopId = null;
let backgroundColor = '#000000';
let pipWindow = null;
let pipUpdateInterval = null;

let playStartTime = 0;
let playStartFrame = 0;
let forceNextRender = false;

// ---------------------------------------------------------------------
// Scoped compilation of layer code
// ---------------------------------------------------------------------
const JS_RESERVED = new Set(['break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default',
    'delete', 'do', 'else', 'export', 'extends', 'finally', 'for', 'function', 'if', 'import', 'in',
    'instanceof', 'new', 'return', 'super', 'switch', 'this', 'throw', 'try', 'typeof', 'var', 'void',
    'while', 'with', 'yield', 'let', 'static', 'enum', 'await', 'implements', 'package', 'protected',
    'interface', 'private', 'public', 'null', 'true', 'false', 'arguments', 'eval', 'undefined', 'NaN', 'Infinity']);

// Names the engine defines itself inside the layer scope (not taken from p5 directly)
const ENGINE_NAMES = new Set(['width', 'height', 'frameCount', 'maxFrames', 'progress', 'mouseX', 'mouseY',
    'pixels', 'deltaTime', 'hue', 'saturation', 'brightness', 'opacity', 'layer', 'p',
    'background', 'createCanvas', 'resizeCanvas', 'frameRate', 'noLoop', 'loop', 'redraw', 'millis',
    'loadPixels', 'drawingContext', 'belowImage', 'setup', 'draw', 'preload', 'remove', 'constructor']);

let p5ApiNamesCache = null;
function getP5ApiNames() {
    if (p5ApiNamesCache) return p5ApiNamesCache;
    const names = [];
    for (const key of Object.getOwnPropertyNames(p5.prototype)) {
        if (!/^[A-Za-z$][\w$]*$/.test(key) || key.startsWith('_')) continue;
        if (JS_RESERVED.has(key) || ENGINE_NAMES.has(key)) continue;
        const desc = Object.getOwnPropertyDescriptor(p5.prototype, key);
        if (!desc || !('value' in desc)) continue;
        names.push(key);
    }
    p5ApiNamesCache = names;
    return names;
}

function compileLayerCode(code, p, ctl) {
    const names = getP5ApiNames();
    const values = names.map(n => {
        const v = p[n];
        return typeof v === 'function' ? v.bind(p) : v;
    });

    const body = `
let width = __p.width, height = __p.height, frameCount = 0, progress = 0;
let maxFrames = layerLoopLength(__ctl.layer), mouseX = 0, mouseY = 0, pixels = [], deltaTime = 1000 / 60;
let hue = 360, saturation = 100, brightness = 100, opacity = 100;
const p = __p, layer = __ctl.layer, drawingContext = __p.drawingContext;
// Effect layers: the finished picture of every layer below this one (and the background)
const belowImage = () => __ctl.below();
const background = (...a) => a.length ? __p.background(...a) : __p.clear();
const loadPixels = () => { __p.loadPixels(); pixels = __p.pixels; };
const millis = () => frameCount / __ctl.layer.fps * 1000;
const frameRate = () => __ctl.layer.fps;
const createCanvas = () => __p._renderer, resizeCanvas = () => {};
const noLoop = () => {}, loop = () => {}, redraw = () => {};
function __sync(f) {
    width = __p.width; height = __p.height;
    maxFrames = layerLoopLength(__ctl.layer);
    frameCount = f; progress = f / maxFrames;
    mouseX = __p.mouseX; mouseY = __p.mouseY;
    deltaTime = 1000 / __ctl.layer.fps;
}
{
${code}
;return {
    setup: typeof setup === 'function' ? setup : null,
    draw: typeof draw === 'function' ? draw : null,
    sync: __sync
};
}`;
    const factory = new Function('__p', '__ctl', ...names, body);
    return factory(p, ctl, ...values);
}

// ---------------------------------------------------------------------
// Layer renderers. Each one exposes:
//   { layer, canvas, render(globalFrame), ready: Promise, remove() }
// ---------------------------------------------------------------------
// Loop length of a layer: its own Frames, or the main loop when it follows it
function layerLoopLength(layer) {
    return layer.syncLoop ? framesPerLoop : layer.maxFrames;
}

function layerFrameFor(layer, globalFrame) {
    if (layer.syncLoop) {
        // Follows the main loop: one of its loops per loop of the whole animation
        return ((globalFrame % framesPerLoop) + framesPerLoop) % framesPerLoop;
    }
    let ticks = globalFrame * layer.fps * layer.speed / animationFPS;
    // Whole frames while playing (and for deliberately choppy low-fps layers);
    // exports ask for in-between moments so motion is perfectly even
    if (Number.isInteger(globalFrame) || layer.fps < animationFPS) ticks = Math.floor(ticks + 1e-6);
    return ((ticks % layer.maxFrames) + layer.maxFrames) % layer.maxFrames;
}

function createCodeLayerRenderer(layer, layerIndex) {
    const ctl = { layer, frame: -1, below: () => belowImageFor(renderer) };
    let renderer = null;
    const seed = 1000 + layer.id * 7919;
    let instance = null;

    instance = new p5(p => {
        p.setup = function () {
            p.pixelDensity(1);
            p.createCanvas(canvasWidth, canvasHeight);
            p.noLoop();
        };
        p.draw = function () {};
    });

    if (!instance.canvas) {
        throw new Error('p5 failed to create a canvas');
    }

    const p = instance;
    p.colorMode(p.HSB, 360, 100, 100, 100);
    p.randomSeed(seed);
    p.noiseSeed(seed);
    p.clear();

    let api;
    try {
        api = compileLayerCode(layer.code, p, ctl);
        if (api.setup) {
            api.sync(0);
            api.setup();
        }
    } catch (e) {
        instance.remove();
        throw e;
    }

    renderer = {
        layer,
        usesBelow: false,
        lastKey: undefined,
        canvas: p.canvas,
        p5: p,
        ready: Promise.resolve(),
        failed: false,
        zoomByComposite: !api.draw,      // drawn once in setup(): zoom the finished image
        render(globalFrame, force) {
            if (this.failed || !api.draw) return; // static layers keep their setup() drawing
            const f = layerFrameFor(layer, globalFrame);
            // Effect layers depend on the layers below, so they redraw on every new frame
            const key = this.usesBelow ? globalFrame : f;
            if (key === this.lastKey && !force) return;
            this.lastKey = key;
            ctl.frame = f;
            api.sync(f);
            p.randomSeed(seed + 1 + f);
            p.push();
            p.clear();
            // Layer zoom: scale everything this layer draws around the canvas centre
            const z = layerZoom(layer);
            if (z !== 1) {
                p.translate(p.width / 2, p.height / 2);
                p.scale(z);
                p.translate(-p.width / 2, -p.height / 2);
            }
            try {
                api.draw();
            } catch (e) {
                this.failed = true;
                showError(`Layer ${layers.indexOf(layer) + 1}: ${e.message}`);
                console.error(e);
            }
            p.pop();
        },
        remove() { instance.remove(); }
    };
    return renderer;
}

function createStaticLayerRenderer(layer, paint) {
    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d');
    const ready = Promise.resolve(paint(ctx, canvas));
    return {
        layer, canvas, ready, failed: false,
        zoomByComposite: true,           // painted once: zoom the finished image
        render() {},
        remove() { canvas.remove(); }
    };
}

function loadHtmlImage(src) {
    return new Promise(resolve => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = src;
    });
}

function createImageLayerRenderer(layer) {
    return createStaticLayerRenderer(layer, async (ctx) => {
        const items = (layer.images || []).filter(i => i.imageData);
        const imgs = await Promise.all(items.map(i => loadHtmlImage(i.imageData)));
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        items.forEach((item, idx) => {
            const img = imgs[idx];
            if (!img) return;
            let w = item.imageWidth, h = item.imageHeight;
            let cx = item.imageX + w / 2, cy = item.imageY + h / 2;
            if (item.imageFit === 'cover' || item.imageFit === 'contain') {
                // Fill / fit the whole canvas, keeping the image's aspect ratio
                const k = item.imageFit === 'cover'
                    ? Math.max(canvasWidth / img.width, canvasHeight / img.height)
                    : Math.min(canvasWidth / img.width, canvasHeight / img.height);
                w = img.width * k;
                h = img.height * k;
                cx = canvasWidth / 2;
                cy = canvasHeight / 2;
            }
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate((item.imageRotation || 0) * Math.PI / 180);
            ctx.drawImage(img, -w / 2, -h / 2, w, h);
            ctx.restore();
        });
        requestRender();
    });
}

// Opacity (0..1) of a text item at layer frame f, from its show/hide window and fades
function textVisibility(t, f, maxFrames) {
    const start = Math.max(0, t.startFrame || 0);
    const end = t.endFrame >= 0 ? t.endFrame : maxFrames - 1;
    if (f < start || f > end) return 0;
    const fade = Math.max(0, t.fadeFrames || 0);
    let a = 1;
    if (fade > 0 && start > 0) a = Math.min(a, (f - start) / fade);          // fade in
    if (fade > 0 && t.endFrame >= 0) a = Math.min(a, (end - f) / fade);      // fade out
    return Math.max(0, Math.min(1, a));
}

function drawTextItem(ctx, t, f, maxFrames) {
    if (!t.text) return;
    let alpha = textVisibility(t, f, maxFrames);
    if (alpha <= 0) return;

    // Position within the current animation cycle (0..1). The offset delays the
    // animation, so offsets 0 / 33 / 67 play one after another in that order.
    const cycles = Math.max(1, Math.round(t.animCycles || 1));
    const pos = f / maxFrames * cycles - (t.animOffset || 0) / 100;
    const cyclePos = pos - Math.floor(pos);
    const phase = cyclePos * Math.PI * 2;
    const amount = t.animAmount || 0;
    let dx = 0, dy = 0, rot = (t.textRotation || 0) * Math.PI / 180, scale = 1;
    switch (t.animation) {
        case 'float': dy = Math.sin(phase) * amount; break;
        case 'sway': dx = Math.sin(phase) * amount; break;
        case 'spin': rot += phase; break;
        case 'pulse': scale = Math.max(0, 1 + amount / 100 * Math.sin(phase)); break;
        case 'blink': {
            // Worked out in whole frames so texts that take turns line up exactly
            const cycleLen = maxFrames / cycles;
            const offsetFrames = Math.round((t.animOffset || 0) / 100 * cycleLen);
            const onFrames = Math.round((t.blinkOn ?? 50) / 100 * cycleLen);
            const inCycle = (((f - offsetFrames) % cycleLen) + cycleLen) % cycleLen;
            if (inCycle >= onFrames - 1e-6) alpha = 0;
            break;
        }
    }
    if (alpha <= 0) return;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(canvasWidth * t.textX / 100 + dx, canvasHeight * t.textY / 100 + dy);
    ctx.rotate(rot);
    ctx.scale(scale, scale);
    ctx.font = `${t.bold ? 'bold ' : ''}${t.fontSize}px "${t.fontFamily}"`;
    ctx.textAlign = (t.textAlign || 'CENTER').toLowerCase();
    ctx.textBaseline = 'middle';
    ctx.fillStyle = t.color || '#ffffff';
    ctx.fillText(String(t.text).split('{frame}').join(String(Math.floor(f))), 0, 0);
    ctx.restore();
}

function createTextLayerRenderer(layer) {
    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d');
    let lastFrame = -1;
    return {
        layer, canvas, ready: Promise.resolve(), failed: false,
        render(globalFrame, force) {
            const f = layerFrameFor(layer, globalFrame);
            if (f === lastFrame && !force) return;
            lastFrame = f;
            ctx.clearRect(0, 0, canvasWidth, canvasHeight);
            const z = layerZoom(layer);
            ctx.save();
            if (z !== 1) {
                ctx.translate(canvasWidth / 2, canvasHeight / 2);
                ctx.scale(z, z);
                ctx.translate(-canvasWidth / 2, -canvasHeight / 2);
            }
            (layer.texts || []).forEach(t => drawTextItem(ctx, t, f, layerLoopLength(layer)));
            ctx.restore();
        },
        remove() { canvas.remove(); }
    };
}

// CSS / canvas filter string for a layer's H/S/B sliders
function layerFilter(layer) {
    const parts = [];
    const hue = (layer.hue || 0) % 360;
    if (hue) parts.push(`hue-rotate(${hue}deg)`);
    if (layer.saturation !== 100) parts.push(`saturate(${layer.saturation / 100})`);
    if (layer.brightness !== 100) parts.push(`brightness(${layer.brightness / 100})`);
    return parts.length ? parts.join(' ') : 'none';
}

// How visible a layer is (0..1) at a frame of the main timeline, from its
// "show from / to" frames and fade length
function layerVisibilityAt(layer, globalFrame) {
    const start = Math.max(0, layer.startFrame || 0);
    const hasEnd = layer.endFrame !== undefined && layer.endFrame !== null && layer.endFrame >= 0;
    const end = hasEnd ? layer.endFrame : framesPerLoop - 1;
    if (globalFrame < start || globalFrame > end) return 0;
    const fade = Math.max(0, layer.fadeFrames || 0);
    let a = 1;
    if (fade > 0 && start > 0) a = Math.min(a, (globalFrame - start) / fade);   // fade in
    if (fade > 0 && hasEnd) a = Math.min(a, (end - globalFrame) / fade);        // fade out
    return Math.max(0, Math.min(1, a));
}

function layerZoom(layer) {
    const z = parseFloat(layer.zoom);
    return z > 0 ? z : 1;
}

function applyLayerStyle(renderer) {
    const vis = renderer.visibility === undefined ? 1 : renderer.visibility;
    renderer.canvas.style.filter = layerFilter(renderer.layer);
    renderer.canvas.style.opacity = renderer.layer.opacity / 100 * vis;
    const z = layerZoom(renderer.layer);
    renderer.canvas.style.transform = renderer.zoomByComposite && z !== 1 ? `scale(${z})` : '';
}

function refreshLayerStyles() {
    canvasLayers.forEach(applyLayerStyle);
    if (isPaused || !isRunning) updatePipWindow();
}

// Draws the full composition (background + every layer) onto a 2D context.
function compositeFrame(ctx, w = canvasWidth, h = canvasHeight) {
    compositeLayers(ctx, canvasLayers, w, h);
}

// The finished picture of everything below an effect layer, at the current frame
function belowImageFor(renderer) {
    renderer.usesBelow = true;
    if (!renderer.belowCanvas) {
        renderer.belowCanvas = document.createElement('canvas');
        renderer.belowCanvas.width = canvasWidth;
        renderer.belowCanvas.height = canvasHeight;
    }
    const index = canvasLayers.indexOf(renderer);
    compositeLayers(renderer.belowCanvas.getContext('2d'), canvasLayers.slice(0, Math.max(0, index)), canvasWidth, canvasHeight);
    return renderer.belowCanvas;
}

function compositeLayers(ctx, renderers, w, h) {
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.filter = 'none';
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, w, h);
    renderers.forEach(r => {
        const vis = r.visibility === undefined ? 1 : r.visibility;
        if (vis <= 0) return;
        ctx.globalAlpha = r.layer.opacity / 100 * vis;
        ctx.filter = layerFilter(r.layer);
        const z = r.zoomByComposite ? layerZoom(r.layer) : 1;
        ctx.drawImage(r.canvas, (w - w * z) / 2, (h - h * z) / 2, w * z, h * z);
    });
    ctx.restore();
}

// ---------------------------------------------------------------------
// Run / stop
// ---------------------------------------------------------------------
function showError(message) {
    const errorDisplay = document.getElementById('errorDisplay');
    errorDisplay.textContent = 'Error: ' + message;
    errorDisplay.style.display = 'block';
}

function destroyLayerRenderers() {
    canvasLayers.forEach(r => { try { r.remove(); } catch (e) { /* ignore */ } });
    canvasLayers = [];
}

function runAnimation(keepFrame = false) {
    const startFrame = keepFrame ? virtualFrameCount : 0;
    if (animationLoopId) {
        cancelAnimationFrame(animationLoopId);
        animationLoopId = null;
    }
    destroyLayerRenderers();

    const errorDisplay = document.getElementById('errorDisplay');
    const status = document.getElementById('status');
    errorDisplay.style.display = 'none';

    const canvasContainer = document.getElementById('canvasContainer');
    canvasContainer.innerHTML = '';
    canvasContainer.style.backgroundColor = backgroundColor;
    canvasContainer.style.position = 'relative';
    canvasContainer.style.width = canvasWidth + 'px';
    canvasContainer.style.height = canvasHeight + 'px';
    canvasContainer.style.zIndex = '0';

    const errors = [];
    layers.forEach((layer, layerIndex) => {
        if (!layer.visible) return;
        let renderer = null;
        try {
            if (layer.type === 'image') renderer = createImageLayerRenderer(layer);
            else if (layer.type === 'text') renderer = createTextLayerRenderer(layer);
            else if (layer.code && layer.code.trim()) renderer = createCodeLayerRenderer(layer, layerIndex);
        } catch (e) {
            console.error(e);
            errors.push(`Layer ${layerIndex + 1}: ${e.message}`);
        }
        if (!renderer) return;
        const el = renderer.canvas;
        if (el.parentNode) el.parentNode.removeChild(el);
        el.style.position = 'absolute';
        el.style.top = '0px';
        el.style.left = '0px';
        el.style.width = canvasWidth + 'px';
        el.style.height = canvasHeight + 'px';
        el.style.zIndex = String(layerIndex);
        el.style.pointerEvents = 'none';
        el.id = `layer-canvas-${layer.id}`;
        applyLayerStyle(renderer);
        canvasContainer.appendChild(el);
        canvasLayers.push(renderer);
    });

    if (errors.length) showError(errors.join(' | '));

    if (autoFrames) applyAutoFrames();

    isRunning = true;
    isPaused = false;
    status.textContent = 'Running...';
    status.style.color = '#00cc66';

    setControlsEnabled(true);
    document.getElementById('pauseFrameBtn').textContent = '⏸';
    document.getElementById('frameSlider').max = framesPerLoop - 1;

    virtualFrameCount = Math.min(startFrame, framesPerLoop - 1);
    showFrame(virtualFrameCount, true);
    playStartTime = performance.now();
    playStartFrame = virtualFrameCount;
    animationLoopId = requestAnimationFrame(tick);
    if (typeof refreshFloatingPreview === 'function') refreshFloatingPreview();
}

function stopAnimation() {
    if (animationLoopId) {
        cancelAnimationFrame(animationLoopId);
        animationLoopId = null;
    }
    destroyLayerRenderers();
    document.getElementById('canvasContainer').innerHTML = '';
    isRunning = false;
    isPaused = false;
    virtualFrameCount = 0;
    loopFrameCount = 0;

    document.getElementById('exportProgressBar').style.width = '0%';
    document.getElementById('frameSlider').value = 0;
    updateUI();
    setControlsEnabled(false);
    document.getElementById('pauseFrameBtn').textContent = '⏸';

    const status = document.getElementById('status');
    status.textContent = 'Stopped';
    status.style.color = '#ff3300';

    if (pipWindow && !pipWindow.closed) updatePipWindow();
}

function setControlsEnabled(enabled) {
    ['exportGifBtn', 'exportMP4Btn', 'pauseFrameBtn', 'prevFrameBtn', 'nextFrameBtn', 'frameSlider']
        .forEach(id => {
            const el = document.getElementById(id);
            if (el) el.disabled = !enabled;
        });
}

function restartAnimationIfRunning() {
    if (isRunning) runAnimation(true);
}

// ---------------------------------------------------------------------
// Master clock
// ---------------------------------------------------------------------
function renderLayersAt(globalFrame, force = false) {
    canvasLayers.forEach(r => {
        const vis = layerVisibilityAt(r.layer, globalFrame);
        if (vis !== r.visibility) {
            r.visibility = vis;
            applyLayerStyle(r);
        }
        if (vis > 0) r.render(globalFrame, force);   // skip drawing hidden layers
    });
}

function showFrame(frame, force = false) {
    virtualFrameCount = frame;
    loopFrameCount = frame;
    renderLayersAt(frame, force);
    updateUI();
    updatePipWindow();
}

function requestRender() {
    forceNextRender = true;
    if (isPaused) showFrame(virtualFrameCount, true);
}

function tick(now) {
    if (!isRunning) return;
    if (!isPaused && !isSliderActive && !isExporting) {
        const elapsed = (now - playStartTime) / 1000;
        const frame = (playStartFrame + Math.floor(elapsed * animationFPS * animationSpeed)) % framesPerLoop;
        if (frame !== virtualFrameCount || forceNextRender) {
            forceNextRender = false;
            showFrame(frame);
        }
    }
    animationLoopId = requestAnimationFrame(tick);
}

function resyncClock() {
    playStartTime = performance.now();
    playStartFrame = virtualFrameCount;
}

// ---------------------------------------------------------------------
// Loop length
// ---------------------------------------------------------------------
function gcd(a, b) { while (b) { [a, b] = [b, a % b]; } return a; }

// Number of global frames after which every visible animated layer is back at frame 0.
function computeAutoLoopLength() {
    const lengths = layers
        // Layers that follow the main loop adapt to it, so they don't count here
        .filter(l => l.visible && !l.syncLoop && ((l.type === 'code' && l.code && l.code.trim()) || l.type === 'text'))
        .map(l => l.maxFrames * animationFPS / (l.fps * l.speed));
    if (!lengths.length) return framesPerLoop;
    const allIntegral = lengths.every(x => Math.abs(x - Math.round(x)) < 1e-6);
    if (allIntegral) {
        let lcm = 1;
        for (const x of lengths.map(Math.round)) {
            lcm = lcm / gcd(lcm, x) * x;
            if (lcm > 3600) break;
        }
        if (lcm <= 3600) return lcm;
    }
    return Math.max(1, Math.round(Math.max(...lengths)));
}

function applyAutoFrames() {
    const len = computeAutoLoopLength();
    if (len !== framesPerLoop) {
        framesPerLoop = len;
        if (virtualFrameCount >= framesPerLoop) virtualFrameCount = 0;
    }
    const framesInput = document.getElementById('framesInput');
    if (framesInput) framesInput.value = framesPerLoop;
    const slider = document.getElementById('frameSlider');
    if (slider) slider.max = framesPerLoop - 1;
    updateUI();
}

// ---------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------
function updateBackgroundColor(color) {
    backgroundColor = color;
    document.getElementById('canvasContainer').style.backgroundColor = color;
    updatePipWindow();
}

function updateLayerFPSLimits() {
    layers.forEach(layer => {
        if (layer.fps > animationFPS) layer.fps = animationFPS;
    });
    refreshLayersDOM();
}

function computeCanvasDimensions() {
    switch (canvasRatio) {
        case '4:3':
            canvasWidth = baseSize;
            canvasHeight = Math.round(baseSize * 3 / 4);
            break;
        case '3:4':
            canvasWidth = Math.round(baseSize * 3 / 4);
            canvasHeight = baseSize;
            break;
        default:
            canvasWidth = baseSize;
            canvasHeight = baseSize;
    }
}

function initializeFromDOMValues() {
    const backgroundColorPicker = document.getElementById('backgroundColorPicker');
    if (backgroundColorPicker) backgroundColor = backgroundColorPicker.value;

    const framesInput = document.getElementById('framesInput');
    const fpsInput = document.getElementById('fpsInput');
    const speedInput = document.getElementById('speedInput');
    const autoInput = document.getElementById('autoFramesInput');
    const sizeSlider = document.getElementById('sizeSlider');
    const sizeInput = document.getElementById('sizeInput');

    if (framesInput) framesPerLoop = parseInt(framesInput.value) || 120;
    if (fpsInput) animationFPS = parseInt(fpsInput.value) || 60;
    if (speedInput) animationSpeed = parseFloat(speedInput.value) || 1;
    if (autoInput) autoFrames = autoInput.checked;

    if (sizeSlider && sizeInput) {
        baseSize = parseInt(sizeSlider.value) || parseInt(sizeInput.value) || 300;
        sizeSlider.value = baseSize;
        sizeInput.value = baseSize;
    }

    const activeRatioBtn = document.querySelector('.size-btn.active');
    if (activeRatioBtn) {
        const t = activeRatioBtn.textContent;
        canvasRatio = t.includes('4:3') ? '4:3' : t.includes('3:4') ? '3:4' : '1:1';
    }
    computeCanvasDimensions();

    const frameSlider = document.getElementById('frameSlider');
    if (frameSlider) frameSlider.max = framesPerLoop - 1;

    const canvasContainer = document.getElementById('canvasContainer');
    if (canvasContainer) {
        canvasContainer.style.position = 'relative';
        canvasContainer.style.width = canvasWidth + 'px';
        canvasContainer.style.height = canvasHeight + 'px';
        canvasContainer.style.backgroundColor = backgroundColor;
    }
    setControlsEnabled(false);
}

window.onload = function () {
    initializeFromDOMValues();
    initializeSliderInteraction();

    const initialLayer = createLayer('');
    applyPresetToLayer(initialLayer, 'ying_yang_spiral');
    LayerDOM.render(initialLayer);
    selectLayer(initialLayer.id);
    runAnimation();
};
