/**
 * ============================================================================
 * TennisPlayer: Jugador 2.5D con Animaciones y Golpes Arcade
 * ============================================================================
 * Modela al tenista (P1 en fondo cercano o P2 en fondo lejano):
 * - Movimiento y posicionamiento en pista
 * - Swings: Forehand (Drive derecha), Backhand (Revés), Saque y Smash
 * - Caja de colisión de raqueta y cálculo de trayectorias
 */

class TennisPlayer {
  constructor(isP1 = true, court) {
    this.isP1 = isP1;
    this.court = court;

    this.x = 0;
    this.y = isP1 ? 30 : court.length - 30;
    this.vx = 0;
    this.vy = 0;
    this.speed = 4.8;

    this.state = 'idle'; // 'idle', 'run', 'swing_fh', 'swing_bh', 'serve', 'smash'
    this.swingTimer = 0;
    this.swingDuration = 18; // frames
    this.racketReach = 55;

    // Colores retro estilo Virtua Tennis
    this.shirtColor = isP1 ? '#00e5ff' : '#ff3366';
    this.shortsColor = isP1 ? '#003366' : '#222222';
    this.skinColor = '#f5c6a5';
    this.hairColor = isP1 ? '#3d2314' : '#f0b400';
  }

  reset(side = 'right') {
    const sX = (side === 'right') ? 60 : -60;
    this.x = sX;
    this.y = this.isP1 ? 25 : this.court.length - 25;
    this.vx = 0;
    this.vy = 0;
    this.state = 'idle';
    this.swingTimer = 0;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;

    // Límites de la pista
    const maxBoundX = this.court.width * 0.65;
    this.x = Math.max(-maxBoundX, Math.min(maxBoundX, this.x));

    if (this.isP1) {
      this.y = Math.max(-40, Math.min(this.court.netY - 35, this.y));
    } else {
      this.y = Math.max(this.court.netY + 35, Math.min(this.court.length + 40, this.y));
    }

    // Gestionar animación de swing
    if (this.swingTimer > 0) {
      this.swingTimer--;
      if (this.swingTimer <= 0) {
        this.state = 'idle';
      }
    } else if (Math.hypot(this.vx, this.vy) > 0.4) {
      this.state = 'run';
    } else {
      this.state = 'idle';
    }
  }

  canHit(ball) {
    if (!ball.inPlay) return false;

    const dx = ball.x - this.x;
    const dy = ball.y - this.y;
    const dist2D = Math.hypot(dx, dy);

    // Debe estar en su mitad de pista o cerca de la red
    const isCorrectSide = this.isP1 ? (ball.y <= this.court.netY + 30) : (ball.y >= this.court.netY - 30);
    const inReach = dist2D <= this.racketReach && ball.z <= 95;

    return isCorrectSide && inReach;
  }

  performSwing(type = 'auto', ball = null) {
    if (this.swingTimer > 0) return false;

    if (type === 'auto' && ball) {
      // Determinar si es derecha o revés según la posición relativa de la pelota
      const isRight = (ball.x > this.x);
      type = this.isP1 ? (isRight ? 'forehand' : 'backhand') : (isRight ? 'backhand' : 'forehand');
      if (ball.z > 65) type = 'smash';
    }

    this.state = (type === 'forehand') ? 'swing_fh' : (type === 'backhand' ? 'swing_bh' : 'smash');
    this.swingTimer = this.swingDuration;
    return true;
  }

  hitBall(ball, targetAimX = 0, isPower = false, audio = null) {
    const isSmash = (this.state === 'smash') || (ball.z > 60);
    const hitter = this.isP1 ? 'p1' : 'p2';

    // Cálculo de velocidad hacia el campo rival
    const targetY = this.isP1 ? (this.court.length - 40) : 40;
    const deltaY = targetY - ball.y;
    const framesToTarget = isSmash ? 24 : (isPower ? 28 : 34);

    const vy = deltaY / framesToTarget;
    const vx = (targetAimX - ball.x) / framesToTarget;
    const vz = isSmash ? 0.8 : (isPower ? 4.5 : 6.0);

    ball.hit(vx, vy, vz, hitter, isSmash);

    if (audio) {
      audio.playHit(isSmash);
    }
    return true;
  }

  draw(screenW, screenH) {
    // 1. Proyección de la Sombra del Jugador
    const shadowPt = this.court.project(this.x, this.y, 0, screenW, screenH);
    const sc = shadowPt.scale;

    noStroke();
    fill(0, 0, 0, 150);
    ellipse(shadowPt.x, shadowPt.y, 34 * sc, 14 * sc);

    // 2. Jugador Pixel-Art / Estilo 3D Arcade
    push();
    translate(shadowPt.x, shadowPt.y);

    const charHeight = 65 * sc;
    const charWidth = 24 * sc;

    // Piernas / Zapatillas
    fill(240);
    const legOffset = (this.state === 'run') ? Math.sin(frameCount * 0.4) * (8 * sc) : 0;
    rect(-10 * sc, -14 * sc + legOffset, 7 * sc, 14 * sc, 2);
    rect(3 * sc, -14 * sc - legOffset, 7 * sc, 14 * sc, 2);

    // Pantalones cortos
    fill(this.shortsColor);
    rect(-12 * sc, -26 * sc, 24 * sc, 14 * sc, 2);

    // Camiseta / Torso
    fill(this.shirtColor);
    rect(-13 * sc, -48 * sc, 26 * sc, 23 * sc, 3);

    // Cabeza
    fill(this.skinColor);
    circle(0, -56 * sc, 16 * sc);

    // Pelo / Cinta de pelo estilo tenista clásico
    fill(this.hairColor);
    arc(0, -58 * sc, 17 * sc, 12 * sc, PI, TWO_PI);
    fill('#ffffff'); // Cinta blanca
    rect(-8 * sc, -58 * sc, 16 * sc, 3 * sc);

    // 3. Raqueta y Brazo con Animación de Swing
    this.drawRacket(sc);

    pop();
  }

  drawRacket(sc) {
    let armAngle = 0.2;
    let racketX = 14 * sc;
    let racketY = -38 * sc;

    if (this.state === 'swing_fh') {
      const progress = 1.0 - (this.swingTimer / this.swingDuration);
      armAngle = map(progress, 0, 1, -1.2, 1.4);
      racketX = 18 * sc * Math.cos(armAngle);
      racketY = -35 * sc - 20 * sc * Math.sin(armAngle);
    } else if (this.state === 'swing_bh') {
      const progress = 1.0 - (this.swingTimer / this.swingDuration);
      armAngle = map(progress, 0, 1, 1.2, -1.4);
      racketX = -18 * sc * Math.cos(armAngle);
      racketY = -35 * sc - 20 * sc * Math.sin(armAngle);
    } else if (this.state === 'smash') {
      racketX = 0;
      racketY = -70 * sc;
    }

    // Brazo
    stroke(this.skinColor);
    strokeWeight(4 * sc);
    line(8 * sc, -42 * sc, racketX, racketY);

    // Mango de Raqueta
    stroke(120);
    strokeWeight(2.5 * sc);
    line(racketX, racketY, racketX + 10 * sc, racketY - 14 * sc);

    // Aro de Raqueta
    stroke(255, 220, 0);
    fill(255, 255, 255, 60);
    ellipse(racketX + 16 * sc, racketY - 22 * sc, 14 * sc, 18 * sc);
  }
}
