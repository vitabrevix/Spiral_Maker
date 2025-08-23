// Function to handle dropdown preset selection
function loadPresetFromDropdown(selectElement, category) {
	const presetName = selectElement.value;
	if (presetName) {
		loadPreset(presetName);
		// Reset dropdown to default option
		selectElement.selectedIndex = 0;
	}
}

// Main preset codes
const presets = {
    spiral: `function draw() {
  translate(width/2, height/2);
  
  let time = (frameCount / 20) * TWO_PI;
  
  for (let i = 0; i < 400; i++) {
    let angle = i * 0.1 + time;
    let radius = i * 1;
    
    let x = cos(angle) * radius/2;
    let y = sin(angle) * radius/2;
    
    let hue = (i * 2 + frameCount * 3) % 360;
    fill(hue, saturation, brightness, 0.3);
    noStroke();
    
    ellipse(x, y, 10, 10);
  }
}`,

    waves: `function draw() {
  let time = frameCount * 0.01;
  strokeWeight(10);
  noFill();

  for (let y = 0; y < height; y += 8) {
    stroke(180 + 60 * sin(time + y * 0.01), saturation, brightness, opacity);
    
    beginShape();
    
    for (let x = 0; x <= width; x += 5) {
      let wave = sin(x * 0.02 + time + y * 0.003) * 20;
      vertex(x, y + wave);
    }
    endShape();
  }
}`,

    tunnel: `function draw() {
  translate(width/2, height/2);
  
  let time = (frameCount / 120) * TWO_PI;
  
  for (let i = 0; i < 50; i++) {
    let size = 300 - i * 6 + sin(time + i * 0.2) * 20;
    let hue = (i * 10 + (frameCount * 2)) % 360;
    
    stroke(hue, saturation, brightness, opacity);
    strokeWeight(2);
    noFill();
    
    ellipse(0, 0, size*2, size*2);
  }
}`,

    mandala: `function draw() {
  translate(width/2, height/2);
  
  let time = frameCount * 0.01;
  
  for (let layer = 0; layer < 5; layer++) {
    let petals = 6 + layer * 2;
    
    for (let i = 0; i < petals; i++) {
      push();
      rotate(TWO_PI * i / petals + time * (layer + 1));
      
      let hue = (layer * 60 + frameCount) % 360;
      fill(hue, 60, 90, 0.7);
      stroke(hue, saturation, brightness, opacity);
      strokeWeight(1);
      
      let size = 30 + layer * 15;
      ellipse(40 + layer * 10, 0, size, size * 0.6);
      pop();
    }
  }
}`,

    plasma: `function draw() {
  let time = frameCount * 0.02;
  
  loadPixels();
  
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      let plasma = sin(x * 0.02 + time) + 
                  sin(y * 0.03 + time * 1.2) +
                  sin((x + y) * 0.02 + time * 0.8) +
                  sin(sqrt(x*x + y*y) * 0.02 + time * 1.5);
      
      let hue = (plasma * 50 + frameCount) % 360;
      let sat = saturation + plasma * 30;
      let bright = brightness + plasma * 40;
      
      let c = color(hue, sat, bright);
      let index = (x + y * width) * 4;
      pixels[index] = red(c);
      pixels[index + 1] = green(c);
      pixels[index + 2] = blue(c);
      pixels[index + 3] = 255;
    }
  }
  
  updatePixels();
}`,

    tunnel_2: `function draw() {
  translate(width/2, height/2);
  
  let time = frameCount * 0.03;
  
  for (let i = 0; i < 100; i++) {
    let size = i * 8;
    let hue = (i * 10 + frameCount * 2) % 360;
    
    push();
    rotate(time + i * 0.1);
    
    stroke(hue, saturation, brightness, opacity);
    strokeWeight(2);
    noFill();
    
    rect(-size/2, -size/2, size, size);
    pop();
  }
}`,

    golden_spiral: `function draw() {
  translate(width/2, height/2);
  let time = frameCount * 0.02;
  
  stroke(45, 80, 90);
  strokeWeight(2);
  noFill();
  
  let phi = (1 + sqrt(5)) / 2; // Golden ratio
  
  for (let i = 0; i < 500; i++) {
    let angle = i * 0.1 + time;
    let radius = sqrt(i) * 4;
    
    let x = cos(angle) * radius;
    let y = sin(angle) * radius;
    
    point(x, y);
  }
}`,

    double_spiral: `function draw() {
  translate(width/2, height/2);
  let time = frameCount * 0.01;
  
  for (let spiral = 0; spiral < 2; spiral++) {
    for (let i = 0; i < 150; i++) {
      let angle = i * 0.2 + time + spiral * PI;
      let radius = i * 1.2;
      
      let x = cos(angle) * radius;
      let y = sin(angle) * radius;
      
      let hue = (spiral * 180 + i * 2 + frameCount) % 360;
      fill(hue, 70, 85);
      noStroke();
      
      ellipse(x, y, 6, 6);
    }
  }
}`,

	text_example: `let textStartFrame = 120;  // Appears after 2 seconds
let textEndFrame = 300;    // Disappears after 5 seconds

function draw() {
    fill(255, 255, 255, 200);
    p.textAlign(p.CENTER, p.CENTER);
    textSize(30);
    p.textFont('Arial Black');
    text("BIG TEXT", width/2, 100);
    
    let wave = sin(frameCount * 0.05) * 20;
    fill(100, 200, 255, 180);
    textSize(24);
    p.textFont('Arial');
    text("Floating on Animation", width/2, 150 + wave);
    
    // Dynamic counter
    fill(255, 150, 100);
    p.textAlign(p.LEFT, p.TOP);
    textSize(16);
    p.text("Frame: " + frameCount, 20, 20);
    
    // Animated rotating text
    push();
    translate(width - 100, height - 100);
    p.rotate(frameCount * 0.02);
    fill(255, 100, 150, 180);
    p.textAlign(p.CENTER, p.CENTER);
    textSize(12);
    p.text("SPINNING", 0, 0);
    pop();
    
    // Immediate appear/disappear text
    if (frameCount >= textStartFrame && frameCount <= textEndFrame) {
        fill(0, 0, 100); // HSB: hue=0, sat=0, brightness=100 (white)
        p.textAlign(p.CENTER, p.CENTER);
        textSize(20);
        p.text("Appear, Disappear", width/2, height/2);
    }
    
    // Fade in/out text
    if (frameCount >= textStartFrame && frameCount <= textEndFrame) {
        let alpha = 100; // HSB alpha ranges 0-100
        let fadeFrames = 30;
        
        // Fade in
        if (frameCount < textStartFrame + fadeFrames) {
            alpha = map(frameCount, textStartFrame, textStartFrame + fadeFrames, 0, 100);
        }
        
        // Fade out  
        if (frameCount > textEndFrame - fadeFrames) {
            alpha = map(frameCount, textEndFrame - fadeFrames, textEndFrame, 100, 0);
        }
        
        fill(300, 80, 90, alpha); // HSB: purple hue, with alpha
        textSize(18);
        p.text("Fade in, Fade out", width/2, 5*height/6);
    }
}`,

    
};

// Function to load a preset by name
function loadPreset(name) {
    if (presets[name]) {
        const selectedLayer = getSelectedLayer();
        if (selectedLayer) {
            // Update the selected layer's code
            selectedLayer.code = presets[name];
            
            // Update the textarea for this layer
            const layerDiv = document.querySelector(`[data-layer-id="${selectedLayer.id}"]`);
            if (layerDiv) {
                const textarea = layerDiv.querySelector('.layer-textarea');
                textarea.value = selectedLayer.code;
            }
            
            // Restart animation if running
            if (isRunning) {
                stopAnimation();
                setTimeout(runAnimation, 100);
            }
        } else {
            // If no layer is selected, create a new one with the preset
            const newLayer = createLayer(`${name.charAt(0).toUpperCase() + name.slice(1)} Layer`, presets[name]);
            selectLayer(newLayer.id);
            
            if (isRunning) {
                stopAnimation();
                setTimeout(runAnimation, 100);
            }
        }
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

// This function is now redundant since we use the main presets object
function getPresetCode(presetName) {
    return presets[presetName] || '';
}