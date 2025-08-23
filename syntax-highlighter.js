class SyntaxHighlighter {
    constructor() {
        this.keywords = [
            'function', 'let', 'const', 'var', 'if', 'else', 'for', 'while', 
            'do', 'switch', 'case', 'break', 'continue', 'return', 'try', 
            'catch', 'finally', 'throw', 'class', 'extends', 'import', 
            'export', 'default', 'new', 'this', 'super', 'static', 'async', 
            'await', 'true', 'false', 'null', 'undefined'
        ];
        
        this.p5Functions = [
            'setup', 'draw', 'createCanvas', 'background', 'fill', 'stroke', 
            'noFill', 'noStroke', 'strokeWeight', 'rect', 'ellipse', 'circle', 
            'line', 'point', 'triangle', 'quad', 'arc', 'bezier', 'curve',
            'translate', 'rotate', 'scale', 'push', 'pop', 'sin', 'cos', 'tan',
            'map', 'lerp', 'noise', 'random', 'frameCount', 'width', 'height',
            'PI', 'TWO_PI', 'HALF_PI', 'radians', 'degrees', 'dist', 'mag',
            'normalize', 'constrain', 'mouseX', 'mouseY', 'pmouseX', 'pmouseY'
        ];
    }

    highlight(code) {
		if (!code) return '';
		
		// Escape HTML first
		code = code.replace(/[&<>"']/g, function(match) {
			const escapeMap = {
				'&': '&amp;',
				'<': '&lt;',
				'>': '&gt;',
				'"': '&quot;',
				"'": '&#39;'
			};
			return escapeMap[match];
		});

		// Highlight comments first (single line and multi-line)
		code = code.replace(/(\/\/.*$)/gm, '<span class="syntax-comment">$1</span>');
		code = code.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="syntax-comment">$1</span>');
		
		// Highlight strings (single and double quotes, template literals)
		code = code.replace(/(['"`])(?:(?!\1)[^\\]|\\.)*/g, '<span class="syntax-string">$&</span>');
		
		// Highlight numbers
		code = code.replace(/\b\d+\.?\d*\b/g, '<span class="syntax-number">$&</span>');
		
		// Highlight P5.js functions first (more specific)
		const p5Pattern = new RegExp('\\b(' + this.p5Functions.join('|') + ')\\b', 'g');
		code = code.replace(p5Pattern, '<span class="p5-function">$1</span>');
		
		// Highlight keywords
		const keywordPattern = new RegExp('\\b(' + this.keywords.join('|') + ')\\b', 'g');
		code = code.replace(keywordPattern, '<span class="syntax-keyword">$1</span>');
		
		// Highlight function calls - simplified regex without lookbehind
		code = code.replace(/\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?=\()/g, '<span class="syntax-function">$1</span>');
		
		// Highlight properties (dot notation) - simplified regex
		code = code.replace(/\.([a-zA-Z_$][a-zA-Z0-9_$]*)/g, '.<span class="syntax-property">$1</span>');
		
		return code;
	}
}

// Global syntax highlighter instance
const syntaxHighlighter = new SyntaxHighlighter();