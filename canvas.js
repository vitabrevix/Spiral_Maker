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

function createLayer(code = '') {
    const layerId = ++layerCounter;
    const layer = {
        id: layerId,
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
    
    // Add color properties to layer if they don't exist
    if (!layer.hasOwnProperty('hue')) layer.hue = 360;
    if (!layer.hasOwnProperty('saturation')) layer.saturation = 100;
    if (!layer.hasOwnProperty('brightness')) layer.brightness = 100;
    if (!layer.hasOwnProperty('opacity')) layer.opacity = 100;
    
    layerDiv.innerHTML = `
        <div class="layer-header">
            <span class="drag-handle">⋮⋮</span>
            <button class="layer-toggle">${layer.collapsed ? '▶' : '▼'}</button>
            <div class="layer-color-controls">
                <div class="color-control">
                    <label>H:</label>
                    <input type="range" class="color-slider hue-slider" min="0" max="360" value="${layer.hue}" 
                           oninput="updateLayerColor(${layer.id}, 'hue', this.value)">
                    <span class="color-value">${layer.hue}</span>
                </div>
                <div class="color-control">
                    <label>S:</label>
                    <input type="range" class="color-slider sat-slider" min="1" max="100" value="${layer.saturation}" 
                           oninput="updateLayerColor(${layer.id}, 'saturation', this.value)">
                    <span class="color-value">${layer.saturation}</span>
                </div>
                <div class="color-control">
                    <label>B:</label>
                    <input type="range" class="color-slider bright-slider" min="1" max="100" value="${layer.brightness}" 
                           oninput="updateLayerColor(${layer.id}, 'brightness', this.value)">
                    <span class="color-value">${layer.brightness}</span>
                </div>
				<div class="color-control">
                    <label>O:</label>
                    <input type="range" class="color-slider opacity-slider" min="1" max="100" value="${layer.opacity}" 
                           oninput="updateLayerColor(${layer.id}, 'opacity', this.value)">
                    <span class="color-value">${layer.opacity}</span>
                </div>
            </div>
            <div class="layer-controls">
                <button class="layer-btn" onclick="moveLayerUp(${layer.id})" ${layers.indexOf(layer) === 0 ? 'disabled' : ''}>↑</button>
                <button class="layer-btn" onclick="moveLayerDown(${layer.id})" ${layers.indexOf(layer) === layers.length - 1 ? 'disabled' : ''}>↓</button>
                <button class="layer-btn" onclick="duplicateLayer(${layer.id})">Copy</button>
                <button class="layer-btn" onclick="deleteLayer(${layer.id})">×</button>
            </div>
        </div>
        <div class="layer-content ${layer.collapsed ? 'collapsed' : 'expanded'}">
            <textarea class="layer-textarea" placeholder="// Layer code here..." oninput="updateLayerCode(${layer.id}, this.value)">${layer.code}</textarea>
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

function updateLayerColor(layerId, property, value) {
    const layer = layers.find(l => l.id === layerId);
    if (layer) {
        layer[property] = parseInt(value);
        
        // Update the display value
        const layerDiv = document.querySelector(`[data-layer-id="${layerId}"]`);
        const valueSpan = layerDiv.querySelector(`.color-control:has(.${property === 'hue' ? 'hue' : property === 'saturation' ? 'sat' : property === 'brightness' ? 'bright' : 'opacity'}-slider) .color-value`);
        if (valueSpan) {
            valueSpan.textContent = value;
        }
        
        // Restart animation if running to apply changes
        if (isRunning) {
            clearTimeout(window.layerColorUpdateTimeout);
            window.layerColorUpdateTimeout = setTimeout(() => {
                stopAnimation();
                setTimeout(runAnimation, 100);
            }, 300);
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
				
				window.layer = layer; // Pass the entire layer object
				window.hue = layer.hue || 360;
				window.saturation = layer.saturation || 100;
				window.brightness = layer.brightness || 100;
				window.opacity = layer.opacity / 100 || 100;

                
                try {
                    eval(layer.code);
                } catch (e) {
                    throw new Error(`${e.message}`);
                }
                
                p.setup = function() {					
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
					
					// Set HSB color mode for this layer
					p.colorMode(p.HSB, layer.hue, 100, 100);
										
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
	
	delete window.hue;
    delete window.saturation;
    delete window.brightness;
    delete window.opacity;
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
        createLayer(layer.code);
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

// Add updateLoopProgress function
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

window.onload = function() {
    // First, initialize settings from DOM values
    initializeFromDOMValues();
    
    // Then create the initial layer - need to check if getPresetCode exists
    const initialCode = typeof getPresetCode === 'function' ? getPresetCode('tunnel') : 
        'function setup() {\n  background(0);\n}\n\nfunction draw() {\n  // Your animation code here\n}';
    
    const initialLayer = createLayer(initialCode);
    selectLayer(initialLayer.id);
};

