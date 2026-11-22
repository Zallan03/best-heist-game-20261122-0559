'use strict';

/* Midnight Vault — all sound is synthesised with WebAudio.
   No audio files are shipped: every effect is an oscillator or a
   short burst of filtered noise, built when the player first acts. */

const SoundBank = {
  ctx: null,
  master: null,
  muted: false,
  alarmOsc: null,
  alarmGain: null,

  ensure() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
    } catch (err) {
      this.ctx = null;
    }
  },

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.5;
    return this.muted;
  },

  /* One short oscillator note. `when` delays the start in seconds. */
  tone(freq, duration, type, volume, when) {
    if (!this.ctx || this.muted) return;
    const start = this.ctx.currentTime + (when || 0);
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(volume || 0.2, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(start);
    osc.stop(start + duration + 0.05);
  },

  /* A short burst of white noise through a low-pass filter. */
  noiseBurst(duration, volume, filterFreq) {
    if (!this.ctx || this.muted) return;
    const start = this.ctx.currentTime;
    const length = Math.max(1, Math.floor(this.ctx.sampleRate * duration));
    const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq || 1200;
    const gain = this.ctx.createGain();
    gain.gain.value = volume || 0.25;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    source.start(start);
  },

  click() { this.tone(660, 0.07, 'triangle', 0.18); },

  pickupGem() {
    this.tone(880, 0.1, 'sine', 0.22);
    this.tone(1318, 0.16, 'sine', 0.2, 0.08);
  },

  pickupSapphire() {
    this.tone(523, 0.12, 'triangle', 0.22);
    this.tone(659, 0.12, 'triangle', 0.22, 0.1);
    this.tone(784, 0.12, 'triangle', 0.22, 0.2);
    this.tone(1046, 0.24, 'triangle', 0.24, 0.3);
  },

  coinToss() {
    this.tone(2093, 0.06, 'square', 0.08);
    this.tone(1567, 0.1, 'square', 0.1, 0.28);
  },

  smokePuff() { this.noiseBurst(0.5, 0.3, 900); },

  /* A two-note sting the first moment a guard or camera spots you. */
  spottedSting() {
    this.tone(233, 0.18, 'sawtooth', 0.2);
    this.tone(175, 0.3, 'sawtooth', 0.2, 0.14);
  },

  /* A soft tick while the alarm is hot, so tension is audible. */
  alarmTick() { this.tone(1174, 0.05, 'square', 0.07); },

  winFanfare() {
    const notes = [523, 659, 784, 1046, 1318];
    notes.forEach((freq, i) => this.tone(freq, 0.22, 'triangle', 0.22, i * 0.12));
  },

  loseDrone() {
    this.tone(220, 0.5, 'sawtooth', 0.18);
    this.tone(165, 0.8, 'sawtooth', 0.18, 0.3);
  },
};
