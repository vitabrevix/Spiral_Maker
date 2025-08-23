function toggleCollapse() {
    const previewPanel = document.querySelector('.preview-panel');
    const editorPanel = document.querySelector('.editor-panel');
    const collapseIcon = document.querySelector('.collapse-icon');
    
    previewPanel.classList.toggle('collapsed');
    
    // Toggle editor panel expansion
    if (previewPanel.classList.contains('collapsed')) {
        editorPanel.classList.add('expanded');
        collapseIcon.style.transform = 'rotate(180deg)';
    } else {
        editorPanel.classList.remove('expanded');
        collapseIcon.style.transform = 'rotate(0deg)';
    }
}

// Animation control functions
function runWithoutLag() {
    clearP5();
    setTimeout(() => {
        runAnimation();
    }, 100);
}

function pauseAnimation() {
    if (!isRunning) return;
    
    isPaused = !isPaused;
    const pauseBtn = document.getElementById('pauseFrameBtn');
    const status = document.getElementById('status');
    
    if (isPaused) {
        // Cancel the animation loop when pausing
        if (animationLoopId) {
            cancelAnimationFrame(animationLoopId);
            animationLoopId = null;
        }
        pauseBtn.textContent = '▶';
        status.textContent = 'Paused';
        status.style.color = '#ffaa00';
    } else {
        pauseBtn.textContent = '⏸';
        status.textContent = 'Running...';
        status.style.color = '#00cc66';
        lastFrameTime = Date.now();
        // Restart the animation loop when unpausing
        updateLoopProgress();
    }
}

function clearCode() {
    document.getElementById('codeEditor').value = '';
    stopAnimation();
}

// Animation loop and frame control functions
function updateLoopProgress() {
    if (!isRunning || isPaused) return;
    
    const currentTime = Date.now();
    const frameInterval = 1000 / (animationFPS * animationSpeed);
    
    if (currentTime - lastFrameTime >= frameInterval) {
        virtualFrameCount++;
        lastFrameTime = currentTime;
        
        if (virtualFrameCount >= framesPerLoop) {
            virtualFrameCount = 0;
        }
        
        loopFrameCount = virtualFrameCount;
        updateUI();
    }
    
    animationLoopId = requestAnimationFrame(updateLoopProgress);
}

function updateUI() {
    document.getElementById('frameSlider').value = loopFrameCount;
    // Format frame numbers with leading zeros to maintain consistent width
    const currentFrameStr = String(loopFrameCount).padStart(3, '0');
    const totalFrameStr = String(framesPerLoop).padStart(3, '0');
    document.getElementById('frameDisplay').textContent = `${currentFrameStr}/${totalFrameStr}`;
    
    // Trigger a redraw if animation is loaded
    if (currentSketch && typeof draw === 'function') {
        draw();
    }
}

function scrubToFrame(frameNum) {
    frameNum = parseInt(frameNum);
    if (frameNum >= 0 && frameNum < framesPerLoop) {
        virtualFrameCount = frameNum;
        loopFrameCount = frameNum;
        updateUI();
    }
}

function nextFrame() {
    if (virtualFrameCount < framesPerLoop - 1) {
        virtualFrameCount++;
    } else {
        virtualFrameCount = 0; // Loop back to start
    }
    loopFrameCount = virtualFrameCount;
    updateUI();
}

function previousFrame() {
    if (virtualFrameCount > 0) {
        virtualFrameCount--;
    } else {
        virtualFrameCount = framesPerLoop - 1; // Loop to end
    }
    loopFrameCount = virtualFrameCount;
    updateUI();
}

function updateAnimationSettings() {
    const oldAnimationFPS = animationFPS;
    
    framesPerLoop = parseInt(document.getElementById('framesInput').value) || 120;
    animationFPS = parseInt(document.getElementById('fpsInput').value) || 60;
    animationSpeed = parseFloat(document.getElementById('speedInput').value) || 1;
    
    // Update slider max value
    document.getElementById('frameSlider').max = framesPerLoop - 1;
    
    // Adjust current frame if frames per loop changed
    if (virtualFrameCount >= framesPerLoop) {
        virtualFrameCount = framesPerLoop - 1;
        loopFrameCount = virtualFrameCount;
    }
    
    // Update layer FPS limits if global FPS changed
    if (oldAnimationFPS !== animationFPS && typeof updateLayerFPSLimits === 'function') {
        updateLayerFPSLimits();
    }
    
    lastFrameTime = Date.now();
    updateUI();
    
    // Restart animation if running to apply new settings
    if (isRunning) {
        stopAnimation();
        setTimeout(runAnimation, 100);
    }
}

// Canvas size control functions
function setCanvasRatio(ratio) {
    canvasRatio = ratio;
    
    // Update button states
    document.querySelectorAll('.size-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Recalculate dimensions
    switch(canvasRatio) {
        case '1:1':
            canvasWidth = baseSize;
            canvasHeight = baseSize;
            break;
        case '4:3':
            canvasWidth = baseSize;
            canvasHeight = Math.round(baseSize * 3 / 4);
            break;
        case '3:4':
            canvasWidth = Math.round(baseSize * 3 / 4);
            canvasHeight = baseSize;
            break;
    }
    
    // Update the main canvas container
    const canvasContainer = document.getElementById('canvasContainer');
    canvasContainer.style.width = canvasWidth + 'px';
    canvasContainer.style.height = canvasHeight + 'px';
    
    // Restart animation if running to apply new canvas size
    if (isRunning) {
        stopAnimation();
        setTimeout(runAnimation, 100);
    }
    
    // Update PiP window size if open
    if (pipWindow && !pipWindow.closed) {
        pipWindow.resizeTo(canvasWidth + 40, canvasHeight + 80);
    }
}

function updateCanvasSize(size) {
    baseSize = parseInt(size);
    document.getElementById('sizeSlider').value = baseSize;
    document.getElementById('sizeInput').value = baseSize;
    
    // Recalculate canvas dimensions based on current ratio
    switch(canvasRatio) {
        case '1:1':
            canvasWidth = baseSize;
            canvasHeight = baseSize;
            break;
        case '4:3':
            canvasWidth = baseSize;
            canvasHeight = Math.round(baseSize * 3 / 4);
            break;
        case '3:4':
            canvasWidth = Math.round(baseSize * 3 / 4);
            canvasHeight = baseSize;
            break;
    }
    
    // Update the main canvas container
    const canvasContainer = document.getElementById('canvasContainer');
    canvasContainer.style.width = canvasWidth + 'px';
    canvasContainer.style.height = canvasHeight + 'px';
    
    // Restart animation if running to apply new canvas size
    if (isRunning) {
        stopAnimation();
        setTimeout(runAnimation, 100);
    }
    
    // Update PiP window size if open
    if (pipWindow && !pipWindow.closed) {
        pipWindow.resizeTo(canvasWidth + 40, canvasHeight + 80);
    }
}

function updateCanvasSizeFromInput(size) {
    const sizeValue = parseInt(size);
    if (sizeValue >= 300 && sizeValue <= 1000) {
        document.getElementById('sizeSlider').value = sizeValue;
        updateCanvasSize(sizeValue);
    } else {
        // Reset input to current valid value
        document.getElementById('sizeInput').value = baseSize;
    }
}