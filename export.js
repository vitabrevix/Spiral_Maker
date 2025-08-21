// Export functionality
let capturedFrames = [];
let isCapturing = false;

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