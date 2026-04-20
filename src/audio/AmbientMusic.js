/**
 * Ambient Music Generator - Web Audio API
 * Creates procedural lo-fi ambient music with rhythm and atmosphere
 * Uses oscillator nodes for pads, melody, bass, and percussion layers
 * Inspired by city pop and lo-fi hip hop aesthetics
 */

export class AmbientMusic {
  constructor() {
    this.audioContext = null;
    this.isPlaying = false;
    this.oscillators = [];
    this.gainNodes = [];
    this.filters = [];
    this.scheduleTime = 0;
    this.nextNoteTime = 0;
    this.current16thNote = 0;
    this.tempo = 70;
    this.baseTempo = 70;
    this.lookahead = 25.0;
    this.scheduleAheadTime = 0.1;
    this.timerID = null;
    this.difficultyManager = null;
    this.padGainNodes = [];
    this.bassGainNode = null;
    
    this.pentatonicScale = [220, 261.63, 293.66, 329.63, 392, 440, 523.25];
    this.chordNotes = {
      Am: [220, 261.63, 329.63],
      Dm: [146.83, 174.61, 220],
      E7: [164.81, 207.65, 246.94, 293.66],
      G: [196.00, 246.94, 293.66],
      Cmaj7: [261.63, 329.63, 392.00, 493.88],
      F: [174.61, 220.00, 261.63]
    };
    this.currentChord = 'Am';
    
    this.lastKickTime = 0;
    this.lastSnareTime = 0;
    this.lastHihatTime = 0;
    
    this.volume = parseFloat(localStorage.getItem('avoidrain-volume')) || 0.4;
    this.isMuted = localStorage.getItem('avoidrain-mute') === 'true';
  }

  setDifficultyManager(dm) {
    this.difficultyManager = dm;
  }

  async init() {
    if (this.audioContext) return;
    
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    await this.audioContext.resume();
    this.scheduleTime = this.audioContext.currentTime;
    this.nextNoteTime = this.scheduleTime;
    console.log('AmbientMusic initialized');
  }

  async start() {
    if (!this.audioContext) {
      await this.init();
    }
    
    if (this.isPlaying) return;
    
    this.isPlaying = true;
    this.current16thNote = 0;
    this.nextNoteTime = this.audioContext.currentTime + 0.05;
    
    // Start scheduler
    this.scheduler();
    
    // Start ambient layers
    this.createAmbientPad();
    this.createBassDrone();
    this.createPercussion();
    
    console.log('AmbientMusic started');
  }

  scheduler() {
    // Schedule notes ahead of time
    while (this.nextNoteTime < this.audioContext.currentTime + this.scheduleAheadTime) {
      this.scheduleNote(this.current16thNote, this.nextNoteTime);
      this.advanceNote();
    }
    
    this.timerID = setTimeout(() => this.scheduler(), this.lookahead);
  }

  advanceNote() {
    const secondsPerBeat = 60.0 / this.tempo;
    const secondsPer16th = secondsPerBeat / 4;
    this.nextNoteTime += secondsPer16th;
    this.current16thNote = (this.current16thNote + 1) % 16;
  }

  scheduleNote(beatNumber, time) {
    // Simple 4/4 drum pattern
    if (beatNumber % 4 === 0) {
      // Kick on beats 0, 4, 8, 12
      this.playKick(time);
    }
    if (beatNumber === 4 || beatNumber === 12) {
      // Snare on 2 and 4
      this.playSnare(time);
    }
    // Hi-hats on every 16th
    this.playHiHat(time, beatNumber % 2 === 0);
    
    // Random melody notes
    if (Math.random() > 0.7 && beatNumber % 4 === 0) {
      this.playMelodyNote(time);
    }
    
    // Chord changes every 4 beats
    if (beatNumber % 16 === 0) {
      this.updateChord(time);
    }
  }

  playKick(time) {
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
    
    gain.gain.setValueAtTime(0.25 * this.volume, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);
    
    osc.connect(gain);
    gain.connect(this.audioContext.destination);
    
    osc.start(time);
    osc.stop(time + 0.5);
    
    this.oscillators.push(osc);
    this.gainNodes.push(gain);
  }

  playSnare(time) {
    const noiseBuffer = this.createNoiseBuffer();
    const noise = this.audioContext.createBufferSource();
    noise.buffer = noiseBuffer;
    
    const noiseFilter = this.audioContext.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 1000;
    
    const noiseGain = this.audioContext.createGain();
    noiseGain.gain.setValueAtTime(0.15 * this.volume, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
    
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.audioContext.destination);
    
    noise.start(time);
    noise.stop(time + 0.2);
    
    this.oscillators.push(noise);
    this.gainNodes.push(noiseGain);
  }

  playHiHat(time, open) {
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(8000, time);
    
    filter.type = 'highpass';
    filter.frequency.value = 5000;
    
    gain.gain.setValueAtTime(0.03 * this.volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + (open ? 0.1 : 0.05));
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.audioContext.destination);
    
    osc.start(time);
    osc.stop(time + 0.1);
    
