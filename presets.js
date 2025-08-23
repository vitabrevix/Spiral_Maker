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
// Modified presets.js - Only the parts that need to change

// Updated presets object with layer properties
const presets = {
    dot_spiral: {
        code: `function draw() {
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
        hue: 360,
        saturation: 100,
        brightness: 100,
        opacity: 100,
        maxFrames: 120,
        fps: 60,
        speed: 1
    },

    tunnel: {
        code: `function draw() {
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
        hue: 360,
        saturation: 100,
        brightness: 100,
        opacity: 100,
        maxFrames: 360,
        fps: 60,
        speed: 1
    },

    mandala: {
        code: `function draw() {
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
        hue: 360,
        saturation: 100,
        brightness: 100,
        opacity: 100,
        maxFrames: 300,
        fps: 60,
        speed: 0.8
    },
	
	waves: {
		code: `function draw() {
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
		hue: 360,
		saturation: 100,
		brightness: 100,
		opacity: 100,
		maxFrames: 360,
		fps: 60,
		speed: 0.5
	},

    tunnel_2: {
		code: `function draw() {
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
        hue: 360,
        saturation: 100,
        brightness: 100,
        opacity: 100,
        maxFrames: 200,
        fps: 60,
        speed: 1.3
    },

    golden_spiral: {
		code: `function draw() {
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
        hue: 360,
        saturation: 100,
        brightness: 100,
        opacity: 100,
        maxFrames: 360,
        fps: 60,
        speed: 0.7
    },

    double_spiral: {
        code: `function draw() {
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
        hue: 360,
        saturation: 100,
        brightness: 100,
        opacity: 100,
        maxFrames: 480,
        fps: 60,
        speed: 0.6
    },

    text_example: {
        code: `let textStartFrame = 120;  // Appears after 2 seconds
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
        hue: 360,
        saturation: 100,
        brightness: 100,
        opacity: 100,
        maxFrames: 360,
        fps: 60,
        speed: 1
    },

    pendulum: {
        code:`let length = 250;
let amplitude = 0;
let size = 100;
	
function setup() {
	amplitude = PI / 5;
}
	
function draw() {
		// Pivot point
		let pivotX = width / 2;
		let pivotY = -10;
		
		// Full cycle
		let time = (frameCount / 120) * TWO_PI;
		let angle = amplitude * sin(time);
		
		// Calculate pendulum position
		let bobX = pivotX + length * sin(angle);
		let bobY = pivotY + length * cos(angle);
		
		// Draw the pendulum
		stroke(0, 0, 2*brightness/3);
		strokeWeight(2);
		line(pivotX, pivotY, bobX, bobY); // Rod
		
		// Draw bob
		fill(220, saturation, brightness/2);
		p.circle(bobX, bobY, size);
}`,
        hue: 360,
        saturation: 100,
        brightness: 100,
        opacity: 100,
        maxFrames: 360,
        fps: 60,
        speed: 1
    },
	
	stopwatch: {
        code:`let length = 250;
let amplitude = 0;
let size = 100;
        
function setup() {
	amplitude = PI / 5;
}
        
function draw() {
            
		// Pivot point
		let pivotX = width / 2;
		let pivotY = -10;
		
		// Full cycle
		let time = (frameCount / 120) * TWO_PI;
		let angle = amplitude * sin(time);
		
		// Calculate pendulum position
		let bobX = pivotX + length * sin(angle);
		let bobY = pivotY + length * cos(angle);
		
		// Draw the golden chain
		drawGoldenChain(pivotX, pivotY, bobX, bobY);
		
		// Draw the golden watch
		drawGoldenWatch(bobX, bobY, size);
	}
	
	function drawGoldenChain(x1, y1, x2, y2) {
		let chainLinks = 12;
		let dx = (x2 - x1) / chainLinks;
		let dy = (y2 - y1) / chainLinks;
		
		for (let i = 0; i < chainLinks; i++) {
			let x = x1 + dx * i;
			let y = y1 + dy * i;
			let nextX = x1 + dx * (i + 1);
			let nextY = y1 + dy * (i + 1);
			
			// Calculate link rotation based on chain direction
			let linkAngle = p.atan2(nextY - y, nextX - x);
			let perpAngle = linkAngle + PI/2;
			
			push();
			translate(x, y);
			rotate(linkAngle);
			
			// Outer link (darker gold)
			stroke(45, 80, 65); // Darker gold
			strokeWeight(2.5);
			fill(50, 85, 85); // Main gold color
			ellipse(0, 0, 16, 8);
			
			// Inner hole (to show it's hollow)
			fill(30, 60, 18); // Background color
			noStroke();
			ellipse(0, 0, 10, 4);
			
			// Inner rim highlight
			stroke(55, 70, 95); // Bright gold highlight
			strokeWeight(1);
			noFill();
			ellipse(0, 0, 10, 4);
			
			// Top highlight on the link
			fill(55, 60, 95, 60); // Bright gold highlight with transparency
			noStroke();
			ellipse(-2, -1, 6, 2);
			
			pop();
			
			// Connect links with small overlapping sections
			if (i < chainLinks - 1) {
				stroke(50, 85, 85); // Main gold
				strokeWeight(1.5);
				let midX = (x + nextX) / 2;
				let midY = (y + nextY) / 2;
				
				push();
				translate(midX, midY);
				rotate(linkAngle + PI/2);
				
				// Small connecting link
				fill(50, 85, 85); // Main gold
				ellipse(0, 0, 8, 4);
				fill(30, 60, 18); // Background
				noStroke();
				ellipse(0, 0, 4, 2);
				
				pop();
			}
		}
	}
	
	function drawGoldenWatch(x, y, watchSize) {
		// Outer rim (darker gold)
		fill(45, 80, 65); // Darker gold
		stroke(50, 85, 85); // Main gold
		strokeWeight(3);
		ellipse(x, y, watchSize, watchSize);
		
		// Inner watch face (lighter gold)
		fill(50, 85, 85); // Main gold
		stroke(55, 70, 95); // Bright gold
		strokeWeight(2);
		ellipse(x, y, watchSize - 15, watchSize - 15);
		
		// Watch face details
		fill(55, 30, 95); // Bright white gold
		noStroke();
		ellipse(x, y, watchSize - 25, watchSize - 25);
		
		// Hour markers
		stroke(25, 90, 25); // Dark brown/bronze
		strokeWeight(2);
		for (let i = 0; i < 12; i++) {
			let angle = (i * PI / 6) - PI/2;
			let x1 = x + cos(angle) * (watchSize/2 - 20);
			let y1 = y + sin(angle) * (watchSize/2 - 20);
			let x2 = x + cos(angle) * (watchSize/2 - 25);
			let y2 = y + sin(angle) * (watchSize/2 - 25);
			line(x1, y1, x2, y2);
		}
		
		// Watch hands
		let currentTime = frameCount * 0.02;
		
		// Hour hand
		stroke(25, 90, 25); // Dark brown/bronze
		strokeWeight(4);
		let hourAngle = (currentTime * 0.5) - PI/2;
		let hourX = x + cos(hourAngle) * 15;
		let hourY = y + sin(hourAngle) * 15;
		line(x, y, hourX, hourY);
		
		// Minute hand
		strokeWeight(3);
		let minuteAngle = currentTime - PI/2;
		let minuteX = x + cos(minuteAngle) * 25;
		let minuteY = y + sin(minuteAngle) * 25;
		line(x, y, minuteX, minuteY);
		
		// Center dot
		fill(139, 69, 19);
		noStroke();
		ellipse(x, y, 8, 8);
		
		// Crown (winding mechanism)
		fill(50, 85, 85); // Main gold
		stroke(55, 70, 95); // Bright gold
		strokeWeight(1);
		rect(x + watchSize/2 - 5, y - 4, 8, 8, 2);
		
		// Decorative engravings
		stroke(25, 90, 25); // Dark brown/bronze
		strokeWeight(1);
		noFill();
		ellipse(x, y, watchSize - 35, watchSize - 35);
		
		// Roman numerals at 12, 3, 6, 9
		fill(25, 90, 25); // Dark brown/bronze
		noStroke();
		p.textAlign(p.CENTER, p.CENTER);
		textSize(12);
		p.textStyle(p.BOLD);
		
		text('XII', x, y - watchSize/2 + 25);
		text('III', x + watchSize/2 - 25, y);
		text('VI', x, y + watchSize/2 - 25);
		text('IX', x - watchSize/2 + 25, y);
		
		// Reflection highlight
		fill(0, 0, 100, opacity*0.3); // White highlight with transparency
		noStroke();
		ellipse(x - watchSize/6, y - watchSize/5, watchSize/3, watchSize/4);
}`,
        hue: 360,
        saturation: 100,
        brightness: 100,
        opacity: 100,
        maxFrames: 360,
        fps: 60,
        speed: 1
    },
	petals: {
		code:`let time = 0;
let petals = [];
let numPetals = 8;
let flowerRadius = 120;
        
function setup() {
	for (let i = 0; i < numPetals; i++) {
		let angle = (i * TWO_PI) / numPetals;
		petals.push({
			baseAngle: angle,
			offsetPhase: random(TWO_PI)
		});
	}
}

function draw() {
	translate(width/2, height/2);
	
	time += 0.02;
	
	// Draw multiple layers of the flower for depth
	for (let layer = 0; layer < 3; layer++) {
		let layerScale = 1 - layer * 0.2;
		let layerAlpha = 80 - layer * 20;
		
		push();
		scale(layerScale);
		rotate(time * 0.3 * (layer + 1));
		
		drawFlowerLayer(layer, layerAlpha);
		
		pop();
	}
	
	// Draw center
	drawFlowerCenter();
}

function drawFlowerLayer(layerIndex, alpha) {
	for (let i = 0; i < petals.length; i++) {
		let petal = petals[i];
		let angle = petal.baseAngle;
		
		// Color cycling through the spectrum
		let hue = (time * 50 + i * 45 + layerIndex * 60) % 360;
		let sat = 80 + sin(time * 2 + i) * 20;
		let brightness = 70 + sin(time * 3 + i * 0.5) * 30;
		
		// Petal animation
		let petalSize = flowerRadius + sin(time * 2 + petal.offsetPhase) * 20;
		let petalAngle = angle + sin(time + petal.offsetPhase) * 0.3;
		
		push();
		rotate(petalAngle);
		
		// Draw petal with gradient effect
		drawPetal(0, 0, petalSize, hue, sat, brightness, alpha);
		
		pop();
	}
}

function drawPetal(x, y, size, hue, sat, brightness, alpha) {
	// Multiple segments for gradient effect
	let segments = 15;
	
	for (let j = 0; j < segments; j++) {
		let segmentProgress = j / segments;
		let segmentHue = (hue + segmentProgress * 60) % 360;
		let segmentSat = sat - segmentProgress * 20;
		let segmentBright = brightness - segmentProgress * 30;
		let segmentAlpha = alpha * (1 - segmentProgress * 0.5);
		
		fill(segmentHue, segmentSat, segmentBright, segmentAlpha);
		noStroke();
		
		// Petal shape using bezier curves
		let petalWidth = (size * 0.4) * (1 - segmentProgress * 0.8);
		let petalLength = size * (1 - segmentProgress);
		
		beginShape();
		vertex(x, y);
		p.bezierVertex(
			x - petalWidth/3, y - petalLength/3,
			x - petalWidth/2, y - petalLength * 0.7,
			x, y - petalLength
		);
		p.bezierVertex(
			x + petalWidth/2, y - petalLength * 0.7,
			x + petalWidth/3, y - petalLength/3,
			x, y
		);
		endShape(p.CLOSE);
	}
}

function drawFlowerCenter() {
	let centerLayers = 8;
	
	for (let i = 0; i < centerLayers; i++) {
		let layerSize = 40 - i * 4;
		let centerHue = (time * 100 + i * 20) % 360;
		let centerSat = 90 - i * 10;
		let centerBright = 80 + sin(time * 4 + i) * 20;
		let pulsate = sin(time * 6 + i * 0.5) * 3;
		
		fill(centerHue, centerSat, centerBright, 70);
		noStroke();
		ellipse(0, 0, layerSize + pulsate);
		
		// Inner ring details
		if (i % 2 == 0) {
			stroke(centerHue, centerSat - 20, 100, 30);
			strokeWeight(1);
			noFill();
			ellipse(0, 0, layerSize + pulsate);
		}
	}
	
	// Center seeds/pistils
	let numSeeds = 12;
	for (let i = 0; i < numSeeds; i++) {
		let seedAngle = (i * TWO_PI / numSeeds) + time * 2;
		let seedRadius = 8 + sin(time * 3 + i) * 4;
		let seedX = cos(seedAngle) * seedRadius;
		let seedY = sin(seedAngle) * seedRadius;
		
		let seedHue = (time * 80 + i * 30) % 360;
		fill(seedHue, 100, 90, 80);
		noStroke();
		ellipse(seedX, seedY, 4);
		
		// Tiny highlight
		fill(seedHue, 20, 100, 60);
		ellipse(seedX - 1, seedY - 1, 2);
	}
}`,
		hue: 360,
        saturation: 100,
        brightness: 100,
        opacity: 100,
        maxFrames: 360,
        fps: 60,
        speed: 1
    },

	center_pulse: {
		code:`let centerLayers = 8;
let size = 45;
let colorOffset = 0;

function draw() {
	translate(width/2, height/2);

	let loopFrame = frameCount % 120;
	let time = (loopFrame / 120) * TWO_PI;

	for (let i = 0; i < centerLayers; i++) {
		let layerSize = size - i * 4;
		let centerHue = (loopFrame * 3 + i * 20 + colorOffset) % 360;
		let centerSat = saturation - i * 10;
		let centerBright = brightness + sin(time * 2 + i) * 20;
		let pulsate = sin(time * 3 + i * 0.5) * 3;
		
		fill(centerHue, centerSat, centerBright, opacity*0.7);
		noStroke();
		ellipse(0, 0, layerSize + pulsate);
		
		// Inner ring details
		if (i % 2 == 0) {
			stroke(centerHue, centerSat - 20, 100, opacity*0.3);
			strokeWeight(1);
			noFill();
			ellipse(0, 0, layerSize + pulsate);
		}
	}
}`,
		hue: 360,
        saturation: 90,
        brightness: 80,
        opacity: 100,
        maxFrames: 360,
        fps: 60,
        speed: 1
    },
	
	night_sky: {
		code: `let starCount = 250;
let twinkleRate = 0.01;
let minTwinkleRate = 100;
let maxTwinkleRate = 100;
let minBlinkDuration = 200;
let maxBlinkDuration = 600;
let minBlinkTimer = 200;
let maxBlinkTimer = 2200;
let heightPercent = 60;

let stars = [];
let time = 0;

function setup() {
    generateStars();
}
        
function draw() {
    // Sky
    for (let i = 0; i <= height; i++) {
        let inter = map(i, 0, height, 0, 1);
        let c = p.lerpColor(color(240, 80, 5), color(220, 60, 2), inter);
        stroke(c);
        line(0, i, width, i);
    }
    // Stars
    noStroke();
    
    for (let star of stars) {
        updateStarTwinkle(star);
        
        // Simple white/slightly warm stars
        fill(30, saturation * 0.4, 360, star.brightness);
        p.circle(star.x, star.y, star.size);
    }
    
    time += 0.01 * twinkleRate;
}

function generateStars() {
    stars = [];
    for (let i = 0; i < starCount; i++) {
        let baseBrightness = random(76, 204); // 30% to 80% of 255
        let shouldStartBlinking = random() < 0.2; // 30% chance to start blinking immediately
        
        stars.push({
            x: random(width),
            y: random(height * heightPercent * 0.01),
            brightness: baseBrightness,
            baseBrightness: baseBrightness,
            size: random(1, 2.5),
            twinkleSpeed: random(minTwinkleRate, maxTwinkleRate),
            twinkleOffset: random(TWO_PI),
            blinkTimer: shouldStartBlinking ? 0 : random(minBlinkTimer, maxBlinkTimer),
            blinkDuration: shouldStartBlinking ? random(minBlinkDuration, maxBlinkDuration) : 0,
            isBlinking: shouldStartBlinking
        });
    }
}

function updateStarTwinkle(star) {
    star.blinkTimer--;
    
    if (star.blinkTimer <= 0 && !star.isBlinking) {
        // Start a blink and change twinkle rate
        star.isBlinking = true;
        star.blinkDuration = random(minBlinkDuration, maxBlinkDuration);
        star.blinkTimer = random(minBlinkTimer, maxBlinkTimer);
        
        // Change twinkle rate every time a star starts blinking
        twinkleRate = random(minTwinkleRate, maxTwinkleRate);
    }
    
    if (star.isBlinking) {
        star.blinkDuration--;
        // Simple fade out and back in
        let blinkProgress = star.blinkDuration / 20.0;
        star.brightness = star.baseBrightness * (0.3 + 0.7 * sin(blinkProgress * PI));
        
        if (star.blinkDuration <= 0) {
            star.isBlinking = false;
            star.brightness = star.baseBrightness;
        }
    } else {
        // Subtle continuous twinkle
        let twinkle = sin(time * star.twinkleSpeed + star.twinkleOffset) * 15;
        star.brightness = p.constrain(star.baseBrightness + twinkle, 20, 230);
    }
}`,
		hue: 360,
        saturation: 90,
        brightness: 80,
        opacity: 100,
        maxFrames: 360,
        fps: 60,
        speed: 1
    },
	
	aurora: {
		code:``,
		hue: 360,
        saturation: 90,
        brightness: 80,
        opacity: 100,
        maxFrames: 360,
        fps: 60,
        speed: 1
    },

};

// Function to load a preset by name
function loadPreset(name) {
    if (presets[name]) {
        const selectedLayer = getSelectedLayer();
        if (selectedLayer) {
            // Update the selected layer's code and properties
            selectedLayer.code = presets[name].code;
            selectedLayer.hue = presets[name].hue;
            selectedLayer.saturation = presets[name].saturation;
            selectedLayer.brightness = presets[name].brightness;
            selectedLayer.opacity = presets[name].opacity;
            selectedLayer.maxFrames = presets[name].maxFrames;
            selectedLayer.fps = presets[name].fps;
            selectedLayer.speed = presets[name].speed;
            
            // Update the DOM for this layer
            const layerDiv = document.querySelector(`[data-layer-id="${selectedLayer.id}"]`);
            if (layerDiv) {
                // Update textarea
                const textarea = layerDiv.querySelector('.layer-textarea');
                textarea.value = selectedLayer.code;
                
                // Update color sliders
                layerDiv.querySelector('.hue-slider').value = selectedLayer.hue;
                layerDiv.querySelector('.sat-slider').value = selectedLayer.saturation;
                layerDiv.querySelector('.bright-slider').value = selectedLayer.brightness;
                layerDiv.querySelector('.opacity-slider').value = selectedLayer.opacity;
                
                // Update color value displays
                layerDiv.querySelector('.hue-slider').nextElementSibling.textContent = selectedLayer.hue;
                layerDiv.querySelector('.sat-slider').nextElementSibling.textContent = selectedLayer.saturation;
                layerDiv.querySelector('.bright-slider').nextElementSibling.textContent = selectedLayer.brightness;
                layerDiv.querySelector('.opacity-slider').nextElementSibling.textContent = selectedLayer.opacity;
                
                // Update animation controls
                layerDiv.querySelector('input[oninput*="maxFrames"]').value = selectedLayer.maxFrames;
                layerDiv.querySelector('input[oninput*="fps"]').value = selectedLayer.fps;
                layerDiv.querySelector('input[oninput*="speed"]').value = selectedLayer.speed;
            }
            
            // Restart animation if running
            if (isRunning) {
                stopAnimation();
                setTimeout(runAnimation, 100);
            }
        } else {
            // If no layer is selected, create a new one with the preset
            const newLayer = createLayer(presets[name].code);
            newLayer.hue = presets[name].hue;
            newLayer.saturation = presets[name].saturation;
            newLayer.brightness = presets[name].brightness;
            newLayer.opacity = presets[name].opacity;
            newLayer.maxFrames = presets[name].maxFrames;
            newLayer.fps = presets[name].fps;
            newLayer.speed = presets[name].speed;
            
            // Refresh DOM to show all values correctly
            refreshLayersDOM();
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
    return presets[presetName] ? presets[presetName].code : '';
}