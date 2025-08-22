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
let layers = [];
let layerCounter = 0;
let canvasLayers = [];
let selectedLayerId = null;
let backgroundColor = '#000000';
let pipWindow = null;
let pipUpdateInterval = null;

function createLayer(name = null, code = '') {
    const layerId = ++layerCounter;
    const layer = {
        id: layerId,
        name: name || `Layer ${layerId}`,
        code: code,
        collapsed: false,
        sketch: null
    };
    
    layers.push(layer);
    renderLayerDOM(layer);
    return layer;
}

function renderLayerDOM(layer) {
    const container = document.getElementById('layersContainer');
    const layerDiv = document.createElement('div');
    layerDiv.className = 'layer-item';
    layerDiv.setAttribute('data-layer-id', layer.id);
    layerDiv.draggable = true;
    
    layerDiv.innerHTML = `
        <div class="layer-header">
            <span class="drag-handle">⋮⋮</span>
            <button class="layer-toggle">${layer.collapsed ? '▶' : '▼'}</button>
            <div class="layer-name">${layer.name}</div>
            <div class="layer-controls">
                <button class="layer-btn" onclick="moveLayerUp(${layer.id})" ${layers.indexOf(layer) === 0 ? 'disabled' : ''}>↑</button>
                <button class="layer-btn" onclick="moveLayerDown(${layer.id})" ${layers.indexOf(layer) === layers.length - 1 ? 'disabled' : ''}>↓</button>
                <button class="layer-btn" onclick="duplicateLayer(${layer.id})">Copy</button>
                <button class="layer-btn" onclick="deleteLayer(${layer.id})">×</button>
            </div>
        </div>
        <div class="layer-content ${layer.collapsed ? 'collapsed' : 'expanded'}">
            <textarea class="layer-textarea" placeholder="// Layer ${layer.id} code here..." oninput="updateLayerCode(${layer.id}, this.value)">${layer.code}</textarea>
        </div>
    `;
    
    // Add event listeners
    const header = layerDiv.querySelector('.layer-header');
    const toggle = layerDiv.querySelector('.layer-toggle');
    const textarea = layerDiv.querySelector('.layer-textarea');
    
    // Layer selection functionality
    header.addEventListener('click', (e) => {
        if (e.target === toggle || e.target.closest('.layer-controls')) return;
        selectLayer(layer.id);
    });
    
    // Collapse/expand functionality
    toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleLayerCollapse(layer.id);
    });
    
    // Select layer when clicking on textarea
    textarea.addEventListener('focus', () => {
        selectLayer(layer.id);
    });
    
    // Drag and drop
    const dragHandle = layerDiv.querySelector('.drag-handle');
	dragHandle.addEventListener('mousedown', () => {
		layerDiv.draggable = true;
	});
	layerDiv.addEventListener('dragstart', handleDragStart);
	layerDiv.addEventListener('dragover', handleDragOver);
	layerDiv.addEventListener('drop', handleDrop);
	layerDiv.addEventListener('dragend', (e) => {
		handleDragEnd.call(layerDiv, e);
		layerDiv.draggable = false;
	});

	// Prevent dragging when not using the handle
	layerDiv.addEventListener('mousedown', (e) => {
		if (!e.target.closest('.drag-handle')) {
			layerDiv.draggable = false;
		}
	});
    
    // Tab handling in textarea
    textarea.addEventListener('keydown', function(e) {
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = this.selectionStart;
            const end = this.selectionEnd;
            this.value = this.value.substring(0, start) + '  ' + this.value.substring(end);
            this.selectionStart = this.selectionEnd = start + 2;
        }
    });
    
    container.appendChild(layerDiv);
    
    // Auto-select first layer if none selected
    if (!selectedLayerId && layers.length === 1) {
        selectLayer(layer.id);
    }
}

