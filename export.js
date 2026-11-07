// =====================================================================
// Export (GIF / MP4)
//
// Frames are rendered offline, one by one, straight from the layer
// renderers and composited (background + all layers + colour filters)
// onto a single canvas - so exports contain exactly what the preview
// shows and loop seamlessly, independent of how fast the machine is.
//
// Size savers:
//  GIF - one global palette, frame-to-frame transparency (only changed
//        pixels are stored), and a GIF-friendly frame rate (browsers
//        clamp delays under 20ms, which made 60fps GIFs play slowly).
//  MP4 - real H.264 via WebCodecs with a bitrate sized to the canvas.
// =====================================================================

let isExporting = false;

const GIF_LIB_URL = 'https://cdn.jsdelivr.net/npm/gifenc@1.0.3/dist/gifenc.esm.js';
const MP4_LIB_URL = 'https://cdn.jsdelivr.net/npm/mp4-muxer@5.1.3/build/mp4-muxer.mjs';

const EXPORT_QUALITY = {
    high:   { gifFps: 50, gifColors: 256, mp4BitsPerPixel: 0.15 },
    medium: { gifFps: 30, gifColors: 128, mp4BitsPerPixel: 0.08 },
    small:  { gifFps: 20, gifColors: 64,  mp4BitsPerPixel: 0.04 },
};

function updateExportProgress(percentage) {
    const progressBar = document.getElementById('exportProgressBar');
    if (progressBar) progressBar.style.width = Math.max(0, Math.min(100, percentage)) + '%';
}

function updateExportStatus(status) {
    const statusElement = document.getElementById('exportStatus');
    if (statusElement) statusElement.textContent = status;
}

function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}

function getExportSettings() {
    const q = (document.getElementById('exportQuality') || {}).value || 'medium';
    const scale = parseFloat((document.getElementById('exportScale') || {}).value) || 1;
    return { quality: EXPORT_QUALITY[q] || EXPORT_QUALITY.medium, scale };
}

// Yield to the browser without setTimeout, which background tabs throttle to 1/s
const yieldChannel = new MessageChannel();
const yieldQueue = [];
yieldChannel.port1.onmessage = () => { const r = yieldQueue.shift(); if (r) r(); };
const nextTick = () => new Promise(r => { yieldQueue.push(r); yieldChannel.port2.postMessage(0); });

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
}

// Plans which global frames to sample and how long each output frame lasts,
// so the total duration matches the preview exactly and the loop is seamless.
function planFrames(targetFps) {
    const sourceFps = animationFPS * animationSpeed;
    const durationMs = framesPerLoop / sourceFps * 1000;
    const fps = Math.min(targetFps, sourceFps);
    const count = Math.max(1, Math.round(durationMs / 1000 * fps));
    const frames = [];
    for (let k = 0; k < count; k++) {
        frames.push({
            globalFrame: Math.floor(k * framesPerLoop / count + 1e-9),
            startMs: k * durationMs / count,
            endMs: (k + 1) * durationMs / count,
        });
    }
    return { frames, durationMs, fps: count / (durationMs / 1000) };
}

function makeExportCanvas(scale, even = false) {
    let w = Math.max(2, Math.round(canvasWidth * scale));
    let h = Math.max(2, Math.round(canvasHeight * scale));
    if (even) { w -= w % 2; h -= h % 2; }
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    return { canvas, ctx, w, h };
}

function renderExportFrame(ctx, w, h, globalFrame) {
    renderLayersAt(globalFrame);
    compositeFrame(ctx, w, h);
}

