/**
 * ============================================================================
 * PongAI: Inteligencia Artificial para el Jugador 2 (Pala Derecha)
 * ============================================================================
 * Modela el comportamiento de la CPU con 3 niveles ajustables:
 * - 'easy': Tiempo de reacción pausado y errores de centrado
 * - 'arcade': Comportamiento clásico del circuito TTL original de 1972
 * - 'master': Predicción balística con cálculo de rebotes en paredes
 */

class PongAI {
  constructor(difficulty = 'arcade') {
    this.difficulty = difficulty;
    this.reactionSpeed = 0.14;
    this.errorMargin = 0;
  }

  setDifficulty(diff) {
    this.difficulty = diff;
  }

  computePaddleY(game) {
    const ball = { x: game.ballX, y: game.ballY, vx: game.ballVx, vy: game.ballVy };
    const currentY = game.p2Y;
    const paddleH = game.paddleH;
    const paddleCenter = currentY + paddleH / 2;

    let targetY = game.h / 2 - paddleH / 2;

    if (this.difficulty === 'easy') {
      // Reacciona solo cuando la pelota está en su mitad (x > w * 0.45)
      if (ball.vx > 0 && ball.x > game.w * 0.35) {
        targetY = ball.y - paddleH / 2 + Math.sin(frameCount * 0.08) * 35;
      }
      return currentY + (targetY - currentY) * 0.12;

    } else if (this.difficulty === 'arcade') {
      // Circuito arcade clásico: Sigue la pelota cuando viene hacia él con velocidad límite
      if (ball.vx > 0) {
        targetY = ball.y - paddleH / 2;
      } else {
        targetY = game.h / 2 - paddleH / 2; // Vuelve al centro suavemente
      }
      const maxStep = 6.2;
      const diff = targetY - currentY;
      return currentY + Math.sign(diff) * Math.min(Math.abs(diff), maxStep);

    } else { // 'master'
      // Predicción balística exacta con rebotes en paredes
      if (ball.vx > 0) {
        let simX = ball.x;
        let simY = ball.y;
        let simVy = ball.vy;
        const targetX = game.w - 32 - game.paddleW;

        while (simX < targetX) {
          simX += ball.vx;
          simY += simVy;
          if (simY <= 0) {
            simY = 0;
            simVy = Math.abs(simVy);
          } else if (simY >= game.h - game.ballSize) {
            simY = game.h - game.ballSize;
            simVy = -Math.abs(simVy);
          }
        }
        targetY = simY - paddleH / 2;
      } else {
        targetY = game.h / 2 - paddleH / 2;
      }

      const maxStep = 9.0;
      const diff = targetY - currentY;
      return currentY + Math.sign(diff) * Math.min(Math.abs(diff), maxStep);
    }
  }
}