function updateBackgroundColor(color) {
    backgroundColor = color;
    const canvasContainer = document.getElementById('canvasContainer');
    canvasContainer.style.backgroundColor = color;
    
    // Update PiP window background if it's open
    if (pipWindow && !pipWindow.closed) {
        const pipCanvas = pipWindow.document.getElementById('pipCanvas');
        if (pipCanvas) {
            pipCanvas.style.backgroundColor = color;
        }
    }
}

function runAnimation() {
    // Clean up existing sketches
    canvasLayers.forEach(sketch => {
        if (sketch) sketch.remove();
    });
    canvasLayers = [];
    
    const errorDisplay = document.getElementById('errorDisplay');
    const status = document.getElementById('status');
    
    errorDisplay.style.display = 'none';
    virtualFrameCount = 0;
    loopFrameCount = 0;
    isPaused = false;
    lastFrameTime = Date.now();
    
    document.getElementById('frameSlider').max = framesPerLoop - 1;
    
    try {
		// Clear the canvas container and set background
		const canvasContainer = document.getElementById('canvasContainer');
		canvasContainer.innerHTML = '';
		canvasContainer.style.backgroundColor = backgroundColor;
		canvasContainer.style.position = 'relative';
		canvasContainer.style.width = canvasWidth + 'px';
		canvasContainer.style.height = canvasHeight + 'px';
		// Add this line to ensure proper stacking context:
		canvasContainer.style.zIndex = '0';
        
        // Create sketches for each layer in proper order (bottom to top)
        layers.forEach((layer, layerIndex) => {
            if (!layer.code.trim()) return;
            
            const sketch = function(p) {
                const p5Functions = ['createCanvas', 'background', 'fill', 'stroke', 'noStroke', 'noFill', 
                                    'ellipse', 'rect', 'line', 'point', 'triangle', 'quad', 'arc',
                                    'translate', 'rotate', 'scale', 'push', 'pop', 'frameCount',
                                    'width', 'height', 'mouseX', 'mouseY', 'sin', 'cos', 'tan',
                                    'map', 'lerp', 'dist', 'random', 'noise', 'TWO_PI', 'PI', 'HALF_PI',
                                    'colorMode', 'HSB', 'RGB', 'strokeWeight', 'textSize', 'text',
                                    'sqrt', 'pow', 'abs', 'floor', 'ceil', 'round', 'radians', 'degrees',
                                    'clear', 'loadPixels', 'updatePixels', 'pixels', 'color', 'red', 'green', 'blue',
                                    'beginShape', 'endShape', 'vertex'];
                
                p5Functions.forEach(func => {
                    if (typeof p[func] !== 'undefined') {
                        window[func] = p[func].bind ? p[func].bind(p) : p[func];
                    }
                });
                
                // Override background function to make it transparent when called without arguments
                const originalBackground = p.background;
                window.background = function(...args) {
                    if (args.length === 0) {
                        p.clear();
                    } else {
                        originalBackground.apply(p, args);
                    }
                };
                
                Object.defineProperty(window, 'frameCount', { get: () => virtualFrameCount });
                Object.defineProperty(window, 'width', { get: () => p.width });
                Object.defineProperty(window, 'height', { get: () => p.height });
                Object.defineProperty(window, 'mouseX', { get: () => p.mouseX });
                Object.defineProperty(window, 'mouseY', { get: () => p.mouseY });
                Object.defineProperty(window, 'pixels', { 
                    get: () => p.pixels,
                    set: (value) => p.pixels = value
                });
                
                try {
                    eval(layer.code);
                } catch (e) {
                    throw new Error(`Layer ${layer.name}: ${e.message}`);
                }
                
                p.setup = function() {
					console.log(`Layer ${layer.name}: Creating canvas ${canvasWidth}x${canvasHeight}`);
					
					// Create canvas without parent to avoid p5's default behavior
					const canvas = p.createCanvas(canvasWidth, canvasHeight);
					
					// Get the actual canvas DOM element
					const canvasElement = canvas.canvas;
					
					// Remove from any existing parent
					if (canvasElement.parentNode) {
						canvasElement.parentNode.removeChild(canvasElement);
					}
					
					// Style the canvas element for proper layering
					canvasElement.style.position = 'absolute';
					canvasElement.style.top = '0px';
					canvasElement.style.left = '0px';
					canvasElement.style.zIndex = layerIndex.toString();
					canvasElement.style.pointerEvents = 'none';
					
					// Create a unique ID for debugging
					canvasElement.id = `layer-canvas-${layer.id}`;
					
					// Add the canvas to our container IMMEDIATELY
					const container = document.getElementById('canvasContainer');
					container.appendChild(canvasElement);
					
					console.log(`Layer ${layer.name} canvas appended with z-index: ${layerIndex}`);
					
					// Make canvas transparent by default
					p.clear();
					p.frameRate(animationFPS);
					
					if (typeof setup === 'function') {
						setup();
					}
				};
                
                p.draw = function() {
                    const shouldDraw = Date.now() - lastFrameTime >= (1000 / (animationFPS * animationSpeed));
                    if (shouldDraw && typeof draw === 'function') {
                        // Clear the canvas to transparent before each draw
                        p.clear();
                        draw();
                    }
                };
            };

            const layerSketch = new p5(sketch);
            canvasLayers.push(layerSketch);
        });
        
        isRunning = true;
        status.textContent = 'Running...';
        status.style.color = '#00cc66';
        
        updateLoopProgress();
        
        // Enable export buttons and frame controls
        document.getElementById('exportGifBtn').disabled = false;
        document.getElementById('exportWebPBtn').disabled = false;
        document.getElementById('exportMP4Btn').disabled = false;
        document.getElementById('pauseFrameBtn').disabled = false;
        document.getElementById('prevFrameBtn').disabled = false;
        document.getElementById('nextFrameBtn').disabled = false;
        document.getElementById('frameSlider').disabled = false;
        
        // Debug: Log canvas container children
        setTimeout(() => {
            const container = document.getElementById('canvasContainer');
            console.log('Canvas container children:', container.children.length);
            Array.from(container.children).forEach((child, index) => {
                console.log(`Child ${index}:`, child.id, 'z-index:', child.style.zIndex);
            });
        }, 100);
        
    } catch (error) {
        errorDisplay.textContent = 'Error: ' + error.message;
        errorDisplay.style.display = 'block';
        status.textContent = 'Error';
        status.style.color = '#ff6666';
    }
}

