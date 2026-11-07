// =====================================================================
// Presets
//
// Every preset is written against the layer scope provided by canvas.js:
//   frameCount  - this layer's frame, 0 .. maxFrames-1 (wraps every loop)
//   progress    - frameCount / maxFrames, 0 .. 1
//   width/height, drawingContext and the whole p5 API
// Colour mode is HSB with ranges (360, 100, 100, 100) - alpha is 0..100.
//
// Anything that moves is a function of `progress` with whole-number
// frequencies, so the last frame flows straight into the first one and
// exported GIF / MP4 loops are seamless. random() is seeded per layer
// (and per frame inside draw), so renders are reproducible.
// =====================================================================

function loadPresetFromDropdown(selectElement) {
    const presetName = selectElement.value;
    if (presetName) {
        loadPreset(presetName);
        const category = selectElement.closest('.preset-category');
        if (category) setCategoryPick(category, presetName);
        selectElement.selectedIndex = 0;
    }
}

// ---------------------------------------------------------------------
// Category buttons follow the last pick
//
// Picking a preset from a category's dropdown puts it on the category's
// main button; the original default moves to the top of the dropdown.
// Picking the original default again puts everything back as it was.
// ---------------------------------------------------------------------
const PRESET_PICKS_KEY = 'presetCategoryPicks';
let presetPicks = {};
try { presetPicks = JSON.parse(localStorage.getItem(PRESET_PICKS_KEY) || '{}'); } catch (e) { presetPicks = {}; }

function savePresetPicks() {
    try { localStorage.setItem(PRESET_PICKS_KEY, JSON.stringify(presetPicks)); } catch (e) { /* ignore */ }
}

// Remember each category's original button and list once, from the page
function initPresetCategories() {
    document.querySelectorAll('.preset-category').forEach(category => {
        const button = category.querySelector('.main-preset-btn');
        const select = category.querySelector('.preset-dropdown');
        const match = (button.getAttribute('onclick') || '').match(/loadPreset\('([^']+)'\)/);
        if (!match) return;
        category._default = { value: match[1], label: button.textContent.trim() };
        category._placeholder = select.options[0] ? select.options[0].textContent : '';
        category._options = [...select.options].slice(1).map(o => ({ value: o.value, label: o.textContent }));
        category._key = category.querySelector('.category-title').textContent.trim();
        button.removeAttribute('onclick');
        button.addEventListener('click', () => loadPreset(button.dataset.preset));
        const saved = presetPicks[category._key];
        const valid = saved && category._options.some(o => o.value === saved);
        renderPresetCategory(category, valid ? saved : null);
    });
}

function setCategoryPick(category, value) {
    if (!category._default) return;
    const pick = value === category._default.value ? null : value;
    if (pick) presetPicks[category._key] = pick; else delete presetPicks[category._key];
    savePresetPicks();
    renderPresetCategory(category, pick);
}

function renderPresetCategory(category, pick) {
    const button = category.querySelector('.main-preset-btn');
    const select = category.querySelector('.preset-dropdown');
    const picked = pick && category._options.find(o => o.value === pick);
    const onButton = picked || category._default;
    button.textContent = onButton.label;
    button.dataset.preset = onButton.value;
    button.title = picked ? `Last picked from this category (default: ${category._default.label})` : '';
    button.classList.toggle('is-picked', !!picked);

    // The default goes to the top of the list while something else is on the button
    const list = picked
        ? [category._default, ...category._options.filter(o => o.value !== picked.value)]
        : category._options;
    select.innerHTML = '';
    select.appendChild(new Option(category._placeholder, ''));
    list.forEach(o => select.appendChild(new Option(o.label, o.value)));
    select.selectedIndex = 0;
}

document.addEventListener('DOMContentLoaded', initPresetCategories);

function preset(code, opts = {}) {
    return Object.assign({
        code: code.trim() + '\n',
        hue: 360, saturation: 100, brightness: 100, opacity: 100,
        maxFrames: 360, fps: 60, speed: 1, syncLoop: false
    }, opts);
}

