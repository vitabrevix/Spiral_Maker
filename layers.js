let layers = [];
let layerCounter = 0;
let canvasLayers = [];
let selectedLayerId = null;

function restartAnimationIfRunning() {
    if (typeof isRunning !== 'undefined' && isRunning) {
        if (typeof stopAnimation === 'function' && typeof runAnimation === 'function') {
            stopAnimation();
            setTimeout(runAnimation, 100);
        }
    }
}

function createLayer(code = '', type = 'code') {
    const layerId = ++layerCounter;
    const layer = {
        id: layerId,
        type: type, // 'code', 'image', 'text'
        code: code,
        collapsed: false,
        sketch: null,
        visible: true,
        maxFrames: 120,
        fps: 60,
        speed: 1
    };
    
    // Add type-specific properties
    if (type === 'image') {
        layer.imageData = null;
        layer.imageName = '';
        layer.imageX = 0;
        layer.imageY = 0;
        layer.imageWidth = 100;
        layer.imageHeight = 100;
        layer.imageRotation = 0;
    } else if (type === 'text') {
        layer.text = 'Sample Text';
        layer.fontSize = 24;
        layer.fontFamily = 'Arial';
        layer.textX = 50;
        layer.textY = 50;
        layer.textRotation = 0;
        layer.textAlign = 'CENTER';
    }
    
    layers.push(layer);
    renderLayerDOM(layer);
    return layer;
}

function addImageLayer() {
    const newLayer = createLayer('', 'image');
    selectLayer(newLayer.id);
    if (isRunning) {
        setTimeout(() => {
            restartAnimationIfRunning();
            setTimeout(runAnimation, 100);
        }, 100);
    }
}

function addTextLayer() {
    const newLayer = createLayer('', 'text');
    selectLayer(newLayer.id);
    if (isRunning) {
        setTimeout(() => {
            restartAnimationIfRunning();
            setTimeout(runAnimation, 100);
        }, 100);
    }
}

function handleImageUpload(layerId, file) {
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const layer = layers.find(l => l.id === layerId);
            if (layer) {
                layer.imageData = e.target.result;
                layer.imageName = file.name;
                
                // Create a temporary image to get dimensions
                const tempImg = new Image();
                tempImg.onload = function() {
                    // Set default size based on image aspect ratio
                    const aspectRatio = tempImg.width / tempImg.height;
                    layer.imageWidth = Math.min(300, tempImg.width);
                    layer.imageHeight = layer.imageWidth / aspectRatio;
                    
                    // Update UI
                    refreshLayersDOM();
                    
                    // Restart animation if running
                    if (isRunning) {
                        restartAnimationIfRunning();
                        setTimeout(runAnimation, 100);
                    }
                };
                tempImg.src = e.target.result;
            }
        };
        reader.readAsDataURL(file);
    }
}

function updateLayerCodeWithHighlight(layerId, code) {
    const layer = layers.find(l => l.id === layerId);
    if (layer) {
        layer.code = code;
        
        // Update syntax highlighting
        const highlighter = document.getElementById(`highlighter-${layerId}`);
        if (highlighter && typeof syntaxHighlighter !== 'undefined') {
            highlighter.innerHTML = syntaxHighlighter.highlight(code);
        }
        
        // Existing animation restart logic
        if (isRunning) {
            clearTimeout(window.layerUpdateTimeout);
            window.layerUpdateTimeout = setTimeout(() => {
                restartAnimationIfRunning();
            }, 1000);
        }
    }
}

