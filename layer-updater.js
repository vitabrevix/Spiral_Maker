const LayerUpdaters = {
    color: (layerId, property, value) => {
        const layer = layers.find(l => l.id === layerId);
        if (!layer) return;
        
        layer[property] = parseInt(value);
        LayerDOM.updateColorDisplay(layerId, property, value);
        AnimationManager.scheduleRestart();
    },
    
    animation: (layerId, property, value) => {
        const layer = layers.find(l => l.id === layerId);
        if (!layer) return;
        
        layer[property] = this.validateAnimationValue(property, value);
        LayerDOM.updateAnimationDisplay(layerId, property, layer[property]);
        AnimationManager.scheduleRestart();
    },
    
    image: (layerId, property, value) => {
        const layer = layers.find(l => l.id === layerId);
        if (!layer || layer.type !== 'image') return;
        
        const selectedImage = layer.images[layer.selectedImageIndex];
        if (selectedImage) {
            selectedImage[property] = parseFloat(value);
            AnimationManager.scheduleRestart(300);
        }
    },
    
    text: (layerId, property, value) => {
        const layer = layers.find(l => l.id === layerId);
        if (!layer || layer.type !== 'text') return;
        
        const selectedText = layer.texts[layer.selectedTextIndex];
        if (selectedText) {
            selectedText[property] = this.parseTextValue(property, value);
            AnimationManager.scheduleRestart(300);
        }
    },
    
    validateAnimationValue(property, value) {
        switch(property) {
            case 'maxFrames': return Math.max(1, parseInt(value));
            case 'fps': return Math.max(1, Math.min(parseInt(value), animationFPS));
            case 'speed': return Math.max(0.1, parseFloat(value));
            default: return value;
        }
    },
    
    parseTextValue(property, value) {
        return ['fontSize', 'textX', 'textY', 'textRotation'].includes(property) 
            ? parseFloat(value) 
            : value;
    }
};

// Global functions that call the updaters
function updateLayerColor(layerId, property, value) {
    LayerUpdaters.color(layerId, property, value);
}