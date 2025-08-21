// Main application variables
let currentSketch = null;
let isRunning = false;
let isPaused = false;
let loopFrameCount = 0;
let framesPerLoop = 120;
let animationFPS = 60;
let animationSpeed = 1;
let lastFrameTime = 0;
let virtualFrameCount = 0;
let canvasRatio = '1:1'; // '1:1', '4:3', or '3:4'
let baseSize = 300;
let canvasWidth = 300;
let canvasHeight = 300;
let animationLoopId = null;

// Export variables
let capturedFrames = [];
let isCapturing = false;

// Animation control functions
function runWithoutLag() {
    stopAnimation();
    setTimeout(() => {
        runAnimation();
    }, 100);
}

function runAnimation() {
    if (currentSketch) {
        currentSketch.remove();
    }

    const code = document.getElementById('codeEditor').value;
    const errorDisplay = document.getElementById('errorDisplay');
    const status = document.getElementById('status');
    
    errorDisplay.style.display = 'none';
    virtualFrameCount = 0;
    loopFrameCount = 0;
    isPaused = false;
    lastFrameTime = Date.now();
    
    // Update slider
    document.getElementById('frameSlider').max = framesPerLoop - 1;
    
    try {
        // Create a new p5 sketch with proper instance mode
        const sketch = function(p) {
            // Make p5 functions available globally within this scope
            const p5Functions = ['createCanvas', 'background', 'fill', 'stroke', 'noStroke', 'noFill', 
                                'ellipse', 'rect', 'line', 'point', 'triangle', 'quad', 'arc',
                                'translate', 'rotate', 'scale', 'push', 'pop', 'frameCount',
                                'width', 'height', 'mouseX', 'mouseY', 'sin', 'cos', 'tan',
                                'map', 'lerp', 'dist', 'random', 'noise', 'TWO_PI', 'PI', 'HALF_PI',
                                'colorMode', 'HSB', 'RGB', 'strokeWeight', 'textSize', 'text',
                                'sqrt', 'pow', 'abs', 'floor', 'ceil', 'round', 'radians', 'degrees'];
            
            // Expose p5 functions and properties to global scope
            p5Functions.forEach(func => {
                if (typeof p[func] !== 'undefined') {
                    window[func] = p[func].bind ? p[func].bind(p) : p[func];
                }
            });
            
            // Special handling for properties - override frameCount with our controlled version
            Object.defineProperty(window, 'frameCount', { get: () => virtualFrameCount });
            Object.defineProperty(window, 'width', { get: () => p.width });
            Object.defineProperty(window, 'height', { get: () => p.height });
            Object.defineProperty(window, 'mouseX', { get: () => p.mouseX });
            Object.defineProperty(window, 'mouseY', { get: () => p.mouseY });
            
            // Execute user code
            try {
                eval(code);
            } catch (e) {
                throw new Error('Code execution error: ' + e.message);
            }
            
            p.setup = function() {
                const canvas = p.createCanvas(canvasWidth, canvasHeight);
                canvas.parent('canvasContainer');
                p.frameRate(framesPerLoop);
                if (typeof setup === 'function') {
                    setup();
                }
            };
            
            p.draw = function() {
                // Only draw when our virtual frame timing allows it
                const shouldDraw = Date.now() - lastFrameTime >= (1000 / (animationFPS * animationSpeed));
                if (shouldDraw && typeof draw === 'function') {
                    draw();
                }
            };
        };

        currentSketch = new p5(sketch);
        isRunning = true;
        status.textContent = 'Running...';
        status.style.color = '#00cc66';
        
        // Start loop progress animation
        updateLoopProgress();
        
        // Enable export buttons and frame controls
        document.getElementById('exportGifBtn').disabled = false;
        document.getElementById('exportWebPBtn').disabled = false;
        document.getElementById('exportMP4Btn').disabled = false;
        document.getElementById('pauseFrameBtn').disabled = false;
        document.getElementById('prevFrameBtn').disabled = false;
        document.getElementById('nextFrameBtn').disabled = false;
        document.getElementById('frameSlider').disabled = false;
        
    } catch (error) {
        errorDisplay.textContent = 'Error: ' + error.message;
        errorDisplay.style.display = 'block';
        status.textContent = 'Error';
        status.style.color = '#ff6666';
    }
}

