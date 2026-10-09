/**
 * Boxing Ring Environment: 3D perspective ropes, crowd silhouettes, stadium flashes
 * Super K.O. Boxing Web Edition
 */

class BoxingRing {
  constructor(width, height) {
    this.w = width;
    this.h = height;
    this.cameraFlashes = [];
    this.crowdBob = 0;
    this.ropeVibration = 0;
    this.spotlightAngle = 0;

    // Pre-generate crowd silhouettes
    this.crowdMembers = [];
    const count = 48;
    for (let i = 0; i < count; i++) {
      this.crowdMembers.push({
        x: (i / count) * this.w * 1.1 - this.w * 0.05,
        y: this.h * 0.32 + (Math.sin(i * 1.4) * 18),
        size: Math.random() * 14 + 18,
        headOffset: Math.random() * 4,
        color: [
          Math.floor(Math.random() * 20 + 20),
          Math.floor(Math.random() * 20 + 25),
          Math.floor(Math.random() * 30 + 40)
        ]
      });
    }
  }

  triggerRopeBounce() {
    this.ropeVibration = 18;
  }

  update() {
    this.crowdBob += 0.05;
    this.spotlightAngle += 0.02;

    if (this.ropeVibration > 0) {
      this.ropeVibration *= 0.88;
      if (this.ropeVibration < 0.1) this.ropeVibration = 0;
    }

    // Random spectator camera flashes
    if (Math.random() < 0.18) {
      this.cameraFlashes.push({
        x: Math.random() * this.w,
        y: Math.random() * (this.h * 0.35),
        life: 5,
        size: Math.random() * 12 + 8
      });
    }

    for (let i = this.cameraFlashes.length - 1; i >= 0; i--) {
      this.cameraFlashes[i].life--;
      if (this.cameraFlashes[i].life <= 0) {
        this.cameraFlashes.splice(i, 1);
      }
    }
  }

  draw(p) {
    p.push();

    // 1. Stadium Darkness & Ceiling
    p.background(10, 14, 24);

    // 2. Stadium Crowd Silhouettes
    for (let i = 0; i < this.crowdMembers.length; i++) {
      const c = this.crowdMembers[i];
      const bob = Math.sin(this.crowdBob + i) * 4;
      p.noStroke();
      p.fill(c.color[0], c.color[1], c.color[2]);
      // Head
      p.ellipse(c.x, c.y + bob - c.size * 0.6, c.size * 0.7, c.size * 0.8);
      // Shoulders
      p.ellipse(c.x, c.y + bob, c.size * 1.5, c.size);
    }

    // 3. Camera Flashes in the crowd
    for (let flash of this.cameraFlashes) {
      p.noStroke();
      p.fill(255, 255, 255, 220);
      p.ellipse(flash.x, flash.y, flash.size * 1.5, flash.size * 1.5);
      p.fill(200, 240, 255, 140);
      p.ellipse(flash.x, flash.y, flash.size * 3, flash.size * 3);
    }

    // 4. Ring Mat / Canvas Floor (Perspective Trapezoid)
    const ringTopY = this.h * 0.44;
    const ringBottomY = this.h * 0.98;
    const ringTopW = this.w * 0.78;
    const ringBottomW = this.w * 0.96;

    const topLeftX = (this.w - ringTopW) / 2;
    const topRightX = (this.w + ringTopW) / 2;
    const bottomLeftX = (this.w - ringBottomW) / 2;
    const bottomRightX = (this.w + ringBottomW) / 2;

    // Ring Floor gradient fill
    p.noStroke();
    p.fill(32, 54, 88); // Deep blue classic canvas
    p.quad(topLeftX, ringTopY, topRightX, ringTopY, bottomRightX, ringBottomY, bottomLeftX, ringBottomY);

    // Ring Center Decal / Logo
    p.push();
    p.translate(this.w / 2, (ringTopY + ringBottomY) * 0.52);
    p.scale(1, 0.45); // Perspective squash
    p.stroke(255, 215, 0, 45);
    p.strokeWeight(12);
    p.noFill();
    p.ellipse(0, 0, 340, 340);
    p.strokeWeight(4);
    p.ellipse(0, 0, 380, 380);

    p.fill(255, 215, 0, 35);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.textStyle(p.BOLD);
    p.text("SUPER K.O.", 0, 0);
    p.pop();

    // Overhead Spotlight Cone
    p.push();
    p.blendMode(p.ADD);
    const spotX = this.w / 2 + Math.sin(this.spotlightAngle) * 20;
    p.fill(160, 220, 255, 18);
    p.triangle(
      this.w / 2, 0,
      topLeftX - 40, ringBottomY,
      topRightX + 40, ringBottomY
    );
    p.pop();

    // 5. Corner Posts (Turnbuckles)
    const postHeight = this.h * 0.28;
    // Blue Corner (Left)
    p.stroke(20, 40, 100);
    p.strokeWeight(14);
    p.line(topLeftX, ringTopY, topLeftX, ringTopY - postHeight);
    // Red Corner (Right)
    p.stroke(140, 20, 20);
    p.line(topRightX, ringTopY, topRightX, ringTopY - postHeight);

    // Turnbuckle Pads
    p.noStroke();
    p.fill(0, 100, 255);
    p.rect(topLeftX - 12, ringTopY - postHeight - 10, 24, postHeight + 15, 4);
    p.fill(255, 40, 40);
    p.rect(topRightX - 12, ringTopY - postHeight - 10, 24, postHeight + 15, 4);

    // 6. Ring Ropes (3 Horizontal levels with vibration)
    const ropeLevels = [0.25, 0.55, 0.85];
    const ropeColors = [[255, 255, 255], [240, 50, 50], [40, 100, 240]];

    for (let r = 0; r < ropeLevels.length; r++) {
      const lvl = ropeLevels[r];
      const yL = (ringTopY - postHeight) + postHeight * lvl;
      const yR = (ringTopY - postHeight) + postHeight * lvl;

      // Sag and vibration curve
      const sag = Math.sin(lvl * Math.PI) * 12 + Math.sin(p.frameCount * 0.5) * this.ropeVibration;

      p.noFill();
      p.stroke(ropeColors[r][0], ropeColors[r][1], ropeColors[r][2]);
      p.strokeWeight(6);
      p.bezier(
        topLeftX, yL,
        this.w * 0.35, yL + sag,
        this.w * 0.65, yR + sag,
        topRightX, yR
      );

      // Metallic Rope Highlight
      p.stroke(255, 255, 255, 140);
      p.strokeWeight(2);
      p.bezier(
        topLeftX, yL - 2,
        this.w * 0.35, yL + sag - 2,
        this.w * 0.65, yR + sag - 2,
        topRightX, yR - 2
      );
    }

    p.pop();
  }
}