function clearP5() {
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
}

function stopAnimation() {
    if (animationLoopId) {
        cancelAnimationFrame(animationLoopId);
        animationLoopId = null;
    }

    // Clean up all layer sketches
    canvasLayers.forEach(sketch => {
        if (sketch) sketch.remove();
    });
    canvasLayers = [];
    
    if (currentSketch) {
        currentSketch.remove();
        currentSketch = null;
    }
    isRunning = false;
    isPaused = false;
    
    // Clear global p5 function references
    clearP5();
    
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
	
	if (pipWindow && !pipWindow.closed) {
		updatePipWindow(); // Final update to show stopped state
	}
}

function selectLayer(layerId) {
    selectedLayerId = layerId;
    updateLayerSelection();
}

function updateLayerSelection() {
    document.querySelectorAll('.layer-item').forEach(el => {
        const layerId = parseInt(el.getAttribute('data-layer-id'));
        const header = el.querySelector('.layer-header');
        const name = el.querySelector('.layer-name');
        
        if (layerId === selectedLayerId) {
            el.classList.add('selected');
            header.classList.add('selected');
            name.classList.add('selected');
        } else {
            el.classList.remove('selected');
            header.classList.remove('selected');
            name.classList.remove('selected');
        }
    });
}

function getSelectedLayer() {
    return layers.find(l => l.id === selectedLayerId);
}

function addLayer() {
    const newLayer = createLayer();
    selectLayer(newLayer.id);
    if (isRunning) {
        setTimeout(() => {
            stopAnimation();
            setTimeout(runAnimation, 100);
        }, 100);
    }
}

