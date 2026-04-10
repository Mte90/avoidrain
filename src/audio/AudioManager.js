/**
 * AudioManager - Procedural audio system using Web Audio API
 * No audio files required - all sounds are synthesized
 */
export class AudioManager {
  constructor() {
    this.audioContext = null;
    this.masterGain = null;
    this.rainNode = null;
    this.rainGain = null;
    this.isMuted = localStorage.getItem('avoidrain-mute') === 'true';
    this.volume = 0.5;
    this.isInitialized = false;
    this.footstepInterval = null;
  }

  /**
   * Initialize the audio context on first user interaction
   */
  init() {
    if (this.isInitialized) return;

    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.audioContext.createGain();
    this.masterGain.connect(this.audioContext.destination);
    this.masterGain.gain.value = this.volume;

    this.isInitialized = true;

    // Set up user interaction handler to resume AudioContext
    this.setupUserInteractionHandler();
  }

  /**
   * Resume AudioContext on first user interaction (required by browsers)
   */
  setupUserInteractionHandler() {
    const resumeContext = async () => {
      if (this.audioContext && this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
    };

    document.addEventListener('click', resumeContext, { once: true });
    document.addEventListener('keydown', resumeContext, { once: true });
    document.addEventListener('touchstart', resumeContext, { once: true });
  }

  /**
   * Create a white noise buffer
   */
  createNoiseBuffer(duration = 1) {
    const sampleRate = this.audioContext.sampleRate;
    const bufferSize = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    return buffer;
  }

  /**
   * Play rain ambient sound - filtered white noise
   */
  playRain() {
    if (!this.isInitialized || this.isMuted) return;
    if (this.rainNode) return; // Already playing

    // Create noise source
    const noiseBuffer = this.createNoiseBuffer(2);
    this.rainNode = this.audioContext.createBufferSource();
    this.rainNode.buffer = noiseBuffer;
    this.rainNode.loop = true;

    // Low-pass filter for rain-like sound
    const lowpass = this.audioContext.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 800;
    lowpass.Q.value = 1;

    // High-pass to remove rumble
    const highpass = this.audioContext.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 200;

    // Gain for rain volume
    this.rainGain = this.audioContext.createGain();
    this.rainGain.gain.value = 0.15;

    // Connect: noise -> lowpass -> highpass -> gain -> master
    this.rainNode.connect(lowpass);
    lowpass.connect(highpass);
    highpass.connect(this.rainGain);
    this.rainGain.connect(this.masterGain);

    this.rainNode.start();
  }

  /**
   * Stop rain ambient sound
   */
  stopRain() {
    if (this.rainNode) {
      this.rainNode.stop();
      this.rainNode.disconnect();
      this.rainNode = null;
    }
    if (this.rainGain) {
      this.rainGain.disconnect();
      this.rainGain = null;
    }
  }

  /**
   * Play footstep sound - short noise burst
   */
  playFootstep() {
    if (!this.isInitialized || this.isMuted) return;

    // Create short noise burst
    const noiseBuffer = this.createNoiseBuffer(0.05);
    const noise = this.audioContext.createBufferSource();
    noise.buffer = noiseBuffer;

    // Band-pass filter for footstep character
    const bandpass = this.audioContext.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 300;
    bandpass.Q.value = 2;

    // Quick envelope
    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.08);

    // Connect: noise -> bandpass -> gain -> master
    noise.connect(bandpass);
    bandpass.connect(gain);
    gain.connect(this.masterGain);

    noise.start();
    noise.stop(this.audioContext.currentTime + 0.1);
  }

  /**
   * Start automatic footstep sounds (every 0.3s)
   */
  startFootsteps() {
    if (this.footstepInterval) return;
    this.footstepInterval = setInterval(() => this.playFootstep(), 300);
  }

  /**
   * Stop automatic footstep sounds
   */
  stopFootsteps() {
    if (this.footstepInterval) {
      clearInterval(this.footstepInterval);
      this.footstepInterval = null;
    }
  }

  /**
   * Play splash sound - short noise burst for wet meter increase
   */
  playSplash() {
    if (!this.isInitialized || this.isMuted) return;

    // Create noise burst
    const noiseBuffer = this.createNoiseBuffer(0.1);
    const noise = this.audioContext.createBufferSource();
    noise.buffer = noiseBuffer;

    // Low-pass filter for splash
    const lowpass = this.audioContext.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 1200;

    // Envelope with quick attack, medium decay
    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0, this.audioContext.currentTime);
    gain.gain.linearRampToValueAtTime(0.4, this.audioContext.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);

    // Connect: noise -> lowpass -> gain -> master
    noise.connect(lowpass);
    lowpass.connect(gain);
    gain.connect(this.masterGain);

