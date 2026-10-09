/**
 * ============================================================================
 * TennisBall: Física 3D y Proyección de Pelota y Sombra Arcade
 * ============================================================================
 * Modela la pelota con gravedad, botes en la pista, rozamiento y colisión con la red:
 * - Posición mundo: (x, y, z) donde z es la altura sobre la pista
 * - Proyección de sombra en el suelo para lectura de profundidad clásica de Virtua Tennis
 */

class TennisBall {
  constructor(court) {
    this.court = court;
    this.reset();
    this.gravity = -0.38;
    this.airResistance = 0.994;
    this.trail = [];
  }

  reset() {
    this.x = 0;
    this.y = 40;
    this.z = 25;
    this.vx = 0;
    this.vy = 0;
    this.vz = 0;
    this.lastHitter = null; // 'p1' o 'p2'
    this.bounceCountP1 = 0;
    this.bounceCountP2 = 0;
    this.firstBounce = null;
    this.inPlay = false;
    this.isSmash = false;
    this.trail = [];
  }

  serveToss(serverX, serverY) {
    this.reset();
    this.x = serverX;
    this.y = serverY;
    this.z = 28;
    this.vx = 0;
    this.vy = 0;
    this.vz = 7.5; // Lanzamiento hacia arriba
    this.inPlay = true;
  }

  hit(vx, vy, vz, hitter, isSmash = false) {
    this.vx = vx;
    this.vy = vy;
    this.vz = vz;
    this.lastHitter = hitter;
    this.isSmash = isSmash;
    this.bounceCountP1 = 0;
    this.bounceCountP2 = 0;
    this.firstBounce = null;
    this.inPlay = true;
  }

  update(audio) {
    if (!this.inPlay) return null;

    const prevY = this.y;

    // Guardar estela para tiros potentes
    if (this.isSmash || Math.hypot(this.vx, this.vy) > 13) {
      this.trail.push({ x: this.x, y: this.y, z: this.z });
      if (this.trail.length > 8) this.trail.shift();
    } else {
      this.trail = [];
    }

    // Integración física
    this.x += this.vx;
    this.y += this.vy;
    this.z += this.vz;
    this.vz += this.gravity;

    this.vx *= this.airResistance;
    this.vy *= this.airResistance;

    let event = null;

    // 1. Colisión con la Red
    const crossedNet = (prevY < this.court.netY && this.y >= this.court.netY) ||
                       (prevY > this.court.netY && this.y <= this.court.netY);

    if (crossedNet && this.z < this.court.netHeight) {
      // Impacto contra la red
      this.vy = -this.vy * 0.25;
      this.vz = Math.min(this.vz, 1.5);
      this.vx *= 0.5;
      if (audio) audio.playHit(false);
      event = { type: 'net_hit' };
    }

    // 2. Bote en el suelo (Z <= 0)
    if (this.z <= 0) {
      this.z = 0;
      if (Math.abs(this.vz) > 0.8) {
        this.vz = -this.vz * 0.74; // Coeficiente de restitución
        this.vx *= 0.92;
        this.vy *= 0.92;

        if (audio) audio.playBounce();

        // Registrar bote en campo P1 (Y < netY) o campo P2 (Y >= netY)
        const inP1Court = this.y < this.court.netY;
        if (inP1Court) {
          this.bounceCountP1++;
        } else {
          this.bounceCountP2++;
        }

        if (!this.firstBounce) {
          this.firstBounce = {
            x: this.x,
            y: this.y,
            side: inP1Court ? 'p1' : 'p2',
            isInside: this.court.isInsideSingles(this.x, this.y)
          };
          event = { type: 'bounce', first: true, details: this.firstBounce };
        } else {
          event = { type: 'bounce', first: false, side: inP1Court ? 'p1' : 'p2' };
        }
      } else {
        this.vz = 0;
      }
    }

    return event;
  }

  draw(screenW, screenH) {
    if (!this.inPlay && this.z <= 0) return;

    // 1. Dibujar estela supersónica si es smash
    if (this.trail.length > 1) {
      noFill();
      stroke(255, 230, 0, 160);
      strokeWeight(3);
      beginShape();
      for (let t of this.trail) {
        const pt = this.court.project(t.x, t.y, t.z, screenW, screenH);
        vertex(pt.x, pt.y);
      }
      endShape();
    }

    // 2. Proyección de la Sombra de la Pelota en el Suelo
    const shadowPt = this.court.project(this.x, this.y, 0, screenW, screenH);
    const shadowScale = shadowPt.scale;
    const heightFactor = Math.max(0.2, 1.0 - this.z / 180);

    noStroke();
    fill(0, 0, 0, 140 * heightFactor);
    ellipse(shadowPt.x, shadowPt.y, 16 * shadowScale * heightFactor, 8 * shadowScale * heightFactor);

    // 3. Proyección de la Pelota 3D en el Espacio
    const ballPt = this.court.project(this.x, this.y, this.z, screenW, screenH);
    const ballScale = ballPt.scale;
    const ballRadius = Math.max(4, 9 * ballScale);

    // Resplandor si es Smash
    if (this.isSmash) {
      fill(255, 60, 60, 150);
      circle(ballPt.x, ballPt.y, ballRadius * 2.2);
    }

    // Pelota de Tenis (Amarillo Optic Neon)
    fill(225, 255, 0);
    stroke(170, 210, 0);
    strokeWeight(1.2);
    circle(ballPt.x, ballPt.y, ballRadius * 2);

    // Costura blanca de la pelota
    noFill();
    stroke(255, 255, 255, 220);
    strokeWeight(1);
    arc(ballPt.x, ballPt.y, ballRadius * 1.5, ballRadius * 1.5, -0.4, 1.2);
  }
}
