// Picture-in-picture window: one canvas that receives the composited frame
// every time the main view renders a new frame.
let pipCanvasEl = null;

function openPipWindow() {
    if (pipWindow && !pipWindow.closed) {
        pipWindow.focus();
        return;
    }

    pipWindow = window.open('', 'PiPWindow',
        `width=${canvasWidth + 40},height=${canvasHeight + 80},scrollbars=no,resizable=yes,status=no,toolbar=no,menubar=no`);
    if (!pipWindow) return;

    pipWindow.document.write(`<!DOCTYPE html>
<html><head><title>Animation Preview</title>
<style>
  body { margin: 0; background: #1a1a1a; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
  canvas { max-width: 100vw; max-height: 100vh; object-fit: contain; }
</style></head>
<body><canvas id="pipCanvas"></canvas></body></html>`);
    pipWindow.document.close();
    pipCanvasEl = pipWindow.document.getElementById('pipCanvas');

    const pipBtn = document.getElementById('pipBtn');
    pipBtn.textContent = 'Close PiP';
    pipBtn.onclick = closePipWindow;

    pipWindow.addEventListener('beforeunload', () => {
        pipWindow = null;
        pipCanvasEl = null;
        resetPipButton();
    });
    updatePipWindow();
}

function resetPipButton() {
    const pipBtn = document.getElementById('pipBtn');
    pipBtn.textContent = 'Open PiP';
    pipBtn.onclick = openPipWindow;
}

function closePipWindow() {
    if (pipWindow && !pipWindow.closed) pipWindow.close();
    pipWindow = null;
    pipCanvasEl = null;
    resetPipButton();
}

function updatePipWindow() {
    if (!pipWindow || pipWindow.closed || !pipCanvasEl) return;
    if (pipCanvasEl.width !== canvasWidth || pipCanvasEl.height !== canvasHeight) {
        pipCanvasEl.width = canvasWidth;
        pipCanvasEl.height = canvasHeight;
    }
    compositeFrame(pipCanvasEl.getContext('2d'));
}
