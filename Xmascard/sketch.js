// 1. GLOBAL VARIABLES
const CANVAS_W = 960;  // 1200 * 0.8
const CANVAS_H = 640;  // 800 * 0.8
const PLAY_AREA_H = 560; // 700 * 0.8

let isAudioContextStarted = false;

// --- AUDIO MIXING ---
let crossFader; 
let masterEq; 
let masterAnalyzer; 

// --- PIANO VARIABLES ---
let synthPiano;
let midiData = null;
let allNotes = [];
let nextNoteIndex = 0;
let visualTime = 0; 
let fallingPianoBalls = []; 
const minMidi = 36;
const maxMidi = 84;
let meteorImg1, meteorImg2, meteorImg3; 

// --- SEQUENCER VARIABLES ---
let draggableBalls = []; 
let nextBallId = 0;

const totalSteps = 8; 
const extraSteps = 1;

let stepWidth; 
let gridStartX, gridEndX; 

let currentStep = 0;
let kitDrums;
let draggedBall = null;
let bpm = 120;
let ballImages = {}; 

const soundTypes = [
    { x: 120, label: "KICK", sound: "kick", img: "1.png" },    // 150 * 0.8
    { x: 192, label: "SNARE", sound: "snare", img: "2.png" },   // 240 * 0.8
    { x: 264, label: "HI-HAT", sound: "hh", img: "3.png" },    // 330 * 0.8
    { x: 336, label: "OPEN HH", sound: "hho", img: "4.png" },   // 420 * 0.8
    { x: 408, label: "DECOR", sound: "mute", img: "5.png" }    // 510 * 0.8
];
let ballRadius = 20; // 25 * 0.8

// BACKGROUND & TREE
let snowflakes = []; 
const SNOW_COUNT = 300; 
let bgGraphic; 
let treeGraphic; 
let colorTop, colorBottom;
const nbranchs = 400; 

let treePos = { x: 0, y: 0 }; 
let isDraggingTree = false;   

const gravity = 0.08; // 0.1 * 0.8
const initialVy = 1.6; // 2 * 0.8

// 2. PRELOAD (Keep same)
function preload() {
    loadJSON("mario.json", loadedMidi);
    meteorImg1 = loadImage("img1.png");
    meteorImg2 = loadImage("img2.png");
    meteorImg3 = loadImage("img3.png");

    soundTypes.forEach(t => {
        ballImages[t.sound] = loadImage(t.img);
    });
}

function loadedMidi(data) {
    midiData = data;
    processMidiData();
}

function processMidiData() {
    if (!midiData) return;
    allNotes = [];
    midiData.tracks.forEach(track => {
        if (track.notes) {
            track.notes.forEach(note => {
                allNotes.push({
                    name: note.name,
                    midi: Tone.Frequency(note.name).toMidi(),
                    time: note.time,
                    duration: note.duration,
                    velocity: note.velocity
                });
            });
        }
    });
    allNotes.sort((a, b) => a.time - b.time);
    if(allNotes.length > 0) {
        visualTime = allNotes[0].time;
    }
}

