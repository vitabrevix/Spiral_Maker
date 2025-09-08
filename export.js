// Export functionality
let isCapturing = false;

function updateExportProgress(percentage) {
    const progressBar = document.getElementById('exportProgressBar');
    if (progressBar) {
        progressBar.style.width = percentage + '%';
    }
}

function updateExportStatus(status) {
    const statusElement = document.getElementById('exportStatus');
    if (statusElement) {
        statusElement.textContent = status;
    }
}

function exportAnimation(format) {
    if (!isRunning) {
        updateExportStatus('No animation running');
        return;
    }

    const capture = P5Capture.getInstance();

    // If a capture is already in progress, stop it.
    if (capture.state === 'capturing') {
        updateExportStatus('Stopping capture...');
        capture.stop();
        return;
    }

    // Check if the requested format is supported
    const supportedFormats = ['mp4', 'gif', 'webm', 'webp', 'png', 'jpg'];
    if (!supportedFormats.includes(format)) {
        updateExportStatus(`Format "${format}" is not supported.`);
        return;
    }

    // Capture needs to be started at the beginning of the animation loop
    virtualFrameCount = 0;
    loopFrameCount = 0;
    
    // Reset all layer timing to start from frame 0
    canvasLayers.forEach(sketch => {
        if (sketch && sketch.layerControls) {
            sketch.layerControls.resetTiming();
        }
    });
    
    // Disable other controls during capture
    const pauseBtn = document.getElementById('pauseFrameBtn');
    if (pauseBtn) {
      pauseBtn.disabled = true;
    }

    // Hook into console.log to capture P5Capture progress
    const originalConsoleLog = console.log;
    const progressRegex = /⏳ encoding (\d+)%/;
    
    console.log = function(...args) {
        const message = args.join(' ');
        const match = message.match(progressRegex);
        if (match) {
            const progress = parseInt(match[1]);
            updateExportProgress(progress);
            updateExportStatus(`Encoding ${format.toUpperCase()}... ${progress}%`);
        }
        // Call original console.log
        originalConsoleLog.apply(console, args);
    };

    // Start the capture
    updateExportStatus(`Capturing ${format.toUpperCase()}...`);
    updateExportProgress(0);

    // Start capture with callbacks in options
    capture.start({
        format: format,
        duration: framesPerLoop,
        framerate: animationFPS,
        disableUi: false, // Enable UI so we get console output
        verbose: true,
        onProgress: (progress) => {
            console.log('Capture progress:', progress);
            updateExportProgress(progress * 50); // Reserve first 50% for capture
            updateExportStatus(`Capturing ${format.toUpperCase()}... ${Math.round(progress * 50)}%`);
        },
        onComplete: (blob) => {
            console.log('Export complete');
            // Clean up
            clearInterval(captureProgressInterval);
            console.log = originalConsoleLog;
            
            updateExportStatus('Download ready!');
            updateExportProgress(100);
            if (pauseBtn) {
                pauseBtn.disabled = false;
            }
            setTimeout(() => {
                updateExportStatus('Idle');
                updateExportProgress(0);
            }, 3000);
        },
        onError: (error) => {
            console.error('Export error:', error);
            // Clean up
            clearInterval(captureProgressInterval);
            console.log = originalConsoleLog;
            
            updateExportStatus('Export failed!');
            updateExportProgress(0);
            if (pauseBtn) {
                pauseBtn.disabled = false;
            }
        }
    });
}