function stopAnimation() {
    if (animationLoopId) {
        cancelAnimationFrame(animationLoopId);
        animationLoopId = null;
    }

    if (currentSketch) {
        currentSketch.remove();
        currentSketch = null;
    }
    isRunning = false;
    isPaused = false;
    
    // Clear global p5 function references
    const p5Functions = ['createCanvas', 'background', 'fill', 'stroke', 'noStroke', 'noFill', 
                        'ellipse', 'rect', 'line', 'point', 'triangle', 'quad', 'arc',
                        'translate', 'rotate', 'scale', 'push', 'pop',
                        'width', 'height', 'mouseX', 'mouseY', 'sin', 'cos', 'tan',
                        'map', 'lerp', 'dist', 'random', 'noise', 'TWO_PI', 'PI', 'HALF_PI',
                        'colorMode', 'HSB', 'RGB', 'strokeWeight', 'textSize', 'text',
                        'sqrt', 'pow', 'abs', 'floor', 'ceil', 'round', 'radians', 'degrees'];
    
    p5Functions.forEach(func => {
        if (window[func]) {
            delete window[func];
        }
    });
    
    // Clean up global functions
    if (window.setup) delete window.setup;
    if (window.draw) delete window.draw;
    
    document.getElementById('status').textContent = 'Stopped';
    document.getElementById('status').style.color = '#ffaa00';
    
    // Reset export progress bar and frame display
    document.getElementById('exportProgressBar').style.width = '0%';
    document.getElementById('frameSlider').value = 0;
    document.getElementById('frameDisplay').textContent = '000/120';
    
    // Disable export buttons and frame controls
    document.getElementById('exportGifBtn').disabled = true;
    document.getElementById('exportWebPBtn').disabled = true;
    document.getElementById('exportMP4Btn').disabled = true;
    document.getElementById('pauseFrameBtn').disabled = true;
    document.getElementById('pauseFrameBtn').textContent = '⏸';
    document.getElementById('prevFrameBtn').disabled = true;
    document.getElementById('nextFrameBtn').disabled = true;
    document.getElementById('frameSlider').disabled = true;
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
        lastFrameTime = Date.now();
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
    
    lastFrameTime = Date.now();
    updateUI();
}

// Canvas size control functions
function setCanvasRatio(ratio) {
    canvasRatio = ratio;
    
    // Update button states
    document.querySelectorAll('.size-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Recalculate dimensions with current base size
    updateCanvasSize(baseSize);
}

function updateCanvasSize(size) {
    baseSize = parseInt(size);
    document.getElementById('sizeSlider').value = baseSize;
    document.getElementById('sizeInput').value = baseSize;
    
    // Calculate dimensions based on ratio
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
    
    // Update all preset codes to use dynamic canvas size
    updatePresetCanvasSizes();
    
    // Restart animation with new size if currently running
    if (isRunning) {
        runAnimation();
    }
    
    stopAnimation();
    setTimeout(() => {
        runAnimation();
    }, 100);
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

// Export functions
function updateExportProgress(percentage) {
    document.getElementById('exportProgressBar').style.width = percentage + '%';
}

function exportGif() {
    if (!currentSketch || !isRunning) {
        document.getElementById('exportStatus').textContent = 'No animation running';
        return;
    }

    // Since gif.js isn't available, export as WebM video instead
    document.getElementById('exportStatus').textContent = 'Exporting as WebM video (GIF alternative)...';
    exportWebM();
}

function exportWebM() {
    const canvas = document.querySelector('#canvasContainer canvas') || 
                  document.querySelector('canvas') || 
                  (currentSketch && currentSketch.canvas);
    
    if (!canvas) {
        document.getElementById('exportStatus').textContent = 'Canvas not found';
        return;
    }

    // Check if MediaRecorder is supported
    if (!MediaRecorder.isTypeSupported('video/webm')) {
        // Fallback: capture individual frames as images
        exportFrameSequence();
        return;
    }

    const stream = canvas.captureStream(animationFPS);
    const recorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp8',
        videoBitsPerSecond: 2500000
    });
    
    const chunks = [];
    
    recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
            chunks.push(e.data);
        }
    };
    
    recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `animation_${framesPerLoop}frames_${Date.now()}.webm`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        document.getElementById('exportStatus').textContent = 'WebM video exported (can be converted to GIF with online tools)';
        updateExportProgress(100);
        
        setTimeout(() => {
            updateExportProgress(0);
            document.getElementById('exportStatus').textContent = '';
        }, 3000);
    };
    
    // Store current state
    const originalFrameCount = virtualFrameCount;
    const wasRunning = !isPaused;
    
    // Start from beginning for clean recording
    virtualFrameCount = 0;
    loopFrameCount = 0;
    updateUI();
    
    if (isPaused) {
        isPaused = false;
        lastFrameTime = Date.now();
    }
    
    // Record for the duration of one complete loop plus a bit extra
    const recordDuration = (framesPerLoop / animationFPS) * 1000 + 200;
    
    recorder.start();
    updateExportProgress(25);
    
    setTimeout(() => {
        updateExportProgress(75);
    }, recordDuration / 2);
    
    setTimeout(() => {
        recorder.stop();
        updateExportProgress(90);
        
        // Restore original state
        virtualFrameCount = originalFrameCount;
        loopFrameCount = originalFrameCount;
        if (!wasRunning) {
            isPaused = true;
        }
        updateUI();
    }, recordDuration);
}

