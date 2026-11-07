const TEXT_FONTS = ['Arial', 'Arial Black', 'Impact', 'Georgia', 'Times New Roman', 'Courier New', 'Verdana', 'Trebuchet MS'];
const TEXT_ANIMATIONS = [['none', 'None'], ['float', 'Float up/down'], ['sway', 'Sway left/right'],
    ['spin', 'Spin'], ['pulse', 'Pulse size'], ['blink', 'Blink']];

// Which settings each text animation uses (only those are shown)
const TEXT_ANIMATION_FIELDS = {
    none:  [],
    float: ['amount', 'cycles', 'offset'],
    sway:  ['amount', 'cycles', 'offset'],
    pulse: ['amount', 'cycles', 'offset'],
    spin:  ['cycles', 'offset'],
    blink: ['cycles', 'offset', 'on'],
};

function textAnimationFields(layer, t) {
    const anim = t.animation || 'none';
    const fields = TEXT_ANIMATION_FIELDS[anim] || [];
    const amountTitle = anim === 'pulse' ? 'How much the size grows/shrinks (%)' : 'How far it moves (pixels)';
    const html = {
        amount: `<label title="${amountTitle}">Amount:</label>
            <input type="number" value="${t.animAmount ?? 20}" min="0"
                   oninput="updateTextProperty(${layer.id}, 'animAmount', this.value)">`,
        cycles: `<label title="Repeats per loop (whole number keeps the loop seamless)">Times/loop:</label>
            <input type="number" value="${t.animCycles ?? 1}" min="1" step="1"
                   oninput="updateTextProperty(${layer.id}, 'animCycles', this.value)">`,
        offset: `<label title="Shifts this animation by a part of one cycle (%). E.g. two blinking texts with offsets 0 and 50 take turns.">Offset (%):</label>
            <input type="number" value="${t.animOffset ?? 0}" min="0" max="100" step="any"
                   oninput="updateTextProperty(${layer.id}, 'animOffset', this.value)">`,
        on: `<label title="How much of each blink cycle the text is visible (%). Three texts taking turns: On 33.33, offsets 0 / 33.33 / 66.67. Four: On 25, offsets 0 / 25 / 50 / 75.">On (%):</label>
            <input type="number" value="${t.blinkOn ?? 50}" min="1" max="100" step="any"
                   oninput="updateTextProperty(${layer.id}, 'blinkOn', this.value)">`,
    };
    return fields.map(f => html[f]).join('');
}