const presets = {

// --------------------------------------------------------------------- Spirals
ying_yang_spiral: preset(`
let arms = 1;           // arms of each colour (2+ = bands meet in a point) {limlow:1}
let bandWidth = 18;     // thickness of every band (px at 300px canvas) {incr:2} {limlow:1}
let turnsPerLoop = 1;   // full rotations per loop (whole number = seamless)
let lightColor = [0, 0, 100];   // light bands {color:hsb}
let darkColor = [0, 0, 0];      // dark bands {color:hsb}
let drawDarkBands = true;

function draw() {
  let s = min(width, height) / 300;
  let band = bandWidth * s;
  let c = band * arms / PI;              // r = c * angle
  let maxR = dist(0, 0, width, height) / 2 + band * 2;
  let maxU = maxR / c;
  let t = progress * TWO_PI * turnsPerLoop;

  translate(width / 2, height / 2);
  noStroke();

  if (drawDarkBands) {
    fill(darkColor);
    circle(0, 0, maxR * 2);
  }

  fill(lightColor);
  let step = 0.04;
  for (let k = 0; k < arms; k++) {
    let offset = k * TWO_PI / arms + t;
    beginShape();
    // Inner edge: spiral leaving the centre
    for (let u = 0; u <= maxU; u += step) {
      vertex(cos(u + offset) * c * u, sin(u + offset) * c * u);
    }
    // Outer edge: the neighbouring spiral, followed all the way back into the
    // centre (instead of stopping one band-width out), so bands meet smoothly
    for (let u = maxU; u >= -PI / arms; u -= step) {
      let r = max(0, c * u + band);
      vertex(cos(u + offset) * r, sin(u + offset) * r);
    }
    vertex(0, 0);
    endShape(CLOSE);
  }
}`, { maxFrames: 120 }),

dot_spiral: preset(`
let arms = 7;             // number of spiral arms
let dotsPerArm = 40;      // dots on each arm
let curl = 4.2;           // how far each arm winds (radians from centre to edge) {incr:0.2}
let flowPerLoop = 4;      // dots that leave each arm per loop (whole number)
let spinsPerLoop = 1;     // rotations of the whole spiral per loop (whole number)
let minDot = 1.5;         // dot size at the centre
let maxDot = 16;          // dot size at the edge
let hueStart = 185;       // colour at the centre (cyan)
let hueRange = 130;       // colour change towards the edge (to magenta)
let colorCyclesPerLoop = 1;
let pulsesPerLoop = 2;    // brightness waves travelling outwards
let glow = true;

function draw() {
  let s = min(width, height) / 300;
  let maxR = dist(0, 0, width, height) / 2 * 1.05;
  let t = progress * TWO_PI;
  translate(width / 2, height / 2);
  noStroke();
  blendMode(ADD);

  // Soft core
  for (let g = 6; g > 0; g--) {
    fill(hueStart + progress * 360 * colorCyclesPerLoop, 60, 100, 5);
    circle(0, 0, g * 9 * s);
  }

  // Inner dots first, so the bigger outer dots sit on top
  for (let j = 0; j < dotsPerArm; j++) {
    let u = ((j + progress * flowPerLoop) % dotsPerArm) / dotsPerArm;   // 0 = centre, 1 = edge
    let r = maxR * pow(u, 1.5);
    let size = (minDot + (maxDot - minDot) * u) * s;
    let fadeIn = min(1, u * 8);
    let wave = 0.65 + 0.35 * sin(u * TWO_PI * 3 - t * pulsesPerLoop);
    let h = (hueStart + u * hueRange + progress * 360 * colorCyclesPerLoop) % 360;

    for (let a = 0; a < arms; a++) {
      let angle = a * TWO_PI / arms + u * curl + t * spinsPerLoop;
      let x = cos(angle) * r, y = sin(angle) * r;
      if (glow) {
        fill(h, 80, 100, 10 * fadeIn * wave);
        circle(x, y, size * 2.8);
      }
      fill(h, 70, 100, 85 * fadeIn * wave);
      circle(x, y, size);
      fill(h, 15, 100, 60 * fadeIn * wave);
      circle(x - size * 0.15, y - size * 0.15, size * 0.35);
    }
  }
}`, { maxFrames: 240 }),

tunnel: preset(`
let tilesAround = 12;     // tiles around the wall (even number) {incr:2}
let ringsPerUnit = 2;     // tile rows per unit of depth (whole number)
let twist = 1;            // spiral twist of the wall pattern (whole number, 0 = straight)
let travelPerLoop = 1;    // depth units flown per loop (whole number)
let spinsPerLoop = 0;     // extra rotation of the whole tunnel (whole number)
let tubeDepth = 0.45;     // bigger = tiles look further away / longer tunnel {incr:0.05}
let fog = 0.45;           // how quickly the far end fades into darkness {slide:0,2} {incr:0.05}
let lightColor = [255, 255, 255]; // light tiles {color}
let darkColor = [0, 0, 0];      // dark tiles {color}
let maxResolution = 400;  // render resolution cap (lower = faster, blurrier) {incr:50} {limlow:50} {limhigh:1200}

let buffer, bctx, img, geo;

// Per-pixel tunnel geometry never changes, so compute it once
function buildGeometry(w, h) {
  let n = w * h, TAU = Math.PI * 2;
  let half = Math.min(w, h) / 2;
  let maxR = Math.sqrt(w * w + h * h) / 2 / half;
  geo = { A: new Float32Array(n), B: new Float32Array(n), eA: new Float32Array(n),
          eB: new Float32Array(n), light: new Float32Array(n) };
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let k = x + y * w;
      let dx = (x + 0.5 - w / 2) / half, dy = (y + 0.5 - h / 2) / half;
      let r = Math.sqrt(dx * dx + dy * dy) + 1e-4;
      let depth = tubeDepth / r;                       // distance down the tube
      geo.A[k] = Math.atan2(dy, dx) * tilesAround / 2 + depth * TAU * twist;
      geo.B[k] = depth * TAU * ringsPerUnit;
      // Width of one pixel in pattern units -> anti-aliasing / blur at the far end
      let dDepth = tubeDepth / (r * r * half);
      let angular = tilesAround / 2 / (r * half), radial = dDepth * TAU * twist;
      geo.eA[k] = Math.sqrt(angular * angular + radial * radial) + 0.02;
      geo.eB[k] = dDepth * TAU * ringsPerUnit + 0.02;
      geo.light[k] = Math.exp(-fog * (depth - tubeDepth / maxR));
    }
  }
}

function draw() {
  let w = min(width, maxResolution), h = max(1, round(w * height / width));
  if (!buffer || buffer.width !== w || buffer.height !== h) {
    buffer = document.createElement('canvas');
    buffer.width = w; buffer.height = h;
    bctx = buffer.getContext('2d');
    img = bctx.createImageData(w, h);
    buildGeometry(w, h);
  }
  let d = img.data, TAU = Math.PI * 2;
  let travel = progress * travelPerLoop;
  let shiftA = travel * TAU * twist + progress * TAU * spinsPerLoop;
  let shiftB = travel * TAU * ringsPerUnit;
  let dr = lightColor[0] - darkColor[0], dg = lightColor[1] - darkColor[1], db = lightColor[2] - darkColor[2];

  for (let k = 0, n = w * h; k < n; k++) {
    let sa = Math.sin(geo.A[k] + shiftA) / geo.eA[k];
    let sb = Math.sin(geo.B[k] + shiftB) / geo.eB[k];
    sa = sa > 1 ? 1 : sa < -1 ? -1 : sa;
    sb = sb > 1 ? 1 : sb < -1 ? -1 : sb;
    let v = 0.5 + 0.5 * sa * sb;          // checkerboard of wall tiles
    let l = geo.light[k];
    let i = k * 4;
    d[i] = (darkColor[0] + dr * v) * l;
    d[i + 1] = (darkColor[1] + dg * v) * l;
    d[i + 2] = (darkColor[2] + db * v) * l;
    d[i + 3] = 255;
  }
  bctx.putImageData(img, 0, 0);
  drawingContext.imageSmoothingEnabled = true;
  drawingContext.drawImage(buffer, 0, 0, width, height);
}`, { maxFrames: 240 }),

tunnel_2: preset(`
let squares = 100;
let spinsPerLoop = 1;

function draw() {
  let s = min(width, height) / 300;
  let t = progress * TWO_PI * spinsPerLoop;
  translate(width / 2, height / 2);
  noFill();
  strokeWeight(2);

  for (let i = 0; i < squares; i++) {
    let size = i * 8 * s;
    push();
    rotate(t + i * 0.1);
    stroke((i * 10 + progress * 360) % 360, 100, 100);
    rect(-size / 2, -size / 2, size, size);
    pop();
  }
}`, { maxFrames: 240 }),

fibonacci_spiral: preset(`
let seeds = 700;
let spread = 5.5;
let dotSize = 7;
let spinsPerLoop = 1;
let pulses = 3;          // pulse waves per loop
const GOLDEN_ANGLE = 2.39996323;

function draw() {
  let s = min(width, height) / 300;
  let t = progress * TWO_PI;
  translate(width / 2, height / 2);
  rotate(t * spinsPerLoop);
  noStroke();

  for (let i = 1; i < seeds; i++) {
    let a = i * GOLDEN_ANGLE;
    let r = spread * sqrt(i) * s;
    let wave = sin(t * pulses - i * 0.03);
    let size = dotSize * s * (0.55 + 0.45 * wave) * (0.4 + i / seeds);
    fill((i * 0.6 + progress * 360) % 360, 80, 100, 90);
    circle(cos(a) * r, sin(a) * r, size);
  }
}`, { maxFrames: 360 }),

galaxy_spiral: preset(`
let galaxySeed = 0;       // 0 = this layer's own random galaxy, any other number = a fixed one {incr:1} {limlow:0}
let randomLook = true;    // random arms, winding, tilt and colours (off = use the values below)
let spinsPerLoop = 1;     // turns of the galaxy per loop (whole number)
let starCount = 7000;     // {incr:500} {limlow:0} {limhigh:50000}
let backgroundStars = 260;  // {incr:20} {limlow:0}
let arms = 2;             // spiral arms (when randomLook is off) {slide:1,6} {incr:1} {limlow:1}
let armTurns = 1.3;       // how far each arm winds around {slide:0.3,3} {incr:0.1}
let armWidth = 0.22;      // how fuzzy the arms are {slide:0.05,0.6} {incr:0.01}
let tilt = 0.6;           // 1 = seen from above, smaller = tilted {slide:0.15,1} {incr:0.05}
let viewAngle = -20;      // rotation of the tilted galaxy (degrees) {slide:-180,180} {incr:5}
let coreColor = '#ffd9a0';  // {color}
let armColor = '#8fb8ff';   // {color}
let knotColor = '#ff7fb6';  // star-forming regions {color}

let galaxy, sky, twinklers = [];

// The galaxy is painted once (face-on) into an image, then rotated and tilted each frame
// Colour themes a random galaxy can pick from: core, arms, star-forming knots
const PALETTES = [
  ['#ffd9a0', '#8fb8ff', '#ff7fb6'],
  ['#ffe2b0', '#ffb36b', '#ff6b6b'],
  ['#fff0c8', '#b48cff', '#ff8fd8'],
  ['#e0fff4', '#5ee0d0', '#7f9cff'],
  ['#ffe9d6', '#ff9a8a', '#ffd36b'],
  ['#f4f1ff', '#9ad7ff', '#c3ff8f'],
];

function setup() {
  if (galaxySeed > 0) randomSeed(galaxySeed);
  if (randomLook) {
    arms = floor(random(2, 5));
    armTurns = random(0.8, 2.1);
    armWidth = random(0.14, 0.34);
    tilt = random(0.35, 0.95);
    viewAngle = random(-180, 180);
    let pal = PALETTES[floor(random(PALETTES.length))];
    coreColor = pal[0]; armColor = pal[1]; knotColor = pal[2];
  }
  let R = min(width, height) * 0.48;
  let size = ceil(R * 2.2);
  galaxy = document.createElement('canvas');
  galaxy.width = galaxy.height = size;
  let g = galaxy.getContext('2d');
  g.translate(size / 2, size / 2);
  g.globalCompositeOperation = 'lighter';

  let armAngle = (k, r) => k * TWO_PI / arms + armTurns * TWO_PI * Math.log(1 + 6 * r) / Math.log(7);
  let core = hexToRgbArr(coreColor), arm = hexToRgbArr(armColor), knot = hexToRgbArr(knotColor);

  // Soft glow along the arms
  for (let k = 0; k < arms; k++) {
    for (let r = 0.08; r < 1; r += 0.006) {
      let a = armAngle(k, r) + randomGaussian() * armWidth * 0.3;
      let x = Math.cos(a) * r * R, y = Math.sin(a) * r * R;
      blob(g, x, y, R * (0.05 + 0.07 * r), arm, 0.05 * (1 - r * 0.6));
    }
  }
  // Stars: mostly in the arms, the rest in the disk
  for (let i = 0; i < starCount; i++) {
    let r = Math.min(1, -Math.log(1 - random() * 0.98) * 0.3);
    let a;
    if (random() < 0.7) a = armAngle(floor(random(arms)), r) + randomGaussian() * armWidth * (1.2 - r * 0.5);
    else a = random(TWO_PI);
    let x = Math.cos(a) * r * R, y = Math.sin(a) * r * R;
    let mix = Math.min(1, r * 1.6);
    let c = [core[0] + (arm[0] - core[0]) * mix, core[1] + (arm[1] - core[1]) * mix, core[2] + (arm[2] - core[2]) * mix];
    g.fillStyle = 'rgba(' + c.map(Math.round).join(',') + ',' + (0.25 + random() * 0.6).toFixed(2) + ')';
    let sz = random() < 0.03 ? random(1.2, 2) : random(0.4, 1);
    g.fillRect(x, y, sz, sz);
  }
  // Pink star-forming knots along the arms
  for (let k = 0; k < arms; k++) {
    for (let i = 0; i < 26; i++) {
      let r = random(0.25, 0.95);
      let a = armAngle(k, r) + randomGaussian() * armWidth * 0.4;
      blob(g, Math.cos(a) * r * R, Math.sin(a) * r * R, R * random(0.012, 0.03), knot, 0.5);
    }
  }
  // Dark dust lanes on the inner edge of each arm
  g.globalCompositeOperation = 'source-over';
  for (let k = 0; k < arms; k++) {
    for (let r = 0.12; r < 0.85; r += 0.008) {
      let a = armAngle(k, r) - 0.18 + randomGaussian() * 0.04;
      blob(g, Math.cos(a) * r * R, Math.sin(a) * r * R, R * 0.035, [10, 6, 4], 0.10);
    }
  }
  // Bright core
  g.globalCompositeOperation = 'lighter';
  blob(g, 0, 0, R * 0.42, core, 0.55);
  blob(g, 0, 0, R * 0.16, [255, 245, 230], 0.9);

  // Background starfield
  sky = document.createElement('canvas');
  sky.width = width; sky.height = height;
  let k2 = sky.getContext('2d');
  for (let i = 0; i < backgroundStars; i++) {
    k2.fillStyle = 'rgba(255,255,255,' + random(0.15, 0.7).toFixed(2) + ')';
    let sz = random(0.5, 1.4);
    k2.fillRect(random(width), random(height), sz, sz);
  }
  for (let i = 0; i < 40; i++) {
    twinklers.push({ x: random(width), y: random(height), speed: floor(random(1, 4)), phase: random(TWO_PI), size: random(1, 2.2) });
  }
}

function hexToRgbArr(hex) {
  let h = hex.replace('#', '');
  return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16));
}

function blob(g, x, y, r, rgb, alpha) {
  let grad = g.createRadialGradient(x, y, 0, x, y, r);
  grad.addColorStop(0, 'rgba(' + rgb.join(',') + ',' + alpha + ')');
  grad.addColorStop(1, 'rgba(' + rgb.join(',') + ',0)');
  g.fillStyle = grad;
  g.fillRect(x - r, y - r, r * 2, r * 2);
}

function draw() {
  let ctx = drawingContext;
  let t = progress * TWO_PI;
  ctx.drawImage(sky, 0, 0);
  for (let st of twinklers) {
    let a = 0.5 + 0.5 * Math.sin(t * st.speed + st.phase);
    ctx.fillStyle = 'rgba(255,255,255,' + (a * a).toFixed(3) + ')';
    ctx.fillRect(st.x, st.y, st.size, st.size);
  }
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.rotate(radians(viewAngle));
  ctx.scale(1, tilt);
  ctx.rotate(t * spinsPerLoop);
  ctx.globalCompositeOperation = 'lighter';
  ctx.drawImage(galaxy, -galaxy.width / 2, -galaxy.height / 2);
  ctx.restore();
}`, { maxFrames: 720 }),

vortex: preset(`
let particles = 520;      // streaks being pulled in {incr:20} {limlow:0} {limhigh:5000}
let swirl = 2.4;          // how much they spin on the way in {slide:0,6} {incr:0.1}
let flowPerLoop = 1;      // trips from the rim to the centre per loop (whole number)
let trail = 7;            // length of each streak {slide:1,14} {incr:1}
let arms = 4;             // faint spiral arms behind the streaks
let rimHue = 195;         // colour at the rim {slide:0,360} {incr:5}
let coreHue = 285;        // colour near the centre {slide:0,360} {incr:5}
let eyeSize = 0.07;       // size of the dark centre {slide:0,0.3} {incr:0.01}

let parts = [];

function setup() {
  for (let i = 0; i < particles; i++) {
    parts.push({ a: random(TWO_PI), offset: random(), size: random(0.6, 1.8), drift: random(-0.25, 0.25) });
  }
}

// Position of a streak at depth u (0 = rim, 1 = centre)
function vortexPoint(pt, u, R, spin) {
  let r = R * (eyeSize + (1 - eyeSize) * pow(1 - u, 1.4));
  let a = pt.a + spin + swirl * -log(1 - u * 0.985) * 1.6 + pt.drift * u;
  return [cos(a) * r, sin(a) * r];
}

// Hue/sat/bright (360/100/100) + alpha (0..100) as a CSS colour, for fast native drawing
function hsba(h, sat, bri, a) {
  sat /= 100; bri /= 100;
  let l = bri * (1 - sat / 2);
  let sl = (l === 0 || l === 1) ? 0 : (bri - l) / Math.min(l, 1 - l);
  return 'hsla(' + (((h % 360) + 360) % 360).toFixed(1) + ',' + (sl * 100).toFixed(1) + '%,' + (l * 100).toFixed(1) + '%,' + (a / 100).toFixed(3) + ')';
}

function draw() {
  let R = dist(0, 0, width, height) / 2;
  let s = min(width, height) / 300;
  let t = progress * TWO_PI;
  let ctx = drawingContext;
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Faint spiral arms, one turn per loop
  ctx.lineWidth = 1.2 * s;
  ctx.strokeStyle = hsba(rimHue, 60, 100, 9);
  for (let k = 0; k < arms; k++) {
    ctx.beginPath();
    let arm = { a: k * TWO_PI / arms, drift: 0 };
    for (let u = 0; u < 0.97; u += 0.01) {
      let q = vortexPoint(arm, u, R, t);
      if (u === 0) ctx.moveTo(q[0], q[1]); else ctx.lineTo(q[0], q[1]);
    }
    ctx.stroke();
  }

  // Streaks: a faint full-length tail plus a brighter head
  ctx.globalCompositeOperation = 'lighter';
  let du = 0.007;
  for (let pt of parts) {
    let u = (progress * flowPerLoop + pt.offset) % 1;
    let fade = Math.pow(Math.sin(u * Math.PI), 0.7);
    if (fade < 0.02) continue;
    let h = rimHue + (coreHue - rimHue) * u;
    let w = pt.size * s * (1.6 - u * 1.1);
    let pts = [];
    for (let k = 0; k <= trail && u - k * du >= 0; k++) pts.push(vortexPoint(pt, u - k * du, R, t));
    if (pts.length < 2) continue;

    ctx.strokeStyle = hsba(h, 75 - u * 40, 100, 38 * fade);
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.stroke();

    ctx.strokeStyle = hsba(h, 45 - u * 30, 100, 85 * fade);
    ctx.lineWidth = w * 0.9;
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < Math.min(3, pts.length); i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.stroke();
  }

  // Glowing rim of the eye, then the dark centre
  let eyeR = R * eyeSize;
  ctx.fillStyle = hsba(coreHue, 70, 100, 4);
  for (let g = 6; g > 0; g--) {
    ctx.beginPath();
    ctx.arc(0, 0, eyeR + g * 3 * s, 0, TWO_PI);
    ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = 'rgba(0,0,0,0.92)';
  ctx.beginPath();
  ctx.arc(0, 0, eyeR, 0, TWO_PI);
  ctx.fill();
  ctx.restore();
}`, { maxFrames: 360 }),

circling_spiral: preset(`
let rings = 16;           // rings of dots from the centre outwards {slide:4,30} {incr:1} {limlow:1} {limhigh:60}
let spacing = 11;         // distance between rings (px at 300px canvas) {slide:5,25} {incr:1}
let circleSize = 5;       // radius of the little circle each dot travels {slide:0,15} {incr:0.5}
let arms = 3;             // spiral arms that appear (whole number) {slide:1,8} {incr:1}
let twist = 1.5;          // how strongly the arms curl {slide:-4,4} {incr:0.1}
let cyclesPerLoop = 2;    // laps each dot makes per loop (whole number) {incr:1}
let dotSize = 3.2;        // {slide:1,8} {incr:0.2}
let contrast = 2.5;       // how strongly the arms stand out {slide:0,6} {incr:0.1}
let showCircles = true;   // draw the little circles to reveal the trick
let rainbow = true;       // colour by position in the spiral
let dotColor = '#ffd27a'; // dot colour when rainbow is off {color}

function hsba(h, sat, bri, a) {
  sat /= 100; bri /= 100;
  let l = bri * (1 - sat / 2);
  let sl = (l === 0 || l === 1) ? 0 : (bri - l) / Math.min(l, 1 - l);
  return 'hsla(' + (((h % 360) + 360) % 360).toFixed(1) + ',' + (sl * 100).toFixed(1) + '%,' + (l * 100).toFixed(1) + '%,' + (a / 100).toFixed(3) + ')';
}

function draw() {
  let s = min(width, height) / 300;
  let ctx = drawingContext;
  let t = progress * TWO_PI * cyclesPerLoop;
  let orbit = circleSize * s;
  ctx.save();
  ctx.translate(width / 2, height / 2);

  for (let ring = 0; ring <= rings; ring++) {
    let r = ring * spacing * s;
    let count = ring === 0 ? 1 : ring * 6;           // evenly spaced dots on each ring
    let depth = ring / rings;
    for (let i = 0; i < count; i++) {
      let theta = i * TWO_PI / count;
      let ax = Math.cos(theta) * r, ay = Math.sin(theta) * r;

      // Each dot only circles its own anchor; the phase offsets build the spiral
      let phase = arms * theta + twist * depth * TWO_PI - t;
      let x = ax + Math.cos(phase) * orbit;
      let y = ay + Math.sin(phase) * orbit;

      if (showCircles && orbit > 0.5) {
        ctx.strokeStyle = 'rgba(255,255,255,0.07)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(ax, ay, orbit, 0, TWO_PI);
        ctx.stroke();
      }

      // Dots pushed outwards light up and grow: together they draw the arms
      let facing = Math.cos(phase - theta) * 0.5 + 0.5;
      let glow = Math.pow(facing, contrast);
      ctx.fillStyle = rainbow
        ? hsba(200 + depth * 140 + progress * 360, 75 - 35 * glow, 100, 100)
        : dotColor;
      ctx.globalAlpha = 0.12 + 0.88 * glow;
      ctx.beginPath();
      ctx.arc(x, y, dotSize * s * (0.6 + 0.6 * depth) * (0.45 + 0.75 * glow), 0, TWO_PI);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }
  ctx.restore();
}`, { maxFrames: 360 }),

droste_zoom: preset(`
let levelsPerLoop = 2;    // frames zoomed through per loop (even number) {incr:2} {limlow:2}
let shrink = 0.8;         // each frame's size compared with the one around it {slide:0.6,0.92} {incr:0.01} {limlow:0.3} {limhigh:0.97}
let twist = 14;           // rotation from one frame to the next (degrees) {slide:-45,45} {incr:1}
let corner = 0.18;        // roundness of the frames {slide:0,0.5} {incr:0.01} {limlow:0}
let lightColor = '#f2f2f2';  // {color}
let darkColor = '#141414';   // {color}
let rainbowEdges = true;     // thin coloured outline on every frame
let centerSize = 1;          // dark spot that hides the tiny frames in the middle (px at 300px canvas) {slide:0,40} {incr:1} {limlow:0}

function hsla(h, a) { return 'hsla(' + (((h % 360) + 360) % 360).toFixed(1) + ',90%,62%,' + a + ')'; }

function roundedSquare(ctx, half, r) {
  r = Math.min(r, half);
  ctx.beginPath();
  ctx.moveTo(-half + r, -half);
  ctx.arcTo(half, -half, half, half, r);
  ctx.arcTo(half, half, -half, half, r);
  ctx.arcTo(-half, half, -half, -half, r);
  ctx.arcTo(-half, -half, half, -half, r);
  ctx.closePath();
}

function draw() {
  let ctx = drawingContext;
  let phase = progress * levelsPerLoop;            // zoom: every frame moves one level outwards
  let base = dist(0, 0, width, height) * 0.75;     // the outermost frame covers the canvas
  let tw = radians(twist);
  let first = Math.floor(phase) - 3;
  let last = first + Math.ceil(Math.log(0.004) / Math.log(shrink)) + 6;
  ctx.save();
  ctx.translate(width / 2, height / 2);

  for (let i = first; i <= last; i++) {
    let level = i - phase;
    let half = base * Math.pow(shrink, level);
    if (half > base * 3) continue;
    if (half < 0.6) break;
    let rot = level * tw;
    ctx.save();
    ctx.rotate(rot);
    roundedSquare(ctx, half, half * corner);
    ctx.fillStyle = ((i % 2) + 2) % 2 ? darkColor : lightColor;
    ctx.fill();
    if (rainbowEdges) {
      ctx.strokeStyle = hsla(level / levelsPerLoop * 360, 0.85);
      ctx.lineWidth = Math.max(0.6, half * 0.012);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Always-dark centre: the smallest frames would otherwise flash light/dark
  if (centerSize > 0) {
    let cr = centerSize * min(width, height) / 300;
    let g = ctx.createRadialGradient(0, 0, 0, 0, 0, cr);
    g.addColorStop(0, darkColor);
    g.addColorStop(0.65, darkColor);
    g.addColorStop(1, darkColor + '00');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, cr, 0, TWO_PI);
    ctx.fill();
  }
  ctx.restore();
}`, { maxFrames: 240 }),

op_art_spiral: preset(`
let rings = 22;           // rings from the edge to the centre {slide:6,40} {incr:1} {limlow:2} {limhigh:80}
let segments = 24;        // checks around each ring (even number) {slide:8,48} {incr:2} {limlow:2} {limhigh:120}
let twist = 0.22;         // how much each ring is turned (spiral strength) {slide:-0.6,0.6} {incr:0.01}
let ringsPerLoop = 2;     // rings flowing into the centre per loop (even number) {incr:2}
let spinsPerLoop = 1;     // turns of the whole pattern per loop (whole number) {incr:1}
let depth = 1.6;          // how much the rings shrink towards the centre {slide:1,3} {incr:0.05} {limlow:0.5}
let lightColor = '#f4f4f4';  // {color}
let darkColor = '#0d0d0d';   // {color}

function draw() {
  let ctx = drawingContext;
  let R = dist(0, 0, width, height) / 2 + 4;
  let phase = progress * ringsPerLoop;
  let spin = progress * TWO_PI * spinsPerLoop;
  let seg = TWO_PI / segments;
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.fillStyle = darkColor;
  ctx.fillRect(-width, -height, width * 2, height * 2);
  ctx.fillStyle = lightColor;

  // Rings move inwards by 'phase' each loop, so they flow into the centre
  let radius = x => R * Math.pow(Math.max(0, x) / rings, depth);
  for (let k = -2; k < rings + 2; k++) {
    let x0 = k - (phase % 1), x1 = x0 + 1;
    if (x1 <= 0) continue;
    let r0 = radius(x0), r1 = Math.min(radius(x1), R * 1.5);
    if (r0 >= R * 1.5) continue;
    let ringIndex = k + Math.floor(phase);           // which ring this is, for the checker parity
    let rot = spin + twist * (x0 + x1) / 2 * 2;
    for (let n = 0; n < segments; n++) {
      if (((ringIndex + n) % 2 + 2) % 2) continue;
      let a0 = rot + n * seg, a1 = a0 + seg;
      ctx.beginPath();
      ctx.arc(0, 0, r1, a0, a1);
      ctx.arc(0, 0, Math.max(0, r0), a1, a0, true);
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.restore();
}`, { maxFrames: 240 }),

spirograph: preset(`
let outerTeeth = 96;       // teeth of the big ring (whole number) {incr:1} {limlow:3} {limhigh:400}
let innerTeeth = 42;      // teeth of the small gear (whole number, smaller than the ring) {incr:1} {limlow:2} {limhigh:399}
let penPosition = 0.85;    // where the pen sits on the small gear (0 = centre, 1 = edge) {slide:0,1.4} {incr:0.02}
let trail = 0.45;         // share of the pattern shown behind the pen {slide:0.02,1} {incr:0.01} {limlow:0.01} {limhigh:1}
let lineWidth = 1.8;      // {slide:0.4,5} {incr:0.1} {limlow:0.1}
let showGears = true;
let showGhost = true;     // faint full pattern underneath
let rainbow = true;
let penColor = '#7fd8ff'; // used when rainbow is off {color}

function gcd(a, b) { while (b) [a, b] = [b, a % b]; return a; }

function hsla(h, a) { return 'hsla(' + (((h % 360) + 360) % 360).toFixed(1) + ',85%,64%,' + a + ')'; }

function draw() {
  let ctx = drawingContext;
  let R = Math.round(outerTeeth), r = Math.min(Math.round(innerTeeth), R - 1);
  let scale = min(width, height) * 0.46 / Math.max(R, R - r + r * penPosition);
  let laps = r / gcd(R, r);                    // turns needed before the pattern closes
  let total = TWO_PI * laps;
  let point = t => {
    let k = (R - r) / r;
    return [((R - r) * Math.cos(t) + r * penPosition * Math.cos(k * t)) * scale,
            ((R - r) * Math.sin(t) - r * penPosition * Math.sin(k * t)) * scale];
  };
  let steps = Math.min(6000, Math.ceil(laps * 180));
  let head = progress * total;                 // the pen goes round the whole pattern once per loop

  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (showGhost) {
    ctx.strokeStyle = 'rgba(255,255,255,0.14)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) { let q = point(i / steps * total); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); }
    ctx.stroke();
  }

  // Fading trail behind the pen, in short chunks so it can change colour and fade
  let trailLen = trail * total, chunks = 120;
  for (let c = 0; c < chunks; c++) {
    let t0 = head - trailLen * (c + 1) / chunks, t1 = head - trailLen * c / chunks;
    let fade = 1 - c / chunks;
    ctx.strokeStyle = rainbow ? hsla(t1 / total * 360 * 2, fade) : penColor;
    ctx.globalAlpha = rainbow ? 1 : fade;
    ctx.lineWidth = lineWidth * (min(width, height) / 300) * (0.4 + 0.6 * fade);
    ctx.beginPath();
    let sub = 4;
    for (let j = 0; j <= sub; j++) { let q = point(t0 + (t1 - t0) * j / sub); j ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  if (showGears) {
    let gx = (R - r) * Math.cos(head) * scale, gy = (R - r) * Math.sin(head) * scale;
    let pen = point(head);
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(0, 0, R * scale, 0, TWO_PI); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.beginPath(); ctx.arc(gx, gy, r * scale, 0, TWO_PI); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(pen[0], pen[1]); ctx.stroke();
    ctx.fillStyle = rainbow ? hsla(head / total * 720, 1) : penColor;
    ctx.beginPath(); ctx.arc(pen[0], pen[1], 3, 0, TWO_PI); ctx.fill();
  }
  ctx.restore();
}`, { maxFrames: 600 }),

spiral_staircase: preset(`
let stepsPerTurn = 16;    // steps in one full turn {slide:6,40} {incr:1} {limlow:3} {limhigh:120}
let turns = 5;            // turns visible going down {slide:1,12} {incr:1} {limlow:1} {limhigh:30}
let stepsPerLoop = 2;     // steps walked down per loop (even number) {incr:2}
let stepDrop = 0.06;      // how far each step goes down (depth) {slide:0.01,0.2} {incr:0.005} {limlow:0.001}
let wellSize = 0.55;      // size of the open stairwell in the middle {slide:0.2,0.9} {incr:0.01} {limlow:0.05}
let stepColor = '#c9a27a';   // {color}
let edgeColor = '#3b2614';   // step edges {color}
let railColor = '#d8d0c0';   // banister posts {color}
let fog = 1.2;            // how quickly the depth darkens {slide:0,4} {incr:0.1}

function hexRgb(hex) { let h = hex.replace('#', ''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); }
function shade(rgb, k, a = 1) { return 'rgba(' + rgb.map(v => Math.round(v * k)).join(',') + ',' + a + ')'; }

function draw() {
  let ctx = drawingContext;
  let R = min(width, height) * 0.5;
  let phase = progress * stepsPerLoop;
  let stepAngle = TWO_PI / stepsPerTurn;
  let total = stepsPerTurn * turns;
  let col = hexRgb(stepColor), edge = hexRgb(edgeColor), rail = hexRgb(railColor);
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.fillStyle = '#000';
  ctx.fillRect(-width, -height, width * 2, height * 2);

  // Deepest steps first, so nearer ones cover them. Steps above you (d < 0)
  // keep rising and growing until they have completely left the view.
  let firstStep = Math.floor(phase);
  let above = Math.ceil(1 / stepDrop) + 2;
  let viewRadius = dist(0, 0, width, height) / 2;
  for (let i = firstStep + total + 2; i >= firstStep - above; i--) {
    let d = i - phase;                            // how many steps down this one is
    let z = d * stepDrop;
    if (1 + z <= 0.02) continue;                  // at or above the camera
    let p = 1 / (1 + z);                          // perspective: deeper = smaller
    if (R * wellSize * p > viewRadius) continue;  // completely outside the view
    let light = Math.exp(-Math.max(0, z) * fog);
    let a0 = d * stepAngle, a1 = a0 + stepAngle * 1.02;
    let outer = R * 1.45 * p, inner = R * wellSize * p;
    let tone = ((i % 2) + 2) % 2 ? 0.88 : 1;      // alternate steps slightly for definition

    ctx.beginPath();
    ctx.arc(0, 0, outer, a0, a1);
    ctx.arc(0, 0, inner, a1, a0, true);
    ctx.closePath();
    ctx.fillStyle = shade(col, light * tone);
    ctx.fill();

    // Front edge (riser) of the step
    ctx.strokeStyle = shade(edge, Math.max(0.25, light));
    ctx.lineWidth = Math.max(0.5, 3 * p);
    ctx.beginPath();
    ctx.moveTo(Math.cos(a0) * inner, Math.sin(a0) * inner);
    ctx.lineTo(Math.cos(a0) * outer, Math.sin(a0) * outer);
    ctx.stroke();

    // Banister post on the inner edge of every step
    let post = inner * 1.04, am = a0 + stepAngle / 2;
    ctx.fillStyle = shade(rail, light);
    ctx.beginPath();
    ctx.arc(Math.cos(am) * post, Math.sin(am) * post, Math.max(0.6, 3.5 * p), 0, TWO_PI);
    ctx.fill();
  }

  ctx.restore();
}`, { maxFrames: 240 }),

// --------------------------------------------------------------------- Circles
pulsing: preset(`
let zoom = 1;
let rings = 50;
let pulsesPerLoop = 2;

function draw() {
  let s = min(width, height) / 300 * zoom;
  let t = progress * TWO_PI * pulsesPerLoop;
  translate(width / 2, height / 2);
  noFill();
  strokeWeight(2);

  for (let i = 0; i < rings; i++) {
    let size = (300 - i * 6 + sin(t + i * 0.2) * 20) * s;
    stroke((i * 10 + progress * 720) % 360, 100, 100);
    ellipse(0, 0, size * 2, size * 2);
  }
}`, { maxFrames: 360 }),

pulsing_bw: preset(`
let bandWidth = 16;       // average band thickness (px at 300px canvas) {limlow:1}
let pulsesPerLoop = 2;    // breaths per loop (whole number)
let breathe = 0.25;       // how much the whole pattern expands / contracts {slide:0,0.6} {incr:0.01} {limlow:0} {limhigh:0.9}
let ripple = 0.5;         // wave running through the rings (0 = uniform breathing)
let rippleLength = 0.6;   // spacing of that wave between rings
let flowPerLoop = 0;      // rings flowing outward per loop (even whole number, 0 = none)
let lightColor = [0, 0, 100];   // light rings {color:hsb}
let darkColor = [0, 0, 0];      // dark rings {color:hsb}

function ringRadius(x, t, gap) {
  return gap * x * (1 + breathe * sin(t)) + ripple * gap * sin(t - x * rippleLength);
}

function draw() {
  let gap = bandWidth * min(width, height) / 300;
  let maxR = dist(0, 0, width, height) / 2;
  let t = progress * TWO_PI * pulsesPerLoop;
  let shift = progress * flowPerLoop;
  translate(width / 2, height / 2);
  noStroke();

  // Find how many rings are needed to cover the canvas
  let count = 1;
  while (ringRadius(count - shift, t, gap) < maxR + gap) count++;

  // Largest first; each smaller disc paints the next band on top
  for (let k = count; k >= 0; k--) {
    let r = ringRadius(k - shift, t, gap);
    if (r <= 0) continue;
    fill(k % 2 ? darkColor : lightColor);
    circle(0, 0, r * 2);
  }
}`, { maxFrames: 240 }),

kaleidoscope: preset(`
let symmetry = 16;
let xSize = 5;
let ySize = 5;
let wheel1 = 30;
let wheel2x = 40;
let wheel2y = 70;
let echoes = 6;          // faded copies trailing behind the shapes

function draw() {
  let s = min(width, height) / 300;
  translate(width / 2, height / 2);
  noFill();
  strokeWeight(2);

  for (let e = echoes - 1; e >= 0; e--) {
    let t = (progress - e * 0.006) * TWO_PI;
    let x = sin(t) * width / xSize;
    let y = cos(t * 2) * width / ySize;
    let alpha = 100 * (1 - e / echoes);

    for (let i = 0; i < symmetry; i++) {
      push();
      rotate(i * TWO_PI / symmetry);
      stroke((i * 360 / symmetry + progress * 360) % 360, 70, 100, alpha);
      ellipse(x, y, wheel1 * s, wheel1 * s);
      scale(1, -1);
      ellipse(x, y, wheel2x * s, wheel2y * s);
      pop();
    }
  }
}`, { maxFrames: 360 }),

orbit_dance: preset(`
let planets = 5;          // {slide:1,7} {incr:1}
let tilt = 0.45;          // 1 = seen from above, smaller = more side-on {slide:0.1,1} {incr:0.02}
let trailLength = 0.9;    // length of the fading trails (radians) {slide:0,3} {incr:0.1}
let sunSize = 16;         // {slide:6,50} {incr:1}
let sunColor = '#ffcf6b'; // {color}
let showOrbits = true;
let starCount = 160;      // {incr:20}

// Planet looks, from the inside out
const PALETTE = ['#9ad0ff', '#ff9a6b', '#c9a3ff', '#7be0b0', '#ffd27a', '#ff7fa8', '#8fe3ff'];
let planetData = [], sky;

function setup() {
  for (let i = 0; i < planets; i++) {
    planetData.push({
      orbit: 0.3 + i * (0.64 / Math.max(1, planets - 1)),
      speed: planets - i,                    // whole laps per loop: inner planets are faster
      phase: random(TWO_PI),
      size: random(6, 10) + i * 1.3,
      color: PALETTE[i % PALETTE.length],
      moons: i >= 1 ? floor(random(0, 3)) : 0,
      ring: i === planets - 2,
      moonPhase: random(TWO_PI)
    });
  }
  sky = document.createElement('canvas');
  sky.width = width; sky.height = height;
  let g = sky.getContext('2d');
  for (let i = 0; i < starCount; i++) {
    g.fillStyle = 'rgba(255,255,255,' + random(0.15, 0.7).toFixed(2) + ')';
    let sz = random(0.5, 1.5);
    g.fillRect(random(width), random(height), sz, sz);
  }
}

function rgbaOf(hex, a) {
  let h = hex.replace('#', '');
  return 'rgba(' + [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)).join(',') + ',' + a + ')';
}

function draw() {
  let ctx = drawingContext;
  let s = min(width, height) / 2;
  let t = progress * TWO_PI;
  ctx.drawImage(sky, 0, 0);
  ctx.save();
  ctx.translate(width / 2, height / 2);

  // Where every planet is: angle, screen position and depth (+1 = in front of the sun)
  let bodies = planetData.map(pl => {
    let a = t * pl.speed + pl.phase;
    return { pl, a, x: Math.cos(a) * pl.orbit * s, y: Math.sin(a) * pl.orbit * s * tilt, z: Math.sin(a) };
  });

  if (showOrbits) {
    ctx.lineWidth = 1;
    for (let pl of planetData) {
      ctx.strokeStyle = 'rgba(255,255,255,0.09)';
      ctx.beginPath();
      ctx.ellipse(0, 0, pl.orbit * s, pl.orbit * s * tilt, 0, 0, TWO_PI);
      ctx.stroke();
    }
  }

  // Behind the sun first, then the sun, then the ones in front
  bodies.filter(b => b.z < 0).forEach(b => drawPlanet(ctx, b, s, t));
  drawSun(ctx, s, t);
  bodies.filter(b => b.z >= 0).forEach(b => drawPlanet(ctx, b, s, t));
  ctx.restore();
}

function drawSun(ctx, s, t) {
  let r = sunSize * s / 150;
  let pulse = 1 + 0.04 * Math.sin(t * 4);
  ctx.globalCompositeOperation = 'lighter';
  let glow = ctx.createRadialGradient(0, 0, r * 0.6, 0, 0, r * 2.6 * pulse);
  glow.addColorStop(0, rgbaOf(sunColor, 0.5));
  glow.addColorStop(1, rgbaOf(sunColor, 0));
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(0, 0, r * 2.6 * pulse, 0, TWO_PI); ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  let body = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
  body.addColorStop(0, '#fffbe8');
  body.addColorStop(0.5, sunColor);
  body.addColorStop(1, rgbaOf(sunColor, 0.9));
  ctx.fillStyle = body;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, TWO_PI); ctx.fill();
}

function drawPlanet(ctx, b, s, t) {
  let pl = b.pl;
  let depth = 0.8 + 0.25 * b.z;                 // closer = bigger
  let r = pl.size * s / 150 * depth;
  let R = pl.orbit * s;

  // Fading trail along the orbit
  if (trailLength > 0) {
    let steps = 14;
    ctx.lineCap = 'round';
    for (let k = 0; k < steps; k++) {
      let a0 = b.a - trailLength * k / steps, a1 = b.a - trailLength * (k + 1) / steps;
      ctx.strokeStyle = rgbaOf(pl.color, (0.45 * (1 - k / steps)).toFixed(3));
      ctx.lineWidth = r * 0.8 * (1 - k / steps);
      ctx.beginPath();
      ctx.moveTo(Math.cos(a0) * R, Math.sin(a0) * R * tilt);
      ctx.lineTo(Math.cos(a1) * R, Math.sin(a1) * R * tilt);
      ctx.stroke();
    }
  }

  // Ring (back half)
  if (pl.ring) drawRing(ctx, b.x, b.y, r, pl.color, true);

  // Sphere lit from the sun's side
  let len = Math.hypot(b.x, b.y) || 1;
  let lx = -b.x / len, ly = -b.y / len;
  let shade = ctx.createRadialGradient(b.x + lx * r * 0.45, b.y + ly * r * 0.45, r * 0.1, b.x, b.y, r);
  shade.addColorStop(0, '#ffffff');
  shade.addColorStop(0.25, pl.color);
  shade.addColorStop(1, 'rgba(10,10,20,1)');
  ctx.fillStyle = shade;
  ctx.beginPath(); ctx.arc(b.x, b.y, r, 0, TWO_PI); ctx.fill();

  if (pl.ring) drawRing(ctx, b.x, b.y, r, pl.color, false);

  // Moons
  for (let m = 0; m < pl.moons; m++) {
    let ma = t * (pl.speed * 3 + 4 + m * 3) + pl.moonPhase + m * 2;
    let mr = r * (1.9 + m * 0.8);
    let mx = b.x + Math.cos(ma) * mr, my = b.y + Math.sin(ma) * mr * tilt;
    let mz = Math.sin(ma);
    ctx.fillStyle = mz >= 0 ? 'rgba(235,235,245,0.95)' : 'rgba(150,150,165,0.8)';
    ctx.beginPath(); ctx.arc(mx, my, Math.max(0.8, r * 0.22), 0, TWO_PI); ctx.fill();
  }
}

function drawRing(ctx, x, y, r, color, backHalf) {
  ctx.strokeStyle = rgbaOf(color, 0.7);
  ctx.lineWidth = Math.max(1, r * 0.25);
  ctx.beginPath();
  ctx.ellipse(x, y, r * 1.9, r * 1.9 * tilt * 0.9, -0.2, backHalf ? Math.PI : 0, backHalf ? TWO_PI : Math.PI);
  ctx.stroke();
}`, { maxFrames: 360 }),

orbital_rings: preset(`
let rings = 6;            // nested rings {slide:1,12} {incr:1} {limlow:1} {limhigh:40}
let size = 0.88;          // size of the biggest ring {slide:0.3,1.2} {incr:0.02}
let beadsPerRing = 2;     // glowing beads travelling along each ring {slide:0,8} {incr:1} {limlow:0} {limhigh:30}
let lineWidth = 1.8;      // {slide:0.4,6} {incr:0.1} {limlow:0.1}
let coreSize = 14;        // glowing centre (px at 300px canvas) {slide:0,50} {incr:1} {limlow:0}
let hueStart = 190;       // colour of the outer ring {slide:0,360} {incr:5}
let hueSpread = 160;      // colour change towards the inner rings {slide:0,360} {incr:5}

let ringData = [];

// Every ring gets its own tilt and whole-number spin speeds, so the loop is seamless
function setup() {
  for (let k = 0; k < rings; k++) {
    ringData.push({
      tiltX: random(TWO_PI), tiltY: random(TWO_PI),
      spinX: floor(random(1, 3)) * (random() < 0.5 ? -1 : 1),
      spinY: floor(random(1, 3)) * (random() < 0.5 ? -1 : 1),
      beadSpeed: floor(random(1, 4)) * (random() < 0.5 ? -1 : 1),
      beadPhase: random(TWO_PI)
    });
  }
}

function hsla(h, l, a) { return 'hsla(' + (((h % 360) + 360) % 360).toFixed(1) + ',85%,' + l + '%,' + a + ')'; }

// A point on a flat circle, turned around the X and then the Y axis; z > 0 is towards the viewer
function ringPoint(a, rad, ax, ay) {
  let x = Math.cos(a) * rad, y = Math.sin(a) * rad, z = 0;
  let y1 = y * Math.cos(ax) - z * Math.sin(ax), z1 = y * Math.sin(ax) + z * Math.cos(ax);
  let x2 = x * Math.cos(ay) + z1 * Math.sin(ay), z2 = -x * Math.sin(ay) + z1 * Math.cos(ay);
  return [x2, y1, z2 / rad];
}

function draw() {
  let ctx = drawingContext;
  let s = min(width, height) / 300;
  let t = progress * TWO_PI;
  let maxR = min(width, height) / 2 * size;
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';

  // Back halves of the rings and beads first, then the core, then the front halves
  let parts = [];
  for (let k = 0; k < ringData.length; k++) {
    let rd = ringData[k];
    let rad = maxR * (1 - k / Math.max(rings, 1) * 0.75);
    let ax = rd.tiltX + t * rd.spinX, ay = rd.tiltY + t * rd.spinY;
    let hue = hueStart + hueSpread * k / Math.max(1, rings - 1);
    let segs = 96, prev = ringPoint(0, rad, ax, ay);
    for (let i = 1; i <= segs; i++) {
      let q = ringPoint(i / segs * TWO_PI, rad, ax, ay);
      parts.push({ z: (prev[2] + q[2]) / 2, line: [prev, q], hue });
      prev = q;
    }
    for (let b = 0; b < beadsPerRing; b++) {
      let q = ringPoint(rd.beadPhase + b * TWO_PI / beadsPerRing + t * rd.beadSpeed, rad, ax, ay);
      parts.push({ z: q[2], bead: q, hue });
    }
  }
  let drawPart = pt => {
    let near = (pt.z + 1) / 2;                       // 0 = far side, 1 = near side
    if (pt.line) {
      ctx.strokeStyle = hsla(pt.hue, 45 + 20 * near, 0.25 + 0.7 * near);
      ctx.lineWidth = lineWidth * s * (0.6 + 0.6 * near);
      ctx.beginPath();
      ctx.moveTo(pt.line[0][0], pt.line[0][1]);
      ctx.lineTo(pt.line[1][0], pt.line[1][1]);
      ctx.stroke();
    } else {
      let r = (2 + 2.5 * near) * s;
      let g = ctx.createRadialGradient(pt.bead[0], pt.bead[1], 0, pt.bead[0], pt.bead[1], r * 3);
      g.addColorStop(0, hsla(pt.hue, 85, 0.95));
      g.addColorStop(1, hsla(pt.hue, 60, 0));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(pt.bead[0], pt.bead[1], r * 3, 0, TWO_PI); ctx.fill();
    }
  };
  parts.filter(pt => pt.z < 0).forEach(drawPart);

  if (coreSize > 0) {
    let cr = coreSize * s * (1 + 0.08 * Math.sin(t * 3));
    let g = ctx.createRadialGradient(0, 0, 0, 0, 0, cr * 2.5);
    g.addColorStop(0, 'rgba(255,255,255,0.95)');
    g.addColorStop(0.3, hsla(hueStart, 80, 0.6));
    g.addColorStop(1, hsla(hueStart, 60, 0));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0, 0, cr * 2.5, 0, TWO_PI); ctx.fill();
  }
  parts.filter(pt => pt.z >= 0).forEach(drawPart);
  ctx.restore();
}`, { maxFrames: 360 }),

ripple_effect: preset(`
let ripples = 9;
let lineWeight = 4;
let baseHue = 190;

function draw() {
  let maxR = dist(0, 0, width, height) / 2;
  let s = min(width, height) / 300;
  translate(width / 2, height / 2);
  noFill();

  for (let k = 0; k < ripples; k++) {
    let ph = ((k / ripples + progress) % 1);
    let r = ph * maxR;
    let alpha = min(1, ph * 8) * (1 - ph) * 100;
    strokeWeight(lineWeight * s * (1.2 - ph));
    stroke((baseHue + ph * 70) % 360, 70, 100, alpha);
    circle(0, 0, r * 2);
    // inner echo
    stroke((baseHue + ph * 70) % 360, 40, 100, alpha * 0.35);
    strokeWeight(1);
    circle(0, 0, r * 1.8);
  }

  // Drop in the middle
  noStroke();
  let d = 1 - abs(sin(progress * PI * ripples));
  fill(baseHue, 50, 100, 60 * d);
  circle(0, 0, 14 * s * d);
}`, { maxFrames: 360 }),

flower_circles: preset(`
let sets = 3;             // overlapping sets of rings {slide:2,6} {incr:1}
let ringSpacing = 13;     // gap between rings (px at 300px canvas) {slide:4,30} {incr:0.5} {limlow:1}
let lineWidth = 1.6;      // {slide:0.5,6} {incr:0.1}
let wobble = 38;          // how far each set's centre drifts (px) {slide:0,100} {incr:1}
let flowPerLoop = 3;      // rings flowing outward per loop (whole number) {incr:1}
let dancesPerLoop = 1;    // laps of the centres per loop (whole number) {incr:1}
let color1 = '#ff3b6b';   // {color}
let color2 = '#3bff9d';   // {color}
let color3 = '#4b7bff';   // {color}
let extraColor = '#ffd23b'; // used by sets 4 and up {color}

function draw() {
  let ctx = drawingContext;
  let s = min(width, height) / 300;
  let gap = ringSpacing * s;
  let maxR = dist(0, 0, width, height) / 2 + wobble * s + gap;
  let t = progress * TWO_PI;
  let colors = [color1, color2, color3];

  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.globalCompositeOperation = 'lighter';     // overlapping colours add up
  ctx.lineWidth = lineWidth * s;

  for (let k = 0; k < sets; k++) {
    // Each set's centre circles the middle; neighbours go opposite ways
    let dir = k % 2 ? -1 : 1;
    let a = dir * t * dancesPerLoop + k * TWO_PI / sets;
    let cx = Math.cos(a) * wobble * s;
    let cy = Math.sin(a * 2) * wobble * s * 0.6;
    ctx.strokeStyle = colors[k] || extraColor;
    ctx.globalAlpha = 0.9;

    // Rings flow outward; shifting by whole ring gaps keeps the loop seamless
    let shift = (progress * flowPerLoop % 1) * gap;
    ctx.beginPath();
    for (let r = shift; r < maxR; r += gap) {
      if (r < 0.5) continue;
      ctx.moveTo(cx + r, cy);
      ctx.arc(cx, cy, r, 0, TWO_PI);
    }
    ctx.stroke();
  }

  // Soft fade towards the edges
  ctx.globalCompositeOperation = 'destination-out';
  ctx.globalAlpha = 1;
  let edge = min(width, height) / 2;
  let fade = ctx.createRadialGradient(0, 0, edge * 0.55, 0, 0, edge * 1.25);
  fade.addColorStop(0, 'rgba(0,0,0,0)');
  fade.addColorStop(1, 'rgba(0,0,0,1)');
  ctx.fillStyle = fade;
  ctx.fillRect(-width, -height, width * 2, height * 2);
  ctx.restore();
}`, { maxFrames: 360 }),

// --------------------------------------------------------------------- Objects
stopwatch: preset(`
let swingsPerLoop = 3;     // full back-and-forth swings per loop
let swingAngle = 32;       // degrees
let pivotHeight = -10;    // height of the top tip (px at 300px canvas); negative = above the canvas, out of view. The object stays put {incr:5}
let chainLinks = 14;

function draw() {
  let s = min(width, height) / 300;
  let watchSize = 100 * s;
  let pivotX = width / 2, pivotY = pivotHeight * s;
  let len = height * 0.6 - 10 * s - pivotY;      // longer rod when the pivot moves up
  // Same side-to-side swing as with the default pivot: a longer rod swings through a smaller angle
  let swingAmp = Math.asin(Math.min(1, height * 0.6 * Math.sin(radians(swingAngle)) / Math.max(1, len)));
  let angle = swingAmp * sin(progress * TWO_PI * swingsPerLoop);

  push();
  translate(pivotX, pivotY);
  rotate(-angle);              // whole pendulum hangs along the chain
  drawChain(len - watchSize / 2, s);
  translate(0, len);
  drawWatch(watchSize, s);
  pop();
}

function drawChain(chainLen, s) {
  let step = chainLen / chainLinks;
  noFill();
  for (let i = 0; i < chainLinks; i++) {
    let y = i * step + step / 2;
    strokeWeight(2.5 * s);
    stroke(42, 85, 60);
    if (i % 2 === 0) ellipse(0, y, 7 * s, step * 1.25);
    else ellipse(0, y, 3 * s, step * 1.25);
    strokeWeight(1 * s);
    stroke(50, 50, 100);
    if (i % 2 === 0) ellipse(-0.6 * s, y, 5 * s, step * 1.1);
  }
}

function drawWatch(size, s) {
  // Crown / bow
  noFill();
  stroke(45, 80, 80);
  strokeWeight(3 * s);
  circle(0, -size / 2 - 7 * s, 12 * s);
  fill(45, 80, 75);
  noStroke();
  rect(-5 * s, -size / 2 - 6 * s, 10 * s, 8 * s, 2 * s);

  // Case
  fill(42, 85, 62);
  stroke(48, 80, 90);
  strokeWeight(3 * s);
  circle(0, 0, size);
  fill(48, 80, 85);
  stroke(52, 60, 98);
  strokeWeight(2 * s);
  circle(0, 0, size - 14 * s);

  // Face
  noStroke();
  fill(45, 12, 98);
  circle(0, 0, size - 24 * s);

  // Hour markers
  stroke(25, 80, 30);
  strokeWeight(2 * s);
  for (let i = 0; i < 12; i++) {
    let a = i * TWO_PI / 12;
    let r1 = size / 2 - 16 * s, r2 = size / 2 - 21 * s;
    line(cos(a) * r1, sin(a) * r1, cos(a) * r2, sin(a) * r2);
  }

  fill(25, 80, 30);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(10 * s);
  textStyle(BOLD);
  let nr = size / 2 - 30 * s;
  text('XII', 0, -nr);
  text('III', nr, 0);
  text('VI', 0, nr);
  text('IX', -nr, 0);

  // Hands: fixed at 10:10, seconds hand sweeps once per loop
  stroke(25, 80, 25);
  strokeCap(ROUND);
  strokeWeight(3.5 * s);
  line(0, 0, cos(radians(305)) * 16 * s, sin(radians(305)) * 16 * s);
  strokeWeight(2.5 * s);
  line(0, 0, cos(radians(-30)) * 26 * s, sin(radians(-30)) * 26 * s);
  stroke(0, 85, 75);
  strokeWeight(1.2 * s);
  let secA = progress * TWO_PI - HALF_PI;
  line(0, 0, cos(secA) * 30 * s, sin(secA) * 30 * s);
  noStroke();
  fill(25, 80, 25);
  circle(0, 0, 6 * s);

  // Glass reflection
  fill(0, 0, 100, 22);
  ellipse(-size / 6, -size / 5, size / 3, size / 4);
}`, { maxFrames: 360 }),

pendulum: preset(`
let swingsPerLoop = 3;
let swingAngle = 36;    // degrees {slide:0,80} {incr:1}
let pivotHeight = 12;     // height of the top tip (px at 300px canvas); negative = above the canvas, out of view. The object stays put {incr:5}
let bobSize = 70;
let ghosts = 0;         // motion-blur copies (e.g. 4) - looks nice, but makes GIFs bigger

function draw() {
  let s = min(width, height) / 300;
  let pivotX = width / 2, pivotY = pivotHeight * s;
  let len = height * 0.68 + 12 * s - pivotY;     // longer rod when the pivot moves up
  // Same side-to-side swing as with the default pivot: a longer rod swings through a smaller angle
  let swingAmp = Math.asin(Math.min(1, height * 0.68 * Math.sin(radians(swingAngle)) / Math.max(1, len)));

  for (let g = ghosts; g >= 0; g--) {
    let p = progress - g * 0.006;
    let a = swingAmp * sin(p * TWO_PI * swingsPerLoop);
    let bx = pivotX + len * sin(a);
    let by = pivotY + len * cos(a);
    let alpha = g ? 18 : 100;

    stroke(0, 0, 75, alpha);
    strokeWeight(2.5 * s);
    line(pivotX, pivotY, bx, by);

    noStroke();
    fill(215, 70, 85, alpha);
    circle(bx, by, bobSize * s);
    if (!g) {
      fill(215, 30, 100, 60);
      circle(bx - bobSize * s * 0.18, by - bobSize * s * 0.18, bobSize * s * 0.3);
    }
  }

  fill(0, 0, 85);
  circle(pivotX, pivotY, 10 * s);
}`, { maxFrames: 360 }),

spiral_pendulum: preset(`
let swingsPerLoop = 2;    // full back-and-forth swings per loop (whole number) {incr:1}
let swingAngle = 30;      // degrees {slide:0,70} {incr:1}
let pivotHeight = 10;     // height of the top tip (px at 300px canvas); negative = above the canvas, out of view. The object stays put {incr:5}
let spinsPerLoop = 3;     // turns of the spiral per loop (whole number, negative = other way) {incr:1}
let discSize = 92;        // diameter of the disc (px at 300px canvas) {slide:30,200} {incr:2} {limlow:10}
let discHeight = 0.58;    // how far down the disc hangs, as a share of the canvas height {slide:0.2,0.9} {incr:0.02} {limlow:0.05}
let arms = 2;             // arms of each colour {slide:1,6} {incr:1} {limlow:1}
let bandWidth = 7;        // thickness of the spiral bands (px at 300px canvas) {incr:0.5} {limlow:1}
let lightColor = '#f4f4f4';  // {color}
let darkColor = '#111111';   // {color}
let rimColor = '#c9a24a';    // metal rim and fittings {color}
let rodColor = '#9a9a9a';    // {color}

function draw() {
  let s = min(width, height) / 300;
  let ctx = drawingContext;
  let r = discSize * s / 2;
  let pivotX = width / 2, pivotY = pivotHeight * s;
  let len = height * discHeight + 10 * s - pivotY;   // longer rod when the pivot moves up
  // Same side-to-side swing as with the default pivot: a longer rod swings through a smaller angle
  let swingAmp = Math.asin(Math.min(1, height * discHeight * Math.sin(radians(swingAngle)) / Math.max(1, len)));
  let angle = swingAmp * Math.sin(progress * TWO_PI * swingsPerLoop);

  push();
  translate(pivotX, pivotY);
  rotate(-angle);                     // rod and disc hang along the swing

  // Rod
  stroke(rodColor);
  strokeWeight(2.5 * s);
  line(0, 0, 0, len - r);

  // Ring that joins the rod to the disc
  noFill();
  stroke(rimColor);
  strokeWeight(2.5 * s);
  circle(0, len - r - 3 * s, 8 * s);

  translate(0, len);

  // Rim
  noStroke();
  fill(rimColor);
  circle(0, 0, r * 2 + 6 * s);
  fill(0, 0, 0, 35);
  circle(1.5 * s, 2 * s, r * 2);

  // Spiral, clipped to the disc
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, TWO_PI);
  ctx.clip();
  fill(darkColor);
  circle(0, 0, r * 2 + 2);
  drawSpiral(r, s, progress * TWO_PI * spinsPerLoop);
  ctx.restore();

  pop();

  // Pivot
  noStroke();
  fill(rimColor);
  circle(pivotX, pivotY, 9 * s);
}

// Two-tone spiral whose bands interlock at the centre
function drawSpiral(R, s, rot) {
  let band = bandWidth * s;
  let c = band * arms / PI;              // r = c * angle
  let maxU = (R + band * 2) / c;
  let step = 0.05;
  noStroke();
  fill(lightColor);
  for (let k = 0; k < arms; k++) {
    let off = k * TWO_PI / arms + rot;
    beginShape();
    for (let u = 0; u <= maxU; u += step) vertex(Math.cos(u + off) * c * u, Math.sin(u + off) * c * u);
    for (let u = maxU; u >= -PI / arms; u -= step) {
      let rr = Math.max(0, c * u + band);
      vertex(Math.cos(u + off) * rr, Math.sin(u + off) * rr);
    }
    vertex(0, 0);
    endShape(CLOSE);
  }
}`, { maxFrames: 360 }),

mandala: preset(`
let baseHue = 35;          // starting colour (gold); the palette drifts once per loop
let hueDrift = 360;        // how far the palette travels per loop (0 = fixed colours)
let breathsPerLoop = 2;
let lineWeight = 1.2;

function draw() {
  let s = min(width, height) / 300;
  let t = progress * TWO_PI;
  let breath = sin(t * breathsPerLoop);
  let h0 = baseHue + progress * hueDrift;
  let hue = k => ((h0 + k) % 360 + 360) % 360;
  translate(width / 2, height / 2);
  scale(s * (1 + 0.03 * breath));
  strokeJoin(ROUND);

  // Soft glow behind everything
  noStroke();
  for (let g = 8; g > 0; g--) {
    fill(hue(0), 60, 40, 5);
    circle(0, 0, g * 36);
  }

  // 1. Outer dot ring
  ring(48, 1, t, () => {
    fill(hue(0), 30, 100, 80);
    circle(0, -138, 3.2);
    fill(hue(180), 50, 100, 60);
    circle(0, -128, 1.8);
  });

  // 2. Outer pointed petals
  ring(16, -1, t, () => {
    petal(52 + 4 * breath, 34, 74, hue(0), 70);
    petal(36 + 3 * breath, 18, 80, hue(30), 85);
    stroke(hue(0), 30, 100, 80);
    strokeWeight(lineWeight * 0.7);
    line(0, -78, 0, -112 - 4 * breath);
  });

  // 3. Scalloped ring
  noFill();
  ring(24, 1, t, () => {
    stroke(hue(200), 50, 100, 85);
    strokeWeight(lineWeight);
    arc(0, -72, 20, 14, 0, PI);
    noStroke();
    fill(hue(200), 40, 100, 90);
    circle(0, -62, 2.6);
  });

  // 4. Middle rounded petals with inner petal
  ring(12, -1, t, () => {
    roundPetal(44 + 3 * breath, 26, 24, hue(300), 65);
    roundPetal(28 + 2 * breath, 14, 28, hue(330), 85);
    noStroke();
    fill(hue(60), 30, 100, 90);
    circle(0, -58 - 2 * breath, 3.5);
  });

  // 5. Diamond ring
  ring(24, 1, t, () => {
    noStroke();
    fill(hue(150), 60, 95, 90);
    quad(0, -24, 3.5, -19, 0, -14, -3.5, -19);
  });

  // 6. Inner lotus
  ring(8, -1, t, () => {
    petal(20 + 2 * breath, 12, 2, hue(20), 90);
  });

  // 7. Centre
  noFill();
  stroke(hue(180), 40, 100, 90);
  strokeWeight(lineWeight);
  circle(0, 0, 18 + 2 * breath);
  noStroke();
  fill(hue(40), 50, 100);
  circle(0, 0, 9 + 2 * breath);
  fill(0, 0, 100, 80);
  circle(0, 0, 3);
}

// Draws one element 'count' times around the circle. The ring turns by exactly
// one symmetry step per loop (dir = 1 / -1), which keeps the loop seamless.
function ring(count, dir, t, drawOne) {
  push();
  rotate(dir * t / count);
  for (let i = 0; i < count; i++) {
    push();
    rotate(i * TWO_PI / count);
    drawOne();
    pop();
  }
  pop();
}

// Pointed petal starting at distance 'start' from the centre, pointing outwards
function petal(len, wid, start, h, a) {
  fill(h, 70, 90, a * 0.55);
  stroke(h, 40, 100, a);
  strokeWeight(lineWeight);
  beginShape();
  vertex(0, -start);
  bezierVertex(wid * 0.6, -start - len * 0.25, wid * 0.45, -start - len * 0.75, 0, -start - len);
  bezierVertex(-wid * 0.45, -start - len * 0.75, -wid * 0.6, -start - len * 0.25, 0, -start);
  endShape(CLOSE);
  stroke(h, 20, 100, a * 0.6);
  strokeWeight(lineWeight * 0.6);
  line(0, -start - len * 0.15, 0, -start - len * 0.8);
}

// Rounded (tear-drop) petal
function roundPetal(len, wid, start, h, a) {
  fill(h, 65, 90, a * 0.5);
  stroke(h, 35, 100, a);
  strokeWeight(lineWeight);
  beginShape();
  vertex(0, -start);
  bezierVertex(wid, -start - len * 0.2, wid * 0.8, -start - len, 0, -start - len);
  bezierVertex(-wid * 0.8, -start - len, -wid, -start - len * 0.2, 0, -start);
  endShape(CLOSE);
}`, { maxFrames: 480 }),

particules: preset(`
let count = 260;
let curl = 2.2;          // how much each particle swirls on its way out
let parts = [];

function setup() {
  for (let i = 0; i < count; i++) {
    parts.push({
      a: random(TWO_PI),
      speed: random(0.55, 1),
      offset: random(),
      size: random(2, 6),
      hue: random(170, 320)
    });
  }
}

function draw() {
  let maxR = dist(0, 0, width, height) / 2;
  let s = min(width, height) / 300;
  translate(width / 2, height / 2);
  noStroke();

  for (let q of parts) {
    let ph = (progress + q.offset) % 1;
    let r = pow(ph, 1.4) * maxR * q.speed * 1.2;
    let a = q.a + ph * curl;
    let alpha = sin(ph * PI) * 100;
    fill(q.hue, 70, 100, alpha);
    circle(cos(a) * r, sin(a) * r, q.size * s * (0.4 + ph));
  }
}`, { maxFrames: 360 }),

coin: preset(`
let swingsPerLoop = 3;
let swingAngle = 40;     // degrees
let pivotHeight = 0;      // height of the top tip (px at 300px canvas); negative = above the canvas, out of view. The object stays put {incr:5}
let coinSize = 120;

function draw() {
  let s = min(width, height) / 300;
  let size = coinSize * s;
  let pivotX = width / 2, pivotY = pivotHeight * s;
  let len = height * 0.62 - pivotY;              // longer string when the pivot moves up
  // Same side-to-side swing as with the default pivot: a longer rod swings through a smaller angle
  let swingAmp = Math.asin(Math.min(1, height * 0.62 * Math.sin(radians(swingAngle)) / Math.max(1, len)));
  let angle = swingAmp * sin(progress * TWO_PI * swingsPerLoop + PI);

  push();
  translate(pivotX, pivotY);
  rotate(-angle);
  drawString(len - size / 2, s);
  translate(0, len);
  drawCoin(size, s);
  pop();

  // Pivot
  noStroke();
  fill(30, 70, 45);
  circle(pivotX, pivotY, 16 * s);
  fill(25, 80, 25);
  circle(pivotX, pivotY, 6 * s);
}

function drawString(l, s) {
  stroke(0, 85, 65);
  strokeWeight(4 * s);
  line(0, 0, 0, l);
  stroke(10, 70, 85);
  strokeWeight(1.2 * s);
  for (let y = 4 * s; y < l; y += 8 * s) line(-1.5 * s, y, 1.5 * s, y + 4 * s);
  // knot
  noStroke();
  fill(0, 90, 55);
  ellipse(0, l, 11 * s, 9 * s);
}

function drawCoin(size, s) {
  let hole = size / 4;
  noStroke();
  fill(35, 90, 15, 40);
  circle(3 * s, 3 * s, size + 6 * s);

  fill(42, 85, 65);
  stroke(38, 90, 55);
  strokeWeight(3 * s);
  circle(0, 0, size);
  fill(45, 80, 78);
  stroke(48, 75, 88);
  strokeWeight(2 * s);
  circle(0, 0, size - 12 * s);

  // Rim dots and rings
  noStroke();
  fill(48, 70, 92);
  for (let i = 0; i < 16; i++) {
    let a = i * TWO_PI / 16;
    circle(cos(a) * (size / 2 - 15 * s), sin(a) * (size / 2 - 15 * s), 3 * s);
  }
  noFill();
  stroke(48, 70, 92);
  strokeWeight(1 * s);
  circle(0, 0, size / 2.5);

  // Four characters (stylised)
  noStroke();
  fill(30, 95, 32);
  let o = size / 3.4;
  rectMode(CENTER);
  rect(0, -o, 4 * s, 13 * s, 1);  rect(0, -o - 2 * s, 11 * s, 3 * s, 1);
  rect(0, o, 12 * s, 3 * s, 1);   rect(0, o + 4 * s, 3 * s, 8 * s, 1);
  rect(-o, 0, 3 * s, 12 * s, 1);  rect(-o, 0, 10 * s, 3 * s, 1);
  rect(o, 0, 9 * s, 9 * s, 2);

  // Square hole: actually cut out, so the background shows through
  erase();
  rect(0, 0, hole, hole);
  noErase();
  noFill();
  stroke(30, 70, 30);
  strokeWeight(1.5 * s);
  rect(0, 0, hole, hole);
  rectMode(CORNER);

  // Shine
  noStroke();
  fill(50, 40, 100, 40);
  ellipse(-size / 4, -size / 4, size / 3, size / 4);
}`, { maxFrames: 360 }),

pendant: preset(`
let swingsPerLoop = 3;
let swingAngle = 30;      // degrees
let pivotHeight = 0;      // height of the top tip (px at 300px canvas); negative = above the canvas, out of view. The object stays put {incr:5}
let rotationMomentum = 1; // extra crystal tilt
let chainLinks = 10;
let crystalSize = 60;

function draw() {
  let s = min(width, height) / 300;
  let w = crystalSize * s, h = crystalSize * 2 * s;
  let pivotX = width / 2, pivotY = pivotHeight * s;
  let len = height * 0.55 - pivotY;              // longer chain when the pivot moves up
  // Same side-to-side swing as with the default pivot: a longer rod swings through a smaller angle
  let swingAmp = Math.asin(Math.min(1, height * 0.55 * Math.sin(radians(swingAngle)) / Math.max(1, len)));
  let angle = swingAmp * sin(progress * TWO_PI * swingsPerLoop);
  let bobX = pivotX + len * sin(angle);
  let bobY = pivotY + len * cos(angle);

  stroke(40, 30, 80);
  strokeWeight(2.5 * s);
  line(pivotX, pivotY, bobX, bobY);
  noStroke();
  fill(40, 30, 90);
  for (let i = 1; i < chainLinks; i++) {
    ellipse(lerp(pivotX, bobX, i / chainLinks), lerp(pivotY, bobY, i / chainLinks), 4 * s, 6 * s);
  }

  push();
  translate(bobX, bobY);
  rotate(-angle * rotationMomentum);
  translate(0, h / 2);

  fill(200, 60, 90, 75);
  stroke(200, 80, 95);
  strokeWeight(2 * s);
  quad(0, -h / 2, w / 2, 0, 0, h / 2, -w / 2, 0);

  noStroke();
  fill(180, 40, 100, 55);
  quad(0, -h / 3, w / 3, 0, 0, h / 3, -w / 3, 0);

  stroke(200, 30, 100, 80);
  strokeWeight(1 * s);
  line(0, -h / 2, 0, h / 2);
  line(-w / 2, 0, w / 2, 0);

  // Sparkles (3 orbits per loop)
  for (let i = 0; i < 3; i++) {
    let a = i * TWO_PI / 3 + progress * TWO_PI * 3;
    let sx = cos(a) * w / 4, sy = sin(a) * h / 6;
    let tw = pow(abs(sin(progress * TWO_PI * 6 + i)), 4);
    stroke(60, 30, 100, 80 * tw);
    strokeWeight(1 * s);
    line(sx - 4 * s, sy, sx + 4 * s, sy);
    line(sx, sy - 4 * s, sx, sy + 4 * s);
  }
  pop();

  noStroke();
  fill(40, 30, 85);
  ellipse(pivotX, pivotY, 12 * s, 8 * s);       // mounting point (hidden when the pivot is above the canvas)
}`, { maxFrames: 360 }),

metronome: preset(`
let beatsPerLoop = 6;      // ticks per loop (even number keeps it seamless) {incr:2}
let swingAngle = 24;       // degrees
let weightPosition = 0.5;  // 0 = pivot, 1 = tip of the rod
let woodLight = '#9a5a2c';  // wood colour {color}
let woodMid = '#6e3818';  // wood colour {color}
let woodDark = '#3a1a08';  // wood colour {color}

function draw() {
  let s = min(width, height) / 300;
  let cx = width / 2;
  let B = height * 0.93;                     // bottom of the plinth
  let bodyBottom = B - 14 * s, bodyTop = B - 244 * s;
  let halfBottom = 75 * s, halfTop = 15 * s;
  let halfAt = y => lerp(halfBottom, halfTop, (bodyBottom - y) / (bodyBottom - bodyTop));
  let panelTop = B - 92 * s;                 // top edge of the lower front panel
  let pivotY = B - 78 * s;
  let ctx = drawingContext;

  // Ground shadow
  noStroke();
  fill(0, 0, 0, 35);
  ellipse(cx + 6 * s, B + 2 * s, 210 * s, 14 * s);

  // Plinth
  woodFill(ctx, cx - 88 * s, cx + 88 * s);
  rect(cx - 88 * s, B - 14 * s, 176 * s, 14 * s, 2 * s);
  fill(30, 50, 75, 60);
  rect(cx - 88 * s, B - 14 * s, 176 * s, 2.5 * s);

  // Pyramid case
  woodFill(ctx, cx - halfBottom, cx + halfBottom);
  quad(cx - halfTop, bodyTop, cx + halfTop, bodyTop, cx + halfBottom, bodyBottom, cx - halfBottom, bodyBottom);

  // Recessed opening with the tempo scale
  let openTop = bodyTop + 20 * s;
  let inset = 11 * s;
  fill(15, 70, 12);
  quad(cx - halfAt(openTop) + inset, openTop, cx + halfAt(openTop) - inset, openTop,
       cx + halfAt(panelTop) - inset, panelTop, cx - halfAt(panelTop) + inset, panelTop);
  fill(0, 0, 0, 30);                         // inner shadow along the top/left
  quad(cx - halfAt(openTop) + inset, openTop, cx + halfAt(openTop) - inset, openTop,
       cx + halfAt(openTop) - inset, openTop + 4 * s, cx - halfAt(openTop + 4 * s) + inset + 3 * s, openTop + 4 * s);

  let scaleTop = openTop + 8 * s, scaleBottom = panelTop - 4 * s;
  fill(42, 18, 94);
  quad(cx - 5 * s, scaleTop, cx + 5 * s, scaleTop, cx + 9 * s, scaleBottom, cx - 9 * s, scaleBottom);
  let tempos = [208, 176, 144, 120, 100, 84, 72, 60, 50, 40];
  textAlign(LEFT, CENTER);
  textSize(5.5 * s);
  textStyle(NORMAL);
  for (let i = 0; i < tempos.length; i++) {
    let y = lerp(scaleTop + 6 * s, scaleBottom - 6 * s, i / (tempos.length - 1));
    stroke(20, 60, 25);
    strokeWeight(0.7 * s);
    line(cx - 7 * s, y, cx - 3 * s, y);
    noStroke();
    fill(20, 60, 22);
    text(tempos[i], cx - 1.5 * s, y);
  }

  // Pendulum (rod pivots behind the lower panel)
  let a = radians(swingAngle) * sin(progress * PI * beatsPerLoop);
  let rodLen = 192 * s;
  push();
  translate(cx, pivotY);
  rotate(a);
  stroke(0, 0, 25);
  strokeWeight(3.2 * s);
  line(0, 0, 0, -rodLen);
  stroke(0, 0, 85);
  strokeWeight(1.4 * s);
  line(-0.6 * s, 0, -0.6 * s, -rodLen);
  noStroke();
  fill(0, 0, 80);
  circle(0, -rodLen, 4 * s);

  // Sliding weight
  let wy = -rodLen * weightPosition;
  fill(0, 0, 30);
  quad(-11 * s, wy - 9 * s, 11 * s, wy - 9 * s, 13 * s, wy + 9 * s, -13 * s, wy + 9 * s);
  fill(0, 0, 62);
  quad(-10 * s, wy - 8 * s, 10 * s, wy - 8 * s, 12 * s, wy + 8 * s, -12 * s, wy + 8 * s);
  fill(0, 0, 92, 70);
  quad(-8 * s, wy - 7 * s, -4 * s, wy - 7 * s, -5 * s, wy + 7 * s, -10 * s, wy + 7 * s);
  fill(0, 0, 20);
  rect(-12 * s, wy - 0.6 * s, 4 * s, 1.2 * s);   // reading notch
  pop();

  // Lower front panel hides the pivot
  woodFill(ctx, cx - halfBottom, cx + halfBottom);
  quad(cx - halfAt(panelTop), panelTop, cx + halfAt(panelTop), panelTop,
       cx + halfBottom, bodyBottom, cx - halfBottom, bodyBottom);
  fill(30, 40, 80, 45);
  quad(cx - halfAt(panelTop), panelTop, cx + halfAt(panelTop), panelTop,
       cx + halfAt(panelTop + 2 * s), panelTop + 2 * s, cx - halfAt(panelTop + 2 * s), panelTop + 2 * s);

  // Brass plate
  fill(42, 70, 75);
  rect(cx - 22 * s, B - 52 * s, 44 * s, 12 * s, 2 * s);
  fill(45, 40, 100, 50);
  rect(cx - 21 * s, B - 51 * s, 42 * s, 3 * s, 1.5 * s);

  // Winding key on the right side
  let kx = cx + halfAt(B - 45 * s);
  fill(42, 65, 70);
  rect(kx, B - 47 * s, 7 * s, 4 * s);
  ellipse(kx + 11 * s, B - 45 * s, 8 * s, 14 * s);
  fill(42, 40, 95, 60);
  ellipse(kx + 10 * s, B - 47 * s, 3 * s, 6 * s);

  // Top cap
  woodFill(ctx, cx - halfTop - 3 * s, cx + halfTop + 3 * s);
  rect(cx - halfTop - 3 * s, bodyTop - 6 * s, (halfTop + 3 * s) * 2, 6 * s, 2 * s);
}

// Horizontal wood gradient: lit from the left
function woodFill(ctx, x0, x1) {
  fill(0);
  let g = ctx.createLinearGradient(x0, 0, x1, 0);
  g.addColorStop(0, woodLight);
  g.addColorStop(0.45, woodMid);
  g.addColorStop(1, woodDark);
  ctx.fillStyle = g;
}`, { maxFrames: 360 }),

// --------------------------------------------------------------------- Chill
waves: preset(`
let lineGap = 16;         // gap between lines {limlow:1} {incr:1}
let lineWeight = 17;      // thicker than the gap: lines blend into smooth colour in places {limlow:0} {incr:1}

function draw() {
  let t = progress * TWO_PI;
  strokeWeight(lineWeight);
  noFill();

  // Start and end a few lines past the edges so the wave dips never leave a gap
  let margin = Math.ceil((20 + lineWeight) / lineGap) * lineGap;
  for (let y = -margin; y < height + margin; y += lineGap) {
    stroke((180 + 60 * sin(t + y * 0.01) + 360) % 360, 100, 100);
    beginShape();
    for (let x = 0; x <= width + 5; x += 5) {
      vertex(x, y + sin(x * 0.02 + t + y * 0.003) * 20);
    }
    endShape();
  }
}`, { maxFrames: 360, speed: 0.5 }),

night_sky: preset(`
let starCount = 250;
let skyHeight = 0.75;       // portion of the canvas that has stars
let shootingStar = true;
let stars = [];

function setup() {
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: random(width),
      y: pow(random(), 1.4) * height * skyHeight,
      size: random(0.8, 2.6),
      base: random(35, 85),
      speed: floor(random(1, 5)),     // twinkles per loop
      phase: random(TWO_PI),
      sharp: random() < 0.15,         // some stars blink hard
      hue: random() < 0.2 ? random(20, 50) : random(200, 230)
    });
  }
}

function draw() {
  let ctx = drawingContext;
  let g = ctx.createLinearGradient(0, 0, 0, height);
  g.addColorStop(0, '#02030d');
  g.addColorStop(0.7, '#0b1233');
  g.addColorStop(1, '#1d1838');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);

  let t = progress * TWO_PI;
  noStroke();
  for (let st of stars) {
    let tw = sin(t * st.speed + st.phase);
    if (st.sharp) tw = pow(abs(tw), 6) * 2 - 1;
    fill(st.hue, 25, 100, constrain(st.base + tw * 30, 5, 100));
    circle(st.x, st.y, st.size);
  }

  if (shootingStar) {
    let ph = (progress * 2) % 1;          // two per loop
    if (ph < 0.18) {
      let k = ph / 0.18;
      let sx = lerp(width * 0.85, width * 0.25, k);
      let sy = lerp(height * 0.08, height * 0.4, k);
      let fade = sin(k * PI);
      for (let i = 0; i < 20; i++) {
        stroke(0, 0, 100, fade * 100 * (1 - i / 20));
        strokeWeight(2 * (1 - i / 20) + 0.4);
        point(sx + i * width * 0.012, sy - i * height * 0.0065);
      }
      noStroke();
    }
  }
}`, { maxFrames: 600 }),

aurora: preset(`
let curtains = 3;
let columnStep = 3;       // width of each light column {limlow:1}
let starCount = 120;
let stars = [];

function setup() {
  for (let i = 0; i < starCount; i++) {
    stars.push([random(width), random(height * 0.8), random(0.6, 1.8), random(30, 90)]);
  }
}

// Noise that loops: walk around a circle in noise space
function loopNoise(x, layerIdx, r) {
  let a = progress * TWO_PI;
  return noise(x, layerIdx * 13.7 + cos(a) * r, sin(a) * r);
}

function draw() {
  let ctx = drawingContext;
  let g = ctx.createLinearGradient(0, 0, 0, height);
  g.addColorStop(0, '#01020a');
  g.addColorStop(1, '#06172a');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);

  noStroke();
  for (let st of stars) {
    fill(0, 0, 100, st[3]);
    circle(st[0], st[1], st[2]);
  }

  strokeCap(SQUARE);
  for (let c = 0; c < curtains; c++) {
    let hueBase = 130 + c * 25;
    for (let x = 0; x < width; x += columnStep) {
      let n = loopNoise(x * 0.004, c, 0.9);
      let top = height * (0.12 + c * 0.1) + n * height * 0.35;
      let len = height * (0.18 + loopNoise(x * 0.01 + 50, c, 0.6) * 0.32);
      let glow = pow(loopNoise(x * 0.02 + 100, c, 1.2), 2) * 1.6;
      let segs = 8;
      strokeWeight(columnStep + 0.5);
      for (let k = 0; k < segs; k++) {
        let f = k / segs;
        let alpha = (1 - f) * (f < 0.15 ? f / 0.15 : 1) * 65 * glow;
        stroke(hueBase + f * 60, 70, 100, alpha);
        line(x, top + f * len, x, top + (f + 1 / segs) * len);
      }
    }
  }
}`, { maxFrames: 600 }),

crystal: preset(`
let shards = 14;
let maxLength = 120;
let shardData = [];

function setup() {
  for (let i = 0; i < shards; i++) {
    shardData.push({
      a: i * TWO_PI / shards + random(-0.2, 0.2),
      len: random(0.55, 1),
      w: random(0.12, 0.22),
      phase: random(TWO_PI),
      hue: random(175, 290)
    });
  }
}

function draw() {
  let s = min(width, height) / 300;
  let t = progress * TWO_PI;
  translate(width / 2, height / 2);
  rotate(sin(t) * 0.15);

  noStroke();
  for (let g = 8; g > 0; g--) {
    fill(200, 50, 100, 6);
    circle(0, 0, g * 14 * s);
  }

  for (let sh of shardData) {
    let grow = 0.55 + 0.45 * sin(t + sh.phase);
    let L = maxLength * s * sh.len * grow;
    let W = L * sh.w;
    push();
    rotate(sh.a);
    // body
    fill(sh.hue, 55, 95, 55);
    stroke(sh.hue, 30, 100, 90);
    strokeWeight(1.2 * s);
    beginShape();
    vertex(0, -W * 0.4);
    vertex(L * 0.75, -W / 2);
    vertex(L, 0);
    vertex(L * 0.75, W / 2);
    vertex(0, W * 0.4);
    endShape(CLOSE);
    // facet
    stroke(sh.hue, 10, 100, 70);
    line(0, 0, L, 0);
    line(L * 0.75, -W / 2, L * 0.75, W / 2);
    // tip sparkle
    let sp = pow(max(0, sin(t * 2 + sh.phase * 2)), 12);
    stroke(0, 0, 100, 100 * sp);
    let k = 6 * s * sp;
    line(L - k, 0, L + k, 0);
    line(L, -k, L, k);
    pop();
  }

  noStroke();
  fill(190, 20, 100, 90);
  circle(0, 0, 18 * s);
}`, { maxFrames: 480 }),

water: preset(`
let samples = 120;       // horizontal resolution of the effect (higher = sharper, slower) {limlow:10} {limhigh:400}
let iterations = 5;       // detail of the light pattern {limlow:1} {limhigh:20}
let intensity = 0.005;
let speeds = [1, -1, 2, -1, 1];   // whole numbers = seamless loop
let buffer, bctx, img;

function draw() {
  let w = samples, h = max(1, round(samples * height / width));
  if (!buffer || buffer.width !== w || buffer.height !== h) {
    buffer = document.createElement('canvas');
    buffer.width = w; buffer.height = h;
    bctx = buffer.getContext('2d');
    img = bctx.createImageData(w, h);
  }
  let data = img.data;
  let t = progress * Math.PI * 2;
  let TAU2 = Math.PI * 2;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let px = x / w * TAU2 - 250, py = y / h * TAU2 - 250;
      let ix = px, iy = py, c = 1;
      for (let n = 0; n < iterations; n++) {
        let tt = t * speeds[n % speeds.length] + n * 1.7;
        ix = px + Math.cos(tt - ix) + Math.sin(tt + iy);
        iy = py + Math.sin(tt - iy) + Math.cos(tt + ix);
        let ax = px / (Math.sin(ix + tt) / intensity);
        let ay = py / (Math.cos(iy + tt) / intensity);
        c += 1 / Math.sqrt(ax * ax + ay * ay);
      }
      c /= iterations;
      c = 1.17 - Math.pow(c, 1.4);
      let v = Math.pow(Math.abs(c), 8);
      let i = (x + y * w) * 4;
      data[i] = Math.min(1, v) * 255;
      data[i + 1] = Math.min(1, v + 0.35) * 255;
      data[i + 2] = Math.min(1, v + 0.5) * 255;
      data[i + 3] = 255;
    }
  }
  bctx.putImageData(img, 0, 0);
  drawingContext.imageSmoothingEnabled = true;
  drawingContext.drawImage(buffer, 0, 0, width, height);
}`, { maxFrames: 480 }),

heat_waves: preset(`
let heatSeed = 0;         // 0 = this layer's own random pattern, any other number = a fixed one {incr:1} {limlow:0}
let detail = 4;           // grid step for tracing (px, smaller = smoother but slower) {slide:2,10} {incr:0.5} {limlow:1.5}
let levels = 5;           // brightness levels traced as lines {slide:2,10} {incr:1} {limlow:1} {limhigh:20}
let lineWidth = 1.4;      // {slide:0.4,4} {incr:0.1}
let glow = 5;             // blur around the light (px) {slide:0,12} {incr:0.5}
let smoothing = 2;        // passes that smooth out small wobbles {slide:0,5} {incr:1} {limlow:0} {limhigh:8}
let zoom = 1;             // size of the pattern {slide:0.5,2} {incr:0.05} {limlow:0.1}
let baseColor = '#2a0700';   // the dark background heat {color}
let heatColor = '#ffc46b';   // the hottest shimmer {color}
let showBackground = true;   // fill the background colour behind the shimmer
let iterations = 5;       // detail of the light pattern {limlow:1} {limhigh:20}
let intensity = 0.005;

let speeds, phases, offsetX, offsetY;

// Random pattern: where in the light field we look, and how fast (whole numbers,
// so the loop stays seamless) and in which direction each part of it moves
function setup() {
  if (heatSeed > 0) randomSeed(heatSeed);
  offsetX = random(-320, -180);
  offsetY = random(-320, -180);
  speeds = []; phases = [];
  for (let n = 0; n < iterations; n++) {
    speeds.push(floor(random(1, 3)) * (random() < 0.5 ? -1 : 1));
    phases.push(random(TWO_PI));
  }
}

// A rippling light field (the same maths as "Water (shader)"), sampled on a coarse grid
function lightAt(u, v, t) {
  let TAU2 = Math.PI * 2;
  let px = u * TAU2 + offsetX, py = v * TAU2 + offsetY;
  let ix = px, iy = py, c = 1;
  for (let n = 0; n < iterations; n++) {
    let tt = t * speeds[n] + phases[n];
    ix = px + Math.cos(tt - ix) + Math.sin(tt + iy);
    iy = py + Math.sin(tt - iy) + Math.cos(tt + ix);
    let ax = px / (Math.sin(ix + tt) / intensity);
    let ay = py / (Math.cos(iy + tt) / intensity);
    c += 1 / Math.sqrt(ax * ax + ay * ay);
  }
  c /= iterations;
  c = 1.17 - Math.pow(c, 1.4);
  return Math.pow(Math.abs(c), 8);
}

// Marching squares: adds the line where field == level to the current path
function traceLevel(ctx, F, cols, rows, step, level) {
  let edge = (x1, y1, v1, x2, y2, v2) => { let k = v1 / (v1 - v2); return [x1 + (x2 - x1) * k, y1 + (y2 - y1) * k]; };
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      let a = F[j * (cols + 1) + i] - level, b = F[j * (cols + 1) + i + 1] - level;
      let c = F[(j + 1) * (cols + 1) + i + 1] - level, d = F[(j + 1) * (cols + 1) + i] - level;
      if ((a > 0) === (b > 0) && (b > 0) === (c > 0) && (c > 0) === (d > 0)) continue;
      let x = i * step, y = j * step, pts = [];
      if ((a > 0) !== (b > 0)) pts.push(edge(x, y, a, x + step, y, b));
      if ((b > 0) !== (c > 0)) pts.push(edge(x + step, y, b, x + step, y + step, c));
      if ((c > 0) !== (d > 0)) pts.push(edge(x + step, y + step, c, x, y + step, d));
      if ((d > 0) !== (a > 0)) pts.push(edge(x, y + step, d, x, y, a));
      for (let p = 0; p + 1 < pts.length; p += 2) {
        ctx.moveTo(pts[p][0], pts[p][1]);
        ctx.lineTo(pts[p + 1][0], pts[p + 1][1]);
      }
    }
  }
}

function hexRgb(hex) {
  let h = hex.replace('#', '');
  return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16));
}

// Colour at brightness v: background + heat
function lightColorAt(v, alpha) {
  let d = hexRgb(baseColor), l = hexRgb(heatColor);
  let rgb = d.map((c, i) => Math.min(255, Math.round(c + l[i] * v)));
  return 'rgba(' + rgb.join(',') + ',' + alpha + ')';
}

function draw() {
  let ctx = drawingContext;
  let s = min(width, height) / 300;
  let t = progress * TWO_PI;
  let step = detail * s;
  let cols = Math.ceil(width / step), rows = Math.ceil(height / step);

  if (showBackground) {
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, width, height);
  }

  // Sample the light field
  let F = new Float32Array((cols + 1) * (rows + 1));
  for (let j = 0; j <= rows; j++) {
    for (let i = 0; i <= cols; i++) {
      let u = (i * step - width / 2) / (width * zoom) + 0.5;
      let v = (j * step - height / 2) / (height * zoom) + 0.5;
      F[j * (cols + 1) + i] = lightAt(u, v, t);
    }
  }

  // Smooth the sampled light so the traced lines flow instead of wobbling
  for (let pass = 0; pass < smoothing; pass++) {
    let G = new Float32Array(F.length);
    for (let j = 0; j <= rows; j++) {
      for (let i = 0; i <= cols; i++) {
        let sum = 0, n = 0;
        for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
          let jj = j + dj, ii = i + di;
          if (jj < 0 || jj > rows || ii < 0 || ii > cols) continue;
          sum += F[jj * (cols + 1) + ii]; n++;
        }
        G[j * (cols + 1) + i] = sum / n;
      }
    }
    F = G;
  }

  // Brightness levels from dim to bright (more levels near the bright end)
  let lv = [];
  for (let k = 0; k < levels; k++) lv.push(0.1 + 0.8 * Math.pow((k + 1) / levels, 1.4));

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.globalCompositeOperation = 'lighter';

  // Soft blurred glow under everything
  if (glow > 0) {
    ctx.filter = 'blur(' + (glow * s).toFixed(1) + 'px)';
    ctx.beginPath();
    for (let L of lv) traceLevel(ctx, F, cols, rows, step, L);
    ctx.strokeStyle = lightColorAt(0.5, 0.45);
    ctx.lineWidth = lineWidth * 4 * s;
    ctx.stroke();
    ctx.filter = 'none';
  }

  // Each level: dim ones wide and faint, bright ones thin and hottest
  for (let L of lv) {
    ctx.beginPath();
    traceLevel(ctx, F, cols, rows, step, L);
    ctx.strokeStyle = lightColorAt(L, 0.35 + 0.5 * L);
    ctx.lineWidth = lineWidth * s * (1.8 - L);
    ctx.stroke();
  }
  ctx.restore();
}`, { maxFrames: 480 }),

height_map: preset(`
let terrainSeed = 0;      // 0 = this layer's own random terrain, any other number = a fixed one {incr:1} {limlow:0}
let hills = 9;            // mountains on the map {slide:1,25} {incr:1} {limlow:1} {limhigh:60}
let roughness = 0.35;     // small bumps on the slopes {slide:0,1} {incr:0.05} {limlow:0}
let lineSpacing = 0.05;   // height between contour lines {slide:0.02,0.2} {incr:0.005} {limlow:0.01}
let flowPerLoop = 5;      // lines that grow out of the peaks per loop (whole number) {incr:5}
let majorEvery = 5;       // every Nth line is thicker (keep flowPerLoop a multiple of it) {incr:1} {limlow:1}
let lineWidth = 1.2;      // {slide:0.4,4} {incr:0.1} {limlow:0.1}
let detail = 4;           // grid step for tracing (px, smaller = smoother) {slide:2,10} {incr:0.5} {limlow:1.5}
let showBackground = true;
let mapBackground = '#0b1116';  // {color}

let terrain, gridCols, gridRows, gridStep;

// Colour by height: water, lowland, sand, rock, snow
const RAMP = [[0, '#2b5c9e'], [0.22, '#2f8f6a'], [0.45, '#b9c46a'], [0.65, '#c08a4a'], [0.85, '#8a5a3c'], [1, '#f4f4f4']];

function rampColor(h, alpha) {
  h = Math.max(0, Math.min(1, h));
  for (let i = 1; i < RAMP.length; i++) {
    if (h <= RAMP[i][0]) {
      let [h0, c0] = RAMP[i - 1], [h1, c1] = RAMP[i];
      let k = (h - h0) / (h1 - h0);
      let a = hexRgb(c0), b = hexRgb(c1);
      return 'rgba(' + a.map((v, j) => Math.round(v + (b[j] - v) * k)).join(',') + ',' + alpha + ')';
    }
  }
  return 'rgba(244,244,244,' + alpha + ')';
}

function hexRgb(hex) {
  let h = hex.replace('#', '');
  return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16));
}

// Random terrain: a few round hills of random size and height, plus gentle bumps
function setup() {
  if (terrainSeed > 0) randomSeed(terrainSeed);
  let s = min(width, height) / 300;
  gridStep = detail * s;
  gridCols = Math.ceil(width / gridStep);
  gridRows = Math.ceil(height / gridStep);

  let peaks = [];
  for (let i = 0; i < hills; i++) {
    peaks.push({ x: random(-0.1, 1.1) * width, y: random(-0.1, 1.1) * height,
                 r: random(0.12, 0.32) * min(width, height), h: random(0.45, 1) });
  }
  let bumps = [];
  for (let i = 0; i < 4; i++) bumps.push({ fx: random(0.01, 0.03) / s, fy: random(0.01, 0.03) / s, p: random(TWO_PI) });

  terrain = new Float32Array((gridCols + 1) * (gridRows + 1));
  let maxH = 0;
  for (let j = 0; j <= gridRows; j++) {
    for (let i = 0; i <= gridCols; i++) {
      let x = i * gridStep, y = j * gridStep, h = 0;
      for (let pk of peaks) {
        let dx = x - pk.x, dy = y - pk.y;
        h += pk.h * Math.exp(-(dx * dx + dy * dy) / (2 * pk.r * pk.r));
      }
      for (let b of bumps) h += roughness * 0.08 * Math.sin(x * b.fx + b.p) * Math.sin(y * b.fy - b.p);
      terrain[j * (gridCols + 1) + i] = h;
      maxH = Math.max(maxH, h);
    }
  }
  for (let k = 0; k < terrain.length; k++) terrain[k] = Math.max(0, terrain[k] / (maxH || 1));
}

// Marching squares: adds the line where terrain == level to the current path
function traceLevel(ctx, F, cols, rows, step, level) {
  let edge = (x1, y1, v1, x2, y2, v2) => { let k = v1 / (v1 - v2); return [x1 + (x2 - x1) * k, y1 + (y2 - y1) * k]; };
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      let a = F[j * (cols + 1) + i] - level, b = F[j * (cols + 1) + i + 1] - level;
      let c = F[(j + 1) * (cols + 1) + i + 1] - level, d = F[(j + 1) * (cols + 1) + i] - level;
      if ((a > 0) === (b > 0) && (b > 0) === (c > 0) && (c > 0) === (d > 0)) continue;
      let x = i * step, y = j * step, pts = [];
      if ((a > 0) !== (b > 0)) pts.push(edge(x, y, a, x + step, y, b));
      if ((b > 0) !== (c > 0)) pts.push(edge(x + step, y, b, x + step, y + step, c));
      if ((c > 0) !== (d > 0)) pts.push(edge(x + step, y + step, c, x, y + step, d));
      if ((d > 0) !== (a > 0)) pts.push(edge(x, y + step, d, x, y, a));
      for (let p = 0; p + 1 < pts.length; p += 2) {
        ctx.moveTo(pts[p][0], pts[p][1]);
        ctx.lineTo(pts[p + 1][0], pts[p + 1][1]);
      }
    }
  }
}

function draw() {
  let ctx = drawingContext;
  let s = min(width, height) / 300;
  if (showBackground) {
    ctx.fillStyle = mapBackground;
    ctx.fillRect(0, 0, width, height);
  }

  // Lines move down in height over the loop, so new rings appear at the peaks
  // and spread outwards. Shifting by whole lines keeps the loop seamless.
  let shift = progress * flowPerLoop;
  let first = Math.floor(shift), last = Math.ceil(1 / lineSpacing + shift) + 1;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (let k = first; k <= last; k++) {
    let level = (k - shift) * lineSpacing;
    if (level <= 0.002 || level >= 0.998) continue;
    let major = ((k % majorEvery) + majorEvery) % majorEvery === 0;
    let fadeIn = Math.min(1, (1 - level) / 0.06);     // new rings fade in at the peaks
    ctx.beginPath();
    traceLevel(ctx, terrain, gridCols, gridRows, gridStep, level);
    ctx.strokeStyle = rampColor(level, ((major ? 0.95 : 0.6) * fadeIn).toFixed(3));
    ctx.lineWidth = lineWidth * s * (major ? 1.8 : 1);
    ctx.stroke();
  }
  ctx.restore();
}`, { maxFrames: 480 }),

hourglass: preset(`
let flipTime = 0.15;      // share of the loop spent turning the glass over {slide:0.05,0.4} {incr:0.01} {limlow:0.02} {limhigh:0.6}
let glassHeight = 0.78;   // size of the hourglass, as a share of the canvas height {slide:0.4,0.95} {incr:0.01} {limlow:0.1}
let glassWidth = 0.5;     // width compared with the height {slide:0.25,0.9} {incr:0.01} {limlow:0.1}
let fallTime = 0.04;      // share of the loop the sand takes to fall from the neck to the bottom {slide:0.005,0.15} {incr:0.005} {limlow:0.002} {limhigh:0.3}
let neck = 0.045;         // width of the narrow middle {slide:0.01,0.15} {incr:0.005} {limlow:0.005}
let sandColor = '#e2b866';   // {color}
let woodColor = '#6b3f1f';   // frame {color}
let glassColor = '#cfe8ff';  // glass tint {color}

function hexRgba(hex, a) { let h = hex.replace('#', ''); return 'rgba(' + [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)).join(',') + ',' + a + ')'; }

// Half-width of the glass at height y (-H = top, 0 = neck, H = bottom)
function glassHalf(y, H, W) {
  let u = Math.min(1, Math.abs(y) / H);
  let bulge = Math.sin(Math.min(1, u * 1.25) * Math.PI / 2);
  let close = u > 0.88 ? 1 - (u - 0.88) * 1.6 : 1;
  return W * neck * 2 + (W - W * neck * 2) * bulge * close;
}

function glassPath(ctx, H, W) {
  ctx.beginPath();
  for (let y = -H; y <= H; y += H / 60) ctx.lineTo(glassHalf(y, H, W), y);
  for (let y = H; y >= -H; y -= H / 60) ctx.lineTo(-glassHalf(y, H, W), y);
  ctx.closePath();
}

function draw() {
  let ctx = drawingContext;
  let H = height * glassHeight / 2 * 0.86, W = H * glassWidth;
  let drainEnd = 1 - flipTime;                              // the flip starts once all sand has landed
  let fall = Math.min(fallTime, drainEnd * 0.45);
  let pour = drainEnd - fall;                               // time the top takes to empty
  // The top starts emptying at once; the same sand reaches the bottom 'fall' later
  let drained = Math.min(1, progress / pour);               // 0 = top full, 1 = top empty
  let landed = Math.min(1, Math.max(0, (progress - fall) / pour));   // sand that has reached the pile
  let flip = progress <= drainEnd ? 0 : (progress - drainEnd) / flipTime;
  let turn = Math.PI * (flip < 0.5 ? 2 * flip * flip : 1 - Math.pow(-2 * flip + 2, 2) / 2);   // eased half-turn

  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.rotate(turn);

  // Sand, clipped to the inside of the glass
  ctx.save();
  glassPath(ctx, H, W);
  ctx.clip();
  ctx.fillStyle = sandColor;
  // Sand moves by AMOUNT, not height: the bulbs are wide in the middle and
  // narrow at the neck, so equal heights hold very different amounts of sand.
  // levelFromCap(a) = how high sand of amount a (0..1 of a bulb) reaches from the cap.
  let slices = 160, cum = [0];
  for (let k = 1; k <= slices; k++) {
    let y = H - (k - 0.5) * H / slices;               // from the cap (y = H) up to the neck (y = 0)
    cum.push(cum[k - 1] + glassHalf(y, H, W));
  }
  let levelFromCap = amount => {
    let target = amount * cum[slices];
    let k = 1;
    while (k < slices && cum[k] < target) k++;
    let frac = (target - cum[k - 1]) / Math.max(1e-9, cum[k] - cum[k - 1]);
    return (k - 1 + Math.min(1, Math.max(0, frac))) * H / slices;
  };

  let top = 1 - drained;
  if (top > 0.001) {
    // Upper bulb: the sand left fills it from the neck upwards (same shape, mirrored),
    // and its surface sinks into a funnel above the neck as it drains
    let level = -(H - levelFromCap(1 - top));
    let dip = H * 0.12 * Math.min(1, drained * 4) * Math.min(1, top / 0.12);
    ctx.beginPath();
    ctx.moveTo(-W, 0);
    for (let x = -W; x <= W; x += W / 24) ctx.lineTo(x, Math.min(0, level + dip * (1 - Math.min(1, Math.abs(x) / (W * 0.9)))));
    ctx.lineTo(W, 0);
    ctx.closePath();
    ctx.fill();
  }
  let pileTop = H;
  if (landed > 0.001) {
    // Lower bulb: the pile rises steadily by amount; its cone flattens as it fills
    let h = levelFromCap(landed);
    let peak = H * 0.16 * (1 - landed);
    pileTop = H - h - peak * 0.5;
    ctx.beginPath();
    ctx.moveTo(-W, H);
    for (let x = -W; x <= W; x += W / 24) ctx.lineTo(x, H - h + peak * 0.5 - peak * (1 - Math.min(1, Math.abs(x) / W)));
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fill();
  }
  // Falling sand. At first it falls as separate grains that speed up and spread a
  // little; once they land, the solid stream fades in and takes over. After the
  // top has emptied, the end of the stream falls the rest of the way.
  if (flip === 0) {
    let floor = Math.max(0, pileTop);
    let head = progress < fall ? floor * Math.pow(progress / fall, 2) : floor;
    let tail = progress < pour ? 0 : floor * Math.pow(Math.min(1, (progress - pour) / fall), 2);
    let solid = progress < fall ? 0 : Math.min(1, (progress - fall) / (fall * 1.5));
    let grain = Math.max(0.6, W * 0.014);
    ctx.fillStyle = sandColor;

    // Solid stream (fades in after the first grains land)
    if (solid > 0 && head > tail + 0.5) {
      ctx.globalAlpha = solid;
      ctx.fillRect(-W * neck * 0.6, tail, W * neck * 1.2, head - tail);
      ctx.globalAlpha = 1;
    }

    // Separate grains: one released every 'dt'; each falls with gravity (distance ~ time²)
    let gravity = floor / (fall * fall);
    let dt = fall / 45;
    let lastRelease = Math.min(progress, pour);
    let grainAlpha = 1 - solid * 0.8;
    if (grainAlpha > 0.02 && floor > 1) {
      ctx.globalAlpha = grainAlpha;
      for (let j = Math.max(0, Math.floor((progress - fall) / dt)); j * dt <= lastRelease; j++) {
        let age = progress - j * dt;
        if (age < 0) continue;
        let y = gravity * age * age;
        if (y > floor || y < tail) continue;                 // landed, or above the end of the stream
        let jitter = Math.sin(j * 12.9898) * 43758.5453; jitter -= Math.floor(jitter);
        let jitter2 = Math.sin(j * 78.233) * 12345.678; jitter2 -= Math.floor(jitter2);
        let spread = W * neck * (0.6 + 2.2 * y / floor);
        ctx.beginPath();
        ctx.arc((jitter - 0.5) * spread, y, grain * (0.7 + 0.6 * jitter2), 0, TWO_PI);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    // A few loose grains sparkling around the solid stream
    if (solid > 0 && head > tail + 0.5) {
      for (let k = 0; k < 6; k++) {
        let gy = tail + ((progress * 40 + k / 6) % 1) * (head - tail);
        ctx.beginPath();
        ctx.arc((random() - 0.5) * W * neck * 2.5, gy, Math.max(0.6, W * 0.012), 0, TWO_PI);
        ctx.fill();
      }
    }
  }
  ctx.restore();

  // Glass
  glassPath(ctx, H, W);
  ctx.fillStyle = hexRgba(glassColor, 0.08);
  ctx.fill();
  ctx.strokeStyle = hexRgba(glassColor, 0.75);
  ctx.lineWidth = Math.max(1, W * 0.025);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = Math.max(1, W * 0.02);
  ctx.beginPath();
  for (let y = -H * 0.8; y <= -H * 0.25; y += H / 40) ctx.lineTo(-glassHalf(y, H, W) * 0.7, y);
  ctx.stroke();

  // Wooden frame: two caps and three posts
  let capW = W * 1.25, capH = H * 0.09;
  ctx.fillStyle = woodColor;
  for (let sgn of [-1, 1]) {
    ctx.beginPath();
    ctx.roundRect(-capW, sgn * H - (sgn < 0 ? capH : 0), capW * 2, capH, capH * 0.35);
    ctx.fill();
  }
  ctx.fillStyle = hexRgba(woodColor, 0.95);
  for (let px of [-capW * 0.88, capW * 0.88]) ctx.fillRect(px - W * 0.035, -H, W * 0.07, H * 2);
  ctx.restore();
}`, { maxFrames: 480 }),

lava_lamp: preset(`
let blobs = 7;            // wax blobs {slide:2,14} {incr:1} {limlow:1} {limhigh:30}
let blobSize = 1;         // {slide:0.5,2} {incr:0.05} {limlow:0.2}
let resolution = 90;      // detail of the wax (higher = smoother, slower) {incr:10} {limlow:30} {limhigh:240}
let waxColor = '#ff5a3c';     // {color}
let liquidColor = '#3a0a4a';  // {color}
let metalColor = '#b8b8c4';   // lamp base and cap {color}

let blobData = [], buffer, bctx, img;

function setup() {
  for (let i = 0; i < blobs; i++) {
    blobData.push({ x: random(-0.5, 0.5), r: random(0.06, 0.11), speed: floor(random(1, 3)), phase: random(TWO_PI), wobble: random(TWO_PI), sway: floor(random(1, 4)) });
  }
}

function hexRgb(hex) { let h = hex.replace('#', ''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); }

// The lamp's glass: narrow at the top, wide near the bottom
function lampPath(ctx, top, bottom, wTop, wBottom) {
  ctx.beginPath();
  ctx.moveTo(-wTop, top);
  ctx.bezierCurveTo(-wTop * 1.2, (top + bottom) / 2, -wBottom * 1.1, bottom - (bottom - top) * 0.25, -wBottom, bottom);
  ctx.lineTo(wBottom, bottom);
  ctx.bezierCurveTo(wBottom * 1.1, bottom - (bottom - top) * 0.25, wTop * 1.2, (top + bottom) / 2, wTop, top);
  ctx.closePath();
}

function draw() {
  let ctx = drawingContext;
  let s = min(width, height) / 300;
  let top = -height * 0.36, bottom = height * 0.2, wTop = 26 * s, wBottom = 58 * s;
  let t = progress * TWO_PI;
  let cw = Math.ceil(resolution * 0.6), ch = resolution;
  if (!buffer || buffer.width !== cw || buffer.height !== ch) {
    buffer = document.createElement('canvas');
    buffer.width = cw; buffer.height = ch;
    bctx = buffer.getContext('2d');
    img = bctx.createImageData(cw, ch);
  }
  // Blob positions: each rises and sinks a whole number of times per loop
  let pos = blobData.map(b => ({
    x: b.x * 0.7 + 0.12 * Math.sin(t * b.sway + b.wobble),
    y: 0.5 - 0.46 * Math.cos(t * b.speed + b.phase),
    r: b.r * blobSize * (1 + 0.15 * Math.sin(t * 2 + b.phase))
  }));
  let wax = hexRgb(waxColor), liquid = hexRgb(liquidColor), d = img.data;
  for (let j = 0; j < ch; j++) {
    let v = j / ch;
    for (let i = 0; i < cw; i++) {
      let u = i / cw - 0.5, f = 0;
      for (let p of pos) { let dx = (u - p.x) * 0.6, dy = v - p.y; f += p.r * p.r / (dx * dx + dy * dy + 1e-4); }
      let k = Math.min(1, Math.max(0, (f - 1) * 4));          // 0 = liquid, 1 = wax
      let glow = Math.min(1, f * 0.18);
      let o = (j * cw + i) * 4;
      for (let c = 0; c < 3; c++) d[o + c] = liquid[c] * (1 - k) + wax[c] * k * (0.75 + 0.25 * (1 - v)) + glow * 30;
      d[o + 3] = 255;
    }
  }
  bctx.putImageData(img, 0, 0);

  ctx.save();
  ctx.translate(width / 2, height / 2);
  // Soft glow around the lamp
  let g = ctx.createRadialGradient(0, (top + bottom) / 2, 10 * s, 0, (top + bottom) / 2, 150 * s);
  g.addColorStop(0, 'rgba(' + wax.join(',') + ',0.25)');
  g.addColorStop(1, 'rgba(' + wax.join(',') + ',0)');
  ctx.fillStyle = g;
  ctx.fillRect(-width, -height, width * 2, height * 2);

  ctx.save();
  lampPath(ctx, top, bottom, wTop, wBottom);
  ctx.clip();
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(buffer, -wBottom * 1.15, top, wBottom * 2.3, bottom - top);
  // glass highlight
  let hl = ctx.createLinearGradient(-wBottom, 0, wBottom, 0);
  hl.addColorStop(0, 'rgba(255,255,255,0)');
  hl.addColorStop(0.25, 'rgba(255,255,255,0.18)');
  hl.addColorStop(0.35, 'rgba(255,255,255,0)');
  ctx.fillStyle = hl;
  ctx.fillRect(-wBottom * 1.2, top, wBottom * 2.4, bottom - top);
  ctx.restore();

  // Metal cap and base
  let metal = hexRgb(metalColor);
  let mg = ctx.createLinearGradient(-wBottom * 1.3, 0, wBottom * 1.3, 0);
  mg.addColorStop(0, 'rgb(' + metal.map(c => c * 0.45 | 0).join(',') + ')');
  mg.addColorStop(0.4, 'rgb(' + metal.join(',') + ')');
  mg.addColorStop(1, 'rgb(' + metal.map(c => c * 0.35 | 0).join(',') + ')');
  ctx.fillStyle = mg;
  ctx.beginPath();
  ctx.moveTo(-wTop * 0.9, top);
  ctx.lineTo(-wTop * 0.55, top - 34 * s);
  ctx.lineTo(wTop * 0.55, top - 34 * s);
  ctx.lineTo(wTop * 0.9, top);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-wBottom, bottom);
  ctx.lineTo(-wBottom * 0.72, bottom + 34 * s);
  ctx.lineTo(-wBottom * 1.15, bottom + 70 * s);
  ctx.lineTo(wBottom * 1.15, bottom + 70 * s);
  ctx.lineTo(wBottom * 0.72, bottom + 34 * s);
  ctx.lineTo(wBottom, bottom);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}`, { maxFrames: 600 }),

newtons_cradle: preset(`
let balls = 5;            // {slide:2,9} {incr:1} {limlow:2} {limhigh:15}
let hitsPerLoop = 4;      // knocks per loop (even number keeps it seamless) {incr:2} {limlow:2}
let swingAngle = 32;      // how far the end balls swing out (degrees) {slide:5,70} {incr:1}
let ballSize = 34;        // (px at 300px canvas) {slide:12,60} {incr:1} {limlow:4}
let stringLength = 0.42;  // as a share of the canvas height {slide:0.15,0.7} {incr:0.01} {limlow:0.05}
let ballColor = '#d9dde6';   // {color}
let frameColor = '#3a3d46';  // {color}

function hexRgb(hex) { let h = hex.replace('#', ''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); }

function draw() {
  let ctx = drawingContext;
  let s = min(width, height) / 300;
  let r = ballSize * s / 2;
  let len = height * stringLength;
  let topY = height * 0.5 - len * 0.62, bottomY = topY + len;
  let spacing = r * 2.02;
  let t = progress * Math.PI * hitsPerLoop;            // a swing out and back takes PI
  let swing = Math.sin(t);
  let leftA = swing < 0 ? radians(swingAngle) * swing : 0;     // the left ball swings on one half
  let rightA = swing > 0 ? radians(swingAngle) * swing : 0;    // the right ball on the other
  let col = hexRgb(ballColor), frame = hexRgb(frameColor);
  ctx.save();
  ctx.translate(width / 2, 0);

  // Frame: base and top bar
  let half = (balls - 1) / 2 * spacing + r * 3;
  ctx.fillStyle = 'rgb(' + frame.join(',') + ')';
  ctx.fillRect(-half, topY - 5 * s, half * 2, 6 * s);
  ctx.fillRect(-half - 6 * s, topY - 5 * s, 6 * s, bottomY - topY + r * 2.6);
  ctx.fillRect(half, topY - 5 * s, 6 * s, bottomY - topY + r * 2.6);
  ctx.fillRect(-half - 18 * s, bottomY + r * 2.6, half * 2 + 36 * s, 7 * s);

  for (let i = 0; i < balls; i++) {
    let a = i === 0 ? leftA : i === balls - 1 ? rightA : 0;
    let px = (i - (balls - 1) / 2) * spacing;
    let bx = px + Math.sin(a) * len, by = topY + Math.cos(a) * len;

    // Shadow on the base
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(bx, bottomY + r * 2.6, r * 0.9, r * 0.22, 0, 0, TWO_PI);
    ctx.fill();

    // Two strings in a V
    ctx.strokeStyle = 'rgba(220,220,230,0.6)';
    ctx.lineWidth = Math.max(0.6, s);
    ctx.beginPath();
    ctx.moveTo(px - r * 0.9, topY); ctx.lineTo(bx, by - r);
    ctx.moveTo(px + r * 0.9, topY); ctx.lineTo(bx, by - r);
    ctx.stroke();

    // Steel ball
    let g = ctx.createRadialGradient(bx - r * 0.35, by - r * 0.4, r * 0.08, bx, by, r);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.3, 'rgb(' + col.join(',') + ')');
    g.addColorStop(1, 'rgb(' + col.map(c => c * 0.25 | 0).join(',') + ')');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(bx, by, r, 0, TWO_PI); ctx.fill();
  }
  ctx.restore();
}`, { maxFrames: 360 }),

film_grain: preset(`
let grain = 0.35;         // strength of the grain {slide:0,1} {incr:0.05} {limlow:0}
let grainSize = 1.5;      // size of each grain (px) {slide:1,4} {incr:0.5} {limlow:1}
let flicker = 0.12;       // brightness flicker {slide:0,0.4} {incr:0.01} {limlow:0}
let scratches = 2;        // scratch lines at a time {slide:0,8} {incr:1} {limlow:0} {limhigh:30}
let dust = 6;             // specks of dust per frame {slide:0,40} {incr:1} {limlow:0} {limhigh:200}
let vignette = 0.55;      // dark edges {slide:0,1} {incr:0.05} {limlow:0}
let sepia = 0.15;         // warm old-film tint {slide:0,0.6} {incr:0.01} {limlow:0}
let grainHold = 3;        // grain, dust and flicker change every N frames, like film (higher = smaller exports) {incr:1} {limlow:1} {limhigh:30}
let buffer, bctx, img;

// A see-through overlay: put this layer on top of the others.
function draw() {
  let ctx = drawingContext;
  // Same random pattern for 'grainHold' frames in a row: looks like film and
  // lets GIF/MP4 skip the unchanged frames
  randomSeed(Math.floor(frameCount / grainHold) * 9973 + 17);
  let w = Math.ceil(width / grainSize), h = Math.ceil(height / grainSize);
  if (!buffer || buffer.width !== w || buffer.height !== h) {
    buffer = document.createElement('canvas');
    buffer.width = w; buffer.height = h;
    bctx = buffer.getContext('2d');
    img = bctx.createImageData(w, h);
  }
  // Grain: sparse light and dark specks (most pixels stay clear, which keeps exports small)
  let d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    let v = random();
    let light = v > 0.5;
    d[i] = d[i + 1] = d[i + 2] = light ? 255 : 0;
    d[i + 3] = Math.abs(v - 0.5) > 0.425 ? grain * 150 : 0;
  }
  bctx.putImageData(img, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(buffer, 0, 0, w * grainSize, h * grainSize);

  // Warm tint and flicker
  if (sepia > 0) { ctx.fillStyle = 'rgba(112,66,20,' + sepia + ')'; ctx.fillRect(0, 0, width, height); }
  let fl = (random() - 0.5) * 2 * flicker;
  ctx.fillStyle = fl > 0 ? 'rgba(255,245,220,' + fl + ')' : 'rgba(0,0,0,' + (-fl) + ')';
  ctx.fillRect(0, 0, width, height);

  // Vertical scratches that jump around
  for (let k = 0; k < scratches; k++) {
    if (random() < 0.35) continue;
    let x = random(width);
    ctx.strokeStyle = random() < 0.5 ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)';
    ctx.lineWidth = random(0.5, 1.5);
    ctx.beginPath();
    let y0 = random(-0.2, 0.4) * height, y1 = y0 + random(0.4, 1.2) * height;
    ctx.moveTo(x, y0);
    ctx.bezierCurveTo(x + random(-3, 3), y0 + (y1 - y0) / 3, x + random(-3, 3), y0 + (y1 - y0) * 2 / 3, x + random(-2, 2), y1);
    ctx.stroke();
  }
  // Dust and hairs
  for (let k = 0; k < dust; k++) {
    ctx.fillStyle = random() < 0.7 ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.ellipse(random(width), random(height), random(0.5, 2.5), random(0.5, 1.5), random(TWO_PI), 0, TWO_PI);
    ctx.fill();
  }
  // Vignette
  if (vignette > 0) {
    let r = Math.hypot(width, height) / 2;
    let g = ctx.createRadialGradient(width / 2, height / 2, r * 0.4, width / 2, height / 2, r);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,' + vignette + ')');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);
  }
}`, { maxFrames: 120, syncLoop: true }),

scanline_crt: preset(`
let lineGap = 3;          // distance between scanlines (px) {slide:2,8} {incr:1} {limlow:1}
let lineDarkness = 0.35;  // {slide:0,1} {incr:0.05} {limlow:0}
let pixelMask = 0.12;     // red/green/blue stripes of the screen {slide:0,0.5} {incr:0.01} {limlow:0}
let rollingBand = 0.12;   // bright band rolling down the screen {slide:0,0.5} {incr:0.01} {limlow:0}
let bandsPerLoop = 1;     // (whole number) {incr:1}
let cornerRadius = 0.12;  // rounded screen corners {slide:0,0.4} {incr:0.01} {limlow:0}
let edgeShadow = 0.5;     // darkening towards the screen edges {slide:0,1} {incr:0.05} {limlow:0}
let flicker = 0.03;       // {slide:0,0.2} {incr:0.01} {limlow:0}
let overlay;

// A see-through overlay: put this layer on top of the others.
function setup() {
  // Everything that doesn't move is painted once
  overlay = document.createElement('canvas');
  overlay.width = width; overlay.height = height;
  let g = overlay.getContext('2d');
  g.fillStyle = 'rgba(0,0,0,' + lineDarkness + ')';
  for (let y = 0; y < height; y += lineGap) g.fillRect(0, y, width, Math.max(1, lineGap / 2.5));
  if (pixelMask > 0) {
    let cols = ['255,0,0', '0,255,0', '0,0,255'];
    for (let x = 0; x < width; x++) {
      g.fillStyle = 'rgba(' + cols[x % 3] + ',' + pixelMask * 0.5 + ')';
      g.fillRect(x, 0, 1, height);
    }
  }
  if (edgeShadow > 0) {
    let r = Math.hypot(width, height) / 2;
    let v = g.createRadialGradient(width / 2, height / 2, r * 0.45, width / 2, height / 2, r);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(0,0,0,' + edgeShadow + ')');
    g.fillStyle = v;
    g.fillRect(0, 0, width, height);
  }
  if (cornerRadius > 0) {
    // black outside a rounded rectangle
    let rr = cornerRadius * min(width, height);
    g.fillStyle = '#000';
    g.beginPath();
    g.rect(0, 0, width, height);
    g.roundRect(0, 0, width, height, rr);
    g.fill('evenodd');
  }
}

function draw() {
  let ctx = drawingContext;
  ctx.drawImage(overlay, 0, 0);
  // Rolling bright band
  if (rollingBand > 0) {
    let y = ((progress * bandsPerLoop) % 1) * (height * 1.4) - height * 0.2;
    let g = ctx.createLinearGradient(0, y - height * 0.12, 0, y + height * 0.12);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.5, 'rgba(255,255,255,' + rollingBand + ')');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, y - height * 0.12, width, height * 0.24);
  }
  if (flicker > 0) {
    ctx.fillStyle = 'rgba(255,255,255,' + (random() * flicker).toFixed(3) + ')';
    ctx.fillRect(0, 0, width, height);
  }
}`, { maxFrames: 240, syncLoop: true }),

blur_bloom: preset(`
let blurAmount = 0;       // softens everything below (px) {slide:0,20} {incr:0.5} {limlow:0} {limhigh:60}
let bloom = 1;            // strength of the glow around bright parts {slide:0,2} {incr:0.05} {limlow:0}
let bloomSize = 10;       // how far the glow spreads (px) {slide:1,40} {incr:1} {limlow:0.5} {limhigh:100}
let threshold = 0.55;     // how bright something must be to glow (0 = everything) {slide:0,0.95} {incr:0.05} {limlow:0} {limhigh:0.98}
let pulsesPerLoop = 0;    // make the glow breathe (whole number, 0 = steady) {incr:1} {limlow:0}

// An effect: it works on the layers below it.
function draw() {
  let ctx = drawingContext;
  let below = belowImage();
  let s = min(width, height) / 300;
  ctx.save();
  ctx.filter = blurAmount > 0 ? 'blur(' + (blurAmount * s).toFixed(1) + 'px)' : 'none';
  ctx.drawImage(below, 0, 0, width, height);
  if (bloom > 0) {
    // Keep only the bright parts, blur them and add them on top. brightness + contrast
    // together map 'threshold' to black and full brightness to full brightness.
    let pulse = pulsesPerLoop > 0 ? 0.75 + 0.25 * Math.sin(progress * TWO_PI * pulsesPerLoop) : 1;
    let th = Math.min(0.95, threshold);
    let c = (1 + th) / (1 - th), b = 0.5 + 0.5 / c;
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = Math.min(1, bloom * pulse);
    ctx.filter = 'brightness(' + b.toFixed(3) + ') contrast(' + c.toFixed(3) + ') blur(' + (bloomSize * s).toFixed(1) + 'px)';
    ctx.drawImage(below, 0, 0, width, height);
    if (bloom > 1) {
      ctx.globalAlpha = Math.min(1, bloom - 1);
      ctx.drawImage(below, 0, 0, width, height);
    }
  }
  ctx.restore();
}`, { maxFrames: 120, syncLoop: true }),

pixelate: preset(`
let tileSize = 8;         // size of each pixel / tile (px at 300px canvas) {slide:2,40} {incr:1} {limlow:1} {limhigh:200}
let roundDots = false;    // round mosaic dots instead of squares
let dotSize = 0.9;        // dot size compared with the tile (when roundDots is on) {slide:0.2,1.2} {incr:0.05} {limlow:0.05}
let gridLines = 0;        // dark lines between tiles (px) {slide:0,4} {incr:0.5} {limlow:0}
let gridColor = '#000000';   // {color}
let small, sctx;

// An effect: it works on the layers below it.
function draw() {
  let ctx = drawingContext;
  let below = belowImage();
  let s = min(width, height) / 300;
  let tile = Math.max(1, tileSize * s);
  let cols = Math.max(1, Math.ceil(width / tile)), rows = Math.max(1, Math.ceil(height / tile));
  if (!small || small.width !== cols || small.height !== rows) {
    small = document.createElement('canvas');
    small.width = cols; small.height = rows;
    sctx = small.getContext('2d', { willReadFrequently: true });
  }
  // Shrink the picture to one pixel per tile (averaging each tile's colours)
  sctx.imageSmoothingEnabled = true;
  sctx.imageSmoothingQuality = 'high';
  sctx.clearRect(0, 0, cols, rows);
  sctx.drawImage(below, 0, 0, cols * tile, rows * tile * 1, 0, 0, cols, rows);

  ctx.save();
  if (!roundDots) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(small, 0, 0, cols, rows, 0, 0, cols * tile, rows * tile);
  } else {
    ctx.fillStyle = gridColor;
    ctx.fillRect(0, 0, width, height);
    let d = sctx.getImageData(0, 0, cols, rows).data;
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        let o = (j * cols + i) * 4;
        ctx.fillStyle = 'rgb(' + d[o] + ',' + d[o + 1] + ',' + d[o + 2] + ')';
        ctx.beginPath();
        ctx.arc((i + 0.5) * tile, (j + 0.5) * tile, tile * dotSize / 2, 0, TWO_PI);
        ctx.fill();
      }
    }
  }
  if (gridLines > 0 && !roundDots) {
    ctx.fillStyle = gridColor;
    let g = gridLines * s;
    for (let i = 1; i < cols; i++) ctx.fillRect(i * tile - g / 2, 0, g, height);
    for (let j = 1; j < rows; j++) ctx.fillRect(0, j * tile - g / 2, width, g);
  }
  ctx.restore();
}`, { maxFrames: 120, syncLoop: true }),

kaleido_mirror: preset(`
let slices = 8;           // mirrored slices (even number looks best) {slide:2,24} {incr:2} {limlow:2} {limhigh:64}
let spinsPerLoop = 1;     // turns of the source picture per loop (whole number, negative = other way) {incr:1}
let rotateResult = 0;     // turns of the whole kaleidoscope per loop (whole number) {incr:1}
let sourceZoom = 1.4;     // how much of the picture below is used (bigger = closer in) {slide:0.5,4} {incr:0.05} {limlow:0.1}
let sourceOffset = 0.15;  // how far from the centre the slice is taken {slide:0,0.5} {incr:0.01}

// An effect: it works on the layers below it.
function draw() {
  let ctx = drawingContext;
  let below = belowImage();
  let R = Math.hypot(width, height) / 2 + 2;
  let seg = TWO_PI / slices;
  let spin = progress * TWO_PI * spinsPerLoop;
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.rotate(progress * TWO_PI * rotateResult);
  for (let k = 0; k < slices; k++) {
    ctx.save();
    ctx.rotate(k * seg);
    if (k % 2) { ctx.rotate(seg); ctx.scale(1, -1); }     // every other slice is mirrored
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, R, -0.002, seg + 0.002);
    ctx.closePath();
    ctx.clip();
    // The same turning, zoomed piece of the picture below is shown in every slice
    ctx.rotate(spin);
    ctx.scale(sourceZoom, sourceZoom);
    ctx.translate(-width / 2 - sourceOffset * width, -height / 2);
    ctx.drawImage(below, 0, 0, width, height);
    ctx.restore();
  }
  ctx.restore();
}`, { maxFrames: 360, syncLoop: true }),

wave_distortion: preset(`
let amplitude = 8;        // how far things are pushed (px at 300px canvas) {slide:0,40} {incr:1} {limlow:0}
let wavelength = 60;      // distance between waves (px at 300px canvas) {slide:10,200} {incr:5} {limlow:2}
let wavesPerLoop = 2;     // how fast the waves travel (whole number) {incr:1}
let horizontal = true;    // rows sway left and right
let vertical = false;     // columns bob up and down
let sliceSize = 2;        // thickness of each slice (px, smaller = smoother, slower) {slide:1,8} {incr:1} {limlow:1}
let mid;

// An effect: it works on the layers below it.
function draw() {
  let ctx = drawingContext;
  let below = belowImage();
  let s = min(width, height) / 300;
  let amp = amplitude * s, wl = Math.max(2, wavelength * s), t = progress * TWO_PI * wavesPerLoop;
  let step = Math.max(1, Math.round(sliceSize));
  let source = below;
  if (horizontal && vertical) {
    if (!mid || mid.width !== width || mid.height !== height) { mid = document.createElement('canvas'); mid.width = width; mid.height = height; }
    let m = mid.getContext('2d');
    m.clearRect(0, 0, width, height);
    for (let y = 0; y < height; y += step) {
      let dx = Math.sin(y / wl * TWO_PI + t) * amp;
      m.drawImage(below, 0, y, width, step, dx, y, width, step);
      if (dx > 0) m.drawImage(below, width - dx, y, dx, step, 0, y, dx, step);           // wrap the edge
      else if (dx < 0) m.drawImage(below, 0, y, -dx, step, width + dx, y, -dx, step);
    }
    source = mid;
  }
  if (horizontal && !vertical) {
    for (let y = 0; y < height; y += step) {
      let dx = Math.sin(y / wl * TWO_PI + t) * amp;
      ctx.drawImage(source, 0, y, width, step, dx, y, width, step);
      if (dx > 0) ctx.drawImage(source, width - dx, y, dx, step, 0, y, dx, step);
      else if (dx < 0) ctx.drawImage(source, 0, y, -dx, step, width + dx, y, -dx, step);
    }
  } else if (vertical) {
    for (let x = 0; x < width; x += step) {
      let dy = Math.sin(x / wl * TWO_PI + t) * amp;
      ctx.drawImage(source, x, 0, step, height, x, dy, step, height);
      if (dy > 0) ctx.drawImage(source, x, height - dy, step, dy, x, 0, step, dy);
      else if (dy < 0) ctx.drawImage(source, x, 0, step, -dy, x, height + dy, step, -dy);
    }
  } else {
    ctx.drawImage(source, 0, 0);
  }
}`, { maxFrames: 120, syncLoop: true }),

ascii_effect: preset(`
let cellSize = 6;         // width of each character cell (px at 300px canvas) {slide:3,24} {incr:0.5} {limlow:2} {limhigh:80}
let characters = ' .:-=+*#%@';   // from darkest to brightest
let colorful = true;      // keep the original colours (off = one terminal colour)
let textColor = '#33ff66';       // used when colorful is off {color}
let backgroundColor = '#000000'; // {color}
let invert = false;       // bright areas get the sparse characters
let boost = 1.2;          // brighten the picture before choosing characters {slide:0.5,3} {incr:0.05} {limlow:0.1}
let small, sctx;

// An effect: it turns the layers below into text characters, like a console.
function draw() {
  let ctx = drawingContext;
  let below = belowImage();
  let s = min(width, height) / 300;
  let cw = Math.max(2, cellSize * s), ch = cw * 1.5;          // console characters are taller than wide
  let cols = Math.max(1, Math.ceil(width / cw)), rows = Math.max(1, Math.ceil(height / ch));
  if (!small || small.width !== cols || small.height !== rows) {
    small = document.createElement('canvas');
    small.width = cols; small.height = rows;
    sctx = small.getContext('2d', { willReadFrequently: true });
  }
  // One averaged colour per cell
  sctx.imageSmoothingEnabled = true;
  sctx.imageSmoothingQuality = 'high';
  sctx.drawImage(below, 0, 0, cols * cw, rows * ch, 0, 0, cols, rows);
  let d = sctx.getImageData(0, 0, cols, rows).data;

  ctx.save();
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, height);
  ctx.font = 'bold ' + (ch * 0.95).toFixed(1) + 'px "Courier New", Consolas, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let chars = characters.length ? characters : ' #';
  if (!colorful) ctx.fillStyle = textColor;
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      let o = (j * cols + i) * 4;
      let r = d[o], g = d[o + 1], b = d[o + 2];
      let lum = Math.min(1, (0.299 * r + 0.587 * g + 0.114 * b) / 255 * boost);
      if (invert) lum = 1 - lum;
      let k = Math.min(chars.length - 1, Math.floor(lum * chars.length));
      let c = chars[k];
      if (c === ' ') continue;
      if (colorful) {
        // brighten dim colours a little so the characters stay readable
        let m = Math.max(r, g, b, 1), lift = Math.min(2.5, 200 / m);
        ctx.fillStyle = 'rgb(' + Math.min(255, r * lift | 0) + ',' + Math.min(255, g * lift | 0) + ',' + Math.min(255, b * lift | 0) + ')';
      }
      ctx.fillText(c, (i + 0.5) * cw, (j + 0.5) * ch);
    }
  }
  ctx.restore();
}`, { maxFrames: 120, syncLoop: true }),

wagon_wave: preset(`
let gridSize = 30;        // {limlow:1} {limhigh:200}
let offsetMultiplier = 5;
let zoom = 1.11;
let dotSize = 0.7;

function setup() {
  colorMode(RGB);
  noStroke();
}

function draw() {
  let t = progress * TWO_PI;
  translate(width / 2, height / 2);
  scale(zoom);
  translate(-width / 2, -height / 2);

  let cellW = width / gridSize, cellH = height / gridSize;
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      let x = i * cellW + cellW / 2;
      let y = j * cellH + cellH / 2;
      let offset = sin(t + i * 0.2 + j * 0.1) * offsetMultiplier;
      fill(map(sin(t + i), -1, 1, 100, 200),
           map(cos(t * 2 + j), -1, 1, 150, 255),
           map(sin(t + i + j), -1, 1, 200, 255));
      ellipse(x + offset, y + offset, min(cellW, cellH) * dotSize);
    }
  }
}`, { maxFrames: 180 }),

// --------------------------------------------------------------------- Others
petals: preset(`
let numPetals = 8;
let flowerRadius = 120;
let petals = [];

function setup() {
  for (let i = 0; i < numPetals; i++) {
    petals.push({ baseAngle: i * TWO_PI / numPetals, offsetPhase: random(TWO_PI) });
  }
}

function draw() {
  let s = min(width, height) / 300;
  let t = progress * TWO_PI;
  translate(width / 2, height / 2);
  scale(s);

  for (let lay = 0; lay < 3; lay++) {
    push();
    scale(1 - lay * 0.2);
    rotate(t * (lay + 1) * (lay % 2 ? -1 : 1));
    drawFlowerLayer(lay, 80 - lay * 20, t);
    pop();
  }
  drawFlowerCenter(t);
}

function drawFlowerLayer(layerIndex, alpha, t) {
  for (let i = 0; i < petals.length; i++) {
    let pt = petals[i];
    let h = (progress * 360 + i * 45 + layerIndex * 60) % 360;
    let sat = 80 + sin(t * 2 + i) * 20;
    let bri = 70 + sin(t * 3 + i * 0.5) * 30;
    let size = flowerRadius + sin(t * 2 + pt.offsetPhase) * 20;
    push();
    rotate(pt.baseAngle + sin(t + pt.offsetPhase) * 0.3);
    drawPetal(size, h, sat, bri, alpha);
    pop();
  }
}

function drawPetal(size, h, sat, bri, alpha) {
  let segments = 15;
  noStroke();
  for (let j = 0; j < segments; j++) {
    let k = j / segments;
    fill((h + k * 60) % 360, sat - k * 20, bri - k * 30, alpha * (1 - k * 0.5));
    let pw = size * 0.4 * (1 - k * 0.8);
    let pl = size * (1 - k);
    beginShape();
    vertex(0, 0);
    bezierVertex(-pw / 3, -pl / 3, -pw / 2, -pl * 0.7, 0, -pl);
    bezierVertex(pw / 2, -pl * 0.7, pw / 3, -pl / 3, 0, 0);
    endShape(CLOSE);
  }
}

function drawFlowerCenter(t) {
  for (let i = 0; i < 8; i++) {
    let size = 40 - i * 4 + sin(t * 6 + i * 0.5) * 3;
    let h = (progress * 720 + i * 20) % 360;
    noStroke();
    fill(h, 90 - i * 10, 80 + sin(t * 4 + i) * 20, 70);
    circle(0, 0, size);
  }
  for (let i = 0; i < 12; i++) {
    let a = i * TWO_PI / 12 + t * 2;
    let r = 8 + sin(t * 3 + i) * 4;
    fill((progress * 360 + i * 30) % 360, 100, 90, 80);
    circle(cos(a) * r, sin(a) * r, 4);
  }
}`, { maxFrames: 360 }),

center_pulse: preset(`
let centerLayers = 8;
let size = 45;
let colorOffset = 0;
let zoom = 2;
let pulsesPerLoop = 3;

function draw() {
  let s = min(width, height) / 300 * zoom;
  translate(width / 2, height / 2);
  scale(s);
  let t = progress * TWO_PI * pulsesPerLoop;

  for (let i = 0; i < centerLayers; i++) {
    let layerSize = size - i * 4;
    let h = (progress * 360 * pulsesPerLoop + i * 20 + colorOffset) % 360;
    let pulsate = sin(t * 3 + i * 0.5) * 3;
    noStroke();
    fill(h, 90 - i * 10, 80 + sin(t * 2 + i) * 20, 70);
    circle(0, 0, layerSize + pulsate);
    if (i % 2 === 0) {
      stroke(h, 70 - i * 10, 100, 30);
      strokeWeight(1);
      noFill();
      circle(0, 0, layerSize + pulsate);
    }
  }
}`, { maxFrames: 360 }),

bg_gradient: preset(`
let gradientColors = ['#FF6B6B', '#FFE66D', '#4ECDC4', '#4F81C2', '#6B4C93'];
let gradientPercentages = [0.3, 0.2, 0.1, 0.2, 0.3];
let gradientRotation = 0;   // degrees
let smooth = true;          // false = hard colour bands

function setup() {
  let ctx = drawingContext;
  let a = radians(gradientRotation);
  let half = (abs(width * sin(a)) + abs(height * cos(a))) / 2;
  let cx = width / 2, cy = height / 2;
  let g = ctx.createLinearGradient(cx + sin(a) * half, cy - cos(a) * half,
                                   cx - sin(a) * half, cy + cos(a) * half);
  let total = gradientPercentages.reduce((s, v) => s + v, 0);
  let pos = 0;
  gradientColors.forEach((c, i) => {
    let band = gradientPercentages[i] / total;
    if (smooth) {
      g.addColorStop(min(1, pos + band / 2), c);
    } else {
      g.addColorStop(pos, c);
      g.addColorStop(min(1, pos + band), c);
    }
    pos += band;
  });
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);
}`),

vignette: preset(`
let vignetteSize = 0.55;      // 0..1 where the darkening starts
let vignetteStrength = 0.9;   // 0..1 darkness at the corners

function setup() {
  let ctx = drawingContext;
  let r = dist(0, 0, width, height) / 2;
  let g = ctx.createRadialGradient(width / 2, height / 2, r * vignetteSize, width / 2, height / 2, r);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,' + vignetteStrength + ')');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);
}`, { syncLoop: true }),

static: preset(`
let grain = 2;           // size of each noise pixel {limlow:1}
let colorNoise = 0.15;   // chance of a coloured speck
let buffer, bctx, img;

function draw() {
  let w = ceil(width / grain), h = ceil(height / grain);
  if (!buffer || buffer.width !== w || buffer.height !== h) {
    buffer = document.createElement('canvas');
    buffer.width = w; buffer.height = h;
    bctx = buffer.getContext('2d');
    img = bctx.createImageData(w, h);
  }
  let d = img.data;
  let barY = progress * h;
  for (let y = 0; y < h; y++) {
    let bar = max(0, 1 - abs(y - barY) / (h * 0.08)) * 40;
    for (let x = 0; x < w; x++) {
      let i = (x + y * w) * 4;
      let v = random(60, 200) + bar;
      if (random() < colorNoise) {
        let ch = floor(random(3));
        d[i] = ch === 0 ? 255 : v * 0.4;
        d[i + 1] = ch === 1 ? 255 : v * 0.4;
        d[i + 2] = ch === 2 ? 255 : v * 0.4;
      } else {
        d[i] = d[i + 1] = d[i + 2] = v;
      }
      d[i + 3] = 255;
    }
  }
  bctx.putImageData(img, 0, 0);
  drawingContext.imageSmoothingEnabled = false;
  drawingContext.drawImage(buffer, 0, 0, w * grain, h * grain);

  stroke(0, 0, 0, 25);
  strokeWeight(1);
  for (let y = 0; y < height; y += 3) line(0, y, width, y);
}`, { maxFrames: 120 }),

};

