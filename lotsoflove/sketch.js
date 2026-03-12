let myHandpose;
let myVideo;
let myResults;
let particles = []; 

function preload() {
  myHandpose = ml5.handPose();
}

function setup() {
  createCanvas(640, 480);
  myVideo = createCapture(VIDEO);
  myVideo.size(640, 480);
  myVideo.hide();

  myHandpose.detectStart(myVideo, gotHands);

  textAlign(CENTER, CENTER);
  noStroke();
}

function gotHands(results) {
  myResults = results;
}

function draw() {
  image(myVideo, 0, 0, width, height);

  if (myResults && myResults.length > 0) {
    let isDoubleHearting = false;
    if (myResults.length > 1) {
      isDoubleHearting = checkDoubleHandHeart(myResults[0], myResults[1]);
    }

    if (!isDoubleHearting) {
      for (let i = 0; i < myResults.length; i++) {
        drawHandText(myResults[i]);
      }
    }
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    p.update();
    p.show();
    if (p.alpha <= 0 || p.size < 2) {
      particles.splice(i, 1);
    }
  }
}

function drawHandText(hand) {
  let thumb = hand.thumb_tip;
  let index = hand.index_finger_tip;
  let centerX = (thumb.x + index.x) / 2;
  let centerY = (thumb.y + index.y) / 2;

  let dy = index.y - thumb.y;
  let dx = index.x - thumb.x;
  let angle = atan2(dy, dx);
  if (abs(angle) > HALF_PI) angle += PI;

  let d = dist(thumb.x, thumb.y, index.x, index.y);
  let repeatCount = floor(d / 18); // 调小间距适配小字
  if (repeatCount < 0) repeatCount = 0;

  // 统一使用 ❤️，字号调小到 18
  let content = "L" + "❤️".repeat(repeatCount) + "VE";

  push();
  fill(255, 0, 125);
  textSize(18); 
  translate(centerX, centerY);
  rotate(angle);
  text(content, 0, 0);
  pop();
}

function checkDoubleHandHeart(hand1, hand2) {
  let t1 = hand1.thumb_tip;
  let i1 = hand1.index_finger_tip;
  let t2 = hand2.thumb_tip;
  let i2 = hand2.index_finger_tip;

  let dThumb = dist(t1.x, t1.y, t2.x, t2.y);
  let dIndex = dist(i1.x, i1.y, i2.x, i2.y);

  if (dThumb < 20 && dIndex < 20) {
    if (frameCount % 10 === 0) {
      let m1 = hand1.index_finger_mcp;
      let m2 = hand2.index_finger_mcp;
      let dMCP = dist(m1.x, m1.y, m2.x, m2.y);
      
      let heartSize = map(dMCP, 50, 200, 40, 120, true);
      let centerX = (i1.x + i2.x) / 2;
      let centerY = (i1.y + i2.y) / 2;
      particles.push(new HeartParticle(centerX, centerY, heartSize));
    }
    return true; 
  }
  return false; 
}

class HeartParticle {
  constructor(x, y, baseSize) {
    this.x = x;
    this.y = y;
    this.size = baseSize;
    this.alpha = 255;
    this.vx = random(-1.5, 1.5);
    this.vy = random(-1, -3);
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.alpha -= 3;
    this.size *= 0.98; 
  }
  show() {
    push();
    drawingContext.globalAlpha = max(0, this.alpha / 255);
    textSize(this.size);
    text("❤️", this.x, this.y);
    pop();
  }
}