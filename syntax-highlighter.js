const SyntaxHighlighter = {
    initialize: function(layerId) {
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
};