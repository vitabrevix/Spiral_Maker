// =====================================================================
// Code colouring for the layer editors (VS Code "Dark+" style).
//
// The <textarea> keeps doing the editing; its text is transparent and a
// <pre> with coloured tokens sits exactly underneath it, scrolled in sync.
// =====================================================================

const SyntaxHighlighter = (() => {
    const DECLARE = new Set(['let', 'const', 'var', 'function', 'class', 'new', 'typeof', 'instanceof',
        'in', 'of', 'delete', 'void', 'async', 'static', 'get', 'set', 'extends']);
    const CONTROL = new Set(['if', 'else', 'for', 'while', 'do', 'return', 'break', 'continue', 'switch',
        'case', 'default', 'try', 'catch', 'finally', 'throw', 'await', 'yield']);
    const LITERAL = new Set(['true', 'false', 'null', 'undefined', 'NaN', 'Infinity', 'this']);
    // Values the engine provides to every layer
    const ENGINE = new Set(['width', 'height', 'frameCount', 'progress', 'maxFrames', 'mouseX', 'mouseY',
        'pixels', 'deltaTime', 'hue', 'saturation', 'brightness', 'opacity', 'layer', 'p', 'drawingContext']);
    const GLOBALS = new Set(['Math', 'Array', 'Object', 'Number', 'String', 'JSON', 'console', 'document',
        'window', 'Float32Array', 'Uint8Array', 'Uint8ClampedArray', 'Date', 'Promise', 'Set', 'Map']);

    let p5Names = null;
    function isP5Function(name) {
        if (!p5Names) {
            p5Names = new Set();
            try {
                if (typeof getP5ApiNames === 'function') {
                    getP5ApiNames().forEach(n => { if (typeof p5.prototype[n] === 'function') p5Names.add(n); });
                }
            } catch (e) { /* p5 not loaded */ }
            ['background', 'createCanvas', 'loadPixels', 'millis', 'frameRate', 'noLoop', 'loop', 'redraw']
                .forEach(n => p5Names.add(n));
        }
        return p5Names.has(name);
    }

    const TOKEN_RE = /(\/\/[^\n]*)|(\/\*[\s\S]*?(?:\*\/|$))|("(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?|`(?:\\.|[^`\\])*`?)|(\b0x[0-9a-fA-F]+\b|(?:\b\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?\b)|([A-Za-z_$][\w$]*)|(\s+)|([\s\S])/g;

    function esc(s) {
        return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function span(cls, text) {
        return `<span class="tok-${cls}">${esc(text)}</span>`;
    }

    function highlight(code) {
        let out = '';
        let prevSignificant = '';
        let m;
        TOKEN_RE.lastIndex = 0;
        while ((m = TOKEN_RE.exec(code)) !== null) {
            const [text, lineComment, blockComment, str, num, ident, ws] = m;
            if (lineComment || blockComment) {
                out += span('comment', text);
                continue;
            }
            if (ws) {
                out += esc(text);
                continue;
            }
            if (str !== undefined) {
                out += span('string', text);
            } else if (num !== undefined) {
                out += span('number', text);
            } else if (ident !== undefined) {
                // Look ahead to see if this identifier is called: name(
                const rest = code.slice(TOKEN_RE.lastIndex);
                const isCall = /^\s*\(/.test(rest);
                const afterDot = prevSignificant === '.';
                let cls;
                if (afterDot) cls = isCall ? 'function' : 'property';
                else if (DECLARE.has(ident)) cls = 'keyword';
                else if (CONTROL.has(ident)) cls = 'control';
                else if (LITERAL.has(ident)) cls = 'literal';
                else if (isCall) cls = isP5Function(ident) ? 'builtin' : 'function';
                else if (/^[A-Z][A-Z0-9_]+$/.test(ident)) cls = 'constant';
                else if (ENGINE.has(ident)) cls = 'engine';
                else if (GLOBALS.has(ident)) cls = 'class';
                else cls = 'variable';
                out += span(cls, text);
            } else {
                out += span('punct', text);
            }
            prevSignificant = text;
        }
        // A trailing newline needs a character after it to keep the last line's height
        return out + '\n ';
    }

    function initialize(layerId) {
        const textarea = document.getElementById(`textarea-${layerId}`);
        const highlighter = document.getElementById(`highlighter-${layerId}`);
        if (!textarea || !highlighter || textarea.dataset.highlighted) return;
        textarea.dataset.highlighted = '1';

        const render = () => {
            highlighter.innerHTML = highlight(textarea.value);
            sync();
        };
        const sync = () => {
            highlighter.scrollTop = textarea.scrollTop;
            highlighter.scrollLeft = textarea.scrollLeft;
        };
        textarea.addEventListener('input', render);
        textarea.addEventListener('scroll', sync);
        render();
    }

    return { highlight, initialize };
})();

// Older code paths look for this name
const syntaxHighlighter = SyntaxHighlighter;
