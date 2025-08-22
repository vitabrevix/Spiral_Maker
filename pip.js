function openPipWindow() {
    if (pipWindow && !pipWindow.closed) {
        pipWindow.focus();
        return;
    }
    
    const pipBtn = document.getElementById('pipBtn');
    pipBtn.textContent = 'Opening...';
    pipBtn.disabled = true;
    
    // Create a new window
    pipWindow = window.open('', 'PiPWindow', `
        width=${canvasWidth + 40},
        height=${canvasHeight + 80},
        scrollbars=no,
        resizable=yes,
        status=no,
        toolbar=no,
        menubar=no
    `);
    
    // Set up the PiP window content
    pipWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Animation Preview</title>
            <style>
                body { 
                    margin: 0; 
                    padding: 20px; 
                    background: #1a1a1a; 
                    display: flex; 
                    justify-content: center; 
                    align-items: center;
                    min-height: 100vh;
                }
                #pipCanvas { 
                    position: relative;
                    border: 1px solid #333;
                    background: ${backgroundColor};
                }
            </style>
        </head>
        <body>
            <div id="pipCanvas" style="width: ${canvasWidth}px; height: ${canvasHeight}px;"></div>
        </body>
        </html>
    `);
    
    pipWindow.document.close();
    
    // Update button state
    pipBtn.textContent = 'Close PiP';
    pipBtn.onclick = closePipWindow;
    pipBtn.disabled = false;
    
    // Start updating the PiP window
    startPipUpdates();
    
    // Handle window closing
    pipWindow.onbeforeunload = function() {
        closePipWindow();
    };
}

function closePipWindow() {
    if (pipWindow && !pipWindow.closed) {
        pipWindow.close();
    }
    stopPipUpdates();
    
    const pipBtn = document.getElementById('pipBtn');
    pipBtn.textContent = 'Open PiP';
    pipBtn.onclick = openPipWindow;
    pipWindow = null;
}

function startPipUpdates() {
    if (pipUpdateInterval) {
        clearInterval(pipUpdateInterval);
    }
    
    pipUpdateInterval = setInterval(() => {
        updatePipWindow();
    }, 100); // Update every 100ms
}

function stopPipUpdates() {
    if (pipUpdateInterval) {
        clearInterval(pipUpdateInterval);
        pipUpdateInterval = null;
    }
}

function updatePipWindow() {
    if (!pipWindow || pipWindow.closed) {
        closePipWindow();
        return;
    }
    
    const mainCanvasContainer = document.getElementById('canvasContainer');
    if (!mainCanvasContainer) return;
    
    const pipCanvas = pipWindow.document.getElementById('pipCanvas');
    if (!pipCanvas) return;
    
    // Update background color
    pipCanvas.style.backgroundColor = backgroundColor;
    pipCanvas.style.width = canvasWidth + 'px';
    pipCanvas.style.height = canvasHeight + 'px';
    
    // Clear existing canvases in PiP
    pipCanvas.innerHTML = '';
    
    // Get all canvas elements from the main window
    const mainCanvases = mainCanvasContainer.querySelectorAll('canvas');
    
    mainCanvases.forEach((sourceCanvas, index) => {
        // Create a new canvas in the PiP window with the correct display dimensions
        const pipCanvasElement = pipWindow.document.createElement('canvas');
        pipCanvasElement.width = canvasWidth;  // Set to display width
        pipCanvasElement.height = canvasHeight; // Set to display height
        pipCanvasElement.style.position = 'absolute';
        pipCanvasElement.style.top = '0px';
        pipCanvasElement.style.left = '0px';
        pipCanvasElement.style.width = canvasWidth + 'px';   // CSS display size
        pipCanvasElement.style.height = canvasHeight + 'px'; // CSS display size
        pipCanvasElement.style.zIndex = sourceCanvas.style.zIndex || index;
        pipCanvasElement.style.pointerEvents = 'none';
        pipCanvasElement.id = `pip-${sourceCanvas.id || 'canvas-' + index}`;
        
        // Copy the pixel data from source to PiP canvas, scaling if necessary
        const pipCtx = pipCanvasElement.getContext('2d');
        pipCtx.clearRect(0, 0, pipCanvasElement.width, pipCanvasElement.height);
        
        // Scale the image to fit the target canvas dimensions
        pipCtx.drawImage(sourceCanvas, 0, 0, sourceCanvas.width, sourceCanvas.height, 
                        0, 0, canvasWidth, canvasHeight);
        
        // Add the canvas to the PiP container
        pipCanvas.appendChild(pipCanvasElement);
    });
}