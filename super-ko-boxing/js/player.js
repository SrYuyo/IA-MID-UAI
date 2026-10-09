/**
 * Player State, First-Person Boxing Gloves & Animation
 * Super K.O. Boxing Web Edition
 */

class Player {
  constructor(canvasWidth, canvasHeight) {
    this.w = canvasWidth;
    this.h = canvasHeight;

    // Combat Stats
    this.maxHp = 100;
    this.hp = 100;
    this.superMeter = 0; // 0 to 100
    this.knockdowns = 0;
    this.isDead = false;

    // Movement & Stance Offsets (driven by PoseTracker)
    this.targetOffsetX = 0;
    this.currentOffsetX = 0;
    this.targetOffsetY = 0;
    this.currentOffsetY = 0;
    this.dodgeState = 'IDLE'; // 'IDLE', 'DODGE_LEFT', 'DODGE_RIGHT', 'DUCK'
    this.isBlocking = false;

    // Glove Positions & Animations
    // Rest positions relative to center bottom
    this.leftGlove = {
      baseX: -140,
      baseY: -70,
      x: -140,
      y: -70,
      z: 1.0, // Scale
      state: 'IDLE', // 'IDLE', 'PUNCHING', 'RETRACTING'
      progress: 0,
      isSuper: false
    };

    this.rightGlove = {
      baseX: 140,
      baseY: -70,
      x: 140,
      y: -70,
      z: 1.0,
      state: 'IDLE',
      progress: 0,
      isSuper: false
    };

    this.idleBob = 0;
    this.hurtTimer = 0;
  }

  reset() {
    this.hp = this.maxHp;
    this.superMeter = 0;
    this.knockdowns = 0;
    this.isDead = false;
    this.hurtTimer = 0;
    this.leftGlove.state = 'IDLE';
    this.rightGlove.state = 'IDLE';
  }

  takeDamage(amount, isBlocked = false) {
    if (isBlocked) {
      amount = Math.max(1, Math.floor(amount * 0.15)); // 85% damage reduction on block
    }

    this.hp = Math.max(0, this.hp - amount);
    this.hurtTimer = 10;

    // Recoil gloves back
    this.leftGlove.y += 25;
    this.rightGlove.y += 25;

    if (this.hp <= 0) {
      this.isDead = true;
    }
  }

  addSuper(amount) {
    const prev = this.superMeter;
    this.superMeter = Math.min(100, this.superMeter + amount);
    return prev < 100 && this.superMeter === 100; // Returns true if just filled
  }

  triggerPunch(type, isSuper = false) {
    if (this.isBlocking) return false;

    if (type === 'PUNCH_LEFT' && this.leftGlove.state === 'IDLE') {
      this.leftGlove.state = 'PUNCHING';
      this.leftGlove.progress = 0;
      this.leftGlove.isSuper = isSuper;
      return true;
    } else if (type === 'PUNCH_RIGHT' && this.rightGlove.state === 'IDLE') {
      this.rightGlove.state = 'PUNCHING';
      this.rightGlove.progress = 0;
      this.rightGlove.isSuper = isSuper;
      return true;
    } else if (type === 'SUPER_PUNCH') {
      if (this.superMeter >= 100) {
        this.superMeter = 0;
        this.leftGlove.state = 'PUNCHING';
        this.leftGlove.progress = 0;
        this.leftGlove.isSuper = true;

        this.rightGlove.state = 'PUNCHING';
        this.rightGlove.progress = 0;
        this.rightGlove.isSuper = true;
        return true;
      }
    }
    return false;
  }

  update(tracker) {
    this.idleBob += 0.08;
    if (this.hurtTimer > 0) this.hurtTimer--;

    // Read pose tracker input
    if (tracker) {
      this.dodgeState = tracker.currentAction;
      this.isBlocking = tracker.isBlocking;

      if (tracker.currentAction === 'DODGE_LEFT') {
        this.targetOffsetX = -160;
        this.targetOffsetY = 0;
      } else if (tracker.currentAction === 'DODGE_RIGHT') {
        this.targetOffsetX = 160;
        this.targetOffsetY = 0;
      } else if (tracker.currentAction === 'DUCK') {
        this.targetOffsetX = 0;
        this.targetOffsetY = 110;
      } else {
        // Continuous smooth tracking from tracker.dodgeAmountX
        this.targetOffsetX = tracker.dodgeAmountX * 130;
        this.targetOffsetY = tracker.duckAmountY * 90;
      }
    }

    // Smooth movement interpolation
    this.currentOffsetX += (this.targetOffsetX - this.currentOffsetX) * 0.22;
    this.currentOffsetY += (this.targetOffsetY - this.currentOffsetY) * 0.22;

    // Update Left Glove Punch Physics
    this._updateGlove(this.leftGlove, -1);
    // Update Right Glove Punch Physics
    this._updateGlove(this.rightGlove, 1);
  }