function exportFrameSequence() {
    document.getElementById('exportStatus').textContent = 'Exporting frame sequence...';
    
    const canvas = document.querySelector('#canvasContainer canvas') || 
                  document.querySelector('canvas') || 
                  (currentSketch && currentSketch.canvas);
                  
    if (!canvas) {
        document.getElementById('exportStatus').textContent = 'Canvas not found';
        return;
    }
    
    // Store current state
    const originalFrameCount = virtualFrameCount;
    const wasRunning = !isPaused;
    if (wasRunning) isPaused = true;
    
    const frames = [];
    let currentFrame = 0;
    
    const captureNextFrame = () => {
        if (currentFrame >= Math.min(framesPerLoop, 60)) { // Limit to 60 frames max
            createZipFromFrames(frames);
            
            // Restore state
            virtualFrameCount = originalFrameCount;
            loopFrameCount = originalFrameCount;
            if (wasRunning) {
                isPaused = false;
                lastFrameTime = Date.now();
            }
            updateUI();
            return;
        }
        
        virtualFrameCount = currentFrame;
        loopFrameCount = currentFrame;
        updateUI();
        
        setTimeout(() => {
            const dataURL = canvas.toDataURL('image/png');
            frames.push({
                name: `frame_${String(currentFrame).padStart(3, '0')}.png`,
                data: dataURL
            });
            
            const progress = (currentFrame / Math.min(framesPerLoop, 60)) * 90;
            updateExportProgress(progress);
            
            currentFrame++;
            setTimeout(captureNextFrame, 100);
        }, 100);
    };
    
    captureNextFrame();
}

function createZipFromFrames(frames) {
    // Since we can't create a ZIP easily in browser without libraries,
    // just download the first frame as a sample
    if (frames.length > 0) {
        const link = document.createElement('a');
        link.download = 'animation_sample_frame.png';
        link.href = frames[0].data;
        link.click();
        
        document.getElementById('exportStatus').textContent = `Sample frame exported (${frames.length} frames captured)`;
        updateExportProgress(100);
        
        setTimeout(() => {
            updateExportProgress(0);
            document.getElementById('exportStatus').textContent = '';
        }, 3000);
    }
}

function exportWebP() {
    document.getElementById('exportStatus').textContent = 'WebP animation via screen recording...';
    
    const canvas = document.querySelector('#canvasContainer canvas') || 
                  document.querySelector('canvas') || 
                  (currentSketch && currentSketch.canvas);
    
    if (!canvas) {
        document.getElementById('exportStatus').textContent = 'Canvas not found';
        return;
    }

    const stream = canvas.captureStream(animationFPS);
    const recorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
    });
    
    const chunks = [];
    
    recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
            chunks.push(e.data);
        }
    };
    
    recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `animation_${Date.now()}.webm`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        document.getElementById('exportStatus').textContent = 'WebM video exported (similar quality to animated WebP)';
        updateExportProgress(100);
        
        setTimeout(() => {
            updateExportProgress(0);
            document.getElementById('exportStatus').textContent = '';
        }, 3000);
    };
    
    // Record for the duration of one complete loop
    const recordDuration = (framesPerLoop / animationFPS) * 1000;
    
    recorder.start();
    updateExportProgress(50);
    
    setTimeout(() => {
        recorder.stop();
        updateExportProgress(90);
    }, recordDuration);
}

function exportMP4() {
    document.getElementById('exportStatus').textContent = 'MP4 export not available in browser (requires server-side processing)';
    
    // Simulate some progress for visual feedback
    let progress = 0;
    const interval = setInterval(() => {
        progress += 20;
        updateExportProgress(progress);
        if (progress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
                const canvas = document.querySelector('#canvasContainer canvas') || 
                       document.querySelector('canvas') || 
                       (currentSketch && currentSketch.canvas);
                if (canvas) {
                    const link = document.createElement('a');
                    link.download = 'animation_frame.png';
                    link.href = canvas.toDataURL('image/png');
                    link.click();
                    document.getElementById('exportStatus').textContent = 'Frame saved as PNG (MP4 requires external tools)';
                    setTimeout(() => updateExportProgress(0), 2000);
                }
            }, 500);
        }
    }, 200);
}

// Initialization and event handlers
window.onload = function() {
    loadPreset('tunnel');
    updateCanvasSize(300); // Initialize with default size
    
    // Auto-run when user stops typing for 1 second
    let timeout;
    document.getElementById('codeEditor').addEventListener('input', function() {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            if (isRunning) {
                stopAnimation();
                setTimeout(() => {
                    runAnimation();
                }, 100);
            }
        }, 1000);
    });
    
    // Handle tab key in textarea
    document.getElementById('codeEditor').addEventListener('keydown', function(e) {
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = this.selectionStart;
            const end = this.selectionEnd;
            this.value = this.value.substring(0, start) + '  ' + this.value.substring(end);
            this.selectionStart = this.selectionEnd = start + 2;
        }
    });
};