async function exportAnimation(format) {
    if (!isRunning) {
        updateExportStatus('Press Run first');
        return;
    }
    if (isExporting) return;

    isExporting = true;
    const buttons = ['exportGifBtn', 'exportMP4Btn'].map(id => document.getElementById(id));
    buttons.forEach(b => b && (b.disabled = true));
    updateExportProgress(0);

    try {
        await Promise.all(canvasLayers.map(r => r.ready));
        const { quality, scale } = getExportSettings();
        let result;
        if (format === 'gif') {
            result = await exportGif(quality, scale);
        } else {
            result = await exportVideo(quality, scale);
        }
        downloadBlob(result.blob, result.filename);
        updateExportProgress(100);
        updateExportStatus(`Saved ${result.filename} (${formatBytes(result.blob.size)})`);
    } catch (err) {
        console.error('Export error:', err);
        updateExportStatus('Export failed: ' + (err && err.message ? err.message : err));
        updateExportProgress(0);
    } finally {
        isExporting = false;
        buttons.forEach(b => b && (b.disabled = !isRunning));
        if (isRunning) {
            showFrame(virtualFrameCount, true);
            resyncClock();
        }
    }
}

// ---------------------------------------------------------------- GIF
async function exportGif(quality, scale) {
    updateExportStatus('Loading GIF encoder...');
    const { GIFEncoder, quantize, applyPalette } = await import(GIF_LIB_URL);

    const plan = planFrames(quality.gifFps);
    const { ctx, w, h } = makeExportCanvas(scale);

    // Pass 1: build one shared palette from a sample of frames
    updateExportStatus('Analysing colours...');
    const sampleFrames = Math.min(plan.frames.length, 16);
    const pixelsPerFrame = w * h;
    const stride = Math.max(1, Math.floor(pixelsPerFrame * sampleFrames / 400000));
    const samples = [];
    for (let i = 0; i < sampleFrames; i++) {
        const f = plan.frames[Math.floor(i * plan.frames.length / sampleFrames)];
        renderExportFrame(ctx, w, h, f.globalFrame);
        const data = ctx.getImageData(0, 0, w, h).data;
        for (let p = (i % stride); p < pixelsPerFrame; p += stride) {
            const o = p * 4;
            samples.push(data[o], data[o + 1], data[o + 2], 255);
        }
        updateExportProgress(i / sampleFrames * 10);
        await nextTick();
    }
    const palette = quantize(new Uint8Array(samples), quality.gifColors - 1, { format: 'rgb565' });
    const transparentIndex = palette.length;
    const fullPalette = palette.concat([[0, 0, 0]]);

    // Pass 2: encode, storing only pixels that changed since the previous frame
    const gif = GIFEncoder();
    let prev = null;
    let lastCs = 0;
    for (let k = 0; k < plan.frames.length; k++) {
        const f = plan.frames[k];
        renderExportFrame(ctx, w, h, f.globalFrame);
        const rgba = ctx.getImageData(0, 0, w, h).data;
        const index = applyPalette(rgba, palette, 'rgb565');

        // GIF delays are in 1/100 s: accumulate so the total stays exact
        const endCs = Math.round(f.endMs / 10);
        const delayMs = Math.max(2, endCs - lastCs) * 10;
        lastCs = endCs;

        if (prev) {
            const out = new Uint8Array(index.length);
            for (let i = 0; i < index.length; i++) {
                out[i] = index[i] === prev[i] ? transparentIndex : index[i];
            }
            gif.writeFrame(out, w, h, { delay: delayMs, transparent: true, transparentIndex, dispose: 1 });
        } else {
            gif.writeFrame(index, w, h, { palette: fullPalette, delay: delayMs, repeat: 0, dispose: 1 });
        }
        prev = index;

        updateExportProgress(10 + (k + 1) / plan.frames.length * 90);
        updateExportStatus(`Encoding GIF... ${k + 1}/${plan.frames.length}`);
        if (k % 2 === 0) await nextTick();
    }
    gif.finish();
    return { blob: new Blob([gif.bytes()], { type: 'image/gif' }), filename: `spiral-${Date.now()}.gif` };
}

// ---------------------------------------------------------------- MP4
async function pickAvcCodec(w, h, fps, bitrate) {
    const candidates = ['avc1.640028', 'avc1.4d0028', 'avc1.42e028', 'avc1.42001f'];
    for (const codec of candidates) {
        const config = { codec, width: w, height: h, bitrate, framerate: fps, avc: { format: 'avc' } };
        try {
            const support = await VideoEncoder.isConfigSupported(config);
            if (support.supported) return config;
        } catch (e) { /* try next */ }
    }
    return null;
}

