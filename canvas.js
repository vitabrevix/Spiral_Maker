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