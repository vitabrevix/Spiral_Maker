// =====================================================================
// Floating preview ("PiP")
//
// The canvas can be lifted out of the page into a small floating window
// that you drag around by its title bar and resize from its corner.
// Docking puts it back below the layers. Position, size and floating
// state are remembered in this browser.
// =====================================================================

const FLOAT_STORE_KEY = 'floatingPreview';
let floatState = { floating: false, x: null, y: null, width: 320 };
try { Object.assign(floatState, JSON.parse(localStorage.getItem(FLOAT_STORE_KEY) || '{}')); } catch (e) { /* ignore */ }

let floatPanel = null;

function saveFloatState() {
    try { localStorage.setItem(FLOAT_STORE_KEY, JSON.stringify(floatState)); } catch (e) { /* ignore */ }
}

function buildFloatPanel() {
    if (floatPanel) return floatPanel;
    floatPanel = document.createElement('div');
    floatPanel.className = 'float-preview';
    floatPanel.innerHTML = `
        <div class="float-preview-bar" title="Drag to move">
            <span class="float-preview-title">Preview</span>
            <span class="float-preview-size"></span>
            <button class="float-preview-btn" title="Put the preview back in the page" onclick="dockPreview()">⤓</button>
        </div>
        <div class="float-preview-body"><div class="float-preview-scale"></div></div>
        <div class="float-preview-resize" title="Drag to resize"></div>`;
    document.body.appendChild(floatPanel);

    // Move by dragging the title bar
    const bar = floatPanel.querySelector('.float-preview-bar');
    bar.addEventListener('pointerdown', (e) => {
        if (e.target.closest('button')) return;
        e.preventDefault();
        const rect = floatPanel.getBoundingClientRect();
        const dx = e.clientX - rect.left, dy = e.clientY - rect.top;
        bar.setPointerCapture(e.pointerId);
        floatPanel.classList.add('is-dragging');
        const move = (ev) => {
            floatState.x = ev.clientX - dx;
            floatState.y = ev.clientY - dy;
            positionFloatPanel();
        };
        const up = () => {
            bar.removeEventListener('pointermove', move);
            bar.removeEventListener('pointerup', up);
            floatPanel.classList.remove('is-dragging');
            saveFloatState();
        };
        bar.addEventListener('pointermove', move);
        bar.addEventListener('pointerup', up);
    });

    // Resize from the bottom-right corner (keeps the canvas proportions)
    const grip = floatPanel.querySelector('.float-preview-resize');
    grip.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        const startX = e.clientX, startW = floatState.width;
        grip.setPointerCapture(e.pointerId);
        const move = (ev) => {
            floatState.width = Math.max(140, Math.min(window.innerWidth - 20, startW + ev.clientX - startX));
            layoutFloatPanel();
        };
        const up = () => {
            grip.removeEventListener('pointermove', move);
            grip.removeEventListener('pointerup', up);
            saveFloatState();
        };
        grip.addEventListener('pointermove', move);
        grip.addEventListener('pointerup', up);
    });

    window.addEventListener('resize', () => { if (floatState.floating) positionFloatPanel(); });
    return floatPanel;
}

// Scales the canvas to the panel width
function layoutFloatPanel() {
    if (!floatPanel || !floatState.floating) return;
    const scale = floatState.width / canvasWidth;
    const holder = floatPanel.querySelector('.float-preview-scale');
    const body = floatPanel.querySelector('.float-preview-body');
    floatPanel.style.width = floatState.width + 'px';
    holder.style.transform = `scale(${scale})`;
    body.style.height = Math.round(canvasHeight * scale) + 'px';
    floatPanel.querySelector('.float-preview-size').textContent = `${canvasWidth}×${canvasHeight} · ${Math.round(scale * 100)}%`;
    positionFloatPanel();
}

// Keeps the panel inside the window
function positionFloatPanel() {
    if (!floatPanel) return;
    const w = floatPanel.offsetWidth, h = floatPanel.offsetHeight;
    if (floatState.x === null || floatState.y === null) {
        floatState.x = window.innerWidth - w - 380;
        floatState.y = window.innerHeight - h - 24;
    }
    floatState.x = Math.max(4, Math.min(window.innerWidth - w - 4, floatState.x));
    floatState.y = Math.max(4, Math.min(window.innerHeight - h - 4, floatState.y));
    floatPanel.style.left = floatState.x + 'px';
    floatPanel.style.top = floatState.y + 'px';
}

function floatPreview() {
    buildFloatPanel();
    const canvas = document.getElementById('canvasContainer');
    floatPanel.querySelector('.float-preview-scale').appendChild(canvas);
    document.getElementById('canvasDock').classList.add('is-empty');
    floatPanel.style.display = 'block';
    floatState.floating = true;
    layoutFloatPanel();
    saveFloatState();
    updatePipButton();
}

function dockPreview() {
    const canvas = document.getElementById('canvasContainer');
    document.getElementById('canvasDock').appendChild(canvas);
    document.getElementById('canvasDock').classList.remove('is-empty');
    if (floatPanel) floatPanel.style.display = 'none';
    floatState.floating = false;
    saveFloatState();
    updatePipButton();
}

function togglePreviewFloating() {
    if (floatState.floating) dockPreview(); else floatPreview();
}

function updatePipButton() {
    const btn = document.getElementById('pipBtn');
    if (!btn) return;
    btn.textContent = floatState.floating ? 'Dock preview' : 'Float preview';
    btn.title = floatState.floating ? 'Put the preview back in the page' : 'Show the preview in a floating window you can drag around';
}

// Called after the canvas size changes
function refreshFloatingPreview() {
    if (floatState.floating) layoutFloatPanel();
}

// Kept for the render loop (older "PiP window" hook) - nothing to copy anymore
function updatePipWindow() {}

// Old names, in case anything still calls them
function openPipWindow() { floatPreview(); }
function closePipWindow() { dockPreview(); }

document.addEventListener('DOMContentLoaded', () => {
    updatePipButton();
    if (floatState.floating) floatPreview();
});
