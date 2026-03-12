let staticImg, gifImg;
let currentImg;
let loaded = false;

let isWActive = false; 
let isRActive = false; 
let isTActive = false; 

let meteors = [];
const numMeteors = 60;
let thunderFlash = 0; 

const audio1 = new Tone.Player("wind.mp3");
const audio2 = new Tone.Player("rain.mp3");
const audio3 = new Tone.Player("thunder.mp3");
const bgm = new Tone.Player("bgm.mp3");

function preload() {
  staticImg = loadImage("tree.JPG");
  gifImg = loadImage("tree.gif");
  currentImg = staticImg;
}

function setup() {
  createCanvas(800, 600);
  colorMode(HSB, 360, 100, 100, 255);
  
  bgm.loop = true;
  audio2.loop = true; 
  audio3.loop = false; 

  for (let i = 0; i < numMeteors; i++) {
    meteors.push(resetMeteor({}));
  }

  Tone.loaded().then(() => {
    loaded = true;
    bgm.toDestination().start();
    audio1.toDestination();
    audio2.toDestination();
    audio3.toDestination();
    console.log("System Ready. Press W, R, T");
  });
}

function draw() {
  if (thunderFlash > 0) {
    tint(0, 0, 100); 
  } else {
    tint(0, 0, 70);  
  }
  
  image(currentImg, 0, 0, width, height);
  noTint();

  if (isRActive) {
    drawRain();
  }

  if (isTActive) {
    if (frameCount % floor(random(50, 120)) === 0) {
      triggerThunder();
    }
  }

  if (thunderFlash > 0) {
    fill(0, 0, 100, thunderFlash * 0.5); 
    rect(0, 0, width, height);
    thunderFlash -= 15; 
  }
}

function drawRain() {
  strokeWeight(1.5);
  for (let m of meteors) {
    m.y += m.speed;
    m.x += m.wind; 
    
    stroke(200, 20, 100, m.opacity); 
    line(m.x, m.y, m.x + m.wind * 2, m.y + m.length);
    
    if (m.y > height) resetMeteor(m);
  }
}

function resetMeteor(m) {
  m.x = random(-100, width + 100);
  m.y = random(-height, 0);
  m.speed = random(10, 20);
  m.length = random(10, 30);
  m.opacity = random(50, 150);
  m.wind = 1.5; 
  return m;
}

function triggerThunder() {
  thunderFlash = 255; 
  if (audio3.state !== "started") {
    audio3.start(); 
  }
  
  push();
  let startX = random(100, width - 100);
  drawLightning(startX, 0, 12); 
  pop();
}

function drawLightning(x, y, segments) {
  if (segments <= 0) return;
  stroke(0, 0, 100, 255);
  strokeWeight(map(segments, 0, 12, 1, 4));
  
  drawingContext.shadowBlur = 15;
  drawingContext.shadowColor = 'white';

  let nextX = x + random(-40, 40);
  let nextY = y + random(20, 60);
  
  line(x, y, nextX, nextY);

  if (random() > 0.7) {
    drawLightning(nextX, nextY, segments - 2);
  }
  
  drawLightning(nextX, nextY, segments - 1);
  
  drawingContext.shadowBlur = 0; 
}

function keyPressed() {
  if (!loaded) return;

  let k = key.toLowerCase();

  if (k === 'w') {
    isWActive = !isWActive;
    if (isWActive) {
      currentImg = gifImg;
      audio1.start();
    } else {
      currentImg = staticImg;
      audio1.stop();
    }
  }

  if (k === 'r') {
    isRActive = !isRActive;
    isRActive ? audio2.start() : audio2.stop();
  }

  if (k === 't') {
    isTActive = !isTActive;
  }
}