// =====================================================================
// Variables panel for code layers
//
// The settings at the very top of a layer's code, e.g.
//     // A short description
//     let tubeDepth = 0.45;   // bigger = longer tunnel {incr:0.05}
// are shown as rows: name | small input with up/down arrows | comment.
// The code editor below shows only the rest of the code.
//
// Comment tags (hidden in the panel):
//   {limlow:X}      the value can't go below X ({limhigh:Y}: can't go above Y)
//   {incr:X}        arrows / slider change the value by X (e.g. {incr:2}, {incr:0.1}).
//                   Without it the step follows the value: 1 for whole numbers,
//                   0.1 for one decimal, 0.01 for two, and so on.
//   {slide:MIN,MAX} show a slider from MIN to MAX instead of the arrows.
//   {color}         show a colour picker. The value can be [r, g, b] (0-255),
//                   or a '#rrggbb' string. Use {color:hsb} for [hue, sat, bright]
//                   arrays (360 / 100 / 100, the default colour mode of layers).
// =====================================================================

const VAR_DECL_RE = /^(\s*(?:let|const|var)\s+)([A-Za-z_$][\w$]*)(\s*=\s*)(.*?)(\s*;?\s*)$/;
const NUMBER_RE = /^-?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i;
const INCR_RE = /\{incr:\s*(-?[\d.]+)\s*\}/i;
const SLIDE_RE = /\{slide:\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\}/i;
const COLOR_RE = /\{colou?r(?::\s*(hsb|rgb))?\s*\}/i;
const LIMLOW_RE = /\{limlow:\s*(-?[\d.]+)\s*\}/i;
const LIMHIGH_RE = /\{limhigh:\s*(-?[\d.]+)\s*\}/i;
const ANY_TAG_RE = /\{(?:incr|slide|colou?r|limlow|limhigh)\b[^}]*\}/gi;

// {limlow:x} / {limhigh:y} keep a number inside a safe range
function varLimits(comment) {
    const lo = comment.match(LIMLOW_RE), hi = comment.match(LIMHIGH_RE);
    return { low: lo ? parseFloat(lo[1]) : -Infinity, high: hi ? parseFloat(hi[1]) : Infinity };
}

function clampToLimits(value, comment) {
    const { low, high } = varLimits(comment);
    return Math.min(high, Math.max(low, value));
}

// Splits "code part" and "// comment" at the first // that is not inside quotes
function splitLineComment(line) {
    let quote = null;
    for (let i = 0; i < line.length - 1; i++) {
        const c = line[i];
        if (quote) {
            if (c === '\\') { i++; continue; }
            if (c === quote) quote = null;
        } else if (c === '"' || c === "'" || c === '`') {
            quote = c;
        } else if (c === '/' && line[i + 1] === '/') {
            return { code: line.slice(0, i), comment: line.slice(i) };
        }
    }
    return { code: line, comment: '' };
}

function parseVarLine(line) {
    const { code, comment } = splitLineComment(line);
    const m = code.match(VAR_DECL_RE);
    if (!m || !m[4].trim()) return null;
    return {
        prefix: m[1] + m[2] + m[3],
        name: m[2],
        value: m[4].trim(),
        afterValue: m[5],
        comment,                                   // raw, including "//" and any {incr}
    };
}

// The header = leading lines that are blank, comments or simple "let x = value;"
function splitCodeHeader(code) {
    const lines = (code || '').split('\n');
    let i = 0;
    let lastVar = -1;
    while (i < lines.length) {
        const t = lines[i].trim();
        if (t === '' || t.startsWith('//')) { i++; continue; }
        const v = parseVarLine(lines[i]);
        // Empty containers ([] {} null) are internal storage filled by the code,
        // not settings: the settings section ends before them
        if (v && !/^(\[\s*\]|\{\s*\}|null|undefined)$/.test(v.value)) { lastVar = i; i++; continue; }
        break;
    }
    if (lastVar < 0) return { header: '', body: code || '', lines: [] };
    // The header ends after the last variable (plus the blank lines right after it);
    // comments further down belong to the code below (e.g. above a function)
    i = lastVar + 1;
    while (i < lines.length && lines[i].trim() === '') i++;
    const headerLines = lines.slice(0, i);
    const header = headerLines.join('\n') + (i < lines.length ? '\n' : '');
    return { header, body: lines.slice(i).join('\n'), lines: headerLines };
}