// 3. SETUP
function setup() {
    createCanvas(CANVAS_W, CANVAS_H);
    colorMode(HSB, 360, 100, 100, 1);
    noStroke();

    gridStartX = width * 0.25; 
    gridEndX = width * 0.75;    
    let mainGridWidth = gridEndX - gridStartX; 
    stepWidth = mainGridWidth / totalSteps;

    colorTop = color(220, 80, 5);    
    colorBottom = color(220, 90, 40); 
    
    generateStaticBackground();
    generateStaticTree(); 
    
    for (let i = 0; i < SNOW_COUNT; i++) {
        snowflakes.push(new Snowflake());
    }

    createControls(); 
    
    initDefaultSequencerBalls(); 
    
    masterEq = new Tone.EQ3(0, 0, 0);
    masterAnalyzer = new Tone.Waveform(64);
    crossFader = new Tone.CrossFade(0.5).connect(masterEq); 
    masterEq.connect(masterAnalyzer);
    masterAnalyzer.toDestination(); 

    const reverb = new Tone.Reverb({ decay: 4, wet: 0.5 }); 

    synthPiano = new Tone.Sampler({
        urls: {
            "A0": "A0.mp3", "C1": "C1.mp3", "D#1": "Ds1.mp3", "F#1": "Fs1.mp3", "A1": "A1.mp3",
            "C2": "C2.mp3", "D#2": "Ds2.mp3", "F#2": "Fs2.mp3", "A2": "A2.mp3", "C3": "C3.mp3",
            "D#3": "Ds3.mp3", "F#3": "Fs3.mp3", "A3": "A3.mp3", "C4": "C4.mp3", "D#4": "Ds4.mp3",
            "F#4": "Fs4.mp3", "A4": "A4.mp3", "C5": "C5.mp3", "D#5": "Ds5.mp3", "F#5": "Fs5.mp3",
            "A5": "A5.mp3", "C6": "C6.mp3", "D#6": "Ds6.mp3", "F#6": "Fs6.mp3", "A6": "A6.mp3",
            "C7": "C7.mp3", "D#7": "Ds7.mp3", "F#7": "Fs7.mp3", "A7": "A7.mp3", "C8": "C8.mp3"
        },
        release: 3, 
        baseUrl: "https://tonejs.github.io/audio/salamander/"
    });

    synthPiano.connect(reverb);
    reverb.connect(crossFader.a);

    kitDrums = new Tone.Players({
        "kick": "kick.mp3",
        "snare": "snare.mp3",
        "hh": "hh.mp3",
        "hho": "hho.mp3"
    });

    kitDrums.connect(crossFader.b);

    Tone.Transport.bpm.value = bpm;
    Tone.Transport.scheduleRepeat(sequencerRepeat, "16n");
}

// 4. DRAW LOOP
function draw() {
    imageMode(CORNER);
    image(bgGraphic, 0, 0);

    push();
    translate(treePos.x, treePos.y); 
    drawWaveformHalo();
    image(treeGraphic, 0, 0);
    pop();

    fill(0, 0, 15); 
    rect(0, PLAY_AREA_H, width, height - PLAY_AREA_H);

    for (let flake of snowflakes) {
        flake.update();
        flake.display();
    }

    if (allNotes.length > 0 && nextNoteIndex < allNotes.length) {
        let targetTime = allNotes[nextNoteIndex].time;
        visualTime = lerp(visualTime, targetTime, 0.15);
    } else if (allNotes.length > 0 && nextNoteIndex >= allNotes.length) {
        visualTime += 0.01;
    }

    drawFallingPianoBalls(); 
    drawRhythmBar(); 
    drawGrid(); 
    drawConnections();
    drawSequencerBalls();

    fill(0, 0, 100); 
    textAlign(CENTER, CENTER);
    textSize(13); // 16 * 0.8
    noStroke();
    text("Merry Christmas!", width/2, 40); // 50 * 0.8

    textSize(10); // 12 * 0.8
    fill(0, 0, 100, 0.6);
    let mixState = crossFader.fade.value > 0.5 ? "DRUMS" : "PIANO";
    let eqState = "FLAT";
    if (masterEq.low.value > 2) eqState = "LOW BOOST";
    if (masterEq.high.value > 2) eqState = "HIGH BOOST";
    text(`EQ: ${eqState} | MIX: ${mixState}`, width/2, 64); // 80 * 0.8
}

