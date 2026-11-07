let layers = [];
let layerCounter = 0;
let selectedLayerId = null;

function createLayer(code = '', type = 'code') {
    const layerId = ++layerCounter;
    const layer = {
        id: layerId,
        type: type,
        code: code,
        collapsed: false,
        visible: true,
        // Default properties
        hue: 360, saturation: 100, brightness: 100, opacity: 100,
        maxFrames: 120, fps: 60, speed: 1,
        startFrame: 0, endFrame: -1, fadeFrames: 0,  // on the main timeline; -1 = until the end
        zoom: 1
    };
    
    initializeLayerTypeData(layer);
    layers.push(layer);
    return layer;
}

function initializeLayerTypeData(layer) {
    if (layer.type === 'image') {
        layer.images = [{ imageData: null, imageName: '', imageX: 0, imageY: 0, imageWidth: 100, imageHeight: 100, imageRotation: 0 }];
        layer.selectedImageIndex = 0;
    } else if (layer.type === 'text') {
        layer.texts = [defaultTextItem()];
        layer.selectedTextIndex = 0;
    }
}

// Basic layer operations
function selectLayer(layerId) {
    selectedLayerId = layerId;
    updateLayerSelection();
}

function getSelectedLayer() {
    return layers.find(l => l.id === selectedLayerId);
}

function moveLayerUp(layerId) {
    const index = layers.findIndex(l => l.id === layerId);
    if (index > 0) {
        [layers[index], layers[index - 1]] = [layers[index - 1], layers[index]];
        refreshLayersDOM();
        restartAnimationIfRunning();
    }
}

function moveLayerDown(layerId) {
    const index = layers.findIndex(l => l.id === layerId);
    if (index < layers.length - 1) {
        [layers[index], layers[index + 1]] = [layers[index + 1], layers[index]];
        refreshLayersDOM();
        restartAnimationIfRunning();
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
        restartAnimationIfRunning();
    }
}

function duplicateLayer(layerId) {
    const layer = layers.find(l => l.id === layerId);
    if (layer) {
        const newLayer = createLayer(layer.code, layer.type);
        // Copy all layer properties
        newLayer.hue = layer.hue;
        newLayer.saturation = layer.saturation;
        newLayer.brightness = layer.brightness;
        newLayer.opacity = layer.opacity;
        newLayer.maxFrames = layer.maxFrames;
        newLayer.fps = layer.fps;
        newLayer.speed = layer.speed;
        newLayer.startFrame = layer.startFrame;
        newLayer.endFrame = layer.endFrame;
        newLayer.fadeFrames = layer.fadeFrames;
        newLayer.zoom = layer.zoom;
        newLayer.syncLoop = layer.syncLoop;
        newLayer.visible = layer.visible;
        newLayer.name = layer.name ? layer.name + ' copy' : layer.name;
        
        // Copy type-specific properties
        if (layer.type === 'image') {
            newLayer.images = layer.images.map(img => ({ ...img })); // Deep copy
            newLayer.selectedImageIndex = layer.selectedImageIndex;
        } else if (layer.type === 'text') {
            newLayer.texts = layer.texts.map(txt => ({ ...txt })); // Deep copy
            newLayer.selectedTextIndex = layer.selectedTextIndex;
        }
        
        // Refresh DOM to show copied values
        refreshLayersDOM();
        
        restartAnimationIfRunning();
    }
}


function defaultTextItem(overrides = {}) {
    return Object.assign({
        text: 'Sample Text', fontSize: 24, fontFamily: 'Arial', bold: false, color: '#ffffff',
        textX: 50, textY: 50, textRotation: 0, textAlign: 'CENTER',
        animation: 'none', animAmount: 20, animCycles: 1, animOffset: 0, blinkOn: 50,
        startFrame: 0, endFrame: -1, fadeFrames: 0
    }, overrides);
}

// ---------------------------------------------------------------------
// Copy a layer to the clipboard as JSON
// ---------------------------------------------------------------------
const LAYER_UI_ONLY_KEYS = ['id', 'collapsed', 'codeView', 'viewMode', 'selectedImageIndex', 'selectedTextIndex'];

function layerToJSON(layer) {
    const data = {};
    Object.keys(layer).forEach(key => {
        if (LAYER_UI_ONLY_KEYS.includes(key) || key.startsWith('_')) return;
        if (layer[key] === undefined) return;
        data[key] = layer[key];
    });
    return JSON.stringify({ spiralMakerLayer: 1, layer: data }, null, 2);
}

async function writeClipboardText(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (e) {
        // Fallback for browsers / contexts without the async clipboard API
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        let ok = false;
        try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
        ta.remove();
        return ok;
    }
}

async function copyLayerToClipboard(layerId) {
    const layer = layers.find(l => l.id === layerId);
    if (!layer) return;
    const ok = await writeClipboardText(layerToJSON(layer));
    showCopyFeedback(layer, ok);
}