// ---------------------------------------------------------------------
// Loading presets
//
// One rule for every preset: it REPLACES ALL LAYERS (the preset becomes the
// whole scene), unless "Add as new layer" is switched on, in which case it is
// added as a new layer on top of what is already there.
// ---------------------------------------------------------------------
let presetAddsLayer = false;
try { presetAddsLayer = localStorage.getItem('presetAddsLayer') === '1'; } catch (e) { /* ignore */ }

function setPresetAddsLayer(on) {
    presetAddsLayer = !!on;
    try { localStorage.setItem('presetAddsLayer', presetAddsLayer ? '1' : '0'); } catch (e) { /* ignore */ }
    syncPresetModeUI();
}

function syncPresetModeUI() {
    const input = document.getElementById('presetAddLayer');
    if (input) input.checked = presetAddsLayer;
    const hint = document.getElementById('presetModeHint');
    if (hint) hint.textContent = presetAddsLayer ? 'Presets are added as a new layer' : 'Presets replace all layers';
}
document.addEventListener('DOMContentLoaded', syncPresetModeUI);

// Turns an existing layer into a fresh layer of the given type (same id and position)
function resetLayer(layer, type) {
    layer.type = type;
    layer.code = '';
    layer.name = undefined;
    delete layer.images;
    delete layer.texts;
    Object.assign(layer, { hue: 360, saturation: 100, brightness: 100, opacity: 100,
                           maxFrames: 120, fps: Math.min(60, animationFPS), speed: 1, syncLoop: false,
                           startFrame: 0, endFrame: -1, fadeFrames: 0, zoom: 1,
                           visible: true, collapsed: false });
    initializeLayerTypeData(layer);
    return layer;
}

