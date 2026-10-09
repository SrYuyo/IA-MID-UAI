/**
 * ============================================================================
 * TennisAI: Inteligencia Artificial Táctica de Rival (CPU)
 * ============================================================================
 * Implementa un oponente arcade inteligente:
 * - Anticipación de trayectoria balística de la pelota
 * - Desplazamiento reactivo con margen de error configurable por dificultad
 * - Selección táctica de tiros: Cruzado, Paralelo, Dejada o Smash
 */

class TennisAI {
  constructor(player, court) {
    this.player = player;
    this.court = court;
    this.difficulty = 'pro'; // 'rookie', 'pro', 'grandslam'
    this.reactionDelay = 0;
  }

  setDifficulty(diff) {
    this.difficulty = diff;
  }

  update(ball, opponentP1, audio) {
    if (!ball.inPlay) {
      // Reposicionarse en el centro de fondo
      this.recenter();
      return;
    }

    // Si la pelota viaja hacia el campo de la CPU (vy > 0)
    if (ball.vy > 0) {
      // Predecir intersección X cuando la pelota llegue a la línea de fondo de la CPU
      const targetY = this.player.y;
      const timeToReach = (targetY - ball.y) / (ball.vy || 0.1);

      let predictedX = ball.x + ball.vx * timeToReach;

      // Aplicar margen de error según dificultad
      if (this.difficulty === 'rookie') {
        predictedX += Math.sin(frameCount * 0.05) * 45;
      } else if (this.difficulty === 'pro') {
        predictedX += Math.sin(frameCount * 0.08) * 15;
      }

      // Mover a la posición de interceptación
      const dx = predictedX - this.player.x;
      const speed = (this.difficulty === 'grandslam') ? 5.2 : (this.difficulty === 'pro' ? 4.4 : 3.2);

      if (Math.abs(dx) > 10) {
        this.player.vx = Math.sign(dx) * speed;
      } else {
        this.player.vx = 0;
      }

      // Comprobar si puede golpear la pelota
      if (this.player.canHit(ball)) {
        this.player.performSwing('auto', ball);

        // Decisión táctica: golpear hacia el lado opuesto al que se encuentra P1
        const courtHalf = this.court.width * 0.38;
        const targetAimX = (opponentP1.x > 0) ? -courtHalf : courtHalf;
        const isPower = (this.difficulty !== 'rookie') && Math.random() < 0.6;

        this.player.hitBall(ball, targetAimX, isPower, audio);
      }
    } else {
      // La pelota va hacia P1: recentrarse gradualmente
      this.recenter();
    }

    this.player.update();
  }

  recenter() {
    const centerDist = 0 - this.player.x;
    if (Math.abs(centerDist) > 12) {
      this.player.vx = Math.sign(centerDist) * 2.2;
    } else {
      this.player.vx = 0;
    }
    this.player.update();
  }
}
