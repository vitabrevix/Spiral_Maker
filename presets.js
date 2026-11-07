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
        selectElement.selectedIndex = 0;
    }
}

function preset(code, opts = {}) {
    return Object.assign({
        code: code.trim() + '\n',
        hue: 360, saturation: 100, brightness: 100, opacity: 100,
        maxFrames: 360, fps: 60, speed: 1
    }, opts);
}

const presets = {

// --------------------------------------------------------------------- Spirals
ying_yang_spiral: preset(`
// Two-tone hypnotic spiral that turns seamlessly.
let arms = 2;           // arms of each colour
let bandWidth = 18;     // thickness of every band (px at 300px canvas)
let turnsPerLoop = 1;   // full rotations per loop (whole number = seamless)
let lightColor = [0, 0, 100];
let darkColor = [0, 0, 0];
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
  for (let k = 0; k < arms; k++) {
    let offset = k * TWO_PI / arms + t;
    beginShape();
    for (let u = 0; u <= maxU; u += 0.06) {
      vertex(cos(u + offset) * c * u, sin(u + offset) * c * u);
    }
    for (let u = maxU; u >= 0; u -= 0.06) {
      let r = c * u + band;
      vertex(cos(u + offset) * r, sin(u + offset) * r);
    }
    endShape(CLOSE);
  }
}`, { maxFrames: 120 }),

dot_spiral: preset(`
// Glowing dots streaming out of the centre along curved spiral arms.
let arms = 7;             // number of spiral arms
let dotsPerArm = 40;      // dots on each arm
let curl = 4.2;           // how far each arm winds (radians from centre to edge)
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
// Flying down a tiled tube: every pixel is mapped onto the inside wall, so the
// sides wrap around you, tiles shrink with distance and the far end fades out.
let tilesAround = 12;     // tiles around the wall (even number)
let ringsPerUnit = 2;     // tile rows per unit of depth (whole number)
let twist = 1;            // spiral twist of the wall pattern (whole number, 0 = straight)
let travelPerLoop = 1;    // depth units flown per loop (whole number)
let spinsPerLoop = 0;     // extra rotation of the whole tunnel (whole number)
let tubeDepth = 0.45;     // bigger = tiles look further away / longer tunnel
let fog = 0.45;           // how quickly the far end fades into darkness
let lightColor = [255, 255, 255];
let darkColor = [0, 0, 0];
let maxResolution = 400;  // render resolution cap (lower = faster, blurrier)

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
// Sunflower / phyllotaxis pattern built on the golden angle.
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
let starCount = 1400;
let arms = 3;
let armTwist = 4.5;      // how tightly the arms wind
let spread = 0.35;       // how fuzzy the arms are
let spinsPerLoop = 1;
let stars = [];

function setup() {
  for (let i = 0; i < starCount; i++) {
    let d = pow(random(), 0.6);
    let arm = i % arms;
    stars.push({
      d: d,
      a: arm * TWO_PI / arms + d * armTwist + randomGaussian() * spread * (1.1 - d),
      size: random(0.6, 2.4),
      hue: d < 0.25 ? random(20, 50) : random(190, 260),
      twinkle: floor(random(1, 5)),
      phase: random(TWO_PI)
    });
  }
}

function draw() {
  let s = min(width, height) / 2 * 0.95;
  let t = progress * TWO_PI;
  translate(width / 2, height / 2);

  // Core glow
  noStroke();
  for (let g = 10; g > 0; g--) {
    fill(40, 40, 100, 4);
    circle(0, 0, s * 0.06 * g);
  }

  rotate(t * spinsPerLoop);
  for (let st of stars) {
    let alpha = 55 + 45 * sin(t * st.twinkle + st.phase);
    fill(st.hue, st.d < 0.25 ? 40 : 55, 100, alpha);
    circle(cos(st.a) * st.d * s, sin(st.a) * st.d * s * 0.92, st.size * s / 150);
  }
}`, { maxFrames: 720 }),

vortex: preset(`
let rings = 22;
let gap = 7;
let twist = 0.35;

function draw() {
  let s = min(width, height) / 300;
  let t = progress * TWO_PI;
  translate(width / 2, height / 2);
  noStroke();

  for (let j = 1; j <= rings; j++) {
    let r = j * gap * s;
    let count = 6 + j * 3;
    let speed = ceil((rings + 1 - j) / 4);  // inner rings spin faster (whole numbers)
    let rot = t * speed + j * twist;
    fill((j * 14 + progress * 360) % 360, 85, 100, 85);
    for (let k = 0; k < count; k++) {
      let a = rot + k * TWO_PI / count;
      circle(cos(a) * r, sin(a) * r, (1.5 + j * 0.25) * s);
    }
  }
}`, { maxFrames: 360 }),

circling_spiral: preset(`
// A spinning spiral whose centre orbits the middle of the canvas.
let turns = 6;
let orbitRadius = 55;
let spinsPerLoop = 3;
let lineWeight = 4;

function draw() {
  let s = min(width, height) / 300;
  let t = progress * TWO_PI;
  translate(width / 2, height / 2);

  // Orbit path
  noFill();
  stroke(0, 0, 100, 12);
  strokeWeight(1);
  circle(0, 0, orbitRadius * 2 * s);

  translate(cos(t) * orbitRadius * s, sin(t) * orbitRadius * s);
  rotate(t * spinsPerLoop);

  let steps = turns * 60;
  let maxR = 85 * s;
  strokeWeight(lineWeight * s);
  for (let i = 0; i < steps; i++) {
    let a1 = i / 60 * TWO_PI, a2 = (i + 1) / 60 * TWO_PI;
    let r1 = maxR * i / steps, r2 = maxR * (i + 1) / steps;
    stroke((i / steps * 300 + progress * 360) % 360, 80, 100);
    line(cos(a1) * r1, sin(a1) * r1, cos(a2) * r2, sin(a2) * r2);
  }
}`, { maxFrames: 360 }),

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
// Hypnotic black & white rings that breathe in and out.
let bandWidth = 16;       // average band thickness (px at 300px canvas)
let pulsesPerLoop = 2;    // breaths per loop (whole number)
let breathe = 0.25;       // how much the whole pattern expands / contracts
let ripple = 0.5;         // wave running through the rings (0 = uniform breathing)
let rippleLength = 0.6;   // spacing of that wave between rings
let flowPerLoop = 0;      // rings flowing outward per loop (even whole number, 0 = none)
let lightColor = [0, 0, 100];
let darkColor = [0, 0, 0];

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
let planets = 6;
let trail = 14;          // trail segments behind each planet
let planetData = [];

function setup() {
  for (let i = 0; i < planets; i++) {
    planetData.push({
      orbit: 0.16 + i * 0.13,
      speed: planets - i,             // whole revolutions per loop
      phase: random(TWO_PI),
      size: random(5, 11),
      hue: (i * 360 / planets + 20) % 360
    });
  }
}

function draw() {
  let s = min(width, height) / 2;
  let t = progress * TWO_PI;
  translate(width / 2, height / 2);

  // Orbits
  noFill();
  strokeWeight(1);
  stroke(0, 0, 100, 10);
  for (let pl of planetData) circle(0, 0, pl.orbit * s * 2);

  // Sun
  noStroke();
  for (let g = 6; g > 0; g--) {
    fill(40, 90, 100, 12);
    circle(0, 0, s * 0.05 * g);
  }
  fill(45, 70, 100);
  circle(0, 0, s * 0.12);

  for (let pl of planetData) {
    let r = pl.orbit * s;
    for (let k = trail; k >= 0; k--) {
      let a = t * pl.speed + pl.phase - k * 0.045 * pl.speed;
      fill(pl.hue, 80, 100, 100 * (1 - k / trail) * (k ? 0.4 : 1));
      circle(cos(a) * r, sin(a) * r, pl.size * s / 150 * (1 - k / (trail * 1.5)));
    }
  }
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
// Flower-of-life rings that breathe and counter-rotate.
let petalRings = 3;
let baseRadius = 34;

function draw() {
  let s = min(width, height) / 300;
  let t = progress * TWO_PI;
  translate(width / 2, height / 2);
  noFill();
  strokeWeight(1.6);

  for (let ring = petalRings; ring >= 1; ring--) {
    let count = ring * 6;
    let breathe = 1 + 0.18 * sin(t * 2 + ring);
    let r = baseRadius * s * breathe;
    let dir = ring % 2 ? 1 : -1;
    push();
    rotate(t * dir);
    for (let i = 0; i < count; i++) {
      let a = i * TWO_PI / count;
      let d = ring * r * 0.9;
      stroke((ring * 70 + i * 360 / count + progress * 360) % 360, 70, 100, 85);
      circle(cos(a) * d, sin(a) * d, r * 2);
    }
    pop();
  }
  stroke(0, 0, 100, 90);
  circle(0, 0, baseRadius * s * 2 * (1 + 0.18 * sin(t * 2)));
}`, { maxFrames: 360 }),

// --------------------------------------------------------------------- Objects
stopwatch: preset(`
// Hypnotist's pocket watch swinging on a golden chain.
let swingsPerLoop = 3;     // full back-and-forth swings per loop
let swingAngle = 32;       // degrees
let chainLinks = 14;

function draw() {
  let s = min(width, height) / 300;
  let watchSize = 100 * s;
  let len = height * 0.6;
  let pivotX = width / 2, pivotY = -10 * s;
  let angle = radians(swingAngle) * sin(progress * TWO_PI * swingsPerLoop);

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
let swingAngle = 36;    // degrees
let bobSize = 70;
let ghosts = 0;         // motion-blur copies (e.g. 4) - looks nice, but makes GIFs bigger

function draw() {
  let s = min(width, height) / 300;
  let pivotX = width / 2, pivotY = 12 * s;
  let len = height * 0.68;

  for (let g = ghosts; g >= 0; g--) {
    let p = progress - g * 0.006;
    let a = radians(swingAngle) * sin(p * TWO_PI * swingsPerLoop);
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

mandala: preset(`
// Layered ornamental mandala: rings of petals, scallops, diamonds and dots
// that breathe and counter-rotate. Each ring turns by one symmetry step per
// loop, so the motion is gentle and the loop is seamless.
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
// Particles spiralling out from the centre, endlessly.
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
// Chinese coin swinging on a red silk string.
let swingsPerLoop = 3;
let swingAngle = 40;     // degrees
let coinSize = 120;

function draw() {
  let s = min(width, height) / 300;
  let size = coinSize * s;
  let pivotX = width / 2, pivotY = 0;
  let len = height * 0.62;
  let angle = radians(swingAngle) * sin(progress * TWO_PI * swingsPerLoop + PI);

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
let rotationMomentum = 1; // extra crystal tilt
let chainLinks = 10;
let crystalSize = 60;

function draw() {
  let s = min(width, height) / 300;
  let w = crystalSize * s, h = crystalSize * 2 * s;
  let pivotX = width / 2, pivotY = -60 * s;
  let len = height * 0.55 + 60 * s;
  let angle = radians(swingAngle) * sin(progress * TWO_PI * swingsPerLoop);
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
  ellipse(pivotX, max(pivotY, 0), 12 * s, 8 * s);
}`, { maxFrames: 360 }),

metronome: preset(`
// Classic wooden pyramid metronome: the pendulum rod swings in front of the
// tempo scale, pivoting behind the lower front panel.
let beatsPerLoop = 6;      // ticks per loop (even number keeps it seamless)
let swingAngle = 24;       // degrees
let weightPosition = 0.5;  // 0 = pivot, 1 = tip of the rod
let woodLight = '#9a5a2c';
let woodMid = '#6e3818';
let woodDark = '#3a1a08';

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
let lineGap = 8;
let lineWeight = 5;

function draw() {
  let t = progress * TWO_PI;
  strokeWeight(lineWeight);
  noFill();

  for (let y = 0; y < height + lineGap; y += lineGap) {
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
let columnStep = 3;
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
// Crystal shards growing and shrinking around a glowing core.
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
// Water caustics (port of a classic shader), rendered at low resolution.
let samples = 120;       // horizontal resolution of the effect (higher = sharper, slower)
let iterations = 5;
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

wagon_wave: preset(`
let gridSize = 30;
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

text_example: preset(`
let textStartFrame = 120;
let textEndFrame = 300;
let fadeFrames = 30;

function draw() {
  textAlign(CENTER, CENTER);
  noStroke();

  fill(0, 0, 100, 80);
  textSize(30);
  textFont('Arial Black');
  text('BIG TEXT', width / 2, height * 0.3);

  let wave = sin(progress * TWO_PI * 3) * 20;
  fill(200, 60, 100, 70);
  textSize(22);
  textFont('Arial');
  text('Floating on Animation', width / 2, height * 0.45 + wave);

  fill(20, 60, 100);
  textAlign(LEFT, TOP);
  textSize(14);
  text('Frame: ' + frameCount, 12, 12);

  push();
  translate(width - 60, height - 60);
  rotate(progress * TWO_PI * 2);
  fill(330, 60, 100, 70);
  textAlign(CENTER, CENTER);
  textSize(12);
  text('SPINNING', 0, 0);
  pop();

  if (frameCount >= textStartFrame && frameCount <= textEndFrame) {
    let alpha = 100;
    if (frameCount < textStartFrame + fadeFrames) {
      alpha = map(frameCount, textStartFrame, textStartFrame + fadeFrames, 0, 100);
    }
    if (frameCount > textEndFrame - fadeFrames) {
      alpha = map(frameCount, textEndFrame - fadeFrames, textEndFrame, 100, 0);
    }
    fill(300, 80, 90, alpha);
    textAlign(CENTER, CENTER);
    textSize(18);
    text('Fade in, Fade out', width / 2, height * 0.75);
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
// Static background gradient (put this layer at the top of the list = bottom of the stack).
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
// Static dark vignette - place it on the last layer so it sits on top.
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
}`),

static: preset(`
// Old TV static with scan lines and a rolling bar.
let grain = 2;           // size of each noise pixel
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

// Copy a preset's code and settings onto a layer object
function applyPresetToLayer(layer, name) {
    const p = presets[name];
    if (!p) return false;
    layer.type = 'code';
    layer.code = p.code;
    layer.hue = p.hue;
    layer.saturation = p.saturation;
    layer.brightness = p.brightness;
    layer.opacity = p.opacity;
    layer.maxFrames = p.maxFrames;
    layer.fps = Math.min(p.fps, animationFPS);
    layer.speed = p.speed;
    return true;
}

// Load a preset into the selected layer (or a new layer) and play it
function loadPreset(name) {
    if (name === 'bg_image') {
        addBackgroundImageLayer();
        return;
    }
    if (!presets[name]) {
        console.warn(`Preset '${name}' not found`);
        return;
    }
    let layer = getSelectedLayer();
    if (!layer || layer.type !== 'code') {
        layer = createLayer('');
        applyPresetToLayer(layer, name);
        refreshLayersDOM();
        selectLayer(layer.id);
    } else {
        applyPresetToLayer(layer, name);
        LayerDOM.refresh(layer.id);
        updateLayerSelection();
    }
    runAnimation();
}

// "BG Image": an image layer at the bottom of the stack that fills the canvas.
// Opens the file picker straight away so you can choose the picture.
function addBackgroundImageLayer() {
    const layer = createLayer('', 'image');
    layer.images[0].imageFit = 'cover';
    layers.splice(layers.indexOf(layer), 1);
    layers.unshift(layer);                  // first in the list = drawn underneath
    refreshLayersDOM();
    selectLayer(layer.id);
    runAnimation();
    const input = document.getElementById(`imageUpload-${layer.id}`);
    if (input) input.click();
}

function getPresetCode(presetName) {
    return presets[presetName] ? presets[presetName].code : '';
}
