class LayerEventManager {
    static attach(layerDiv, layer) {
        this.attachHeaderEvents(layerDiv, layer);
        this.attachDragEvents(layerDiv);
        
        if (layer.type === 'code') {
            this.attachCodeEvents(layerDiv, layer);
        }
    }
    
    static attachHeaderEvents(layerDiv, layer) {
        const header = layerDiv.querySelector('.layer-header');
        const toggle = layerDiv.querySelector('.layer-toggle');
        
        header.addEventListener('click', (e) => {
            if (e.target === toggle || e.target.closest('.layer-controls')) return;
            selectLayer(layer.id);
        });
        
        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleLayerCollapse(layer.id);
        });
    }
    
    static attachCodeEvents(layerDiv, layer) {
        const textarea = layerDiv.querySelector('.layer-textarea');
        
        textarea.addEventListener('focus', () => selectLayer(layer.id));
        textarea.addEventListener('keydown', this.handleTabKey);
    }
    
    static handleTabKey(e) {
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = this.selectionStart;
            const end = this.selectionEnd;
            this.value = this.value.substring(0, start) + '  ' + this.value.substring(end);
            this.selectionStart = this.selectionEnd = start + 2;
        }
    }
	
	static attachLayerEventListeners(layerDiv, layer) {
		const header = layerDiv.querySelector('.layer-header');
		const toggle = layerDiv.querySelector('.layer-toggle');

		header.addEventListener('click', (e) => {
			if (e.target === toggle || e.target.closest('.layer-controls')) return;
			selectLayer(layer.id);
		});
		
		toggle.addEventListener('click', (e) => {
			e.stopPropagation();
			toggleLayerCollapse(layer.id);
		});
		
		if (layer.type === 'code') {
			attachCodeLayerListeners(layerDiv, layer);
		}
		
		this.attachDragEvents(layerDiv);
	}

	static attachCodeLayerListeners(layerDiv, layer) {
		const textarea = layerDiv.querySelector('.layer-textarea');
		
		textarea.addEventListener('focus', () => {
			selectLayer(layer.id);
			const highlighter = document.getElementById(`highlighter-${layer.id}`);
			if (highlighter) highlighter.style.color = 'transparent';
		});
		
		textarea.addEventListener('blur', () => {
			const highlighter = document.getElementById(`highlighter-${layer.id}`);
			if (highlighter) {
				highlighter.style.color = '';
				if (typeof syntaxHighlighter !== 'undefined') {
					highlighter.innerHTML = syntaxHighlighter.highlight(textarea.value);
				}
			}
		});
		
		textarea.addEventListener('keydown', function(e) {
			if (e.key === 'Tab') {
				e.preventDefault();
				const start = this.selectionStart;
				const end = this.selectionEnd;
				this.value = this.value.substring(0, start) + '  ' + this.value.substring(end);
				this.selectionStart = this.selectionEnd = start + 2;
			}
		});
	}
	
	static attachDragEvents(layerDiv) {
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
        
        layerDiv.addEventListener('mousedown', (e) => {
            if (!e.target.closest('.drag-handle')) {
                layerDiv.draggable = false;
            }
        });
    }
}

window.LayerEventManager = LayerEventManager;