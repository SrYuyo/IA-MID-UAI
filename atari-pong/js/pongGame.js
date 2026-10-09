/**
 * ============================================================================
 * PongGame: Motor Físico y Reglas del PONG Original de Atari (1972)
 * ============================================================================
 * Modela:
 * - Pala izquierda (P1) y Pala derecha (P2)
 * - Rebotes segmentados originales de Al Alcorn (ángulos según zona de impacto)
 * - Pelota cuadrada con aceleración progresiva por peloteo
 * - Red central de segmentos punteados
 * - Puntuación clásica hasta 11 puntos
 */

class PongGame {
  constructor(audio) {
    this.audio = audio;
    this.w = 800;
    this.h = 560;

    // Palas
    this.paddleW = 14;
    this.paddleH = 75;
    this.p1Y = this.h / 2 - this.paddleH / 2;
    this.p2Y = this.h / 2 - this.paddleH / 2;
    this.paddleSpeed = 7.5;

    // Pelota cuadrada
    this.ballSize = 12;
    this.ballX = this.w / 2;
    this.ballY = this.h / 2;
    this.ballVx = 0;
    this.ballVy = 0;
    this.baseSpeed = 5.8;
    this.maxSpeed = 13.5;
    this.currentSpeed = this.baseSpeed;

    // Marcador
    this.p1Score = 0;
    this.p2Score = 0;
    this.maxScore = 11;
    this.rallyCount = 0;

    // Estados
    this.state = 'SERVE'; // 'SERVE', 'PLAY', 'POINT', 'GAME_OVER'
    this.serveTimer = 60; // frames
    this.server = 1; // 1 (hacia P1) o -1 (hacia P2)
    this.winner = null;
  }

  resize(w, h) {
    this.w = w;
    this.h = h;
    this.p1Y = Math.min(this.h - this.paddleH, Math.max(0, this.p1Y));
    this.p2Y = Math.min(this.h - this.paddleH, Math.max(0, this.p2Y));
  }

  resetMatch() {
    this.p1Score = 0;
    this.p2Score = 0;
    this.winner = null;
    this.server = Math.random() < 0.5 ? 1 : -1;
    this.startServe();
  }

  startServe() {
    this.state = 'SERVE';
    this.serveTimer = 50;
    this.ballX = this.w / 2;
    this.ballY = this.h / 2;
    this.ballVx = 0;
    this.ballVy = 0;
    this.currentSpeed = this.baseSpeed;
    this.rallyCount = 0;
  }

  launchBall() {
    this.state = 'PLAY';
    this.currentSpeed = this.baseSpeed;
    const angle = (Math.random() - 0.5) * 0.7; // Ángulo inicial suave
    this.ballVx = this.server * this.currentSpeed * Math.cos(angle);
    this.ballVy = this.currentSpeed * Math.sin(angle);
  }

  update(p1InputY, p2InputY) {
    // 1. Mover Palas con suavizado (Interpolar hacia la posición objetivo)
    const targetP1 = Math.max(0, Math.min(this.h - this.paddleH, p1InputY));
    const targetP2 = Math.max(0, Math.min(this.h - this.paddleH, p2InputY));

    this.p1Y += (targetP1 - this.p1Y) * 0.45;
    this.p2Y += (targetP2 - this.p2Y) * 0.45;

    // 2. Gestionar Estado de Saque
    if (this.state === 'SERVE') {
      this.serveTimer--;
      if (this.serveTimer <= 0) {
        this.launchBall();
      }
      return;
    }

    if (this.state !== 'PLAY') return;

    // 3. Mover Pelota
    this.ballX += this.ballVx;
    this.ballY += this.ballVy;

    // 4. Rebote en Paredes Superior e Inferior
    if (this.ballY <= 0) {
      this.ballY = 0;
      this.ballVy = Math.abs(this.ballVy);
      if (this.audio) this.audio.wallBounce();
    } else if (this.ballY >= this.h - this.ballSize) {
      this.ballY = this.h - this.ballSize;
      this.ballVy = -Math.abs(this.ballVy);
      if (this.audio) this.audio.wallBounce();
    }

    // 5. Colisión con Pala Izquierda (P1)
    const p1X = 32;
    if (this.ballVx < 0 &&
        this.ballX <= p1X + this.paddleW &&
        this.ballX + this.ballSize >= p1X &&
        this.ballY + this.ballSize >= this.p1Y &&
        this.ballY <= this.p1Y + this.paddleH) {
      this.handlePaddleBounce(this.p1Y, 1);
    }

    // 6. Colisión con Pala Derecha (P2)
    const p2X = this.w - 32 - this.paddleW;
    if (this.ballVx > 0 &&
        this.ballX + this.ballSize >= p2X &&
        this.ballX <= p2X + this.paddleW &&
        this.ballY + this.ballSize >= this.p2Y &&
        this.ballY <= this.p2Y + this.paddleH) {
      this.handlePaddleBounce(this.p2Y, -1);
    }

    // 7. Punto Anotado (Pelota sale de la pantalla)
    if (this.ballX < -20) {
      // Punto para P2
      this.p2Score++;
      this.handlePointScored('p2');
    } else if (this.ballX > this.w + 20) {
      // Punto para P1
      this.p1Score++;
      this.handlePointScored('p1');
    }
  }

