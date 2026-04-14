import * as strudel from '@strudel/core';
import { audioContext } from '@strudel/webaudio';

const PATTERN_CODE = `
setHz(60)
s("sawtooth~40 <tri~20>" )
.filter("lowpass 120")
.gain(0.08)
.start()
`;

export class MusicSystem {
  constructor() {
    this.isInitialized = false;
    this.isPlaying = false;
    this.volume = parseFloat(localStorage.getItem('avoidrain-volume')) || 0.5;
    this.isMuted = localStorage.getItem('avoidrain-mute') === 'true';
    this.pattern = null;
  }

  async init() {
    if (this.isInitialized) return;
    
    try {
      await audioContext.resume();
      this.isInitialized = true;
      console.log('MusicSystem initialized');
    } catch (err) {
      console.error('MusicSystem init failed:', err);
    }
  }

  async start() {
    if (!this.isInitialized) {
      await this.init();
    }
    
    if (this.isPlaying) return;
    
    try {
      this.pattern = strudel.decode(PATTERN_CODE);
      this.pattern.start();
      this.isPlaying = true;
      console.log('MusicSystem started');
    } catch (err) {
      console.error('MusicSystem start failed:', err);
    }
  }

  stop() {
    if (!this.isPlaying) return;
    
    if (this.pattern) {
      this.pattern.stop();
    }
    this.isPlaying = false;
    console.log('MusicSystem stopped');
  }

  setVolume(value) {
    this.volume = Math.max(0, Math.min(1, value));
    localStorage.setItem('avoidrain-volume', this.volume.toString());
    this.applyVolume();
  }

  applyVolume() {
    const effectiveVolume = this.isMuted ? 0 : this.volume;
    if (this.pattern && this.pattern.setGain) {
      this.pattern.setGain(effectiveVolume);
    }
  }

  setMuted(muted) {
    this.isMuted = muted;
    localStorage.setItem('avoidrain-mute', this.isMuted.toString());
    this.applyVolume();
  }

  dispose() {
    this.stop();
    this.isInitialized = false;
  }
}

export const musicSystem = new MusicSystem();