function drawWaveformHalo() {
    let centerX = width/2;
    let centerY = PLAY_AREA_H/2 + 40; // 50 * 0.8
    let values = masterAnalyzer.getValue();
    
    fill(50, 100, 100, 0.3); 
    let baseRadius = 280; // 350 * 0.8
    let scaleFactor = 200; // 250 * 0.8

    beginShape();
    for (let i = 0; i < values.length; i++) {
        let angle = map(i, 0, values.length, 0, TWO_PI);
        let amplitude = values[i];
        let r = baseRadius + (amplitude * scaleFactor);
        let x = centerX + r * cos(angle);
        let y = centerY + r * sin(angle);
        vertex(x, y);
    }
    endShape(CLOSE);
}

// 5. SEQUENCER LOGIC
function sequencerRepeat(time) {
    draggableBalls.forEach(ball => {
        if (!ball.isOriginal && ball.stepIndex === currentStep) {
            if (ball.soundKey !== 'mute') {
                kitDrums.player(ball.soundKey).start(time);
                Tone.Draw.schedule(() => {
                    ball.scale = 1.4;
                }, time);
            }
        }
    });

    Tone.Draw.schedule(() => {
        currentStep = (currentStep + 1) % totalSteps;
    }, time);
}

function initDefaultSequencerBalls() {
    let baseY = PLAY_AREA_H + 52; // 65 * 0.8
    soundTypes.forEach(type => {
        draggableBalls.push({
            x: type.x,
            y: baseY,
            r: ballRadius,
            soundKey: type.sound,
            label: type.label,
            id: nextBallId++,
            isOriginal: true,
            scale: 1.0,
            stepIndex: -1
        });
    });
}

function drawGrid() {
    if (draggedBall) {
        stroke(0, 0, 100, 0.3); 
        strokeWeight(1);
        for (let i = 0; i < totalSteps; i++) {
            let x = gridStartX + i * stepWidth + stepWidth / 2;
            line(x, 0, x, PLAY_AREA_H); 
        }
        let extraX = gridStartX + totalSteps * stepWidth + stepWidth / 2;
        stroke(0, 0, 100, 0.15); 
        line(extraX, 0, extraX, PLAY_AREA_H);
        stroke(0, 0, 100, 0.2);
        line(gridStartX, 0, gridStartX, PLAY_AREA_H);
        stroke(0, 0, 100, 0.8);
        strokeWeight(2);
        drawingContext.setLineDash([5, 5]); 
        line(gridEndX, 0, gridEndX, PLAY_AREA_H);
        drawingContext.setLineDash([]); 
    }
}

function drawConnections() {
    let placedBalls = draggableBalls.filter(b => !b.isOriginal && b.stepIndex !== -1);
    placedBalls.sort((a, b) => a.stepIndex - b.stepIndex);

    if (placedBalls.length > 1) {
        stroke(200, 80, 80); 
        strokeWeight(2);
        noFill();
        beginShape();
        for (let i = 0; i < placedBalls.length; i++) {
            vertex(placedBalls[i].x, placedBalls[i].y); 
        }
        endShape();
    }
}

function drawSequencerBalls() {
    draggableBalls.forEach(ball => {
        if (!ball.isOriginal) renderSequencerBall(ball);
    });
    draggableBalls.forEach(ball => {
        if (ball.isOriginal) renderSequencerBall(ball);
    });
}

function renderSequencerBall(ball) {
    push();
    translate(ball.x, ball.y);
    if (ball.scale > 1.0) ball.scale = lerp(ball.scale, 1.0, 0.15);
    scale(ball.scale);

    let img = ballImages[ball.soundKey];
    if (img) {
        imageMode(CENTER);
        if (ball.soundKey === 'mute' && !ball.isOriginal) {
            image(img, 0, 0, ball.r * 2.5, ball.r * 2.5); 
        } else {
            image(img, 0, 0, ball.r * 2 + 2, ball.r * 2 + 2);
        }
    } else {
        noStroke();
        fill(100);
        ellipse(0, 0, ball.r * 2);
    }
    pop();
}

