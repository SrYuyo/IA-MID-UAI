/**
 * Visual Effects: Screen Shake, Comic Hit Bursts, Sparks & Sweat Particles
 * Super K.O. Boxing Web Edition
 */

class FXManager {
  constructor() {
    this.particles = [];
    this.floatingTexts = [];
    this.shakeDuration = 0;
    this.shakeIntensity = 0;
    this.flashDuration = 0;
    this.flashColor = [255, 255, 255];
    this.hitStopFrames = 0; // Freeze frame for impact punch feel
  }

  triggerShake(intensity = 12, duration = 14) {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
  }

  triggerFlash(color = [255, 255, 255], duration = 6) {
    this.flashColor = color;
    this.flashDuration = duration;
  }

  triggerHitStop(frames = 6) {
    this.hitStopFrames = Math.max(this.hitStopFrames, frames);
  }

  addText(text, x, y, options = {}) {
    const defaultColor = [255, 230, 0];
    this.floatingTexts.push({
      text: text,
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * 2,
      vy: -3.5,
      size: options.size || 36,
      color: options.color || defaultColor,
      strokeColor: options.strokeColor || [0, 0, 0],
      life: options.life || 45,
      maxLife: options.life || 45,
      scale: 0.1,
      targetScale: 1.0,
      rotation: (Math.random() - 0.5) * 0.3
    });
  }

  spawnImpact(x, y, isSuper = false, isBlocked = false) {
    const count = isSuper ? 40 : (isBlocked ? 15 : 25);
    const baseColor = isBlocked 
      ? [120, 210, 255] 
      : (isSuper ? [255, 220, 0] : [255, 80, 50]);

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (Math.random() * 8 + 4) * (isSuper ? 1.6 : 1);
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        size: Math.random() * (isSuper ? 12 : 7) + 3,
        color: baseColor,
        life: Math.random() * 20 + 15,
        maxLife: 35,
        gravity: 0.3,
        type: isBlocked ? 'spark' : (Math.random() > 0.4 ? 'spark' : 'sweat')
      });
    }

    // Impact Star Burst Ring
    this.particles.push({
      x: x,
      y: y,
      radius: 5,
      maxRadius: isSuper ? 130 : 65,
      life: 14,
      maxLife: 14,
      color: isBlocked ? [180, 230, 255] : (isSuper ? [255, 255, 200] : [255, 200, 100]),
      type: 'ring'
    });
  }

  update() {
    if (this.hitStopFrames > 0) {
      this.hitStopFrames--;
      return false; // Skip game simulation frame for hit stop effect
    }

    // Update Screen Shake
    if (this.shakeDuration > 0) {
      this.shakeDuration--;
      if (this.shakeDuration === 0) this.shakeIntensity = 0;
    }

    // Update Flash
    if (this.flashDuration > 0) {
      this.flashDuration--;
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life--;
      if (p.type === 'ring') {
        p.radius += (p.maxRadius - p.radius) * 0.3;
      } else {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.vx *= 0.95;
      }

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Update Floating Texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life--;
      ft.x += ft.vx;
      ft.y += ft.vy;
      ft.vy *= 0.92;

      // Pop-in bounce scale
      if (ft.scale < ft.targetScale) {
        ft.scale += 0.22;
        if (ft.scale > ft.targetScale) ft.scale = ft.targetScale;
      }

      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }

    return true; // Continue simulation
  }

  applyScreenShake(p) {
    if (this.shakeDuration > 0 && this.shakeIntensity > 0) {
      const decay = this.shakeDuration / 14;
      const curIntensity = this.shakeIntensity * decay;
      const offsetX = (Math.random() - 0.5) * curIntensity * 2;
      const offsetY = (Math.random() - 0.5) * curIntensity * 2;
      p.translate(offsetX, offsetY);
    }
  }

  draw(p) {
    p.push();

    // Draw Particles
    for (let pt of this.particles) {
      const alpha = (pt.life / pt.maxLife) * 255;
      if (pt.type === 'ring') {
        p.noFill();
        p.stroke(pt.color[0], pt.color[1], pt.color[2], alpha);
        p.strokeWeight(4);
        p.ellipse(pt.x, pt.y, pt.radius * 2, pt.radius * 2);
      } else if (pt.type === 'sweat') {
        p.noStroke();
        p.fill(200, 240, 255, alpha);
        p.ellipse(pt.x, pt.y, pt.size, pt.size * 1.5);
      } else {
        p.noStroke();
        p.fill(pt.color[0], pt.color[1], pt.color[2], alpha);
        p.rectMode(p.CENTER);
        p.rect(pt.x, pt.y, pt.size, pt.size);
      }
    }

    // Draw Floating Comic Texts
    for (let ft of this.floatingTexts) {
      const progress = ft.life / ft.maxLife;
      const alpha = progress < 0.25 ? progress * 4 * 255 : 255;

      p.push();
      p.translate(ft.x, ft.y);
      p.rotate(ft.rotation);
      p.scale(ft.scale);

      p.textAlign(p.CENTER, p.CENTER);
      p.textStyle(p.BOLD);
      p.textSize(ft.size);

      // Comic Thick Outline
      p.stroke(ft.strokeColor[0], ft.strokeColor[1], ft.strokeColor[2], alpha);
      p.strokeWeight(8);
      p.fill(ft.strokeColor[0], ft.strokeColor[1], ft.strokeColor[2], alpha);
      p.text(ft.text, 0, 0);

      // Inner Comic Fill
      p.noStroke();
      p.fill(ft.color[0], ft.color[1], ft.color[2], alpha);
      p.text(ft.text, 0, 0);

      p.pop();
    }

    // Draw Screen Flash
    if (this.flashDuration > 0) {
      p.noStroke();
      const alpha = (this.flashDuration / 6) * 160;
      p.fill(this.flashColor[0], this.flashColor[1], this.flashColor[2], alpha);
      p.rect(0, 0, p.width, p.height);
    }

    p.pop();
  }
}