    this.oscillators.push(osc);
    this.gainNodes.push(gain);
  }

  playMelodyNote(time) {
    const freq = this.pentatonicScale[Math.floor(Math.random() * this.pentatonicScale.length)];
    
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    
    osc.type = 'sine';
    osc.frequency.value = freq;
    
    filter.type = 'lowpass';
    filter.frequency.value = 2000;
    
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.04 * this.volume, time + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 1.5);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.audioContext.destination);
    
    osc.start(time);
    osc.stop(time + 2);
    
    this.oscillators.push(osc);
    this.gainNodes.push(gain);
  }

  updateChord(time) {
    const chords = ['Am', 'Dm', 'E7', 'G'];
    const chord = chords[Math.floor(Math.random() * chords.length)];
    const notes = this.chordNotes[chord];
    
    notes.forEach((freq, i) => {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      
      osc.type = 'triangle';
      osc.frequency.value = freq;
      
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.02 * this.volume, time + 0.1);
      gain.gain.setValueAtTime(0.02 * this.volume, time + 1.5);
      gain.gain.linearRampToValueAtTime(0, time + 2);
      
      osc.connect(gain);
      gain.connect(this.audioContext.destination);
      
      osc.start(time);
      osc.stop(time + 2);
      
      this.oscillators.push(osc);
      this.gainNodes.push(gain);
    });
  }

  createNoiseBuffer() {
    const bufferSize = this.audioContext.sampleRate * 2; // 2 seconds
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    return buffer;
  }

  createAmbientPad() {
    const frequencies = [220, 261.63, 329.63, 392, 523.25];
    
    frequencies.forEach((freq, i) => {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      const filter = this.audioContext.createBiquadFilter();
      const panner = this.audioContext.createStereoPanner();
      
      osc.type = i < 2 ? 'triangle' : 'sine';
      osc.frequency.value = freq;
      
      filter.type = 'lowpass';
      filter.frequency.value = 800;
      filter.Q.value = 2;
      
      panner.pan.value = (i % 2 === 0) ? -0.3 : 0.3;
      
      const baseGain = 0.025 * this.volume;
      gain.gain.value = this.isMuted ? 0 : baseGain;
      
      osc.connect(filter);
      filter.connect(panner);
      panner.connect(gain);
      gain.connect(this.audioContext.destination);
      
      osc.start();
      this.oscillators.push(osc);
      this.gainNodes.push(gain);
      this.filters.push(filter);
      this.padGainNodes.push({ gain, filter, panner, baseFreq: freq });
    });
  }

  createBassDrone() {
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    
    osc.type = 'sawtooth';
    osc.frequency.value = 55; // A1
    
    filter.type = 'lowpass';
    filter.frequency.value = 150;
    filter.Q.value = 1;
    
    gain.gain.value = this.isMuted ? 0 : 0.05 * this.volume;
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.audioContext.destination);
    
    osc.start();
    this.oscillators.push(osc);
    this.gainNodes.push(gain);
    this.filters.push(filter);
  }

  createPercussion() {
    // Subtle percussion layer
    setInterval(() => {
      if (!this.isPlaying) return;
      
      if (Math.random() > 0.8) {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200 + Math.random() * 100, this.audioContext.currentTime);
        
        gain.gain.setValueAtTime(0.02 * this.volume, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.1);
        
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        
        osc.start();
        osc.stop(this.audioContext.currentTime + 0.1);
        
        this.oscillators.push(osc);
        this.gainNodes.push(gain);
      }
    }, 500);
  }

  update() {
    if (!this.difficultyManager || !this.isPlaying || !this.audioContext) return;
    
    const intensity = this.difficultyManager.getRainIntensity();
    const targetTempo = this.baseTempo + (intensity * 40);
    this.tempo += (targetTempo - this.tempo) * 0.05;
    
    this.padGainNodes.forEach((pad, i) => {
      const filterMod = 400 + (intensity * 1200);
      const baseGain = 0.02 + (intensity * 0.03);
      
      if (pad.filter && pad.filter.frequency) {
        pad.filter.frequency.setTargetAtTime(filterMod, this.audioContext.currentTime, 0.5);
      }
      if (pad.gain && pad.gain.gain) {
        const targetGain = this.isMuted ? 0 : baseGain * this.volume;
        pad.gain.gain.setTargetAtTime(targetGain, this.audioContext.currentTime, 0.3);
      }
      if (pad.panner && pad.panner.pan) {
        const panValue = Math.sin(this.audioContext.currentTime * 0.5 + i) * 0.4;
        pad.panner.pan.setTargetAtTime(panValue, this.audioContext.currentTime, 0.5);
      }
    });
  }

  setVolume(value) {
    this.volume = Math.max(0, Math.min(1, value));
    localStorage.setItem('avoidrain-volume', this.volume.toString());
    this.applyVolume();
  }

  applyVolume() {
    const effectiveVolume = this.isMuted ? 0 : this.volume;
    
    this.gainNodes.forEach((gain) => {
      try {
        gain.gain.setTargetAtTime(
          gain.gain.value * effectiveVolume / (this.volume || 0.4),
          this.audioContext.currentTime,
          0.1
        );
      } catch (e) { /* ignore */ }
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

  stop() {
    if (!this.isPlaying) return;
    
    clearTimeout(this.timerID);
    
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
    this.filters = [];
    this.isPlaying = false;
    console.log('AmbientMusic stopped');
  }
}

export const ambientMusic = new AmbientMusic();