  /**
   * Cálculo de Rebote Segmentado del PONG de 1972
   * Divide la pala en 8 zonas para calcular el ángulo de deflexión
   */
  handlePaddleBounce(paddleY, direction) {
    if (this.audio) this.audio.paddleHit();
    this.rallyCount++;

    // Punto de impacto relativo (-1.0 arriba, 0.0 centro, +1.0 abajo)
    const paddleCenter = paddleY + this.paddleH / 2;
    const ballCenter = this.ballY + this.ballSize / 2;
    const offset = (ballCenter - paddleCenter) / (this.paddleH / 2);
    const clampedOffset = Math.max(-1.0, Math.min(1.0, offset));

    // Aumentar velocidad progresivamente en cada raquetazo
    this.currentSpeed = Math.min(this.maxSpeed, this.currentSpeed + 0.35);

    // Ángulo de rebote máximo: ~55 grados
    const maxBounceAngle = Math.PI * 0.32;
    const bounceAngle = clampedOffset * maxBounceAngle;

    this.ballVx = direction * this.currentSpeed * Math.cos(bounceAngle);
    this.ballVy = this.currentSpeed * Math.sin(bounceAngle);
  }

  handlePointScored(winner) {
    if (this.audio) this.audio.scorePoint();

    if (this.p1Score >= this.maxScore) {
      this.state = 'GAME_OVER';
      this.winner = 'JUGADOR 1';
    } else if (this.p2Score >= this.maxScore) {
      this.state = 'GAME_OVER';
      this.winner = 'JUGADOR 2 / CPU';
    } else {
      this.server = (winner === 'p1') ? -1 : 1; // Saca quien perdió el punto
      this.startServe();
    }
  }

  draw() {
    background(0); // Negro CRT absoluto de 1972

    // 1. Red Central Discontinua (Segmentos rectangulares idénticos al original)
    fill(245);
    noStroke();
    const segmentH = 12;
    const segmentGap = 16;
    const netX = this.w / 2 - 2;

    for (let y = 8; y < this.h; y += segmentH + segmentGap) {
      rect(netX, y, 4, segmentH);
    }

    // 2. Marcador Numérico Retro PONG (Dígitos de 7 segmentos pixelados)
    this.drawScoreDigit(this.p1Score, this.w / 2 - 120, 40);
    this.drawScoreDigit(this.p2Score, this.w / 2 + 80, 40);

    // 3. Dibujar Palas (Rectángulos blancos nítidos)
    const p1X = 32;
    const p2X = this.w - 32 - this.paddleW;

    rect(p1X, this.p1Y, this.paddleW, this.paddleH);
    rect(p2X, this.p2Y, this.paddleW, this.paddleH);

    // 4. Dibujar Pelota Cuadrada
    if (this.state === 'PLAY' || (this.state === 'SERVE' && frameCount % 20 < 14)) {
      rect(this.ballX, this.ballY, this.ballSize, this.ballSize);
    }

    // 5. Cartel de Fin de Partida
    if (this.state === 'GAME_OVER') {
      textAlign(CENTER, CENTER);
      textSize(24);
      textFont('Press Start 2P');
      fill(255, 230, 0);
      text(`${this.winner} GANA!`, this.w / 2, this.h / 2 - 20);
      textSize(12);
      fill(200);
      text("PRESIONA [R] O [ESPACIO] PARA REINICIAR", this.w / 2, this.h / 2 + 25);
    }
  }

  /**
   * Renderiza números estilo PONG 1972
   */
  drawScoreDigit(num, x, y) {
    const s = 5; // Escala de píxeles
    const font = [
      // 0
      [1,1,1, 1,0,1, 1,0,1, 1,0,1, 1,1,1],
      // 1
      [0,1,0, 0,1,0, 0,1,0, 0,1,0, 0,1,0],
      // 2
      [1,1,1, 0,0,1, 1,1,1, 1,0,0, 1,1,1],
      // 3
      [1,1,1, 0,0,1, 1,1,1, 0,0,1, 1,1,1],
      // 4
      [1,0,1, 1,0,1, 1,1,1, 0,0,1, 0,0,1],
      // 5
      [1,1,1, 1,0,0, 1,1,1, 0,0,1, 1,1,1],
      // 6
      [1,1,1, 1,0,0, 1,1,1, 1,0,1, 1,1,1],
      // 7
      [1,1,1, 0,0,1, 0,0,1, 0,0,1, 0,0,1],
      // 8
      [1,1,1, 1,0,1, 1,1,1, 1,0,1, 1,1,1],
      // 9
      [1,1,1, 1,0,1, 1,1,1, 0,0,1, 1,1,1],
      // 10
      [1,0,1,1,1, 1,0,1,0,1, 1,0,1,0,1, 1,0,1,0,1, 1,0,1,1,1],
      // 11
      [1,0,1, 1,0,1, 1,0,1, 1,0,1, 1,0,1]
    ];

    const glyph = font[Math.min(11, num)] || font[0];
    const cols = num >= 10 ? (num === 11 ? 3 : 5) : 3;

    fill(245);
    noStroke();
    for (let i = 0; i < glyph.length; i++) {
      if (glyph[i] === 1) {
        const c = i % cols;
        const r = Math.floor(i / cols);
        rect(x + c * s * 2, y + r * s * 2, s * 2, s * 2);
      }
    }
  }
}