// 6. PIANO LOGIC
function playNextPianoChord() {
    if (!allNotes || allNotes.length === 0) return;
    let targetTime = allNotes[nextNoteIndex].time;
    let now = Tone.now();
    while (nextNoteIndex < allNotes.length) {
        let note = allNotes[nextNoteIndex];
        if (Math.abs(note.time - targetTime) < 0.05) {
            synthPiano.triggerAttackRelease(note.name, note.duration, now, note.velocity);
            let xPos = map(note.midi, minMidi, maxMidi, 80, width - 80); // 100*0.8
            let selectedImg = random([meteorImg1, meteorImg2, meteorImg3]);
            let rndScale = random(0.64, 0.96); // 0.8-1.2 scaled by 0.8

            fallingPianoBalls.push({
                x: xPos,
                y: -80,        
                vy: initialVy, 
                imgRef: selectedImg, 
                scaleVal: rndScale    
            });
            nextNoteIndex++;
        } else { break; }
    }
}

function drawFallingPianoBalls() {
    imageMode(CENTER);
    for (let i = fallingPianoBalls.length - 1; i >= 0; i--) {
        let ball = fallingPianoBalls[i];
        ball.vy += gravity; 
        ball.y += ball.vy;  
        push();
        translate(ball.x, ball.y);
        scale(ball.scaleVal); 
        image(ball.imgRef, 0, 0); 
        pop();
        if (ball.y - (ball.imgRef.height * ball.scaleVal)/2 > PLAY_AREA_H) {
            fallingPianoBalls.splice(i, 1);
        }
    }
}

function drawRhythmBar() {
    if (!allNotes || allNotes.length === 0) return;
    let barHeight = 24; // 30 * 0.8
    let barY = PLAY_AREA_H; 
    let startX = 120; // 150 * 0.8
    let timeScale = 200; // 250 * 0.8

    fill(0, 0, 20); 
    rect(0, barY, width, barHeight);
    stroke(0, 80, 100); 
    strokeWeight(2);
    line(startX, barY, startX, barY + barHeight);
    noStroke();
    fill(0, 80, 100);
    textSize(10);
    textAlign(CENTER, BOTTOM);
    text("NOW", startX, barY - 4);

    let startIndex = Math.max(0, nextNoteIndex - 20); 
    for (let i = startIndex; i < allNotes.length; i++) {
        let note = allNotes[i];
        let timeDiff = note.time - visualTime;
        let x = startX + timeDiff * timeScale;
        if (x < -40) continue; 
        if (x > width + 40) break; 
        fill(i >= nextNoteIndex ? color(180, 100, 100) : color(0, 0, 40));
        rectMode(CENTER);
        let h = map(note.velocity, 0, 1, barHeight * 0.4, barHeight * 0.8);
        rect(x, barY + barHeight / 2, 3, h, 2); 
        rectMode(CORNER);
    }
}

// 7. UI CONTROLS
function createControls() {
    const controlDiv = createDiv();
    controlDiv.position(width - 320, height - 20); // 650*0.8, 50*0.8

    controlDiv.style('display', 'flex');
    controlDiv.style('flex-direction', 'row'); 
    controlDiv.style('align-items', 'center'); 
    controlDiv.style('gap', '16px'); // 20*0.8
    controlDiv.style('font-family', 'sans-serif');
    controlDiv.style('color', 'white');
    controlDiv.style('font-size', '12px');

    const bpmGroup = createDiv().parent(controlDiv).style('display:flex; align-items:center; gap:8px;');
    const bpmLabel = createSpan('Tempo: ' + bpm).parent(bpmGroup).style('width: 80px; text-align:right;');
    const sliderBPM = createSlider(60,130, bpm).parent(bpmGroup).style('width', '80px');
    
    sliderBPM.input(() => {
        bpm = sliderBPM.value();
        bpmLabel.html('Bpm: ' + bpm);
        Tone.Transport.bpm.rampTo(bpm, 0.1);
    });

    createSpan('|').parent(controlDiv).style('color', 'rgba(255,255,255,0.3)');

    const btnRestart = createButton('Restart').parent(controlDiv);
    btnRestart.style('background-color', '#dd5005'); 
    btnRestart.style('color', 'white');
    btnRestart.style('border', 'none');
    btnRestart.style('padding', '4px 12px');
    btnRestart.style('border-radius', '4px');
    btnRestart.style('cursor', 'pointer');
    btnRestart.style('font-weight', 'bold');

    btnRestart.mousePressed(() => {
        nextNoteIndex = 0;
        fallingPianoBalls = [];
        visualTime = allNotes.length > 0 ? allNotes[0].time : 0;
        console.log("Midi Reset!");
    });
}

