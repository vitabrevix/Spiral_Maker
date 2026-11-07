const TEXT_FONTS = ['Arial', 'Arial Black', 'Impact', 'Georgia', 'Times New Roman', 'Courier New', 'Verdana', 'Trebuchet MS'];
const TEXT_ANIMATIONS = [['none', 'None'], ['float', 'Float up/down'], ['sway', 'Sway left/right'],
    ['spin', 'Spin'], ['pulse', 'Pulse size'], ['blink', 'Blink']];

function escapeAttr(str) {
    return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function generateLayerHTML(layer) {
    return `
        <div class="layer-header">${generateLayerHeader(layer)}</div>
        <div class="layer-content ${layer.collapsed ? 'collapsed' : 'expanded'}">
            ${generateLayerContent(layer)}
        </div>
    `;
}

function generateLayerHeader(layer) {
    return `
        <span class="drag-handle">⋮⋮</span>
        <button class="layer-toggle">${layer.collapsed ? '▼' : '▲'}</button>
        <span class="layer-type-badge">${layer.type.toUpperCase()}</span>
        <span class="layer-name">${escapeAttr(layerLabel(layer))}</span>
        ${generateColorControls(layer)}
        ${generateLayerControls(layer)}
        ${generateAnimationControls(layer)}
        <button class="layer-btn" onclick="duplicateLayer(${layer.id})">Duplicate</button>
    `;
}

const LayerTemplates = {
    code: (layer) => `
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
    `,
    
    image: (layer) => {
        const selectedImage = layer.images[layer.selectedImageIndex] || layer.images[0];
        return `
            <div class="image-editor-container">
                <div class="image-list-controls">
                    <div class="image-tabs">
                        ${layer.images.map((img, index) => `
                            <button class="image-tab ${index === layer.selectedImageIndex ? 'active' : ''}" 
                                    onclick="selectImageInLayer(${layer.id}, ${index})">
                                ${img.imageName || `Image ${index + 1}`}
                                ${layer.images.length > 1 ? `<span class="remove-tab" onclick="event.stopPropagation(); removeImageFromLayer(${layer.id}, ${index})">&times;</span>` : ''}
                            </button>
                        `).join('')}
                        <button class="add-item-btn" onclick="addImageToLayer(${layer.id})">+ Add Image</button>
                    </div>
                </div>
                <div class="image-upload-section">
                    <input type="file" id="imageUpload-${layer.id}" accept="image/*" 
                           onchange="handleImageUpload(${layer.id}, this.files[0])" style="display: none;">
                    <button onclick="document.getElementById('imageUpload-${layer.id}').click()">
                        ${selectedImage.imageName ? 'Change Image' : 'Upload Image'}
                    </button>
                    ${selectedImage.imageName ? `<span class="image-name">${selectedImage.imageName}</span>` : ''}
                </div>
                <div class="image-controls">
                    <div class="control-row">
                        <label>X:</label>
                        <input type="number" value="${selectedImage.imageX}" 
                               oninput="updateImageProperty(${layer.id}, 'imageX', this.value)">
                        <label>Y:</label>
                        <input type="number" value="${selectedImage.imageY}" 
                               oninput="updateImageProperty(${layer.id}, 'imageY', this.value)">
                    </div>
                    <div class="control-row">
                        <label>Width:</label>
                        <input type="number" value="${selectedImage.imageWidth}" min="1" 
                               oninput="updateImageProperty(${layer.id}, 'imageWidth', this.value)">
                        <label>Height:</label>
                        <input type="number" value="${selectedImage.imageHeight}" min="1" 
                               oninput="updateImageProperty(${layer.id}, 'imageHeight', this.value)">
                    </div>
                    <div class="control-row">
                        <label>Rotation (°):</label>
                        <input type="number" value="${selectedImage.imageRotation}" step="1" 
                               oninput="updateImageProperty(${layer.id}, 'imageRotation', this.value)">
                        <label>Fit:</label>
                        <select onchange="updateImageProperty(${layer.id}, 'imageFit', this.value)">
                            <option value="none" ${(selectedImage.imageFit || 'none') === 'none' ? 'selected' : ''}>Manual (X/Y/size)</option>
                            <option value="cover" ${selectedImage.imageFit === 'cover' ? 'selected' : ''}>Fill canvas</option>
                            <option value="contain" ${selectedImage.imageFit === 'contain' ? 'selected' : ''}>Fit inside canvas</option>
                        </select>
                    </div>
                </div>
            </div>
        `;
    },
    
    text: (layer) => {
        const selectedText = layer.texts[layer.selectedTextIndex] || layer.texts[0];
        return `
            <div class="text-editor-container">
                <div class="text-list-controls">
                    <div class="text-tabs">
                        <button class="text-tab add-item-btn" onclick="addTextToLayer(${layer.id})">+ Add Text</button>
                        ${layer.texts.map((txt, index) => `
                            <button class="text-tab ${index === layer.selectedTextIndex ? 'active' : ''}" 
                                    onclick="selectTextInLayer(${layer.id}, ${index})">
                                ${txt.text.substring(0, 10)}${txt.text.length > 10 ? '...' : ''}
                                ${layer.texts.length > 1 ? `<span class="remove-tab" onclick="event.stopPropagation(); removeTextFromLayer(${layer.id}, ${index})">&times;</span>` : ''}
                            </button>
                        `).join('')}
                    </div>
                </div>
                <div class="text-controls">
                    <div class="control-row">
                        <label>Text:</label>
                        <input type="text" value="${escapeAttr(selectedText.text)}" title="Use {frame} to show the current frame number"
                               oninput="updateTextProperty(${layer.id}, 'text', this.value)">
                        <input type="color" value="${selectedText.color || '#ffffff'}" title="Text colour"
                               oninput="updateTextProperty(${layer.id}, 'color', this.value)">
                    </div>
                    <div class="control-row">
                        <label>Font Size:</label>
                        <input type="number" value="${selectedText.fontSize}" min="4" max="300"
                               oninput="updateTextProperty(${layer.id}, 'fontSize', this.value)">
                        <label>Font:</label>
                        <select onchange="updateTextProperty(${layer.id}, 'fontFamily', this.value)">
                            ${TEXT_FONTS.map(f => `<option value="${f}" ${selectedText.fontFamily === f ? 'selected' : ''}>${f}</option>`).join('')}
                        </select>
                        <label><input type="checkbox" ${selectedText.bold ? 'checked' : ''}
                               onchange="updateTextProperty(${layer.id}, 'bold', this.checked)"> Bold</label>
                    </div>
                    <div class="control-row">
                        <label>X (%):</label>
                        <input type="number" value="${selectedText.textX}"
                               oninput="updateTextProperty(${layer.id}, 'textX', this.value)">
                        <label>Y (%):</label>
                        <input type="number" value="${selectedText.textY}"
                               oninput="updateTextProperty(${layer.id}, 'textY', this.value)">
                    </div>
                    <div class="control-row">
                        <label>Rotation (°):</label>
                        <input type="number" value="${selectedText.textRotation}" step="1"
                               oninput="updateTextProperty(${layer.id}, 'textRotation', this.value)">
                        <label>Align:</label>
                        <select onchange="updateTextProperty(${layer.id}, 'textAlign', this.value)">
                            <option value="LEFT" ${selectedText.textAlign === 'LEFT' ? 'selected' : ''}>Left</option>
                            <option value="CENTER" ${selectedText.textAlign === 'CENTER' ? 'selected' : ''}>Center</option>
                            <option value="RIGHT" ${selectedText.textAlign === 'RIGHT' ? 'selected' : ''}>Right</option>
                        </select>
                    </div>
                    <div class="control-row">
                        <label>Animation:</label>
                        <select onchange="updateTextProperty(${layer.id}, 'animation', this.value)">
                            ${TEXT_ANIMATIONS.map(([v, l]) => `<option value="${v}" ${(selectedText.animation || 'none') === v ? 'selected' : ''}>${l}</option>`).join('')}
                        </select>
                        <label title="Pixels for float/sway, % for pulse">Amount:</label>
                        <input type="number" value="${selectedText.animAmount ?? 20}" min="0"
                               oninput="updateTextProperty(${layer.id}, 'animAmount', this.value)">
                        <label title="Repeats per loop (whole number keeps the loop seamless)">Times/loop:</label>
                        <input type="number" value="${selectedText.animCycles ?? 1}" min="1" step="1"
                               oninput="updateTextProperty(${layer.id}, 'animCycles', this.value)">
                    </div>
                    <div class="control-row">
                        <label title="Frame the text appears on">Show from frame:</label>
                        <input type="number" value="${selectedText.startFrame ?? 0}" min="0"
                               oninput="updateTextProperty(${layer.id}, 'startFrame', this.value)">
                        <label title="Frame the text disappears on (-1 = until the end of the loop)">to:</label>
                        <input type="number" value="${selectedText.endFrame ?? -1}" min="-1"
                               oninput="updateTextProperty(${layer.id}, 'endFrame', this.value)">
                        <label title="Frames spent fading in and out (0 = appear instantly)">Fade:</label>
                        <input type="number" value="${selectedText.fadeFrames ?? 0}" min="0"
                               oninput="updateTextProperty(${layer.id}, 'fadeFrames', this.value)">
                    </div>
                </div>
            </div>
        `;
    }
};

function generateLayerContent(layer) {
    if (layer.type === 'code') {
        return LayerTemplates.code(layer);
    } else if (layer.type === 'image') {
        // Initialize with one image if empty
        if (!layer.images || layer.images.length === 0) {
            layer.images = [{
                imageData: null, imageName: '', imageX: 0, imageY: 0,
                imageWidth: 100, imageHeight: 100, imageRotation: 0
            }];
            layer.selectedImageIndex = 0;
        }
        return LayerTemplates.image(layer); // Use LayerTemplates.image instead of generateImageLayerContent
    } else if (layer.type === 'text') {
        // Initialize with one text if empty
        if (!layer.texts || layer.texts.length === 0) {
            layer.texts = [defaultTextItem()];
            layer.selectedTextIndex = 0;
        }
        return LayerTemplates.text(layer); // Use LayerTemplates.text instead of generateTextLayerContent
    }
    
    return '';
}

function generateColorControls(layer) {
    return `
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
    `;
}

function generateLayerControls(layer) {
    const layerIndex = layers.indexOf(layer);
    return `
        <div class="layer-controls">
            <label class="visibility-checkbox">
                <input type="checkbox" ${layer.visible ? 'checked' : ''} onchange="toggleLayerVisibility(${layer.id}, this.checked)">
                <span class="checkbox-visual"></span>
            </label>
            <button class="layer-btn" onclick="moveLayerUp(${layer.id})" ${layerIndex === 0 ? 'disabled' : ''}>↑</button>
            <button class="layer-btn" onclick="moveLayerDown(${layer.id})" ${layerIndex === layers.length - 1 ? 'disabled' : ''}>↓</button>
            <button class="layer-btn" onclick="deleteLayer(${layer.id})">×</button>
        </div>
    `;
}

function generateAnimationControls(layer) {
    let controls = '';
    
    // Frames and FPS for animated layers (code and text)
    if (layer.type === 'code' || layer.type === 'text') {
        controls += `
            <div class="animation-control">
                <label>Frames:</label>
                <input type="number" class="animation-input" min="1" max="9999" value="${layer.maxFrames}" 
                       oninput="updateLayerAnimation(${layer.id}, 'maxFrames', this.value)">
            </div>
            <div class="animation-control">
                <label>FPS:</label>
                <input type="number" class="animation-input" min="1" max="240" value="${layer.fps}" 
                       oninput="updateLayerAnimation(${layer.id}, 'fps', this.value)">
            </div>`;
    }
    
    // Always show Speed for all layer types
    controls += `
        <div class="animation-control">
            <label>Speed:</label>
            <input type="number" class="animation-input" min="0.1" max="10" step="0.1" value="${layer.speed}" 
                   oninput="updateLayerAnimation(${layer.id}, 'speed', this.value)">
        </div>`;
    
    return `<div class="layer-animation-controls">${controls}</div>`;
}


// Short description shown in the layer header, handy when the layer is collapsed
function layerLabel(layer) {
    if (layer.type === 'text') return (layer.texts || []).map(t => t.text).join(' / ');
    if (layer.type === 'image') return (layer.images || []).map(i => i.imageName).filter(Boolean).join(', ');
    return '';
}