async function exportVideo(quality, scale) {
    const plan = planFrames(60);
    const fps = Math.max(1, Math.round(plan.fps));
    const { canvas, ctx, w, h } = makeExportCanvas(scale, true);
    const bitrate = Math.round(Math.min(12e6, Math.max(250e3, w * h * fps * quality.mp4BitsPerPixel)));

    const config = typeof VideoEncoder !== 'undefined' ? await pickAvcCodec(w, h, fps, bitrate) : null;
    if (!config) {
        updateExportStatus('MP4 not supported in this browser, recording WebM...');
        return exportWebmFallback(canvas, ctx, w, h, plan, bitrate);
    }

    updateExportStatus('Loading MP4 muxer...');
    const { Muxer, ArrayBufferTarget } = await import(MP4_LIB_URL);
    const muxer = new Muxer({
        target: new ArrayBufferTarget(),
        video: { codec: 'avc', width: w, height: h, frameRate: fps },
        fastStart: 'in-memory',
    });

    let encodeError = null;
    const encoder = new VideoEncoder({
        output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
        error: e => { encodeError = e; },
    });
    encoder.configure(Object.assign({}, config, { latencyMode: 'quality', bitrateMode: 'variable' }));

    const keyEvery = fps * 2;
    for (let k = 0; k < plan.frames.length; k++) {
        if (encodeError) throw encodeError;
        const f = plan.frames[k];
        renderExportFrame(ctx, w, h, f.globalFrame);
        const timestamp = Math.round(f.startMs * 1000);
        const duration = Math.round(f.endMs * 1000) - timestamp;
        const frame = new VideoFrame(canvas, { timestamp, duration });
        encoder.encode(frame, { keyFrame: k % keyEvery === 0 });
        frame.close();

        while (encoder.encodeQueueSize > 6) {
            await new Promise(r => encoder.addEventListener('dequeue', r, { once: true }));
        }
        updateExportProgress((k + 1) / plan.frames.length * 95);
        updateExportStatus(`Encoding MP4... ${k + 1}/${plan.frames.length}`);
        if (k % 4 === 0) await nextTick();
    }
    await encoder.flush();
    encoder.close();
    if (encodeError) throw encodeError;
    muxer.finalize();

    return { blob: new Blob([muxer.target.buffer], { type: 'video/mp4' }), filename: `spiral-${Date.now()}.mp4` };
}

// Browsers without WebCodecs H.264 (e.g. some Firefox builds): real-time WebM recording
async function exportWebmFallback(canvas, ctx, w, h, plan, bitrate) {
    const stream = canvas.captureStream(0);
    const track = stream.getVideoTracks()[0];
    const mime = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']
        .find(m => MediaRecorder.isTypeSupported(m));
    const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: bitrate });
    const chunks = [];
    recorder.ondataavailable = e => e.data.size && chunks.push(e.data);
    const stopped = new Promise(r => { recorder.onstop = r; });

    renderExportFrame(ctx, w, h, plan.frames[0].globalFrame);
    recorder.start();
    const t0 = performance.now();
    for (let k = 0; k < plan.frames.length; k++) {
        const f = plan.frames[k];
        const wait = t0 + f.startMs - performance.now();
        if (wait > 0) await new Promise(r => setTimeout(r, wait));
        renderExportFrame(ctx, w, h, f.globalFrame);
        if (track.requestFrame) track.requestFrame();
        updateExportProgress((k + 1) / plan.frames.length * 95);
        updateExportStatus(`Recording WebM... ${k + 1}/${plan.frames.length}`);
    }
    await new Promise(r => setTimeout(r, Math.max(0, t0 + plan.durationMs - performance.now())));
    recorder.stop();
    await stopped;
    return { blob: new Blob(chunks, { type: 'video/webm' }), filename: `spiral-${Date.now()}.webm` };
}
