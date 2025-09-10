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
        if (isRunning) {
            clearTimeout(window.layerUpdateTimeout);
            window.layerUpdateTimeout = setTimeout(() => {
                restartAnimationIfRunning();
            }, 1000);
        }
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

function updateImageProperty(layerId, property, value) {
    const layer = layers.find(l => l.id === layerId);
    if (layer && layer.type === 'image' && layer.images.length > 0) {
        const selectedImage = layer.images[layer.selectedImageIndex];
        if (selectedImage) {
            selectedImage[property] = parseFloat(value);
            
            // Restart animation if running to apply changes
            if (isRunning) {
                clearTimeout(window.layerImageUpdateTimeout);
                window.layerImageUpdateTimeout = setTimeout(() => {
                    restartAnimationIfRunning();
                }, 300);
            }
        }
    }
}

function updateTextProperty(layerId, property, value) {
    const layer = layers.find(l => l.id === layerId);
    if (layer && layer.type === 'text' && layer.texts.length > 0) {
        const selectedText = layer.texts[layer.selectedTextIndex];
        if (selectedText) {
            if (property === 'fontSize' || property === 'textX' || property === 'textY' || property === 'textRotation') {
                selectedText[property] = parseFloat(value);
            } else {
                selectedText[property] = value;
            }
            
            // Restart animation if running to apply changes
            if (isRunning) {
                clearTimeout(window.layerTextUpdateTimeout);
                window.layerTextUpdateTimeout = setTimeout(() => {
                    restartAnimationIfRunning();
                }, 300);
            }
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
        const newText = {
            text: 'Sample Text',
            fontSize: 24,
            fontFamily: 'Arial',
            textX: 50,
            textY: 50,
            textRotation: 0,
            textAlign: 'CENTER'
        };
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

// UTILITY
function refreshLayerDOM(layerId) {
    const layer = layers.find(l => l.id === layerId);
    if (!layer) return;
    
    const existingElement = document.querySelector(`[data-layer-id="${layerId}"]`);
    const container = document.getElementById('layersContainer');
    const layerIndex = layers.findIndex(l => l.id === layerId);
    
    if (existingElement) existingElement.remove();
    
    const layerDiv = document.createElement('div');
    layerDiv.className = 'layer-item';
    layerDiv.setAttribute('data-layer-id', layer.id);
    layerDiv.draggable = true;
    layerDiv.innerHTML = generateLayerHTML(layer);
    
    // Insert at correct position
    const allLayerElements = Array.from(container.children);
    if (layerIndex < allLayerElements.length) {
        container.insertBefore(layerDiv, allLayerElements[layerIndex]);
    } else {
        container.appendChild(layerDiv);
    }
    
    LayerEventManager.attachLayerEventListeners(layerDiv, layer);
    
    if (layer.type === 'code') {
        setTimeout(() => initializeSyntaxHighlighting(layer.id), 0);
    }
    
    updateLayerSelection();
}


function restartAnimationIfRunning() {
    if (typeof isRunning !== 'undefined' && isRunning) {
        if (typeof stopAnimation === 'function' && typeof runAnimation === 'function') {
            stopAnimation();
            setTimeout(runAnimation, 100);
        }
    }
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
    
    if (isRunning) {
        restartAnimationIfRunning();
        setTimeout(runAnimation, 100);
    }
}