function initializeSyntaxHighlighting(layerId) {
    const layer = layers.find(l => l.id === layerId);
    if (layer) {
        const highlighter = document.getElementById(`highlighter-${layerId}`);
        const textarea = document.getElementById(`textarea-${layerId}`);
        
        if (highlighter && textarea && typeof syntaxHighlighter !== 'undefined') {
            // Get textarea's computed styles for exact matching
            const textareaStyles = window.getComputedStyle(textarea);
            
            // Apply exact same styles to highlighter
            highlighter.style.fontSize = textareaStyles.fontSize;
            highlighter.style.fontFamily = textareaStyles.fontFamily;
            highlighter.style.lineHeight = textareaStyles.lineHeight;
            highlighter.style.padding = textareaStyles.padding;
            highlighter.style.border = textareaStyles.border;
            highlighter.style.boxSizing = textareaStyles.boxSizing;
            highlighter.style.letterSpacing = textareaStyles.letterSpacing;
            highlighter.style.wordSpacing = textareaStyles.wordSpacing;
            
            // Initial highlight
            highlighter.innerHTML = syntaxHighlighter.highlight(layer.code);
            
            // Sync scrolling and dimensions
            const syncAll = () => {
                highlighter.scrollTop = textarea.scrollTop;
                highlighter.scrollLeft = textarea.scrollLeft;
                highlighter.style.height = textarea.style.height || textareaStyles.height;
                highlighter.style.width = textarea.style.width || textareaStyles.width;
            };
            
            textarea.addEventListener('scroll', syncAll);
            textarea.addEventListener('input', () => {
                highlighter.innerHTML = syntaxHighlighter.highlight(textarea.value);
            });
            
            const resizeObserver = new ResizeObserver(syncAll);
            resizeObserver.observe(textarea);
            
            // Initial sync
            setTimeout(syncAll, 0);
        }
    }
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
    
    // Add animation properties to layer if they don't exist
    if (!layer.hasOwnProperty('maxFrames')) layer.maxFrames = 120;
    if (!layer.hasOwnProperty('fps')) layer.fps = 60;
    if (!layer.hasOwnProperty('speed')) layer.speed = 1;
    
    layerDiv.innerHTML = `
        <div class="layer-header">
            <span class="drag-handle">⋮⋮</span>
            <button class="layer-toggle">${layer.collapsed ? '▼' : '▲'}</button>
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
				<label class="visibility-checkbox">
					<input type="checkbox" ${layer.visible ? 'checked' : ''} onchange="toggleLayerVisibility(${layer.id}, this.checked)">
					<span class="checkbox-visual"></span>
				</label>
				<button class="layer-btn" onclick="moveLayerUp(${layer.id})" ${layers.indexOf(layer) === 0 ? 'disabled' : ''}>↑</button>
				<button class="layer-btn" onclick="moveLayerDown(${layer.id})" ${layers.indexOf(layer) === layers.length - 1 ? 'disabled' : ''}>↓</button>
				<button class="layer-btn" onclick="deleteLayer(${layer.id})">×</button>
			</div>
            <div class="layer-animation-controls">
                <div class="animation-control">
                    <label>Frames:</label>
                    <input type="number" class="animation-input" min="1" max="9999" value="${layer.maxFrames}" 
                           oninput="updateLayerAnimation(${layer.id}, 'maxFrames', this.value)">
                </div>
                <div class="animation-control">
                    <label>FPS:</label>
                    <input type="number" class="animation-input" min="1" max="240" value="${layer.fps}" 
                           oninput="updateLayerAnimation(${layer.id}, 'fps', this.value)">
                </div>
                <div class="animation-control">
                    <label>Speed:</label>
                    <input type="number" class="animation-input" min="0.1" max="10" step="0.1" value="${layer.speed}" 
                           oninput="updateLayerAnimation(${layer.id}, 'speed', this.value)">
                </div>
            </div>
			<div class="layer-controls">
				<button class="layer-btn" onclick="duplicateLayer(${layer.id})">Duplicate</button>
			</div>
        </div>
		<div class="layer-content ${layer.collapsed ? 'collapsed' : 'expanded'}">
			<div class="code-editor-container">
				<textarea class="layer-textarea" 
				  id="textarea-${layer.id}"
				  placeholder="// Layer code here..." 
				  spellcheck="false"
				  autocomplete="off"
				  autocorrect="off"
				  autocapitalize="off"
				  oninput="updateLayerCodeWithHighlight(${layer.id}, this.value)">${layer.code}</textarea>
				<div class="syntax-highlighter" id="highlighter-${layer.id}"></div>
			</div>
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
	
	// Initialize syntax highlighting AFTER DOM is added
    setTimeout(() => {
        initializeSyntaxHighlighting(layer.id);
    }, 0);
	
	// Add focus/blur handlers for proper highlighting behavior
    textarea.addEventListener('focus', () => {
        selectLayer(layer.id);
        // Hide syntax highlighting when editing
        const highlighter = document.getElementById(`highlighter-${layer.id}`);
        if (highlighter) {
            highlighter.style.color = 'transparent';
        }
    });
    
    textarea.addEventListener('blur', () => {
        // Show syntax highlighting when not editing
        const highlighter = document.getElementById(`highlighter-${layer.id}`);
        if (highlighter) {
            highlighter.style.color = '';
            // Re-highlight to ensure sync
            highlighter.innerHTML = syntaxHighlighter.highlight(textarea.value);
        }
    });
    
    // Auto-select first layer if none selected
    if (!selectedLayerId && layers.length === 1) {
        selectLayer(layer.id);
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
                restartAnimationIfRunning();
            }, 300);
        }
    }
}

function updateLayerAnimation(layerId, property, value) {
    const layer = layers.find(l => l.id === layerId);
    if (layer) {
        if (property === 'maxFrames') {
            layer.maxFrames = Math.max(1, parseInt(value));
        } else if (property === 'fps') {
            layer.fps = Math.max(1, Math.min(parseInt(value), animationFPS));
        } else if (property === 'speed') {
            layer.speed = Math.max(0.1, parseFloat(value));
        }
        
        // Update the input field to reflect the actual value (in case it was limited)
        const layerDiv = document.querySelector(`[data-layer-id="${layerId}"]`);
        const input = layerDiv.querySelector(`.animation-control:has(input[oninput*="${property}"]) input`);
        if (input) {
            input.value = layer[property];
        }
        
        // Restart animation if running to apply changes
        if (isRunning) {
            clearTimeout(window.layerAnimationUpdateTimeout);
            window.layerAnimationUpdateTimeout = setTimeout(() => {
                restartAnimationIfRunning();
            }, 300);
        }
    }
}

function toggleLayerVisibility(layerId, isVisible) {
    const layer = layers.find(l => l.id === layerId);
    if (layer) {
        layer.visible = isVisible;
        
        // Restart animation if running to apply visibility changes
        if (isRunning) {
            restartAnimationIfRunning();
            setTimeout(runAnimation, 100);
        }
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
        } else {
            el.classList.remove('selected');
            header.classList.remove('selected');
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
            restartAnimationIfRunning();
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
                restartAnimationIfRunning();
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
    
    toggle.textContent = layer.collapsed ? '▼' : '▲';
    content.className = `layer-content ${layer.collapsed ? 'collapsed' : 'expanded'}`;
}

function moveLayerUp(layerId) {
    const index = layers.findIndex(l => l.id === layerId);
    if (index > 0) {
        [layers[index], layers[index - 1]] = [layers[index - 1], layers[index]];
        refreshLayersDOM();
        if (isRunning) {
            restartAnimationIfRunning();
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
            restartAnimationIfRunning();
            setTimeout(runAnimation, 100);
        }
    }
}

function duplicateLayer(layerId) {
    const layer = layers.find(l => l.id === layerId);
    if (layer) {
        const newLayer = createLayer(layer.code);
        // Copy all layer properties
        newLayer.hue = layer.hue;
        newLayer.saturation = layer.saturation;
        newLayer.brightness = layer.brightness;
        newLayer.opacity = layer.opacity;
        newLayer.maxFrames = layer.maxFrames;
        newLayer.fps = layer.fps;
        newLayer.speed = layer.speed;
        newLayer.visible = layer.visible;
        
        // Refresh DOM to show copied values
        refreshLayersDOM();
        
        if (isRunning) {
            restartAnimationIfRunning();
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
            restartAnimationIfRunning();
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
        restartAnimationIfRunning();
        setTimeout(runAnimation, 100);
    }
}
