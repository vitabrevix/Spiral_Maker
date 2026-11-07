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
let dots = 400;
let spacing = 0.5;
let dotSize = 10;
let spinsPerLoop = 1;

function draw() {
  let s = min(width, height) / 300;
  let t = progress * TWO_PI * spinsPerLoop;
  translate(width / 2, height / 2);
  noStroke();

  for (let i = 0; i < dots; i++) {
    let angle = i * 0.1 + t;
    let radius = i * spacing * s;
    let h = (i * 2 + progress * 360) % 360;
    fill(h, 100, 100, 40);
    ellipse(cos(angle) * radius, sin(angle) * radius, dotSize * s);
  }
}`, { maxFrames: 240 }),

tunnel: preset(`
// Black & white tunnel rushing towards the viewer, twisting as it goes.
let rings = 24;          // keep this an even number
let ringsPerLoop = 2;    // rings that pass the camera each loop
let twist = 1.5;         // extra turn from the near end to the far end
let spinsPerLoop = 1;
let lightColor = [0, 0, 100];
let darkColor = [0, 0, 0];

function draw() {
  let R = dist(0, 0, width, height) / 2;
  let t = progress * TWO_PI * spinsPerLoop;
  translate(width / 2, height / 2);
  noStroke();

  let list = [];
  for (let i = 0; i < rings; i++) {
    let phase = (((i - progress * ringsPerLoop) / rings) % 1 + 1) % 1;
    list.push({ i: i, phase: phase });
  }
  list.sort((a, b) => a.phase - b.phase);   // nearest (biggest) first

  for (let ring of list) {
    let r = R * 0.06 / (ring.phase + 0.045);
    let a = t + ring.phase * twist * TWO_PI;
    let fade = constrain(map(ring.phase, 0.55, 1, 1, 0), 0, 1);
    let swap = ring.i % 2;
    let c1 = swap ? darkColor : lightColor;
    let c2 = swap ? lightColor : darkColor;
    fill(c1[0], c1[1], c1[2] * fade);
    arc(0, 0, r * 2, r * 2, a, a + PI, PIE);
    fill(c2[0], c2[1], c2[2] * fade);
    arc(0, 0, r * 2, r * 2, a + PI, a + TWO_PI, PIE);
  }
  fill(darkColor);
  circle(0, 0, R * 0.06 / 1.045 * 2);
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
let rings = 5;

function draw() {
  let s = min(width, height) / 300;
  let t = progress * TWO_PI;
  translate(width / 2, height / 2);

  for (let ring = 0; ring < rings; ring++) {
    let petals = 6 + ring * 2;
    let dir = ring % 2 ? -1 : 1;
    let h = (ring * 60 + progress * 360) % 360;
    for (let i = 0; i < petals; i++) {
      push();
      rotate(TWO_PI * i / petals + t * dir);
      fill(h, 60, 90, 70);
      stroke(h, 100, 100);
      strokeWeight(1);
      let size = (30 + ring * 15) * s;
      ellipse((40 + ring * 10) * s, 0, size, size * 0.6);
      pop();
    }
  }
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
// Wooden metronome ticking back and forth.
let beatsPerLoop = 6;     // ticks per loop (even number keeps it seamless)
let swingAngle = 28;      // degrees
let weightPosition = 0.62;

function draw() {
  let s = min(width, height) / 300;
  let cx = width / 2, base = height * 0.88;
  let bodyH = 210 * s, bodyTop = 46 * s, bodyBottom = 140 * s;

  // Body
  noStroke();
  fill(22, 70, 38);
  quad(cx - bodyTop / 2, base - bodyH, cx + bodyTop / 2, base - bodyH,
       cx + bodyBottom / 2, base, cx - bodyBottom / 2, base);
  fill(25, 60, 55);
  quad(cx - bodyTop / 2 + 8 * s, base - bodyH + 12 * s, cx + bodyTop / 2 - 8 * s, base - bodyH + 12 * s,
       cx + bodyBottom / 2 - 22 * s, base - 30 * s, cx - bodyBottom / 2 + 22 * s, base - 30 * s);
  fill(20, 60, 25);
  rect(cx - bodyBottom / 2 - 8 * s, base, bodyBottom + 16 * s, 12 * s, 3 * s);

  // Scale marks
  stroke(40, 30, 90, 70);
  strokeWeight(1 * s);
  for (let i = -4; i <= 4; i++) {
    let a = radians(i * 7);
    let px = cx, py = base - 34 * s;
    line(px + sin(a) * 120 * s, py - cos(a) * 120 * s, px + sin(a) * 128 * s, py - cos(a) * 128 * s);
  }

  // Arm: sine swing, a tick at each extreme
  let phase = progress * PI * beatsPerLoop;
  let a = radians(swingAngle) * sin(phase);
  let px = cx, py = base - 34 * s;
  let armLen = 160 * s;
  stroke(0, 0, 80);
  strokeWeight(3 * s);
  line(px, py, px + sin(a) * armLen, py - cos(a) * armLen);

  // Sliding weight
  let wx = px + sin(a) * armLen * weightPosition;
  let wy = py - cos(a) * armLen * weightPosition;
  push();
  translate(wx, wy);
  rotate(a);
  noStroke();
  fill(45, 70, 85);
  rect(-10 * s, -9 * s, 20 * s, 18 * s, 3 * s);
  fill(45, 40, 100, 70);
  rect(-8 * s, -7 * s, 6 * s, 14 * s, 2 * s);
  pop();

  // Pivot and tick light
  noStroke();
  fill(0, 0, 70);
  circle(px, py, 10 * s);
  let tick = pow(abs(sin(phase)), 30);
  fill(5, 90, 100, 100 * tick);
  circle(cx, base - bodyH - 10 * s, 12 * s);
  fill(5, 90, 100, 25 * tick);
  circle(cx, base - bodyH - 10 * s, 30 * s);
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

function getPresetCode(presetName) {
    return presets[presetName] ? presets[presetName].code : '';
}