// 8. BACKGROUND GENERATORS
function generateStaticBackground() {
    bgGraphic = createGraphics(width, PLAY_AREA_H);
    bgGraphic.colorMode(HSB, 360, 100, 100, 1);
    bgGraphic.noStroke();
    let step = 4; 
    let noiseScale = 0.003; 
    let distortionAmount = 120; // 150 * 0.8
    for (let y = 0; y < PLAY_AREA_H; y += step) {
        for (let x = 0; x < width; x += step) {
            let noiseVal = noise(x * noiseScale, y * noiseScale);
            let distortionOffset = map(noiseVal, 0, 1, -distortionAmount, distortionAmount);
            let effectiveY = constrain(y + distortionOffset, 0, PLAY_AREA_H);
            let gradientAmount = map(effectiveY, 0, PLAY_AREA_H, 0, 1);
            bgGraphic.fill(lerpColor(colorTop, colorBottom, gradientAmount));
            bgGraphic.rect(x, y, step, step);
        }
    }
}

function generateStaticTree() {
    treeGraphic = createGraphics(width, PLAY_AREA_H);
    treeGraphic.colorMode(HSB, 360, 100, 100, 1);
    treeGraphic.clear(); 
    let left = width/2 - 176; // 220 * 0.8
    let right = width/2 + 176;
    let foliageTop = PLAY_AREA_H - 440; // 550 * 0.8
    let bottom = PLAY_AREA_H - 8;
    treeGraphic.noStroke();
    treeGraphic.fill(45, 80, 50); 
    let trunkW = 16; // 20 * 0.8
    let trunkTop = foliageTop + 80;
    treeGraphic.rect(width/2 - trunkW/2, trunkTop, trunkW, PLAY_AREA_H - trunkTop);
    drawTreeLayer(treeGraphic, left, right, foliageTop, bottom, color(160, 80, 50)); 
    drawTreeLayer(treeGraphic, left, right, foliageTop, bottom, color(0, 0, 100)); 
}

function drawTreeLayer(pg, left, right, top, bottom, col) {
    pg.stroke(col);
    pg.noFill();
    for (let idx = 0; idx < nbranchs; idx += 1) {
        let y = random(bottom, top);
        let dx = map(y, bottom, top, 0, (right-left)/2);
        let x = random(left + dx, right - dx);
        let w = map (x, left, right, -40, 40) + 1;
        let h = map (y, bottom, top, 20, 4);
        drawBranch(pg, x, y, w + random(-8, 4), h + random(-4, 4));
    }
}

function drawBranch(pg, x, y, dx, dy) {
    let sign = dx/abs(dx);
    for (let i = 0; i <= x; i += 3) {
        let idx = i/x;
        let xi = bezierPoint(x, x + dx/2, x + dx, x + dx, idx);
        let yi = bezierPoint(y, y, y + dy, y + dy, idx);
        pg.line(xi, yi, xi + sign*random(4), yi + random(12));   
    }
}