    noise.start();
    noise.stop(this.audioContext.currentTime + 0.2);
  }

  /**
   * Play car horn sound - sawtooth oscillator 400Hz, 0.3s
   */
  playHorn() {
    if (!this.isInitialized || this.isMuted) return;

    // Create sawtooth oscillator
    const oscillator = this.audioContext.createOscillator();
    oscillator.type = 'sawtooth';
    oscillator.frequency.value = 400;

    // Slight frequency modulation for character
    const lfo = this.audioContext.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 20;
    const lfoGain = this.audioContext.createGain();
    lfoGain.gain.value = 30;
    lfo.connect(lfoGain);
    lfoGain.connect(oscillator.frequency);

    // Envelope
    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gain.gain.setValueAtTime(0.3, this.audioContext.currentTime + 0.25);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

    // Connect: oscillator -> lfo -> gain -> master
    oscillator.connect(gain);
    gain.connect(this.masterGain);

    lfo.start();
    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + 0.35);
    lfo.stop(this.audioContext.currentTime + 0.35);
  }

  /**
   * Play thunder sound - low frequency oscillator with noise for rumble
   * Uses 50-100Hz oscillator + filtered noise for realistic thunder
   */
  playThunder() {
    if (!this.isInitialized || this.isMuted) return;

    const now = this.audioContext.currentTime;
    const duration = 1.5 + Math.random() * 1.5; // 1.5-3 seconds

    // Low frequency oscillator for the "boom"
    const oscillator = this.audioContext.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(80 + Math.random() * 40, now); // 80-120Hz
    oscillator.frequency.exponentialRampToValueAtTime(30, now + duration);

    // Secondary oscillator for rumble
    const oscillator2 = this.audioContext.createOscillator();
    oscillator2.type = 'triangle';
    oscillator2.frequency.setValueAtTime(50, now);
    oscillator2.frequency.exponentialRampToValueAtTime(20, now + duration);

    // Noise for the "crackle" texture
    const noiseBuffer = this.createNoiseBuffer(duration);
    const noise = this.audioContext.createBufferSource();
    noise.buffer = noiseBuffer;

    // Low-pass filter for noise rumble
    const noiseLowpass = this.audioContext.createBiquadFilter();
    noiseLowpass.type = 'lowpass';
    noiseLowpass.frequency.value = 200;
    noiseLowpass.Q.value = 0.5;

    // High-pass to remove DC offset
    const noiseHighpass = this.audioContext.createBiquadFilter();
    noiseHighpass.type = 'highpass';
    noiseHighpass.frequency.value = 20;

    // Envelope for oscillators - quick attack, slow decay
    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.5, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    const gain2 = this.audioContext.createGain();
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.linearRampToValueAtTime(0.3, now + 0.02);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + duration);

    // Envelope for noise
    const noiseGain = this.audioContext.createGain();
    noiseGain.gain.setValueAtTime(0, now);
    noiseGain.gain.linearRampToValueAtTime(0.4, now + 0.03);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + duration * 0.8);

    // Connect oscillators to their gains then to master
    oscillator.connect(gain);
    gain.connect(this.masterGain);

    oscillator2.connect(gain2);
    gain2.connect(this.masterGain);

    // Connect noise through filters then to master
    noise.connect(noiseLowpass);
    noiseLowpass.connect(noiseHighpass);
    noiseHighpass.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    // Start and stop
    oscillator.start(now);
    oscillator2.start(now);
    noise.start(now);

    oscillator.stop(now + duration + 0.1);
    oscillator2.stop(now + duration + 0.1);
    noise.stop(now + duration + 0.1);
  }

  /**
   * Play game over sound - descending tone 800Hz → 200Hz
   */
  playGameOver() {
    if (!this.isInitialized || this.isMuted) return;

    const now = this.audioContext.currentTime;
    const duration = 0.8;

    // Create oscillator for descending tone
    const oscillator = this.audioContext.createOscillator();
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(800, now);
    oscillator.frequency.exponentialRampToValueAtTime(200, now + duration);

    // Secondary oscillator for richness
    const oscillator2 = this.audioContext.createOscillator();
    oscillator2.type = 'sine';
    oscillator2.frequency.setValueAtTime(400, now);
    oscillator2.frequency.exponentialRampToValueAtTime(100, now + duration);

    // Envelope
    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.setValueAtTime(0.4, now + duration * 0.7);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    const gain2 = this.audioContext.createGain();
    gain2.gain.setValueAtTime(0.2, now);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + duration);

    // Connect oscillators to their gains then to master
    oscillator.connect(gain);
    gain.connect(this.masterGain);
    oscillator2.connect(gain2);
    gain2.connect(this.masterGain);

    oscillator.start();
    oscillator2.start();
    oscillator.stop(now + duration + 0.1);
    oscillator2.stop(now + duration + 0.1);
  }

  /**
   * Set master volume (0-1)
   */
  setVolume(value) {
    this.volume = Math.max(0, Math.min(1, value));
    if (this.masterGain) {
      this.masterGain.gain.value = this.isMuted ? 0 : this.volume;
    }
  }

  /**
   * Get current volume
   */
  getVolume() {
    return this.volume;
  }

  /**
   * Toggle mute state
   */
  toggleMute() {
    this.isMuted = !this.isMuted;
    localStorage.setItem('avoidrain-mute', this.isMuted);
    if (this.masterGain) {
      this.masterGain.gain.value = this.isMuted ? 0 : this.volume;
    }
    return this.isMuted;
  }

  /**
   * Set muted state directly
   */
  setMuted(muted) {
    this.isMuted = muted;
    if (this.masterGain) {
      this.masterGain.gain.value = this.isMuted ? 0 : this.volume;
    }
  }

  /**
   * Check if audio is muted
   */
  getMuted() {
    return this.isMuted;
  }

  /**
   * Clean up audio resources
   */
  dispose() {
    this.stopRain();
    this.stopFootsteps();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.isInitialized = false;
  }
}

// Singleton instance
export const audioManager = new AudioManager();