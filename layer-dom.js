class LayerDOM {
    static render(layer) {
        const container = document.getElementById('layersContainer');
        const layerDiv = this.createElement(layer);
        
        layerDiv.innerHTML = generateLayerHTML(layer);
        container.appendChild(layerDiv);
        
        LayerEventManager.attach(layerDiv, layer);
        
        if (layer.type === 'code') {
            setTimeout(() => SyntaxHighlighter.initialize(layer.id), 0);
        }
    }
    
    static refresh(layerId) {
        const layer = layers.find(l => l.id === layerId);
        if (!layer) return;
        
        const existing = document.querySelector(`[data-layer-id="${layerId}"]`);
        const container = document.getElementById('layersContainer');
        const position = layers.findIndex(l => l.id === layerId);
        
        if (existing) existing.remove();
        
        const layerDiv = this.createElement(layer);
        layerDiv.innerHTML = generateLayerHTML(layer);
        
        this.insertAtPosition(container, layerDiv, position);
        LayerEventManager.attach(layerDiv, layer);
        
        if (layer.type === 'code') {
            setTimeout(() => SyntaxHighlighter.initialize(layer.id), 0);
        }
    }
    
    static createElement(layer) {
        const layerDiv = document.createElement('div');
        layerDiv.className = 'layer-item';
        layerDiv.setAttribute('data-layer-id', layer.id);
        layerDiv.draggable = true;
        return layerDiv;
    }
    
    static insertAtPosition(container, element, position) {
        const children = Array.from(container.children);
        if (position < children.length) {
            container.insertBefore(element, children[position]);
        } else {
            container.appendChild(element);
        }
    }
    
    static updateColorDisplay(layerId, property, value) {
        const layerDiv = document.querySelector(`[data-layer-id="${layerId}"]`);
        const valueSpan = layerDiv.querySelector(`.color-control:has(.${this.getSliderClass(property)}) .color-value`);
        if (valueSpan) valueSpan.textContent = value;
    }
    
    static getSliderClass(property) {
        const map = { hue: 'hue', saturation: 'sat', brightness: 'bright', opacity: 'opacity' };
        return `${map[property]}-slider`;
    }
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