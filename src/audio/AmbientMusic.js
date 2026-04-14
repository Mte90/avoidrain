/**
 * Ambient Music Generator - Web Audio API
 * Creates procedural lo-fi ambient music without external dependencies
 * Uses oscillator nodes for pads, melody, and bass layers
 */

export class AmbientMusic {
  constructor() {
    this.audioContext = null;
    this.isPlaying = false;
    this.oscillators = [];
    this.gainNodes = [];
    this.volume = parseFloat(localStorage.getItem('avoidrain-volume')) || 0.5;
    this.isMuted = localStorage.getItem('avoidrain-mute') === 'true';
  }

  async init() {
    if (this.audioContext) return;
    
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    await this.audioContext.resume();
    console.log('AmbientMusic initialized');
  }

  async start() {
    if (!this.audioContext) {
      await this.init();
    }
    
    if (this.isPlaying) return;
    
    this.createAmbientPad();
    this.createBassDrone();
    this.createMelodyLoop();
    
    this.isPlaying = true;
    console.log('AmbientMusic started');
  }

  stop() {
    if (!this.isPlaying) return;
    
    // Stop and disconnect all oscillators
    this.oscillators.forEach(osc => {
      try {
        osc.stop();
        osc.disconnect();
      } catch (e) { /* ignore */ }
    });
    
    this.gainNodes.forEach(gain => {
      try {
        gain.disconnect();
      } catch (e) { /* ignore */ }
    });
    
    this.oscillators = [];
    this.gainNodes = [];
    this.isPlaying = false;
    console.log('AmbientMusic stopped');
  }

  createAmbientPad() {
    // Triangle wave pad for ambient atmosphere
    const frequencies = [220, 277, 330, 440]; // A3, C#4, E4, A4 (A major chord)
    
    frequencies.forEach((freq, index) => {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      const filter = this.audioContext.createBiquadFilter();
      
      osc.type = 'triangle';
      osc.frequency.value = freq;
      
      filter.type = 'lowpass';
      filter.frequency.value = 800;
      
      const baseGain = index === 0 ? 0.08 : 0.04;
      gain.gain.value = this.isMuted ? 0 : baseGain * this.volume;
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.audioContext.destination);
      
      osc.start();
      this.oscillators.push(osc);
      this.gainNodes.push(gain);
    });
  }

  createBassDrone() {
    // Sub-bass drone
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    
    osc.type = 'sine';
    osc.frequency.value = 110; // A2
    
    filter.type = 'lowpass';
    filter.frequency.value = 200;
    
    gain.gain.value = this.isMuted ? 0 : 0.06 * this.volume;
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.audioContext.destination);
    
    osc.start();
    this.oscillators.push(osc);
    this.gainNodes.push(gain);
  }

  createMelodyLoop() {
    // Simple pentatonic melody (A minor pentatonic)
    const melodyFreqs = [220, 261.63, 293.66, 349.23, 392]; // A4, C5, D5, F5, G5
    let noteIndex = 0;
    
    const playNote = () => {
      if (!this.isPlaying) return;
      
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      
      osc.type = 'sine';
      osc.frequency.value = melodyFreqs[noteIndex];
      
      // Envelope: attack, decay, sustain
      gain.gain.setValueAtTime(0, this.audioContext.currentTime);
      gain.gain.linearRampToValueAtTime(0.03 * this.volume, this.audioContext.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01 * this.volume, this.audioContext.currentTime + 0.8);
      
      osc.connect(gain);
      gain.connect(this.audioContext.destination);
      
      osc.start();
      osc.stop(this.audioContext.currentTime + 1);
      
      noteIndex = (noteIndex + 1) % melodyFreqs.length;
      
      // Random timing between 1.5-3 seconds
      const nextNoteDelay = 1500 + Math.random() * 1500;
      setTimeout(playNote, nextNoteDelay);
    };
    
    playNote();
  }

  setVolume(value) {
    this.volume = Math.max(0, Math.min(1, value));
    localStorage.setItem('avoidrain-volume', this.volume.toString());
    this.applyVolume();
  }

  applyVolume() {
    const effectiveVolume = this.isMuted ? 0 : this.volume;
    
    this.gainNodes.forEach((gain, index) => {
      if (index < this.oscillators.length) {
        try {
          gain.gain.setTargetAtTime(
            gain.gain.value * effectiveVolume,
            this.audioContext.currentTime,
            0.1
          );
        } catch (e) { /* ignore */ }
      }
    });
  }

  setMuted(muted) {
    this.isMuted = muted;
    localStorage.setItem('avoidrain-mute', this.isMuted.toString());
    this.applyVolume();
  }

  dispose() {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

export const ambientMusic = new AmbientMusic();