function decimalsOf(x) {
    const s = String(x);
    if (/e-/i.test(s)) return parseInt(s.split(/e-/i)[1], 10);
    const dot = s.indexOf('.');
    return dot < 0 ? 0 : s.length - dot - 1;
}

function varStep(v) {
    const m = v.comment.match(INCR_RE);
    if (m && parseFloat(m[1])) return Math.abs(parseFloat(m[1]));
    const d = decimalsOf(v.value);
    return d === 0 ? 1 : Math.pow(10, -d);
}

function displayComment(raw) {
    return raw.replace(/^\/\/\s?/, '').replace(ANY_TAG_RE, '').replace(/\s{2,}/g, ' ').trim();
}

// ---------------------------------------------------------------- colours
function clamp255(v) { return Math.max(0, Math.min(255, Math.round(v))); }

function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(v => clamp255(v).toString(16).padStart(2, '0')).join('');
}

function hexToRgb(hex) {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim()) || /^#?([0-9a-f]{3})$/i.exec(hex.trim());
    if (!m) return null;
    let h = m[1];
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16));
}

function hsbToRgb(h, s, v) {
    h = ((h % 360) + 360) % 360; s = Math.max(0, Math.min(100, s)) / 100; v = Math.max(0, Math.min(100, v)) / 100;
    const f = n => { const k = (n + h / 60) % 6; return v - v * s * Math.max(0, Math.min(k, 4 - k, 1)); };
    return [f(5) * 255, f(3) * 255, f(1) * 255];
}

function rgbToHsb(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
    let h = 0;
    if (d) {
        if (max === r) h = 60 * (((g - b) / d) % 6);
        else if (max === g) h = 60 * ((b - r) / d + 2);
        else h = 60 * ((r - g) / d + 4);
    }
    if (h < 0) h += 360;
    return [Math.round(h), Math.round(max ? d / max * 100 : 0), Math.round(max * 100)];
}

