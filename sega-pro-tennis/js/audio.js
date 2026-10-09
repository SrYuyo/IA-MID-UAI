/**
 * ============================================================================
 * SegaTennisAudio: Sintetizador de Sonido Retro Arcade (Web Audio API)
 * ============================================================================
 * Genera efectos sonoros 100% sintetizados en tiempo real:
 * - Raquetazo estándar y Smash con resonancia
 * - Bote de la pelota en la pista
 * - Aplausos y ovación del público
 * - Fanfarria arcade de punto y voz de árbitro/juez de silla
 */

class SegaTennisAudio {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.synth = window.speechSynthesis;
    this.initAudioContext();
  }

  initAudioContext() {
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

  /**
   * Sonido de impacto de raqueta (Thwack clásico de tenis)
   */
  playHit(isSmash = false) {
    if (this.isMuted || !this.ctx) return;
    this.ensureContext();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = isSmash ? 'sawtooth' : 'triangle';
    const baseFreq = isSmash ? 320 : 210;
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.exponentialRampToValueAtTime(70, t + (isSmash ? 0.16 : 0.09));

    gain.gain.setValueAtTime(isSmash ? 0.9 : 0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + (isSmash ? 0.18 : 0.11));

    // Ruido blanco de impacto de cordaje
    const bufferSize = this.ctx.sampleRate * (isSmash ? 0.08 : 0.04);
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(isSmash ? 0.5 : 0.3, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, t + (isSmash ? 0.08 : 0.04));

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    noise.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + (isSmash ? 0.18 : 0.11));
    noise.start(t);
    noise.stop(t + (isSmash ? 0.08 : 0.04));
  }

  /**
   * Bote en la pista (Pop grave sordo)
   */
  playBounce() {
    if (this.isMuted || !this.ctx) return;
    this.ensureContext();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.07);

    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.07);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.08);
  }

  /**
   * Ovación del público en las gradas
   */
  playCrowdCheer() {
    if (this.isMuted || !this.ctx) return;
    this.ensureContext();

    const duration = 1.4;
    const bufferSize = this.ctx.sampleRate * duration;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.4;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, this.ctx.currentTime);
    filter.Q.setValueAtTime(1.2, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    const t = this.ctx.currentTime;
    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.45, t + 0.35);
    gain.gain.exponentialRampToValueAtTime(0.01, t + duration);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    whiteNoise.start(t);
    whiteNoise.stop(t + duration);
  }

  /**
   * Fanfarria retro estilo arcade SEGA
   */
  playArcadeFanfare(type = 'point') {
    if (this.isMuted || !this.ctx) return;
    this.ensureContext();

    const notes = type === 'game' ? [523.25, 659.25, 783.99, 1046.50] : [440, 554.37, 659.25];
    const duration = 0.12;

    notes.forEach((freq, idx) => {
      const t = this.ctx.currentTime + idx * duration;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + duration + 0.05);
    });
  }

  /**
   * Locución del árbitro (Voz sintetizada)
   */
  callUmpire(phrase) {
    if (this.isMuted || !this.synth) return;
    try {
      this.synth.cancel();
      const utter = new SpeechSynthesisUtterance(phrase);
      utter.lang = 'en-US';
      utter.rate = 1.15;
      utter.pitch = 0.95;
      utter.volume = 0.8;
      this.synth.speak(utter);
    } catch (e) {
      console.warn("Speech synthesis unavailable:", e);
    }
  }
}