// The layer a preset goes into. In replace mode every existing layer is
// removed first, so the preset becomes the whole scene.
function presetTargetLayer(type) {
    if (!presetAddsLayer) {
        layers = [];
        selectedLayerId = null;
    }
    return createLayer('', type);
}

function finishPresetLoad(selectId) {
    refreshLayersDOM();
    selectLayer(selectId);
    runAnimation();
}

// Copy a preset's code and settings onto a layer object
function applyPresetToLayer(layer, name) {
    const p = presets[name];
    if (!p) return false;
    if (layer.type !== 'code') resetLayer(layer, 'code');
    layer.code = p.code;
    layer.name = presetDisplayName(name);
    layer.hue = p.hue;
    layer.saturation = p.saturation;
    layer.brightness = p.brightness;
    layer.opacity = p.opacity;
    layer.maxFrames = p.maxFrames;
    layer.fps = Math.min(p.fps, animationFPS);
    layer.speed = p.speed;
    layer.syncLoop = !!p.syncLoop;
    return true;
}

// Friendly name of a preset, taken from its button / dropdown label
function presetDisplayName(name) {
    // Original labels first (the buttons and lists can be swapped around)
    for (const category of document.querySelectorAll('.preset-category')) {
        if (category._default && category._default.value === name) return category._default.label;
        const opt = (category._options || []).find(o => o.value === name);
        if (opt) return opt.label;
    }
    const el = document.querySelector(`option[value="${name}"]`) ||
        document.querySelector(`.main-preset-btn[data-preset="${name}"]`) ||
        [...document.querySelectorAll('.main-preset-btn')].find(b => (b.getAttribute('onclick') || '').includes(`'${name}'`));
    return el ? el.textContent.trim() : name.replace(/_/g, ' ');
}