  _updateGlove(glove, sideSign) {
    const bobY = Math.sin(this.idleBob + (sideSign > 0 ? 0.8 : 0)) * 6;

    if (this.isBlocking) {
      // Guard Stance: Hands pulled close to center chin
      const guardTargetX = sideSign * 45;
      const guardTargetY = -120;
      glove.x += (guardTargetX - glove.x) * 0.3;
      glove.y += (guardTargetY - glove.y) * 0.3;
      glove.z += (1.1 - glove.z) * 0.3;
      glove.state = 'IDLE';
      return;
    }

    if (glove.state === 'IDLE') {
      const restX = glove.baseX;
      const restY = glove.baseY + bobY;
      glove.x += (restX - glove.x) * 0.2;
      glove.y += (restY - glove.y) * 0.2;
      glove.z += (1.0 - glove.z) * 0.2;
    } else if (glove.state === 'PUNCHING') {
      glove.progress += 0.24; // Fast forward surge

      // Punch trajectory curves towards opponent's chin / center
      const targetPunchX = sideSign * 25;
      const targetPunchY = glove.isSuper ? -280 : -220;

      glove.x = glove.baseX + (targetPunchX - glove.baseX) * Math.sin(glove.progress * Math.PI * 0.5);
      glove.y = glove.baseY + (targetPunchY - glove.baseY) * Math.sin(glove.progress * Math.PI * 0.5);
      // Perspective scale: glove appears slightly smaller as it hits opponent in distance, then expands
      glove.z = 1.0 - Math.sin(glove.progress * Math.PI * 0.5) * 0.32;

      if (glove.progress >= 1.0) {
        glove.state = 'RETRACTING';
      }
    } else if (glove.state === 'RETRACTING') {
      glove.progress -= 0.18;
      const targetPunchX = sideSign * 25;
      const targetPunchY = glove.isSuper ? -280 : -220;

      glove.x = glove.baseX + (targetPunchX - glove.baseX) * glove.progress;
      glove.y = glove.baseY + (targetPunchY - glove.baseY) * glove.progress;
      glove.z = 1.0 - glove.progress * 0.32;

      if (glove.progress <= 0) {
        glove.state = 'IDLE';
        glove.progress = 0;
        glove.isSuper = false;
      }
    }
  }

  // Draw Player's Hands / Gloves in 1st Person Perspective
  draw(p) {
    p.push();
    const centerX = this.w / 2 + this.currentOffsetX;
    const centerY = this.h + this.currentOffsetY;

    p.translate(centerX, centerY);

    // Optional Player Back/Shoulders Silhouette (Semi-transparent Punch-Out style)
    p.noStroke();
    p.fill(16, 26, 44, 180);
    // Left shoulder / arm
    p.ellipse(this.leftGlove.x * 0.7 - 80, -20, 160, 180);
    // Right shoulder / arm
    p.ellipse(this.rightGlove.x * 0.7 + 80, -20, 160, 180);
    // Back Torso
    p.ellipse(0, 40, 260, 180);

    // Guard Force Shield Effect if Blocking
    if (this.isBlocking) {
      p.push();
      p.stroke(0, 220, 255, 180 + Math.sin(p.frameCount * 0.3) * 60);
      p.strokeWeight(4);
      p.fill(0, 180, 255, 45);
      p.ellipse(0, -115, 230, 210);

      // Energy lines
      p.noFill();
      p.stroke(255, 255, 255, 120);
      p.strokeWeight(2);
      p.arc(0, -115, 200, 180, -p.PI * 0.75, -p.PI * 0.25);
      p.arc(0, -115, 200, 180, p.PI * 0.25, p.PI * 0.75);
      p.pop();
    }

    // Draw Left and Right Boxing Gloves
    this._drawGlove(p, this.leftGlove, -1);
    this._drawGlove(p, this.rightGlove, 1);

    p.pop();
  }

  _drawGlove(p, glove, sideSign) {
    p.push();
    p.translate(glove.x, glove.y);
    p.scale(glove.z);

    const isSuper = glove.isSuper;

    // Super Punch Fiery Aura
    if (isSuper) {
      p.noStroke();
      p.fill(255, 200, 0, 90 + Math.sin(p.frameCount * 0.4) * 50);
      p.ellipse(0, 0, 130, 140);
      p.fill(255, 80, 0, 70);
      p.ellipse(0, 0, 150, 160);
    }

    // Glove Main Body (Cyber Green / Neon Teal Classic Puncher)
    const baseColor = isSuper ? [255, 210, 0] : [0, 230, 180];
    const shadowColor = isSuper ? [180, 90, 0] : [0, 120, 100];
    const highlightColor = isSuper ? [255, 255, 220] : [180, 255, 240];

    // Glove Fist
    p.noStroke();
    p.fill(shadowColor[0], shadowColor[1], shadowColor[2]);
    p.ellipse(0, 5, 96, 96);

    p.fill(baseColor[0], baseColor[1], baseColor[2]);
    p.ellipse(0, 0, 90, 90);

    // Thumb part
    p.fill(shadowColor[0], shadowColor[1], shadowColor[2]);
    p.ellipse(-sideSign * 34, 12, 38, 48);
    p.fill(baseColor[0], baseColor[1], baseColor[2]);
    p.ellipse(-sideSign * 34, 10, 34, 44);

    // Leather Specular Highlight
    p.fill(highlightColor[0], highlightColor[1], highlightColor[2], 180);
    p.ellipse(sideSign * 16, -18, 42, 22);

    // Glove Wrist Band / Tape (White boxing wraps)
    p.fill(240, 240, 245);
    p.rectMode(p.CENTER);
    p.rect(0, 48, 68, 26, 6);
    p.fill(200, 200, 210);
    p.rect(0, 50, 68, 4);

    // Black Laces / Logo
    p.stroke(20, 20, 30);
    p.strokeWeight(3);
    p.line(-12, 42, 12, 42);
    p.line(-10, 52, 10, 52);

    p.pop();
  }
}
