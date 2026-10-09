/**
 * ============================================================================
 * PongAudio: Sintetizador de Sonidos Originales de Atari PONG (1972)
 * ============================================================================
 * Reproduce las frecuencias exactas generadas por los circuitos TTL del arcade original:
 * - Impacto en la Pala (Paddle hit): Onda cuadrada a 490 Hz (18 ms)
 * - Rebote en la Pared (Wall bounce): Onda cuadrada a 226 Hz (18 ms)
 * - Punto Anotado / Fallo (Score/Miss): Onda cuadrada grave a 115 Hz (260 ms)
 */

class PongAudio {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.initContext();
  }

  initContext() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      this.ctx = new AudioContext();
    }
  }

  ensureContext() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  playBeep(frequency, duration) {
    if (this.isMuted || !this.ctx) return;
    this.ensureContext();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square'; // El circuito de 1972 producía ondas cuadradas puras
    osc.frequency.setValueAtTime(frequency, t);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.setValueAtTime(0.3, t + duration * 0.85);
    gain.gain.linearRampToValueAtTime(0.01, t + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + duration);
  }

  /**
   * Impacto de la pelota en la pala (Beep agudo clásico)
   */
  paddleHit() {
    this.playBeep(490, 0.024);
  }

  /**
   * Rebote en borde superior o inferior (Boop medio)
   */
  wallBounce() {
    this.playBeep(226, 0.022);
  }

  /**
   * Pelota perdida / Punto anotado (Zumbido grave)
   */
  scorePoint() {
    this.playBeep(115, 0.28);
  }
}