// Effects work on the layers below them, so they are always added on top
const EFFECT_PRESETS = ['vignette', 'film_grain', 'scanline_crt', 'blur_bloom', 'pixelate', 'ascii_effect', 'kaleido_mirror', 'wave_distortion'];

function loadPreset(name) {
    if (EFFECT_PRESETS.includes(name)) {
        const before = presetAddsLayer;
        presetAddsLayer = true;
        try { return loadPresetInner(name); } finally { presetAddsLayer = before; }
    }
    return loadPresetInner(name);
}

function loadPresetInner(name) {
    if (name === 'bg_image') return loadBackgroundImagePreset();
    if (name === 'text_example') return loadTextExamplePreset();
    if (!presets[name]) {
        console.warn(`Preset '${name}' not found`);
        return;
    }
    const layer = presetTargetLayer('code');
    applyPresetToLayer(layer, name);
    finishPresetLoad(layer.id);
}

// "BG Image": an image layer that fills the canvas. When added as a new
// layer it goes to the back of the stack. Opens the file picker straight away.
function loadBackgroundImagePreset() {
    const layer = presetTargetLayer('image');
    layer.name = 'Background image';
    layer.images[0].imageFit = 'cover';
    layers.splice(layers.indexOf(layer), 1);
    layers.unshift(layer);                  // first in the list = drawn underneath
    finishPresetLoad(layer.id);
    const input = document.getElementById(`imageUpload-${layer.id}`);
    if (input) input.click();
}

