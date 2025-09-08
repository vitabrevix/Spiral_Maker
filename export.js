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
    
    // Disable other controls during capture
    const pauseBtn = document.getElementById('pauseFrameBtn');
    if (pauseBtn) {
      pauseBtn.disabled = true;
    }

    // Start the capture
    updateExportStatus(`Capturing ${format.toUpperCase()}...`);
    updateExportProgress(0);

    // Start capture with callbacks directly in the options object
    capture.start({
        format: format,
        duration: framesPerLoop,
        framerate: animationFPS,
        disableUi: true,
        onProgress: (p) => {
            updateExportProgress(p * 100);
        },
        onComplete: () => {
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
        onError: (e) => {
            updateExportStatus('Export failed!');
            console.error('Export error:', e);
            updateExportProgress(0);
        }
    });
}