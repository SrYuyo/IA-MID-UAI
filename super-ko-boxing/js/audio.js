/**
 * Audio Synthesizer using Web Audio API (Zero external assets needed)
 * Super K.O. Boxing Web Edition
 */
class SoundFX {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.crowdGain = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        if (this.ctx.state === 'suspended') {
          this.ctx.resume();
        }
      }
    }
  }

  ensureContext() {
    if (!this.ctx) {
      this.init();
    } else if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx && !this.isMuted;
  }

  // Boxing Ring Bell: "DING DING!"
  playBell() {
    if (!this.ensureContext()) return;
    const now = this.ctx.currentTime;
    
    // First ring
    this._ringSingleBell(now);
    // Second ring after 0.28s
    this._ringSingleBell(now + 0.28);
  }

  _ringSingleBell(time) {
    const freqs = [840, 1120, 1680, 2520];
    const decay = 1.2;

    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);

      const amp = (0.25 / (idx + 1));
      gain.gain.setValueAtTime(amp, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + decay);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(time);
      osc.stop(time + decay);
    });
  }

  // Punch Swoosh / Whoosh
  playWhoosh() {
    if (!this.ensureContext()) return;
    const now = this.ctx.currentTime;
    const dur = 0.18;

    const bufferSize = this.ctx.sampleRate * dur;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(400, now);
    filter.frequency.exponentialRampToValueAtTime(1400, now + dur * 0.5);
    filter.frequency.exponentialRampToValueAtTime(300, now + dur);
    filter.Q.value = 3.5;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.25, now + dur * 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(now);
    noise.stop(now + dur);
  }

  // Punch Impact
  playHit(isHeavy = false, isSuper = false) {
    if (!this.ensureContext()) return;
    const now = this.ctx.currentTime;
    const dur = isSuper ? 0.6 : (isHeavy ? 0.35 : 0.22);

    // Punch transient body
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = isSuper ? 'sawtooth' : 'triangle';
    const startFreq = isSuper ? 260 : (isHeavy ? 180 : 130);
    const endFreq = isSuper ? 30 : (isHeavy ? 45 : 55);

    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + dur);

    const maxGain = isSuper ? 0.65 : (isHeavy ? 0.45 : 0.3);
    gain.gain.setValueAtTime(maxGain, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    // Crunch noise layer
    const noiseDur = isSuper ? 0.25 : 0.08;
    const noiseBuf = this.ctx.createBuffer(1, this.ctx.sampleRate * noiseDur, this.ctx.sampleRate);
    const data = noiseBuf.getChannelData(0);
    for (let i = 0; i < noiseBuf.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.04));
    }
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuf;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(isSuper ? 3500 : 2000, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(isSuper ? 0.4 : 0.25, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + noiseDur);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + dur);
    noiseSource.start(now);
    noiseSource.stop(now + noiseDur);
  }

  // Block Clank
  playBlock() {
    if (!this.ensureContext()) return;
    const now = this.ctx.currentTime;
    const dur = 0.12;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + dur);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + dur);
  }

  // Telegraph Warning Beep (Opponent preparing heavy punch)
  playTelegraph() {
    if (!this.ensureContext()) return;
    const now = this.ctx.currentTime;
    const dur = 0.15;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.setValueAtTime(1100, now + 0.07);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + dur);
  }

  // Dizzy Stars / Cartoon Chirp
  playDizzy() {
    if (!this.ensureContext()) return;
    const now = this.ctx.currentTime;
    const dur = 0.8;

    const osc = this.ctx.createOscillator();
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(950, now);

    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(9, now); // 9 Hz wobble

    lfoGain.gain.setValueAtTime(240, now);
    lfo.connect(osc.frequency);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    lfo.start(now);
    osc.start(now);
    lfo.stop(now + dur);
    osc.stop(now + dur);
  }

  // Crowd Roar / Knockdown Cheer
  playCheer() {
    if (!this.ensureContext()) return;
    const now = this.ctx.currentTime;
    const dur = 2.0;

    const bufferSize = this.ctx.sampleRate * dur;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, now);
    filter.frequency.linearRampToValueAtTime(1400, now + 0.4);
    filter.frequency.exponentialRampToValueAtTime(600, now + dur);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.35, now + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(now);
    noise.stop(now + dur);
  }

  // Super Meter Ready sound
  playSuperReady() {
    if (!this.ensureContext()) return;
    const now = this.ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    freqs.forEach((f, i) => {
      const t = now + i * 0.08;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, t);
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.25);
    });
  }

  // Referee Count Beep (1, 2, 3...)
  playCountBeep(num) {
    if (!this.ensureContext()) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    const baseFreq = 440 + num * 35;
    osc.frequency.setValueAtTime(baseFreq, now);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  }
}