function updateLayerCode(layerId, code) {
    const layer = layers.find(l => l.id === layerId);
    if (layer) {
        layer.code = code;
        if (isRunning) {
            clearTimeout(window.layerUpdateTimeout);
            window.layerUpdateTimeout = setTimeout(() => {
                stopAnimation();
                setTimeout(runAnimation, 100);
            }, 1000);
        }
    }
}

function toggleLayerCollapse(layerId) {
    const layer = layers.find(l => l.id === layerId);
    if (!layer) return;
    
    layer.collapsed = !layer.collapsed;
    const layerDiv = document.querySelector(`[data-layer-id="${layerId}"]`);
    const toggle = layerDiv.querySelector('.layer-toggle');
    const content = layerDiv.querySelector('.layer-content');
    
    toggle.textContent = layer.collapsed ? '▶' : '▼';
    content.className = `layer-content ${layer.collapsed ? 'collapsed' : 'expanded'}`;
}

function moveLayerUp(layerId) {
    const index = layers.findIndex(l => l.id === layerId);
    if (index > 0) {
        [layers[index], layers[index - 1]] = [layers[index - 1], layers[index]];
        refreshLayersDOM();
        if (isRunning) {
            stopAnimation();
            setTimeout(runAnimation, 100);
        }
    }
}

function moveLayerDown(layerId) {
    const index = layers.findIndex(l => l.id === layerId);
    if (index < layers.length - 1) {
        [layers[index], layers[index + 1]] = [layers[index + 1], layers[index]];
        refreshLayersDOM();
        if (isRunning) {
            stopAnimation();
            setTimeout(runAnimation, 100);
        }
    }
}

function duplicateLayer(layerId) {
    const layer = layers.find(l => l.id === layerId);
    if (layer) {
        createLayer(layer.name + ' Copy', layer.code);
        if (isRunning) {
            stopAnimation();
            setTimeout(runAnimation, 100);
        }
    }
}

function deleteLayer(layerId) {
    const index = layers.findIndex(l => l.id === layerId);
    if (index !== -1) {
        layers.splice(index, 1);
        
        // Update selection if deleted layer was selected
        if (selectedLayerId === layerId) {
            if (layers.length > 0) {
                // Select the layer at the same position, or the last one if we deleted the last
                const newSelectedIndex = Math.min(index, layers.length - 1);
                selectedLayerId = layers[newSelectedIndex].id;
            } else {
                selectedLayerId = null;
            }
        }
        
        refreshLayersDOM();
        if (isRunning) {
            stopAnimation();
            setTimeout(runAnimation, 100);
        }
    }
}

function refreshLayersDOM() {
    document.getElementById('layersContainer').innerHTML = '';
    layers.forEach(renderLayerDOM);
    updateLayerSelection();
}

// Drag and drop handlers
let draggedElement = null;

function handleDragStart(e) {
    draggedElement = this;
    this.classList.add('dragging');
}

function handleDragOver(e) {
    e.preventDefault();
    const draggingElement = document.querySelector('.dragging');
    const siblings = [...document.querySelectorAll('.layer-item:not(.dragging)')];
    
    const nextSibling = siblings.find(sibling => {
        return e.clientY <= sibling.getBoundingClientRect().top + sibling.offsetHeight / 2;
    });
    
    if (nextSibling) {
        nextSibling.parentNode.insertBefore(draggingElement, nextSibling);
    } else {
        document.getElementById('layersContainer').appendChild(draggingElement);
    }
}

function handleDrop(e) {
    e.preventDefault();
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
    
    // Update layers array based on new DOM order
    const newOrder = [];
    document.querySelectorAll('.layer-item').forEach(el => {
        const layerId = parseInt(el.getAttribute('data-layer-id'));
        const layer = layers.find(l => l.id === layerId);
        if (layer) newOrder.push(layer);
    });
    layers = newOrder;
    
    if (isRunning) {
        stopAnimation();
        setTimeout(runAnimation, 100);
    }
}