// "Text Example": one Text layer per line, each showing a different option of
// the visual text editor (font, colour, animation, show/hide frames, fades,
// the {frame} counter). Everything here can be changed without code.
function loadTextExamplePreset() {
    const examples = [
        { text: 'BIG TEXT', fontSize: 34, fontFamily: 'Arial Black', textY: 28 },
        { text: 'Floating on Animation', fontSize: 20, color: '#66ccff', textY: 44,
          animation: 'float', animAmount: 14, animCycles: 3 },
        { text: 'Frame: {frame}', fontSize: 14, color: '#ffaa66', textX: 4, textY: 6, textAlign: 'LEFT' },
        { text: 'SPINNING', fontSize: 13, bold: true, color: '#ff77bb', textX: 80, textY: 82,
          animation: 'spin', animCycles: 2 },
        { text: 'Appear, Disappear', fontSize: 18, textY: 62, startFrame: 120, endFrame: 300 },
        { text: 'Fade in, Fade out', fontSize: 18, color: '#cc66ff', textY: 76,
          startFrame: 120, endFrame: 300, fadeFrames: 30 },
    ];
    const first = presetTargetLayer('text');
    let insertAt = layers.indexOf(first) + 1;
    examples.forEach((opts, i) => {
        let layer = first;
        if (i > 0) {
            layer = createLayer('', 'text');
            layers.splice(layers.indexOf(layer), 1);
            layers.splice(insertAt++, 0, layer);
        }
        layer.texts = [defaultTextItem(opts)];
        layer.selectedTextIndex = 0;
        layer.maxFrames = 360;
        layer.fps = Math.min(60, animationFPS);
        layer.speed = 1;
        layer.collapsed = i > 0;      // keep the panel tidy: open the first one only
    });
    finishPresetLoad(first.id);
}

function getPresetCode(presetName) {
    return presets[presetName] ? presets[presetName].code : '';
}
