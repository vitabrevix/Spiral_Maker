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
let backgroundColor = '#000000';
let pipWindow = null;
let pipUpdateInterval = null;

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
        createLayerSketch();
        
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

function updateLoopProgress() {
    if (!isRunning || isPaused || isSliderActive) return;
    
    const currentTime = Date.now();
    const frameInterval = 1000 / (animationFPS * animationSpeed);
    
    if (currentTime - lastFrameTime >= frameInterval) {
        virtualFrameCount++;
        lastFrameTime = currentTime;
        
        if (virtualFrameCount >= framesPerLoop) {
            virtualFrameCount = 0; // Reset global counter
            
            // Reset all layers when global loop completes
            canvasLayers.forEach(sketch => {
                if (sketch && sketch.layerControls) {
                    sketch.layerControls.resetTiming();
                }
            });
        }
        
        loopFrameCount = virtualFrameCount;
        updateUI();
    }
    
    animationLoopId = requestAnimationFrame(updateLoopProgress);
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

function createLayerSketch(){
	layers.forEach((layer, layerIndex) => {
		if (!layer.code.trim() || !layer.visible) return;
		
		// Layer control object to be shared between sketch and external functions
		const layerControls = {
			layer: layer,
			frameCount: 0,
			lastFrameTime: Date.now(),
			startTime: Date.now(),
			getFrameCount: function() { return this.frameCount; },
			setFrameCount: function(frame) { this.frameCount = frame; },
			resetTiming: function() {
				this.frameCount = 0;
				this.lastFrameTime = Date.now();
				this.startTime = Date.now();
			}
		};
		
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
			
			// Layer-specific timing variables - use layerControls object
			Object.defineProperty(window, 'width', { get: () => p.width });
			Object.defineProperty(window, 'height', { get: () => p.height });
			Object.defineProperty(window, 'mouseX', { get: () => p.mouseX });
			Object.defineProperty(window, 'mouseY', { get: () => p.mouseY });
			Object.defineProperty(window, 'pixels', { 
				get: () => p.pixels,
				set: (value) => p.pixels = value
			});
			
			window.layer = layer;
			window.hue = layer.hue || 360;
			window.saturation = layer.saturation || 100;
			window.brightness = layer.brightness || 100;
			window.opacity = layer.opacity / 100 || 100;
			
			// Layer-specific frame count - runs at its own speed
			Object.defineProperty(window, 'frameCount', { 
				get: () => layerControls.frameCount
			});
			
			// Function to reset this layer's timing
			window.resetLayerTiming = layerControls.resetTiming.bind(layerControls);
			
			try {
				eval(layer.code);
			} catch (e) {
				throw new Error(`${e.message}`);
			}
			
			p.setup = function() {
				const canvas = p.createCanvas(canvasWidth, canvasHeight);
				const canvasElement = canvas.canvas;
				
				if (canvasElement.parentNode) {
					canvasElement.parentNode.removeChild(canvasElement);
				}
				
				canvasElement.style.position = 'absolute';
				canvasElement.style.top = '0px';
				canvasElement.style.left = '0px';
				canvasElement.style.zIndex = layerIndex.toString();
				canvasElement.style.pointerEvents = 'none';
				canvasElement.id = `layer-canvas-${layer.id}`;
				
				const container = document.getElementById('canvasContainer');
				container.appendChild(canvasElement);
				
				p.colorMode(p.HSB, layer.hue, 100, 100);
				p.clear();
				p.frameRate(layer.fps);
				
				if (typeof setup === 'function') {
					setup();
				}
			};
			
			p.draw = function() {
				// Update timing only if not paused
				if (!isPaused) {
					const currentTime = Date.now();
					const layerFrameInterval = 1000 / (layer.fps * layer.speed * animationSpeed);
					
					if (currentTime - layerControls.lastFrameTime >= layerFrameInterval) {
						layerControls.frameCount = (layerControls.frameCount + 1) % layer.maxFrames;
						layerControls.lastFrameTime = currentTime;
					}
				}
				
				// Always draw when draw() is called (for manual control and regular animation)
				if (typeof draw === 'function') {
					p.clear();
					draw();
				}
			};
		};

		const layerSketch = new p5(sketch);
		layerSketch.layerControls = layerControls; // Store reference to controls
		canvasLayers.push(layerSketch);
	});
}

function updateLayerFPSLimits() {
    layers.forEach(layer => {
        if (layer.fps > animationFPS) {
            layer.fps = animationFPS;
        }
    });
    refreshLayersDOM();
}

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

window.onload = function() {
    // First, initialize settings from DOM values
    initializeFromDOMValues();
	initializeSliderInteraction();
    
    // Then create the initial layer - need to check if getPresetCode exists
    const initialCode = typeof getPresetCode === 'function' ? getPresetCode('tunnel') : 
        'function setup() {\n  background(0);\n}\n\nfunction draw() {\n  // Your animation code here\n}';
    
    const initialLayer = createLayer(initialCode);
    selectLayer(initialLayer.id);
};
