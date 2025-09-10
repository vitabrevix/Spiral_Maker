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

    pulsing: {
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

    text_example: {
        code: `let textStartFrame = 120;  // Appears after 2 seconds
let textEndFrame = 300;    // Disappears after 5 seconds

function draw() {
    fill(255, 255, 255, 200);
    textAlign(CENTER, CENTER);
    textSize(30);
    textFont('Arial Black');
    text("BIG TEXT", width/2, 100);
    
    let wave = sin(frameCount * 0.05) * 20;
    fill(100, 200, 255, 180);
    textSize(24);
    textFont('Arial');
    text("Floating on Animation", width/2, 150 + wave);
    
    // Dynamic counter
    fill(255, 150, 100);
    textAlign(LEFT, TOP);
    textSize(16);
    text("Frame: " + frameCount, 20, 20);
    
    // Animated rotating text
    push();
    translate(width - 100, height - 100);
    rotate(frameCount * 0.02);
    fill(255, 100, 150, 180);
    textAlign(CENTER, CENTER);
    textSize(12);
    text("SPINNING", 0, 0);
    pop();
    
    // Immediate appear/disappear text
    if (frameCount >= textStartFrame && frameCount <= textEndFrame) {
        fill(0, 0, 100); // HSB: hue=0, sat=0, brightness=100 (white)
        textAlign(CENTER, CENTER);
        textSize(20);
        text("Appear, Disappear", width/2, height/2);
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
        text("Fade in, Fade out", width/2, 5*height/6);
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
		circle(bobX, bobY, size);
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
			let linkAngle = atan2(nextY - y, nextX - x);
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
		textAlign(CENTER, CENTER);
		textSize(12);
		textStyle(BOLD);
		
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
		bezierVertex(
			x - petalWidth/3, y - petalLength/3,
			x - petalWidth/2, y - petalLength * 0.7,
			x, y - petalLength
		);
		bezierVertex(
			x + petalWidth/2, y - petalLength * 0.7,
			x + petalWidth/3, y - petalLength/3,
			x, y
		);
		endShape(CLOSE);
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
        let c = lerpColor(color(240, 80, 5), color(220, 60, 2), inter);
        stroke(c);
        line(0, i, width, i);
    }
    // Stars
    noStroke();
    
    for (let star of stars) {
        updateStarTwinkle(star);
        
        // Simple white/slightly warm stars
        fill(30, saturation * 0.4, 360, star.brightness);
        circle(star.x, star.y, star.size);
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
        star.brightness = constrain(star.baseBrightness + twinkle, 20, 230);
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

	static: {
		code:`let staticPixels = [];
const numPixels = 2500;
const greyBg = 120;

function setup() {
    // Pre-generate static pixels
    for (let i = 0; i < numPixels; i++) {
        staticPixels.push(createPixel());
    }
}

function draw() {
    // Grey background with noise (convert RGB to HSB equivalent)
    background(0, 0, map(greyBg + random(-5, 5), 0, 255, 0, 100));
    
    // Update and draw static pixels
    for (let pixel of staticPixels) {
        updatePixel(pixel);
        drawPixel(pixel);
    }
    
    // Add scan lines and screen effects
    drawScanLines();
    
    // Occasional screen flicker
    if (random() < 0.02) {
        fill(0, 0, 100, random(5, 15)); // White with low alpha
        noStroke();
        rect(0, 0, width, height);
    }
}

function createPixel() {
    const life = random(5, 30);
    return {
        x: random(width),
        y: random(height),
        hue: getRandomHue(),
        life: life,
        maxLife: life
    };
}

function updatePixel(pixel) {
    pixel.life--;
    
    // Respawn pixel when it dies
    if (pixel.life <= 0) {
        pixel.x = random(width);
        pixel.y = random(height);
        pixel.hue = getRandomHue();
        pixel.life = random(5, 30);
        pixel.maxLife = pixel.life;
    }
    
    // Add flickering effect
    if (random() < 0.1) {
        pixel.life = random(1, 5);
    }
}

function drawPixel(pixel) {
    const alpha = map(pixel.life, 0, pixel.maxLife, 0, 80);
    
    fill(pixel.hue, 100, 100, alpha); // Full saturation and brightness
    noStroke();
    rect(pixel.x, pixel.y, 1.3, 1.3);
}

function getRandomHue() {
    const hues = [0, 120, 240]; // Red, Green, Blue in HSB
    return hues[floor(random(hues.length))];
}

function drawScanLines() {
    stroke(0, 0, 0, 8); // Semi-transparent black
    strokeWeight(1);
    
    // Draw every 3rd line for performance
    for (let y = 0; y < height; y += 3) {
        if (random() < 0.7) {
            line(0, y, width, y);
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
	
	ying_yang_spiral: {
		code:`let resolution = 900;
let spiralTurns = 9; // Number of complete spirals
let zoom = 1;
let growthRate = 5;
let centerGap = 0.98;

function draw() {
	translate(width / 2, height / 2);
	time = (frameCount / 60) * TWO_PI
	let maxRadius = min(width*zoom , height*zoom) * 0.73;
	
	// Draw two interweaving spiral bands with smooth curves
	drawSmoothSpiralBand(0, 255, maxRadius, spiralTurns); // White band
	drawSmoothSpiralBand(PI, 0, maxRadius, spiralTurns);  // Black band (offset by PI)
}

function drawSmoothSpiralBand(offset, color, maxRadius, spiralTurns) {	
	noFill();
	stroke(color);
	strokeCap(ROUND);
	strokeJoin(ROUND);
	
	// Start the curve
	beginShape();
	noFill();
	
	for (let i = 0; i < resolution; i++) {
		let progress = i / resolution;
		
		// Calculate spiral angle with offset for interweaving
		let angle = progress * PI * 2 * spiralTurns + time + offset;
		
		// Radius decreases as we spiral inward
		let radius = maxRadius * (1 - progress * centerGap);
		
		// Calculate positions
		let x = cos(angle) * radius;
		let y = sin(angle) * radius;
		
		let spiralSpacing = (2 * PI * radius) / (spiralTurns * 2);
                
     // Line thickness - grows outward but respects spiral spacing
     let desiredThickness = map(progress, -1, 1, 50, growthRate);
     let thickness = min(desiredThickness, spiralSpacing);
		
		// We need to draw each small segment with its own thickness
		if (i > 0) {
			let prevProgress = (i - 1) / resolution;
			let prevAngle = prevProgress * PI * 2 * spiralTurns + time + offset;
			let prevRadius = maxRadius * (1 - prevProgress * centerGap);
			let prevX = cos(prevAngle) * prevRadius;
			let prevY = sin(prevAngle) * prevRadius;
			
			strokeWeight(thickness);
			line(prevX, prevY, x, y);
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
	
	tunnel: {
		code:`let time = 0;
let tunnelDepth = 0;

function draw() {
	translate(width / 2, height / 2);
	
	// Animate forward movement and rotation
	time += 0.02;
	tunnelDepth += 0.5;
	
	// Draw multiple rings at different depths to create tunnel effect
	let numRings = 60;
	let maxRadius = min(width, height) * 0.4;
	
	for (let ring = 0; ring < numRings; ring++) {
		let z = ring * 10 + (tunnelDepth % 10); // Z-depth with forward movement
		
		// Perspective scaling - objects further away appear smaller
		let perspective = 200 / (z + 200); // Perspective factor
		let ringRadius = maxRadius * perspective;
		
		// Skip rings that are too small or too far
		if (ringRadius < 1) continue;
		
		// Calculate rotation for this ring based on depth
		let ringRotation = time + ring * 0.1;
		
		// Draw the yin-yang bands for this ring
		drawTunnelRing(ringRadius, ringRotation, perspective, z);
	}
}

function drawTunnelRing(radius, rotation, perspective, depth) {
	let segments = 60;
	let bandWidth = 20 * perspective; // Band width scales with perspective
	
	// Skip if band is too thin
	if (bandWidth < 0.5) return;
	
	// Calculate opacity based on depth for fade effect
	let opacity = map(depth, 0, 300, 255, 0);
	opacity = constrain(opacity, 0, 255);
	
	for (let i = 0; i < segments; i++) {
		let angle = (i / segments) * TWO_PI + rotation;
		let nextAngle = ((i + 1) / segments) * TWO_PI + rotation;
		
		// Determine if this segment should be black or white
		// Create yin-yang pattern by alternating every half circle
		let segmentAngle = (angle + rotation) % TWO_PI;
		let isWhite = segmentAngle < PI;
		
		// Set color with opacity
		if (isWhite) {
			stroke(255, opacity);
		} else {
			stroke(0, opacity);
			// For black lines, draw white background first for visibility
			strokeWeight(bandWidth + 1);
			stroke(255, opacity * 0.3);
			let x1 = cos(angle) * radius;
			let y1 = sin(angle) * radius;
			let x2 = cos(nextAngle) * radius;
			let y2 = sin(nextAngle) * radius;
			line(x1, y1, x2, y2);
			stroke(0, opacity);
		}
		
		strokeWeight(bandWidth);
		strokeCap(ROUND);
		
		// Calculate positions
		let x1 = cos(angle) * radius;
		let y1 = sin(angle) * radius;
		let x2 = cos(nextAngle) * radius;
		let y2 = sin(nextAngle) * radius;
		
		// Draw the segment
		line(x1, y1, x2, y2);
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
	
	coin: {
		code: `let length = 200;
let swingIntensity = 1.0; 
let amplitude = 0;
let size = 120;
let pivotY = 0;
let currentCoinAngle = 0;

function setup() {
    amplitude = PI / 4.5 * swingIntensity;
}

function draw() {
    drawBackground();
    let pivotX = width / 2;
    
    // Perfect loop for pendulum: One full swing cycle every 120 frames
    let time = (frameCount / 120) * TWO_PI;
    // The phase shift of PI makes the pendulum swing to the left first.
    let angle = amplitude * sin(time + PI); 
    
    let bobX = pivotX + length * sin(angle);
    let bobY = pivotY + length * cos(angle);

    // Make the coin's rotation match the pendulum's swing angle.
    let targetCoinAngle = angle;
    currentCoinAngle = lerp(currentCoinAngle, targetCoinAngle, 0.1);
    
    // Draw the silk string, attached to the top of the coin.
    drawSilkString(pivotX, pivotY, bobX, bobY, angle);
    
    // Draw the Chinese gold coin, with rotation tied to the pendulum's angle
    drawChineseCoin(bobX, bobY, size, currentCoinAngle);
    
    // The string's internal details also follow this rotation
    drawStringAroundCoin(bobX, bobY, size, currentCoinAngle);
    
    // Draw pivot point
    drawPivotPoint(pivotX, pivotY);
}

function drawBackground() {
    for (let y = 0; y < height; y++) {
        let inter = map(y, 0, height, 0, 1);
        let c = lerpColor(color(25, 40, 12), color(15, 60, 5), inter);
        stroke(c);
        line(0, y, width, y);
    }
}

function drawSilkString(x1, y1, x2, y2, pendulumAngle) {
    let stringEndX = x2 + (size / 2) * sin(pendulumAngle);
    let stringEndY = y2 - (size / 2) * cos(pendulumAngle);
    
    stroke(0, 85, 65);
    strokeWeight(4);
    line(x1, y1, stringEndX, stringEndY);

    let angle = atan2(stringEndY - y1, stringEndX - x1);
    let perpOffset = 1.2;
    let offsetX = cos(angle + HALF_PI) * perpOffset;
    let offsetY = sin(angle + HALF_PI) * perpOffset;

    stroke(15, 70, 80);
    strokeWeight(1.5);
    line(x1 + offsetX, y1 + offsetY, stringEndX + offsetX, stringEndY + offsetY);

    stroke(5, 60, 75);
    strokeWeight(1.5);
    line(x1 - offsetX, y1 - offsetY, stringEndX - offsetX, stringEndY - offsetY);

    stroke(0, 90, 55);
    strokeWeight(1);
    line(x1, y1, stringEndX, stringEndY);

    stroke(0, 70, 60, 60);
    strokeWeight(0.5);
    let segments = floor(dist(x1, y1, stringEndX, stringEndY) / 8);
    for (let i = 0; i < segments; i++) {
        let t = i / segments;
        let x = lerp(x1, stringEndX, t);
        let y = lerp(y1, stringEndY, t);
        let twist = sin(t * PI * 6) * 1.5;
        let twistX = cos(angle + HALF_PI) * twist;
        let twistY = sin(angle + HALF_PI) * twist;
        point(x + twistX, y + twistY);
    }
}

function drawStringAroundCoin(centerX, centerY, coinSize, rotationAngle) {
    push();
    translate(centerX, centerY);
    rotate(rotationAngle);

    let holeSize = coinSize / 4;
    let coinRadius = coinSize / 2;
    let knotX = 0;
    let knotY = -coinRadius;
    
    stroke(0, 85, 65);
    strokeWeight(3);
    line(knotX, knotY, 0, -holeSize / 2);

    let angleToHole = atan2(-holeSize/2 - knotY, 0 - knotX);
    let perpOffset = 1.2;
    let offsetX = cos(angleToHole + HALF_PI) * perpOffset;
    let offsetY = sin(angleToHole + HALF_PI) * perpOffset;
    stroke(15, 70, 80);
    strokeWeight(1);
    line(knotX + offsetX, knotY + offsetY, offsetX, -holeSize / 2 + offsetY);
    stroke(5, 60, 75);
    strokeWeight(1);
    line(knotX - offsetX, knotY - offsetY, -offsetX, -holeSize / 2 - offsetY);

    fill(0, 90, 50);
    stroke(0, 95, 35);
    strokeWeight(1.5);
    ellipse(knotX, knotY, 10, 8);

    fill(15, 70, 70);
    noStroke();
    ellipse(knotX - 2, knotY + 2, 3, 2);
    ellipse(knotX + 2, knotY - 2, 3, 2);

    stroke(0, 80, 60);
    strokeWeight(1);
    line(knotX, knotY, knotX + 5, knotY);
    line(knotX, knotY, knotX, knotY + 5);

    pop();
}

function drawChineseCoin(x, y, coinSize, rotationAngle) {
    push();
    translate(x, y);
    rotate(rotationAngle);

    fill(35, 90, 15, 40);
    noStroke();
    ellipse(2, 2, coinSize + 8, coinSize + 8);

    fill(42, 85, 65);
    stroke(38, 90, 55);
    strokeWeight(3);
    ellipse(0, 0, coinSize, coinSize);

    fill(45, 80, 78);
    stroke(48, 75, 85);
    strokeWeight(2);
    ellipse(0, 0, coinSize - 12, coinSize - 12);

    let holeSize = coinSize / 4;
    fill(15, 60, 8);
    noStroke();
    rectMode(CENTER);
    rect(1, 1, holeSize + 2, holeSize + 2);

    fill(25, 40, 12);
    rect(0, 0, holeSize, holeSize);

    stroke(30, 70, 25);
    strokeWeight(1);
    noFill();
    rect(0, 0, holeSize - 1, holeSize - 1);

    stroke(48, 60, 90);
    strokeWeight(1);
    line(-holeSize / 2, -holeSize / 2, holeSize / 2, -holeSize / 2);
    line(-holeSize / 2, -holeSize / 2, -holeSize / 2, holeSize / 2);

    stroke(35, 80, 40);
    line(-holeSize / 2, holeSize / 2, holeSize / 2, holeSize / 2);
    line(holeSize / 2, -holeSize / 2, holeSize / 2, holeSize / 2);

    drawChineseCharacters(coinSize);
    drawDecorativeBorder(coinSize);
    drawCoinTexture(coinSize);

    fill(50, 40, 95, 50);
    noStroke();
    ellipse(-coinSize / 4, -coinSize / 4, coinSize / 3, coinSize / 4);

    pop();
}

function drawChineseCharacters(coinSize) {
    fill(35, 95, 25);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(coinSize / 8);
    textStyle(BOLD);

    let charOffset = coinSize / 3.5;

    fill(30, 95, 30);
    rect(-charOffset, -10, 6, 12, 1);
    rect(-charOffset + 3, -13, 12, 3, 1);

    ellipse(charOffset, 10, 8, 8);
    rect(charOffset - 4, 4, 8, 3, 1);

    rect(-10, charOffset, 3, 8, 1);
    rect(-13, charOffset + 4, 9, 2, 1);

    rect(10, -charOffset, 3, 12, 1);
    rect(10 + 2, -charOffset - 2, 7, 2, 1);
}

function drawDecorativeBorder(coinSize) {
    fill(48, 70, 90);
    noStroke();
    let dots = 16;
    let dotRadius = coinSize / 2 - 15;
    for (let i = 0; i < dots; i++) {
        let angle = (i / dots) * TWO_PI;
        let dotX = cos(angle) * dotRadius;
        let dotY = sin(angle) * dotRadius;
        ellipse(dotX, dotY, 3, 3);
    }
    
    stroke(48, 70, 90);
    strokeWeight(1);
    noFill();
    ellipse(0, 0, coinSize - 8, coinSize - 8);
    
    let ringSize = coinSize / 2.5;
    ellipse(0, 0, ringSize, ringSize);
}

function drawCoinTexture(coinSize) {
    stroke(40, 60, 85, 30);
    strokeWeight(0.5);
    let innerR = coinSize / 2.8;
    let outerR = coinSize / 2.2;
    for (let i = 0; i < 32; i++) {
        let angle = (i / 32) * TWO_PI;
        let x1 = cos(angle) * innerR;
        let y1 = sin(angle) * innerR;
        let x2 = cos(angle) * outerR;
        let y2 = sin(angle) * outerR;
        line(x1, y1, x2, y2);
    }
    
    stroke(35, 80, 60, 20);
    strokeWeight(0.5);
    noFill();
    for (let r = coinSize / 4; r < coinSize / 2; r += 8) {
        ellipse(0, 0, r * 2, r * 2);
    }
}

function drawPivotPoint(x, y) {
    fill(30, 70, 40);
    stroke(35, 80, 50);
    strokeWeight(2);
    ellipse(x, y, 16, 16);
    
    fill(25, 80, 25);
    noStroke();
    ellipse(x, y, 6, 6);
    
    stroke(20, 90, 20);
    strokeWeight(1);
    line(x - 2, y, x + 2, y);
    line(x, y - 2, x, y + 2);
}`,
		
		hue: 360,
        saturation: 100,
        brightness: 100,
        opacity: 100,
        maxFrames: 360,
        fps: 60,
        speed: 1
    },
	
	pendant: {
		code: `let length = 250;
let pivotY = -80;
let size = 60;
let crystalWidth = size;
let crystalHeight = size * 2;
let chainLinks = 8;

let amplitude = 0;

function setup() {
	amplitude = PI / 5;
}
	
function draw() {
	// Pivot point
	let pivotX = width / 2;
	
	// Full cycle
	let time = (frameCount / 120) * TWO_PI;
	let angle = amplitude * sin(time);
	
	// Calculate pendulum position
	let bobX = pivotX + length * sin(angle);
	let bobY = pivotY + length * cos(angle);
	
	// Draw the chain/cord
	stroke(40, 30, 80);
	strokeWeight(3);
	line(pivotX, pivotY, bobX, bobY);
	
	// Draw small chain links
	for (let i = 1; i < chainLinks; i++) {
		let linkX = lerp(pivotX, bobX, i / chainLinks);
		let linkY = lerp(pivotY, bobY, i / chainLinks);
		fill(40, 30, 85);
		noStroke();
		ellipse(linkX, linkY, 4, 6);
	}
	
	// Draw crystal pendant (double-terminated/bipyramidal)
	push();
	translate(bobX, bobY);
	
	
	
	// Main crystal body - diamond shape (two pyramids butt to butt)
	fill(200, 60, 90, 80); // Translucent blue crystal
	stroke(200, 80, 95);
	strokeWeight(2);
	
	// Draw the bipyramidal crystal (diamond shape)
	beginShape();
	vertex(0, -crystalHeight/2);        // Top point
	vertex(crystalWidth/2, 0);          // Right middle
	vertex(0, crystalHeight/2);         // Bottom point
	vertex(-crystalWidth/2, 0);         // Left middle
	endShape(CLOSE);
	
	// Inner crystal core
	fill(180, 40, 100, 60);
	noStroke();
	beginShape();
	vertex(0, -crystalHeight/3);        // Top point (smaller)
	vertex(crystalWidth/3, 0);          // Right middle
	vertex(0, crystalHeight/3);         // Bottom point
	vertex(-crystalWidth/3, 0);         // Left middle
	endShape(CLOSE);
	
	// Crystal facet lines to show the bipyramidal structure
	stroke(200, 30, 100, 80);
	strokeWeight(1);
	
	// Top pyramid facet lines
	line(0, -crystalHeight/2, crystalWidth/2, 0);  // Top to right
	line(0, -crystalHeight/2, -crystalWidth/2, 0); // Top to left
	line(0, -crystalHeight/2, 0, 0);               // Top to center
	
	// Bottom pyramid facet lines
	line(0, crystalHeight/2, crystalWidth/2, 0);   // Bottom to right
	line(0, crystalHeight/2, -crystalWidth/2, 0);  // Bottom to left
	line(0, crystalHeight/2, 0, 0);                // Bottom to center
	
	// Central division line
	line(-crystalWidth/2, 0, crystalWidth/2, 0);
	
	// Sparkle effect
	let sparkleTime = frameCount * 0.1;
	for (let i = 0; i < 3; i++) {
		let sparkleAngle = (i * TWO_PI / 3) + sparkleTime;
		let sparkleX = cos(sparkleAngle) * (crystalWidth / 4);
		let sparkleY = sin(sparkleAngle) * (crystalHeight / 6);
		
		fill(60, 80, 100, 70);
		noStroke();
		ellipse(sparkleX, sparkleY, 2, 2);
		
		// Sparkle rays
		stroke(60, 60, 100, 40);
		strokeWeight(0.5);
		line(sparkleX - 3, sparkleY, sparkleX + 3, sparkleY);
		line(sparkleX, sparkleY - 3, sparkleX, sparkleY + 3);
	}
	
	pop();
	
	// Draw mounting point
	fill(40, 30, 85);
	noStroke();
	ellipse(pivotX, pivotY, 12, 8);
}`,
		
		hue: 360,
        saturation: 100,
        brightness: 100,
        opacity: 100,
        maxFrames: 360,
        fps: 60,
        speed: 1
    },
	
	water: {
		code:`const TAU = 6.28318530718;
const MAX_ITER = 5;
let showTiling = false;

function draw() {
	loadPixels();
	
	let time = millis() * 0.001 * 0.5 + 23.0; // Convert to seconds and apply time scaling
	
	for (let x = 0; x < width; x++) {
		for (let y = 0; y < height; y++) {
			// Convert to UV coordinates (0-1)
			let u = x / width;
			let v = y / height;
			
			// Apply the shader logic
			let p;
			if (showTiling) {
				p = createVector(
					((u * TAU * 2.0) % TAU) - 250.0,
					((v * TAU * 2.0) % TAU) - 250.0
				);
			} else {
				p = createVector(
					((u * TAU) % TAU) - 250.0,
					((v * TAU) % TAU) - 250.0
				);
			}
			
			let i = createVector(p.x, p.y);
			let c = 1.0;
			let inten = 0.005;
			
			// Main iteration loop
			for (let n = 0; n < MAX_ITER; n++) {
				let t = time * (1.0 - (3.5 / (n + 1)));
				i.x = p.x + cos(t - i.x) + sin(t + i.y);
				i.y = p.y + sin(t - i.y) + cos(t + i.x);
				
				let px = p.x / (sin(i.x + t) / inten);
				let py = p.y / (cos(i.y + t) / inten);
				let length = sqrt(px * px + py * py);
				c += 1.0 / length;
			}
			
			c /= MAX_ITER;
			c = 1.17 - pow(c, 1.4);
			
			// Create color
			let colorValue = pow(abs(c), 8.0);
			let r = constrain(colorValue + 0.0, 0.0, 1.0);
			let g = constrain(colorValue + 0.35, 0.0, 1.0);
			let b = constrain(colorValue + 0.5, 0.0, 1.0);
			
			// Tiling effect
			if (showTiling) {
				let pixelX = 2.0 / width;
				let pixelY = 2.0 / height;
				let uTile = u * 2.0;
				let vTile = v * 2.0;
				let f = floor((millis() * 0.001 * 0.5) % 2.0); // Flash value
				
				let firstX = (uTile > pixelX ? 1 : 0) * f;
				let firstY = (vTile > pixelY ? 1 : 0) * f;
				
				let uStep = (uTile % 1.0) < pixelX ? 1 : 0;
				let vStep = (vTile % 1.0) < pixelY ? 1 : 0;
				
				let lineIntensity = (uStep + vStep) * firstX * firstY;
				
				// Mix with yellow line
				r = r * (1 - lineIntensity) + 1.0 * lineIntensity;
				g = g * (1 - lineIntensity) + 1.0 * lineIntensity;
				b = b * (1 - lineIntensity) + 0.0 * lineIntensity;
			}
			
			// Set pixel
			let index = (x + y * width) * 4;
			pixels[index] = r * 255;     // Red
			pixels[index + 1] = g * 255; // Green
			pixels[index + 2] = b * 255; // Blue
			pixels[index + 3] = 255;     // Alpha
		}
	}
	
	updatePixels();
}

// Helper function for modulo that works with negative numbers like GLSL
function mod(a, b) {
	return ((a % b) + b) % b;
}`,
		hue: 360,
        saturation: 90,
        brightness: 80,
        opacity: 100,
        maxFrames: 360,
        fps: 60,
        speed: 1
    },
	
	vignette: {
		code:`let vignetteSize = 0.7;
let vignetteHarshness = 1;

function setup() {
  noLoop(); // Prevent the draw() function from running repeatedly
  drawVignette(); // Call the vignette function just once
}

function drawVignette() {
  noStroke();

  // Calculate the center of the canvas
  const centerX = width / 2;
  const centerY = height / 2;

  // Iterate through every pixel to apply the vignette effect
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      let distance = dist(x, y, centerX, centerY);

      let normalizedDistance = distance / (width / 2);

      // Create a smooth transition
      let vignetteValue = constrain( (normalizedDistance - vignetteSize) * vignetteHarshness/100, 0, 1);

      let alpha = vignetteValue * 255; // Map to alpha range (0-255)

      fill(0, alpha); // Set the fill color to black with calculated alpha
      rect(x, y, 1, 1);
    }
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
	
	bg_gradient: {
		code:`// Array of colors for the gradient
let gradientColors = ['#FF6B6B','#FFE66D','#4ECDC4','#4F81C2','#6B4C93',];

// Array of numbers (0-1) representing the percentage of screen height
let gradientPercentages = [0.3,0.2,0.1,0.2,0.3,];

// Rotation angle for the gradient in degrees.
let gradientRotation = 0;

// Controls the fade from one color into the next.
let fadeAmount = 0;

function setup() {
	noLoop(); // The gradient is static, so we don't need the draw loop
	drawGradient(gradientColors, gradientPercentages, gradientRotation, fadeAmount);
}

function drawGradient(colors, percentages, rotation, fade) {
	let diagonal = sqrt(width * width + height * height);
	let gradientCanvas = createGraphics(diagonal, diagonal);
	gradientCanvas.noStroke();
	
	// Normalize percentages to ensure they add up to 1 (or 100%)
	let totalPercentage = percentages.reduce((sum, p) => sum + p, 0);
	let normalizedPercentages = percentages.map(p => p / totalPercentage);

	// Draw the colored bands and fades on the temporary canvas
	let currentY = 0;
	let totalHeight = gradientCanvas.height;

	for (let i = 0; i < colors.length; i++) {
		let colorStart = color(colors[i]);
		let colorEnd = (i < colors.length - 1) ? color(colors[i + 1]) : colorStart;

		// Calculate the height of the main color band
		let bandHeight = normalizedPercentages[i] * totalHeight;
		let fadeHeight = fade * bandHeight; // Fade is a percentage of the band height
		
		// Draw the main, solid color part of the band
		gradientCanvas.fill(colorStart);
		gradientCanvas.rect(0, currentY, gradientCanvas.width, bandHeight - fadeHeight);

		// Draw the fade section
		if (fade > 0 && i < colors.length - 1) {
			for (let y = 0; y < fadeHeight; y++) {
				let inter = map(y, 0, fadeHeight, 0, 1);
				let fadeColor = lerpColor(colorStart, colorEnd, inter);
				gradientCanvas.stroke(fadeColor);
				gradientCanvas.line(0, currentY + bandHeight - fadeHeight + y, gradientCanvas.width, currentY + bandHeight - fadeHeight + y);
			}
		}

		// Move the current Y position for the next color band
		currentY += bandHeight;
	}

	// Apply rotation and display the gradient
	push();
	translate(width / 2, height / 2);
	rotate(radians(rotation));
	image(gradientCanvas, -diagonal / 2, -diagonal / 2);
	pop();
}`,
		hue: 360,
        saturation: 100,
        brightness: 100,
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