function escapeAttr(str) {
    return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

const LAYER_ICONS = {
    eye: '<svg viewBox="0 0 24 24"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
    eyeOff: '<svg viewBox="0 0 24 24"><path d="M3 3l18 18"/><path d="M10.6 5.1A10.8 10.8 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.6 6.6C3.8 8.4 2 12 2 12s3.6 7 10 7a9.7 9.7 0 0 0 5.4-1.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>',
    up: '<svg viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7"/></svg>',
    down: '<svg viewBox="0 0 24 24"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>',
    copy: '<svg viewBox="0 0 24 24"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/></svg>',
    trash: '<svg viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>',
    clipboard: '<svg viewBox="0 0 24 24"><rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4V3h6v1"/><path d="M9 10h6M9 14h6M9 18h3"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="M5 12l5 5 9-10"/></svg>',
    chevron: '<svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>',
    grip: '<svg viewBox="0 0 24 24"><circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/></svg>',
};

function generateLayerHTML(layer) {
    return `
        <div class="layer-header">${generateLayerHeader(layer)}</div>
        <div class="layer-content ${layer.collapsed ? 'collapsed' : 'expanded'}">
            <div class="layer-props">
                ${generateColorControls(layer)}
                ${generateAnimationControls(layer)}
            </div>
            ${generateLayerContent(layer)}
        </div>
    `;
}

// Display name: what the layer is (preset name / text / image), numbered by position
function layerTitle(layer) {
    const index = layers.indexOf(layer) + 1;
    const label = layer.name || layerLabel(layer) || ({ code: 'Code', image: 'Image', text: 'Text' })[layer.type];
    return { index, label };
}

function generateLayerHeader(layer) {
    const { index, label } = layerTitle(layer);
    return `
        <span class="drag-handle" title="Drag to reorder">${LAYER_ICONS.grip}</span>
        <button class="layer-toggle ${layer.collapsed ? 'is-collapsed' : ''}" title="${layer.collapsed ? 'Expand' : 'Collapse'}">${LAYER_ICONS.chevron}</button>
        <span class="layer-type-badge type-${layer.type}">${layer.type}</span>
        <span class="layer-index">${index}</span>
        <span class="layer-name" title="${escapeAttr(label)}">${escapeAttr(label)}</span>
        ${generateLayerControls(layer)}
    `;
}

const LayerTemplates = {
    code: (layer) => {
        // Three views, switched with one button:
        //   mixed    - settings as controls, the rest of the code in the editor
        //   controls - settings as controls only, no code
        //   code     - everything as code
        const split = splitCodeHeader(layer.code);
        const hasVars = !!split.header;
        const mode = hasVars ? codeViewMode(layer) : 'code';
        const showPanel = mode !== 'code';
        const showEditor = mode !== 'controls';
        const editorText = mode === 'mixed' ? split.body : layer.code;
        const onInput = mode === 'mixed' ? 'updateLayerBodyCode' : 'updateLayerCodeWithHighlight';
        const viewButton = hasVars ? codeViewButton(layer, mode) : '';
        return `
        ${showPanel ? generateVarsPanel(layer, split, viewButton) : ''}
        ${showEditor ? `
        <div class="code-editor-container">
            ${mode === 'code' ? `<div class="code-view-float">${viewButton}</div>` : ''}
            <textarea class="layer-textarea"
              id="textarea-${layer.id}"
              placeholder="// Layer code here..."
              spellcheck="false"
              autocomplete="off"
              autocorrect="off"
              autocapitalize="off"
              oninput="${onInput}(${layer.id}, this.value)"
              ${mode === 'mixed' ? `onblur="refreshVarsIfNeeded(${layer.id}, this.value)"` : ''}>${escapeHtml(editorText)}</textarea>
            <div class="syntax-highlighter" id="highlighter-${layer.id}"></div>
        </div>` : ''}
    `;
    },

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
                        <button class="image-tab add-item-btn" onclick="addImageToLayer(${layer.id})">+ Add Image</button>
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
                        ${textAnimationFields(layer, selectedText)}
                    </div>
                    <div class="control-row">
                        <label title="Frame of this layer's loop where this text appears">This text from frame:</label>
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
    const slider = (key, cls, label, title, min, max) => `
        <div class="color-control" title="${title}">
            <label>${label}</label>
            <input type="range" class="color-slider ${cls}-slider" min="${min}" max="${max}" value="${layer[key]}"
                   oninput="updateLayerColor(${layer.id}, '${key}', this.value)">
            <span class="color-value">${layer[key]}</span>
        </div>`;
    return `
        <div class="prop-group">
            <div class="prop-title">Adjust</div>
            <div class="layer-color-controls">
                ${slider('hue', 'hue', 'Hue', 'Hue shift (degrees)', 0, 360)}
                ${slider('saturation', 'sat', 'Sat', 'Saturation (%)', 1, 100)}
                ${slider('brightness', 'bright', 'Bright', 'Brightness (%)', 1, 100)}
                ${slider('opacity', 'opacity', 'Opacity', 'Opacity (%)', 1, 100)}
                <div class="color-control" title="Zoom in or out around the centre of the canvas (double-click to reset)">
                    <label>Zoom</label>
                    <input type="range" class="color-slider zoom-slider" min="0.25" max="4" step="0.05" value="${layerZoom(layer)}"
                           oninput="updateLayerZoom(${layer.id}, this.value)" ondblclick="updateLayerZoom(${layer.id}, 1, true)">
                    <span class="color-value zoom-value">${layerZoom(layer).toFixed(2)}×</span>
                </div>
            </div>
        </div>
    `;
}

function generateLayerControls(layer) {
    const layerIndex = layers.indexOf(layer);
    return `
        <div class="layer-controls">
            <button class="icon-btn ${layer.visible ? '' : 'is-off'}" title="${layer.visible ? 'Hide layer' : 'Show layer'}"
                    onclick="toggleLayerVisibility(${layer.id}, ${!layer.visible})">${layer.visible ? LAYER_ICONS.eye : LAYER_ICONS.eyeOff}</button>
            <button class="icon-btn" title="Move up (further back)" onclick="moveLayerUp(${layer.id})" ${layerIndex === 0 ? 'disabled' : ''}>${LAYER_ICONS.up}</button>
            <button class="icon-btn" title="Move down (further front)" onclick="moveLayerDown(${layer.id})" ${layerIndex === layers.length - 1 ? 'disabled' : ''}>${LAYER_ICONS.down}</button>
            <button class="icon-btn" data-role="copy" title="Copy layer to clipboard (JSON) - or select the layer and press Ctrl+C" onclick="copyLayerToClipboard(${layer.id})">${LAYER_ICONS.clipboard}</button>
            <button class="icon-btn" title="Duplicate layer" onclick="duplicateLayer(${layer.id})">${LAYER_ICONS.copy}</button>
            <button class="icon-btn danger" title="Delete layer" onclick="deleteLayer(${layer.id})">${LAYER_ICONS.trash}</button>
        </div>
    `;
}

function generateAnimationControls(layer) {
    if (layer.startFrame === undefined) layer.startFrame = 0;
    if (layer.endFrame === undefined) layer.endFrame = -1;
    if (layer.fadeFrames === undefined) layer.fadeFrames = 0;
    const field = (prop, label, title, attrs) => `
        <label class="animation-control" title="${title}">
            <span>${label}</span>
            <input type="number" class="animation-input" ${attrs} value="${layer[prop]}"
                   oninput="updateLayerAnimation(${layer.id}, '${prop}', this.value)">
        </label>`;
    let controls = '';
    if (layer.type === 'code' || layer.type === 'text') {
        controls += field('maxFrames', 'Frames', 'Length of this layer\'s loop, in frames', 'min="1" max="9999"');
        controls += field('fps', 'FPS', 'Frames per second for this layer', 'min="1" max="240"');
    }
    controls += field('speed', 'Speed', 'Playback speed multiplier', 'min="0.1" max="10" step="0.1"');
    const showControls =
        field('startFrame', 'Show from', 'Frame of the main timeline where this layer appears', 'min="0"') +
        field('endFrame', 'to', 'Frame where this layer disappears (-1 = until the end of the loop)', 'min="-1"') +
        field('fadeFrames', 'Fade', 'Frames spent fading in and out (0 = appear instantly)', 'min="0"');
    return `
        <div class="prop-group">
            <div class="prop-title">Timing</div>
            <div class="layer-animation-controls">${controls}</div>
        </div>
        <div class="prop-group">
            <div class="prop-title">Visible</div>
            <div class="layer-animation-controls">${showControls}</div>
        </div>
    `;
}

// Short description shown in the layer header, handy when the layer is collapsed
function layerLabel(layer) {
    if (layer.type === 'text') return (layer.texts || []).map(t => t.text).join(' / ');
    if (layer.type === 'image') return (layer.images || []).map(i => i.imageName).filter(Boolean).join(', ');
    return '';
}
