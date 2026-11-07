let wasRunningBeforeSlider = false;
let isSliderActive = false;

function toggleCollapse() {
    const previewPanel = document.querySelector('.preview-panel');
    const editorPanel = document.querySelector('.editor-panel');
    const collapseIcon = document.querySelector('.collapse-icon');

    previewPanel.classList.toggle('collapsed');
    const collapsed = previewPanel.classList.contains('collapsed');
    editorPanel.classList.toggle('expanded', collapsed);
    collapseIcon.style.transform = collapsed ? 'rotate(180deg)' : 'rotate(0deg)';
}

function runWithoutLag() {
    runAnimation();
}

function pauseAnimation() {
    if (!isRunning) return;
    isPaused = !isPaused;
    const pauseBtn = document.getElementById('pauseFrameBtn');
    const status = document.getElementById('status');

    if (isPaused) {
        pauseBtn.textContent = '▶';
        status.textContent = 'Paused';
        status.style.color = '#ffaa00';
    } else {
        pauseBtn.textContent = '⏸';
        status.textContent = 'Running...';
        status.style.color = '#00cc66';
        resyncClock();
    }
}

function clearCode() {
    const layer = getSelectedLayer();
    if (layer && layer.type === 'code') {
        layer.code = '';
        LayerDOM.refresh(layer.id);
    }
    stopAnimation();
}

function updateUI() {
    const slider = document.getElementById('frameSlider');
    slider.max = Math.max(0, framesPerLoop - 1);
    slider.value = loopFrameCount;
    const width = Math.max(3, String(framesPerLoop).length);
    const currentFrameStr = String(loopFrameCount).padStart(width, '0');
    const totalFrameStr = String(framesPerLoop).padStart(width, '0');
    document.getElementById('frameDisplay').textContent = `${currentFrameStr}/${totalFrameStr}`;
}

function goToFrame(frame) {
    if (!isRunning) return;
    frame = ((frame % framesPerLoop) + framesPerLoop) % framesPerLoop;
    showFrame(frame);
    resyncClock();
}

function scrubToFrame(frameNum) {
    goToFrame(parseInt(frameNum) || 0);
}

function nextFrame() {
    goToFrame(virtualFrameCount + 1);
}

function previousFrame() {
    goToFrame(virtualFrameCount - 1);
}

function pauseForSliderInteraction() {
    if (isRunning && !isPaused && !isSliderActive) {
        wasRunningBeforeSlider = true;
        isSliderActive = true;
        const status = document.getElementById('status');
        status.textContent = 'Scrubbing...';
        status.style.color = '#ffaa00';
    }
}

function resumeAfterSliderInteraction() {
    if (wasRunningBeforeSlider && isSliderActive) {
        isSliderActive = false;
        wasRunningBeforeSlider = false;
        resyncClock();
        const status = document.getElementById('status');
        status.textContent = 'Running...';
        status.style.color = '#00cc66';
    }
}

function initializeSliderInteraction() {
    const frameSlider = document.getElementById('frameSlider');
    if (!frameSlider) return;
    frameSlider.addEventListener('mousedown', pauseForSliderInteraction);
    frameSlider.addEventListener('touchstart', pauseForSliderInteraction);
    frameSlider.addEventListener('keydown', pauseForSliderInteraction);
    frameSlider.addEventListener('keyup', resumeAfterSliderInteraction);
    document.addEventListener('mouseup', () => { if (isSliderActive) resumeAfterSliderInteraction(); });
    document.addEventListener('touchend', () => { if (isSliderActive) resumeAfterSliderInteraction(); });
}

function updateAnimationSettings(changed) {
    const oldAnimationFPS = animationFPS;

    if (changed === 'frames') {
        // Typing a frame count manually switches off auto loop length
        autoFrames = false;
        const autoInput = document.getElementById('autoFramesInput');
        if (autoInput) autoInput.checked = false;
    }

    framesPerLoop = Math.max(1, parseInt(document.getElementById('framesInput').value) || 120);
    animationFPS = Math.max(1, Math.min(120, parseInt(document.getElementById('fpsInput').value) || 60));
    animationSpeed = Math.max(0.1, parseFloat(document.getElementById('speedInput').value) || 1);

    if (oldAnimationFPS !== animationFPS) updateLayerFPSLimits();
    if (autoFrames) applyAutoFrames();

    if (virtualFrameCount >= framesPerLoop) virtualFrameCount = 0;
    loopFrameCount = virtualFrameCount;
    updateUI();
    if (isRunning) {
        showFrame(virtualFrameCount, true);
        resyncClock();
    }
}

function toggleAutoFrames(checked) {
    autoFrames = checked;
    if (autoFrames) {
        applyAutoFrames();
        if (isRunning) resyncClock();
    }
}

// Canvas size control functions
function applyCanvasSize() {
    computeCanvasDimensions();
    const canvasContainer = document.getElementById('canvasContainer');
    canvasContainer.style.width = canvasWidth + 'px';
    canvasContainer.style.height = canvasHeight + 'px';
    if (isRunning) {
        clearTimeout(window.__resizeTimer);
        window.__resizeTimer = setTimeout(() => runAnimation(true), 150);
    }
    if (pipWindow && !pipWindow.closed) {
        pipWindow.resizeTo(canvasWidth + 40, canvasHeight + 80);
    }
}

function setCanvasRatio(ratio, btn) {
    canvasRatio = ratio;
    document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
    const target = btn || (typeof event !== 'undefined' && event && event.target);
    if (target) target.classList.add('active');
    applyCanvasSize();
}

function updateCanvasSize(size) {
    baseSize = Math.max(100, Math.min(1000, parseInt(size) || 300));
    document.getElementById('sizeSlider').value = baseSize;
    document.getElementById('sizeInput').value = baseSize;
    applyCanvasSize();
}

function updateCanvasSizeFromInput(size) {
    const sizeValue = parseInt(size);
    if (sizeValue >= 100 && sizeValue <= 1000) {
        updateCanvasSize(sizeValue);
    } else {
        document.getElementById('sizeInput').value = baseSize;
    }
}