// Tick on the layer's copy button + a small toast
function showCopyFeedback(layer, ok) {
    const button = document.querySelector(`[data-layer-id="${layer.id}"] .layer-controls [data-role="copy"]`);
    if (button) {
        clearTimeout(button._flashTimer);
        button.classList.remove('is-done', 'is-error');
        button.innerHTML = ok ? LAYER_ICONS.check : '!';
        button.title = ok ? 'Copied to clipboard' : 'Could not copy';
        button.classList.add(ok ? 'is-done' : 'is-error');
        button._flashTimer = setTimeout(() => {
            button.innerHTML = LAYER_ICONS.clipboard;
            button.title = 'Copy layer to clipboard (JSON)';
            button.classList.remove('is-done', 'is-error');
        }, 1400);
    }
    const label = layer.name || layerLabel(layer) || layer.type;
    showToast(ok ? `Copied layer “${label}” to the clipboard` : 'Could not copy the layer', ok ? 'ok' : 'error');
}

function showToast(message, kind = 'ok') {
    let toast = document.getElementById('appToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'appToast';
        toast.className = 'app-toast';
        toast.setAttribute('role', 'status');
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.className = `app-toast is-${kind} is-visible`;
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('is-visible'), 1800);
}

// Ctrl+C / Cmd+C with a layer selected and no text selected copies that layer
document.addEventListener('copy', (e) => {
    const t = e.target;
    if (t && t.closest && t.closest('input, textarea, select, [contenteditable="true"]')) return;
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed && sel.toString().trim() !== '') return;   // normal text copy
    const layer = getSelectedLayer();
    if (!layer || !e.clipboardData) return;
    e.preventDefault();
    e.clipboardData.setData('text/plain', layerToJSON(layer));
    showCopyFeedback(layer, true);
});

// ---------------------------------------------------------------------
// Paste a layer from clipboard JSON (button, or Ctrl+V outside text boxes)
// ---------------------------------------------------------------------
const LAYER_TYPES = ['code', 'image', 'text'];

// Accepts {spiralMakerLayer, layer}, a bare layer object, or {layers: [...]}
function parseLayerJSON(text) {
    let data;
    try { data = JSON.parse(text); } catch (e) { return null; }
    if (!data || typeof data !== 'object') return null;
    let list = Array.isArray(data) ? data : data.layers || [data.layer || data];
    list = list.filter(l => l && typeof l === 'object' && LAYER_TYPES.includes(l.type));
    return list.length ? list : null;
}

function addLayersFromData(list) {
    const selected = getSelectedLayer();
    let insertAt = selected ? layers.indexOf(selected) + 1 : layers.length;
    let last = null;
    list.forEach(data => {
        const layer = createLayer('', data.type);
        layers.splice(layers.indexOf(layer), 1);
        const clean = Object.assign({}, data);
        LAYER_UI_ONLY_KEYS.forEach(k => delete clean[k]);
        Object.assign(layer, clean);
        layer.collapsed = false;
        if (layer.type === 'code' && typeof layer.code !== 'string') layer.code = '';
        if (layer.type === 'image' && !(Array.isArray(layer.images) && layer.images.length)) initializeLayerTypeData(layer);
        if (layer.type === 'text') {
            if (!(Array.isArray(layer.texts) && layer.texts.length)) initializeLayerTypeData(layer);
            layer.texts = layer.texts.map(t => defaultTextItem(t));
        }
        layer.selectedImageIndex = 0;
        layer.selectedTextIndex = 0;
        layers.splice(insertAt++, 0, layer);
        last = layer;
    });
    refreshLayersDOM();
    selectLayer(last.id);
    runAnimation(true);
    return last;
}

function flashButton(button, ok, okTitle, failTitle) {
    if (!button) return;
    clearTimeout(button._flashTimer);
    button.classList.remove('is-done', 'is-error');
    button.textContent = ok ? '✓ Pasted' : 'Nothing to paste';
    button.title = ok ? okTitle : failTitle;
    button.classList.add(ok ? 'is-done' : 'is-error');
    button._flashTimer = setTimeout(() => {
        button.textContent = 'Paste';
        button.title = 'Paste a copied layer (JSON) from the clipboard';
        button.classList.remove('is-done', 'is-error');
    }, 1500);
}

async function pasteLayerFromClipboard(button) {
    let text = null;
    try {
        text = await navigator.clipboard.readText();
    } catch (e) {
        // Clipboard reading blocked: let the user paste the JSON by hand
        text = prompt('Paste the copied layer JSON here:');
        if (text === null) return;
    }
    const list = text && parseLayerJSON(text);
    if (!list) {
        flashButton(button, false, '', 'The clipboard does not contain a copied layer');
        return;
    }
    addLayersFromData(list);
    flashButton(button, true, list.length > 1 ? `Pasted ${list.length} layers` : 'Layer pasted', '');
}

// Ctrl+V / Cmd+V anywhere outside a text field pastes a copied layer
document.addEventListener('paste', (e) => {
    const t = e.target;
    if (t && (t.closest('input, textarea, select, [contenteditable="true"]'))) return;
    const text = e.clipboardData && e.clipboardData.getData('text');
    const list = text && parseLayerJSON(text);
    if (!list) return;
    e.preventDefault();
    const last = addLayersFromData(list);
    flashButton(document.getElementById('pasteLayerBtn'), true, 'Layer pasted', '');
    showToast(list.length > 1 ? `Pasted ${list.length} layers` : `Pasted layer “${last.name || layerLabel(last) || last.type}”`);
});
