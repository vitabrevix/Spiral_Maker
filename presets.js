// Animation presets for the p5.js Spiral Editor
const presets = {
    tunnel: `function setup() {
  createCanvas(300, 300);
  colorMode(HSB, 360, 100, 100);
}

function draw() {
  background(0);
  translate(width/2, height/2);
  
  // Create perfect loop by using frameCount with TWO_PI
  let time = (frameCount / 120) * TWO_PI; // Complete one cycle per loop
  
  for (let i = 0; i < 50; i++) {
    let size = 300 - i * 6 + sin(time + i * 0.2) * 20;
    let hue = (i * 10 + (frameCount * 2)) % 360;
    
    stroke(hue, 80, 90);
    strokeWeight(2);
    noFill();
    
    ellipse(0, 0, size*2, size*2);
  }
}`,

    spiral: `function setup() {
  createCanvas(300, 300);
  colorMode(HSB, 360, 100, 100);
}

function draw() {
  background(0, 0, 10);
  translate(width/2, height/2);
  
  // Perfect loop: complete one cycle per animation loop
  let time = (frameCount / 20) * TWO_PI;
  
  for (let i = 0; i < 200; i++) {
    let angle = i * 0.1 + time;
    let radius = i * 0.8;
    
    let x = cos(angle) * radius;
    let y = sin(angle) * radius;
    
    let hue = (i * 2 + frameCount * 3) % 360;
    fill(hue, 80, 90, 0.8);
    noStroke();
    
    ellipse(x, y, 8, 8);
  }
}`,

    waves: `function setup() {
  createCanvas(300, 300);
  colorMode(HSB, 360, 100, 100);
}

function draw() {
  background(0, 0, 5);
  
  // Perfect loop timing
  let time = (frameCount / 120) * TWO_PI * 0.6; // Complete cycles per loop
  
  for (let y = 0; y < height; y += 4) {
    for (let x = 0; x < width; x += 4) {
      let d = dist(x, y, width/2, height/2);
      let wave = sin(d * 0.05 - time * 5) * 50;
      
      let hue = (d + frameCount * 2) % 360;
      let brightness = map(wave, -50, 50, 30, 100);
      
      fill(hue, 70, brightness);
      noStroke();
      rect(x, y, 4, 4);
    }
  }
}`,

    mandala: `function setup() {
  createCanvas(300, 300);
  colorMode(HSB, 360, 100, 100);
}

function draw() {
  background(0, 0, 10);
  translate(width/2, height/2);
  
  // Perfect loop rotation
  let time = (frameCount / 120) * TWO_PI * 0.1; // One complete rotation per loop
  
  for (let layer = 0; layer < 8; layer++) {
    rotate(time * (layer + 1));
    
    for (let i = 0; i < 12; i++) {
      let angle = (TWO_PI / 12) * i;
      let radius = 30 + layer * 20;
      
      let x = cos(angle) * radius;
      let y = sin(angle) * radius;
      
      let hue = (layer * 45 + i * 10 + frameCount) % 360;
      fill(hue, 70, 80);
      noStroke();
      
      ellipse(x, y, 8 - layer, 8 - layer);
    }
  }
}`,

    plasma: `function setup() {
  createCanvas(300, 300);
  colorMode(HSB, 360, 100, 100);
}

function draw() {
  // Perfect loop timing for all wave components
  let time = (frameCount / 120) * TWO_PI;
  
  for (let x = 0; x < width; x += 2) {
    for (let y = 0; y < height; y += 2) {
      let plasma = sin(x * 0.02 + time) + 
                   sin(y * 0.03 + time * 1.3) + 
                   sin((x + y) * 0.01 + time * 0.8) +
                   sin(sqrt(x*x + y*y) * 0.02 + time * 2);
      
      let hue = map(plasma, -4, 4, 0, 360);
      let brightness = map(sin(plasma + time), -1, 1, 30, 100);
      
      fill(hue, 80, brightness);
      noStroke();
      rect(x, y, 2, 2);
    }
  }
}`
};

// Function to load a preset by name
function loadPreset(name) {
    if (presets[name]) {
        document.getElementById('codeEditor').value = presets[name];
    } else {
        console.warn(`Preset '${name}' not found`);
    }
}

// Function to update all preset canvas sizes when canvas dimensions change
function updatePresetCanvasSizes() {
    Object.keys(presets).forEach(key => {
        presets[key] = presets[key].replace(
            /createCanvas\(\d+,\s*\d+\)/, 
            `createCanvas(${canvasWidth}, ${canvasHeight})`
        );
    });
    
    // Update current code in editor if it contains createCanvas
    const currentCode = document.getElementById('codeEditor').value;
    if (currentCode.includes('createCanvas(')) {
        const updatedCode = currentCode.replace(
            /createCanvas\(\d+,\s*\d+\)/, 
            `createCanvas(${canvasWidth}, ${canvasHeight})`
        );
        document.getElementById('codeEditor').value = updatedCode;
    }
}