class Snowflake {
    constructor() {
        this.reset();
        this.y = random(PLAY_AREA_H); 
    }
    reset() {
        this.x = random(width);
        this.y = random(-40, -8); 
        this.size = random(1.6, 4); 
        this.speedY = random(0.8, 2.4); 
    }
    update() {
        this.y += this.speedY;
        if (this.y > PLAY_AREA_H) this.reset();
    }
    display() {
        fill(0, 0, 100, 0.8); 
        ellipse(this.x, this.y, this.size);
    }
}

// 9. INPUT HANDLING
function keyPressed() {
    if (!isAudioContextStarted) {
        Tone.start(); Tone.Transport.start();
        isAudioContextStarted = true;
    }
    playNextPianoChord(); 
    return false; 
}

function mousePressed() {
    if (!isAudioContextStarted) {
        Tone.start(); Tone.Transport.start();
        isAudioContextStarted = true;
    }
    let treeCenterX = width/2 + treePos.x;
    let treeCenterY = PLAY_AREA_H/2 + 40 + treePos.y;
    if (dist(mouseX, mouseY, treeCenterX, treeCenterY) < 160) { // 200 * 0.8
        let clickedBall = false;
        for (let b of draggableBalls) {
            if (dist(mouseX, mouseY, b.x, b.y) < b.r) { clickedBall = true; break; }
        }
        if (!clickedBall) { isDraggingTree = true; return; }
    }
    for (let i = draggableBalls.length - 1; i >= 0; i--) {
        let b = draggableBalls[i];
        if (dist(mouseX, mouseY, b.x, b.y) < b.r) {
            if (b.isOriginal) {
                let newBall = { ...b, id: nextBallId++, isOriginal: false, scale: 1.0, stepIndex: -1, x: mouseX, y: mouseY };
                draggableBalls.push(newBall);
                draggedBall = newBall;
            } else {
                if (mouseButton === RIGHT || keyIsDown(SHIFT)) draggableBalls.splice(i, 1);
                else draggedBall = b;
            }
            return; 
        }
    }
}

function updateAudioFromTree() {
    let mixVal = map(treePos.y, 0, 240, 1, 0); // 300 * 0.8
    mixVal = constrain(mixVal, 0, 1);
    crossFader.fade.rampTo(mixVal, 0.1);
    let panX = constrain(map(width/2 + treePos.x, 0, width, -1, 1), -1, 1);
    if (panX < 0) {
        masterEq.low.rampTo(Math.abs(panX) * 10, 0.1); 
        masterEq.high.rampTo(Math.abs(panX) * -20, 0.1);
    } else {
        masterEq.low.rampTo(panX * -20, 0.1);
        masterEq.high.rampTo(panX * 10, 0.1);
    }
}

function mouseDragged() {
    if (isDraggingTree) {
        treePos.x = constrain(mouseX - width/2, -width/2, width/2);
        treePos.y = constrain(mouseY - (PLAY_AREA_H/2 + 40), 0, 240); // 300 * 0.8
        updateAudioFromTree();
    }
    if (draggedBall) { draggedBall.x = mouseX; draggedBall.y = mouseY; }
    return false;
}

function mouseReleased() {
    isDraggingTree = false;
    if (draggedBall && !draggedBall.isOriginal) {
        let validRegionEnd = gridEndX + stepWidth * extraSteps;
        if (mouseX > gridStartX && mouseX < validRegionEnd && mouseY > 0 && mouseY < PLAY_AREA_H) {
            let step = Math.floor((mouseX - gridStartX) / stepWidth);
            if (step >= 0 && step < (totalSteps + extraSteps)) {
                draggedBall.x = gridStartX + step * stepWidth + stepWidth / 2;
                draggedBall.y = mouseY;
                draggedBall.stepIndex = step;
                draggedBall.scale = 1.2;
            } else draggableBalls = draggableBalls.filter(b => b !== draggedBall);
        } else draggableBalls = draggableBalls.filter(b => b !== draggedBall);
    }
    draggedBall = null; 
}

document.addEventListener('contextmenu', e => e.preventDefault());