// Initialize settings from DOM values on page load
function initializeFromDOMValues() {
    // Read background color from DOM element
    const backgroundColorPicker = document.getElementById('backgroundColorPicker');
    if (backgroundColorPicker) {
        backgroundColor = backgroundColorPicker.value;
        updateBackgroundColor(backgroundColor);
    }
    
    // Read animation settings from DOM
    const framesInput = document.getElementById('framesInput');
    const fpsInput = document.getElementById('fpsInput');
    const speedInput = document.getElementById('speedInput');
    const sizeSlider = document.getElementById('sizeSlider');
    const sizeInput = document.getElementById('sizeInput');
    
    if (framesInput) {
        framesPerLoop = parseInt(framesInput.value) || 120;
    }
    if (fpsInput) {
        animationFPS = parseInt(fpsInput.value) || 60;
    }
    if (speedInput) {
        animationSpeed = parseFloat(speedInput.value) || 1;
    }
    
    // Read canvas size settings
    if (sizeSlider && sizeInput) {
        const sliderValue = parseInt(sizeSlider.value);
        const inputValue = parseInt(sizeInput.value);
        
        // Use whichever value is present (in case one was changed)
        baseSize = sliderValue || inputValue || 300;
        
        // Sync both controls
        sizeSlider.value = baseSize;
        sizeInput.value = baseSize;
    }
    
    // Read canvas ratio from active button
    const activeRatioBtn = document.querySelector('.size-btn.active');
    if (activeRatioBtn) {
        const btnText = activeRatioBtn.textContent;
        if (btnText.includes('1:1')) canvasRatio = '1:1';
        else if (btnText.includes('4:3')) canvasRatio = '4:3';
        else if (btnText.includes('3:4')) canvasRatio = '3:4';
    }
    
    // Calculate canvas dimensions based on ratio and size
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
    
    // Update frame slider max
    const frameSlider = document.getElementById('frameSlider');
    if (frameSlider) {
        frameSlider.max = framesPerLoop - 1;
    }
    
    // Initialize canvas container with proper dimensions and background
    const canvasContainer = document.getElementById('canvasContainer');
    if (canvasContainer) {
        canvasContainer.style.position = 'relative';
        canvasContainer.style.width = canvasWidth + 'px';
        canvasContainer.style.height = canvasHeight + 'px';
        canvasContainer.style.backgroundColor = backgroundColor;
    }
}

// Add updateLoopProgress function (referenced but missing from original)
function updateLoopProgress() {
    if (!isRunning) return;
    
    const currentTime = Date.now();
    const timeSinceLastFrame = currentTime - lastFrameTime;
    
    if (timeSinceLastFrame >= (1000 / (animationFPS * animationSpeed))) {
        virtualFrameCount++;
        loopFrameCount = virtualFrameCount % framesPerLoop;
        lastFrameTime = currentTime;
        
        // Update frame display
        const frameDisplay = document.getElementById('frameDisplay');
        const frameSlider = document.getElementById('frameSlider');
        if (frameDisplay) {
            const frameStr = String(loopFrameCount).padStart(3, '0');
            const totalStr = String(framesPerLoop).padStart(3, '0');
            frameDisplay.textContent = `${frameStr}/${totalStr}`;
        }
        if (frameSlider) {
            frameSlider.value = loopFrameCount;
        }
    }
    
    animationLoopId = requestAnimationFrame(updateLoopProgress);
}

// PiP
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

window.onload = function() {
    // First, initialize settings from DOM values
    initializeFromDOMValues();
    
    // Then create the initial layer - need to check if getPresetCode exists
    const initialCode = typeof getPresetCode === 'function' ? getPresetCode('tunnel') : 
        'function setup() {\n  background(0);\n}\n\nfunction draw() {\n  // Your animation code here\n}';
    
    const initialLayer = createLayer('Main Layer', initialCode);
    selectLayer(initialLayer.id);
};

