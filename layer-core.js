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
        maxFrames: 120, fps: 60, speed: 1
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
        layer.texts = [{ text: 'Sample Text', fontSize: 24, fontFamily: 'Arial', textX: 50, textY: 50, textRotation: 0, textAlign: 'CENTER' }];
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
        newLayer.visible = layer.visible;
        
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
        
        if (isRunning) {
            restartAnimationIfRunning();
            setTimeout(runAnimation, 100);
        }
    }
}
