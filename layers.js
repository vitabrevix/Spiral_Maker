let canvasLayers = [];

// PUBLIC
function addLayer() {
    const newLayer = createLayer();
    LayerDOM.render(newLayer);
    selectLayer(newLayer.id);
    AnimationManager.scheduleRestart(100);
}

function addImageLayer() {
    const newLayer = createLayer('', 'image');
    LayerDOM.render(newLayer);
    selectLayer(newLayer.id);
    AnimationManager.scheduleRestart(100);
}

function addTextLayer() {
    const newLayer = createLayer('', 'text');
    LayerDOM.render(newLayer);
    selectLayer(newLayer.id);
    AnimationManager.scheduleRestart(100);
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
        scheduleLayerRestart(800);
    }
}

function updateLayerCode(layerId, code) {
    const layer = layers.find(l => l.id === layerId);
    if (layer) {
        layer.code = code;
        scheduleLayerRestart(800);
    }
}

function updateLayerColor(layerId, property, value) {
    const layer = layers.find(l => l.id === layerId);
    if (!layer) return;
    layer[property] = parseInt(value);

    const layerDiv = document.querySelector(`[data-layer-id="${layerId}"]`);
    const cls = { hue: 'hue', saturation: 'sat', brightness: 'bright', opacity: 'opacity' }[property];
    const valueSpan = layerDiv && layerDiv.querySelector(`.${cls}-slider + .color-value`);
    if (valueSpan) valueSpan.textContent = value;

    // Colour sliders are applied as a live filter - no restart needed
    refreshLayerStyles();
}

function updateLayerAnimation(layerId, property, value) {
    const layer = layers.find(l => l.id === layerId);
    if (!layer) return;
    if (property === 'maxFrames') {
        const v = parseInt(value);
        if (!(v >= 1)) return;
        layer.maxFrames = v;
    } else if (property === 'fps') {
        const v = parseInt(value);
        if (!(v >= 1)) return;
        layer.fps = Math.min(v, animationFPS);
    } else if (property === 'speed') {
        const v = parseFloat(value);
        if (!(v > 0)) return;
        layer.speed = v;
    }
    // Timing is derived from the master clock every frame, so just re-sync
    if (autoFrames) applyAutoFrames();
    if (isRunning) {
        showFrame(virtualFrameCount % framesPerLoop, true);
        resyncClock();
    }
}

function scheduleLayerRestart(delay = 300) {
    clearTimeout(window.__layerRestartTimer);
    window.__layerRestartTimer = setTimeout(restartAnimationIfRunning, delay);
}

function updateImageProperty(layerId, property, value) {
    const layer = layers.find(l => l.id === layerId);
    if (layer && layer.type === 'image' && layer.images.length > 0) {
        const selectedImage = layer.images[layer.selectedImageIndex];
        if (selectedImage && property === 'imageFit') {
            selectedImage.imageFit = value;
            scheduleLayerRestart(50);
            return;
        }
        const v = parseFloat(value);
        if (selectedImage && !isNaN(v)) {
            selectedImage[property] = v;
            scheduleLayerRestart();
        }
    }
}

function updateTextProperty(layerId, property, value) {
    const layer = layers.find(l => l.id === layerId);
    if (layer && layer.type === 'text' && layer.texts.length > 0) {
        const selectedText = layer.texts[layer.selectedTextIndex];
        if (!selectedText) return;
        if (['fontSize', 'textX', 'textY', 'textRotation', 'animAmount', 'animCycles', 'startFrame', 'endFrame', 'fadeFrames'].includes(property)) {
            const v = parseFloat(value);
            if (isNaN(v)) return;
            selectedText[property] = v;
        } else {
            selectedText[property] = value;
        }
        if (property === 'text') {
            const label = document.querySelector(`[data-layer-id="${layerId}"] .layer-header .layer-name`);
            if (label) label.textContent = layerLabel(layer);
        }
        // Text layers draw every frame, so just redraw the current one
        if (isRunning) {
            showFrame(virtualFrameCount, true);
            if (isPaused) updatePipWindow();
        }
    }
}

function toggleLayerVisibility(layerId, isVisible) {
    const layer = layers.find(l => l.id === layerId);
    if (layer) {
        layer.visible = isVisible;
        restartAnimationIfRunning();
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

function addImageToLayer(layerId) {
    const layer = layers.find(l => l.id === layerId);
    if (layer && layer.type === 'image') {
        const newImage = {
            imageData: null,
            imageName: '',
            imageX: 0,
            imageY: 0,
            imageWidth: 100,
            imageHeight: 100,
            imageRotation: 0
        };
        layer.images.push(newImage);
        layer.selectedImageIndex = layer.images.length - 1;
        refreshLayerDOM(layerId);
    }
}

function addTextToLayer(layerId) {
    const layer = layers.find(l => l.id === layerId);
    if (layer && layer.type === 'text') {
        const newText = defaultTextItem();
        layer.texts.push(newText);
        layer.selectedTextIndex = layer.texts.length - 1;
        refreshLayerDOM(layerId);
    }
}

function removeImageFromLayer(layerId, imageIndex) {
    const layer = layers.find(l => l.id === layerId);
    if (layer && layer.type === 'image' && layer.images.length > 1) {
        layer.images.splice(imageIndex, 1);
        if (layer.selectedImageIndex >= layer.images.length) {
            layer.selectedImageIndex = layer.images.length - 1;
        }
        refreshLayerDOM(layerId);
    }
}

function removeTextFromLayer(layerId, textIndex) {
    const layer = layers.find(l => l.id === layerId);
    if (layer && layer.type === 'text' && layer.texts.length > 1) {
        layer.texts.splice(textIndex, 1);
        if (layer.selectedTextIndex >= layer.texts.length) {
            layer.selectedTextIndex = layer.texts.length - 1;
        }
        refreshLayerDOM(layerId);
    }
}

function selectImageInLayer(layerId, imageIndex) {
    const layer = layers.find(l => l.id === layerId);
    if (layer && layer.type === 'image') {
        layer.selectedImageIndex = imageIndex;
        refreshLayerDOM(layerId);
    }
}

function selectTextInLayer(layerId, textIndex) {
    const layer = layers.find(l => l.id === layerId);
    if (layer && layer.type === 'text') {
        layer.selectedTextIndex = textIndex;
        refreshLayerDOM(layerId);
    }
}

function handleImageUpload(layerId, file) {
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const layer = layers.find(l => l.id === layerId);
            if (layer && layer.images.length > 0) {
                const selectedImage = layer.images[layer.selectedImageIndex];
                selectedImage.imageData = e.target.result;
                selectedImage.imageName = file.name;
                
                // Create a temporary image to get dimensions
                const tempImg = new Image();
                tempImg.onload = function() {
                    // Set default size based on image aspect ratio
                    const aspectRatio = tempImg.width / tempImg.height;
                    selectedImage.imageWidth = Math.min(300, tempImg.width);
                    selectedImage.imageHeight = selectedImage.imageWidth / aspectRatio;
                    
                    // Update UI - refresh the specific layer
                    refreshLayerDOM(layerId);
                    
                    restartAnimationIfRunning();
                };
                tempImg.src = e.target.result;
            }
        };
        reader.readAsDataURL(file);
    }
}

// UTILITY
function refreshLayerDOM(layerId) {
    LayerDOM.refresh(layerId);
    updateLayerSelection();
}

// SYNTAX HIGHLIGHT
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

// DRAG N DROP
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
    
    restartAnimationIfRunning();
}