// Reads a colour setting; returns { hex, format } or null if it isn't a colour
function readColorValue(value, mode) {
    const str = /^(['"])(#[0-9a-f]{3}(?:[0-9a-f]{3})?)\1$/i.exec(value);
    if (str) return { hex: rgbToHex(...hexToRgb(str[2])), format: 'string', quote: str[1] };
    const arr = /^\[\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\]$/.exec(value);
    if (!arr) return null;
    const nums = arr.slice(1, 4).map(Number);
    if (mode === 'hsb') return { hex: rgbToHex(...hsbToRgb(...nums)), format: 'hsb' };
    return { hex: rgbToHex(...nums), format: 'rgb' };
}

// Writes a picked colour back in the same format the code already uses
function formatColorValue(hex, format, quote = "'") {
    const rgb = hexToRgb(hex);
    if (format === 'string') return quote + hex + quote;
    if (format === 'hsb') return '[' + rgbToHsb(...rgb).join(', ') + ']';
    return '[' + rgb.join(', ') + ']';
}

function setLayerColorVar(layerId, lineIndex, hex, format, quote) {
    setLayerVar(layerId, lineIndex, formatColorValue(hex, format, quote));
}

// Slider: show the value with as many decimals as the step needs
function setLayerSliderVar(layerId, lineIndex, value, step) {
    const d = Math.min(decimalsOf(step), 10);
    const text = String(parseFloat(Number(value).toFixed(d)));
    const out = document.getElementById(`var-${layerId}-${lineIndex}-val`);
    if (out) out.textContent = text;
    setLayerVar(layerId, lineIndex, text);
}

function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ---------------------------------------------------------------- rendering
function generateVarsPanel(layer, split, viewButton = '') {
    const rows = [];
    split.lines.forEach((line, index) => {
        const t = line.trim();
        if (!t) return;
        if (t.startsWith('//')) {
            rows.push(`<div class="var-note">${escapeHtml(t.replace(/^\/\/\s?/, ''))}</div>`);
            return;
        }
        const v = parseVarLine(line);
        if (!v) return;
        const id = `var-${layer.id}-${index}`;
        let input;
        const colorTag = v.comment.match(COLOR_RE);
        const slideTag = v.comment.match(SLIDE_RE);
        const color = colorTag ? readColorValue(v.value, (colorTag[1] || 'rgb').toLowerCase()) : null;
        if (color) {
            input = `
                <label class="var-color" title="${escapeAttr(v.value)}">
                    <input type="color" id="${id}" value="${color.hex}"
                           oninput="setLayerColorVar(${layer.id}, ${index}, this.value, '${color.format}', ${color.quote === '"' ? "'&quot;'" : "&quot;'&quot;"})">
                    <span>${color.hex}</span>
                </label>`;
        } else if (slideTag && NUMBER_RE.test(v.value)) {
            const lim = varLimits(v.comment);
            const min = Math.max(Math.min(parseFloat(slideTag[1]), parseFloat(slideTag[2])), lim.low);
            const max = Math.min(Math.max(parseFloat(slideTag[1]), parseFloat(slideTag[2])), lim.high);
            const incrTag = v.comment.match(INCR_RE);
            const step = incrTag ? Math.abs(parseFloat(incrTag[1])) : Math.min(varStep(v), Math.abs(max - min) / 100 || 1);
            input = `
                <div class="var-slider">
                    <input type="range" id="${id}" min="${Math.min(min, max)}" max="${Math.max(min, max)}" step="${step}" value="${escapeAttr(v.value)}"
                           oninput="setLayerSliderVar(${layer.id}, ${index}, this.value, ${step})">
                    <span class="var-slider-value" id="${id}-val">${escapeHtml(v.value)}</span>
                </div>`;
        } else if (NUMBER_RE.test(v.value)) {
            const step = varStep(v);
            input = `
                <div class="var-number">
                    <input type="text" inputmode="decimal" id="${id}" value="${escapeAttr(v.value)}"
                           onchange="setLayerVar(${layer.id}, ${index}, this.value)"
                           onkeydown="varInputKey(event, ${layer.id}, ${index}, ${step})">
                    <div class="var-arrows">
                        <button title="+${step}" onclick="stepLayerVar(${layer.id}, ${index}, ${step})">▲</button>
                        <button title="-${step}" onclick="stepLayerVar(${layer.id}, ${index}, ${-step})">▼</button>
                    </div>
                </div>`;
        } else if (v.value === 'true' || v.value === 'false') {
            input = `
                <label class="var-bool">
                    <input type="checkbox" id="${id}" ${v.value === 'true' ? 'checked' : ''}
                           onchange="setLayerVar(${layer.id}, ${index}, this.checked ? 'true' : 'false')">
                    <span>${v.value}</span>
                </label>`;
        } else {
            input = `<input type="text" class="var-text" id="${id}" value="${escapeAttr(v.value)}"
                            title="${escapeAttr(v.value)}"
                            onchange="setLayerVar(${layer.id}, ${index}, this.value)">`;
        }
        rows.push(`
            <div class="var-row">
                <span class="var-name">${v.name}</span>
                ${input}
                <span class="var-comment">${escapeHtml(displayComment(v.comment))}</span>
            </div>`);
    });
    return `
        <div class="code-vars">
            <div class="code-vars-header">
                <span class="prop-title">Variables</span>
                ${viewButton}
            </div>
            ${rows.join('')}
        </div>`;
}

// ---------------------------------------------------------------- editing
function setLayerVar(layerId, lineIndex, newValue) {
    const layer = layers.find(l => l.id === layerId);
    if (!layer) return;
    const split = splitCodeHeader(layer.code);
    const line = split.lines[lineIndex];
    const v = line !== undefined && parseVarLine(line);
    if (!v) return;
    newValue = String(newValue).trim();
    if (!newValue) return;
    // Numbers are kept inside their {limlow}/{limhigh} range
    if (NUMBER_RE.test(v.value)) {
        const num = parseFloat(newValue);
        if (isNaN(num) || !NUMBER_RE.test(newValue)) {
            const input = document.getElementById(`var-${layerId}-${lineIndex}`);
            if (input && input.type === 'text') input.value = v.value;   // not a number: undo
            return;
        }
        const clamped = clampToLimits(num, v.comment);
        if (clamped !== num) newValue = String(clamped);
    }
    split.lines[lineIndex] = v.prefix + newValue + v.afterValue + v.comment;
    const header = split.lines.join('\n') + (split.header.endsWith('\n') ? '\n' : '');
    layer.code = header + split.body;
    const input = document.getElementById(`var-${layerId}-${lineIndex}`);
    if (input && input.type === 'text' && input.value !== newValue) input.value = newValue;
    if (input && input.type === 'color') {
        const label = input.parentElement.querySelector('span');
        if (label) label.textContent = input.value;
    }
    if (input && input.type === 'checkbox') {
        const label = input.parentElement.querySelector('span');
        if (label) label.textContent = newValue;
    }
    scheduleLayerRestart(150);
}

function stepLayerVar(layerId, lineIndex, step) {
    const input = document.getElementById(`var-${layerId}-${lineIndex}`);
    const current = parseFloat(input ? input.value : NaN);
    if (isNaN(current)) return;
    const decimals = Math.max(decimalsOf(step), decimalsOf(input.value));
    const next = parseFloat((current + step).toFixed(Math.min(decimals, 10)));
    setLayerVar(layerId, lineIndex, String(next));
}

// Arrow keys in the input step the value too
function varInputKey(e, layerId, lineIndex, step) {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        stepLayerVar(layerId, lineIndex, e.key === 'ArrowUp' ? step : -step);
    } else if (e.key === 'Enter') {
        e.target.blur();
    }
}

// Typing in the code editor: the editor only holds the code after the header
function updateLayerBodyCode(layerId, body) {
    const layer = layers.find(l => l.id === layerId);
    if (!layer) return;
    const { header } = splitCodeHeader(layer.code);
    layer.code = header + body;
    scheduleLayerRestart(800);
}

// When new "let x = ..." lines were typed at the top of the editor, move them into the panel
function refreshVarsIfNeeded(layerId, body) {
    const layer = layers.find(l => l.id === layerId);
    if (!layer || codeViewMode(layer) !== 'mixed') return;
    if (splitCodeHeader(body).header) {
        LayerDOM.refresh(layerId);
        updateLayerSelection();
    }
}

// ---------------------------------------------------------------- view modes
const CODE_VIEW_MODES = ['mixed', 'controls', 'code'];
const CODE_VIEW_LABELS = {
    mixed: { icon: '▤', label: 'Controls + code' },
    controls: { icon: '☰', label: 'Controls only' },
    code: { icon: '</>', label: 'Code only' },
};

function codeViewMode(layer) {
    if (CODE_VIEW_MODES.includes(layer.viewMode)) return layer.viewMode;
    return layer.codeView ? 'code' : 'mixed';      // older layers
}

function codeViewButton(layer, mode) {
    const next = CODE_VIEW_MODES[(CODE_VIEW_MODES.indexOf(mode) + 1) % CODE_VIEW_MODES.length];
    const cur = CODE_VIEW_LABELS[mode];
    return `<button class="code-view-btn" onclick="cycleCodeView(${layer.id})"
                title="View: ${cur.label}. Click to switch to ${CODE_VIEW_LABELS[next].label.toLowerCase()}.">
                <span class="code-view-icon">${escapeHtml(cur.icon)}</span><span class="code-view-label">${cur.label}</span><span class="code-view-cycle">⇄</span>
            </button>`;
}

function cycleCodeView(layerId) {
    const layer = layers.find(l => l.id === layerId);
    if (!layer) return;
    const mode = codeViewMode(layer);
    layer.viewMode = CODE_VIEW_MODES[(CODE_VIEW_MODES.indexOf(mode) + 1) % CODE_VIEW_MODES.length];
    delete layer.codeView;
    LayerDOM.refresh(layerId);
    updateLayerSelection();
}
