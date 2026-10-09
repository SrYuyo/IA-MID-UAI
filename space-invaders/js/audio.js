/**
 * ============================================================================
 * InvadersAudio: Sintetizador de Sonidos Originales de Space Invaders (1978)
 * ============================================================================
 * Sintetiza mediante Web Audio API:
 * - Marcha hipnótica de 4 notas de los invasores (se acelera a menor conteo)
 * - Disparo del cañón láser
 * - Explosión de alienígena
 * - Explosión del jugador
 * - Ovni / Platillo volante misterioso
 */

class InvadersAudio {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.marchNotes = [130.81, 123.47, 116.54, 110.00]; // Do, Si, Sib, La en graves
    this.currentMarchNote = 0;
    this.ufoOsc = null;
    this.ufoGain = null;
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
    if (this.isMuted && this.ufoGain) {
      this.ufoGain.gain.setValueAtTime(0, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  /**
   * Nota de marcha alienígena (1 de 4 notas cíclicas)
   */
  playMarchStep() {
    if (this.isMuted || !this.ctx) return;
    this.ensureContext();

    const freq = this.marchNotes[this.currentMarchNote];
    this.currentMarchNote = (this.currentMarchNote + 1) % this.marchNotes.length;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, t);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.09);
  }

  /**
   * Disparo del láser del cañón
   */
  playShoot() {
    if (this.isMuted || !this.ctx) return;
    this.ensureContext();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.exponentialRampToValueAtTime(220, t + 0.12);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.13);
  }

  /**
   * Explosión de un alienígena impactado
   */
  playInvaderKilled() {
    if (this.isMuted || !this.ctx) return;
    this.ensureContext();

    const t = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.15;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(900, t);
    filter.frequency.exponentialRampToValueAtTime(200, t + 0.15);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(t);
    noise.stop(t + 0.16);
  }

  /**
   * Explosión del cañón del jugador
   */
  playPlayerExplosion() {
    if (this.isMuted || !this.ctx) return;
    this.ensureContext();

    const t = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.45;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, t);
    filter.frequency.linearRampToValueAtTime(80, t + 0.45);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.45);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(t);
    noise.stop(t + 0.46);
  }

  /**
   * Sirena oscilante del OVNI / Platillo Misterioso
   */
  startUfoSound() {
    if (this.isMuted || !this.ctx || this.ufoOsc) return;
    this.ensureContext();

    this.ufoOsc = this.ctx.createOscillator();
    this.ufoGain = this.ctx.createGain();

    this.ufoOsc.type = 'sine';
    this.ufoOsc.frequency.setValueAtTime(580, this.ctx.currentTime);

    // LFO para oscilar el tono
    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(5.5, this.ctx.currentTime);
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(70, this.ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(this.ufoOsc.frequency);
    lfo.start();

    this.ufoGain.gain.setValueAtTime(0.25, this.ctx.currentTime);

    this.ufoOsc.connect(this.ufoGain);
    this.ufoGain.connect(this.ctx.destination);

    this.ufoOsc.start();
  }

  stopUfoSound() {
    if (this.ufoOsc) {
      try {
        this.ufoOsc.stop();
        this.ufoOsc.disconnect();
      } catch (e) {}
      this.ufoOsc = null;
      this.ufoGain = null;
    }
  }
}
