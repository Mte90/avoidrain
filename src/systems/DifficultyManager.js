// Difficulty configuration - all curves span 60 seconds
const DIFFICULTY_RAMP_TIME = 60;

// Phase constants for difficulty waves
const PHASE = {
  CALM: 'CALM',
  BUILDING: 'BUILDING',
  STORM: 'STORM',
  FADING: 'FADING'
};

// Phase duration ranges in seconds [min, max]
const PHASE_DURATIONS = {
  [PHASE.CALM]: [5, 8],
  [PHASE.BUILDING]: [8, 15],
  [PHASE.STORM]: [5, 8],
  [PHASE.FADING]: [8, 12]
};

// Phase transition table: current phase -> next phase
const PHASE_TRANSITIONS = {
  [PHASE.CALM]: PHASE.BUILDING,
  [PHASE.BUILDING]: PHASE.STORM,
  [PHASE.STORM]: PHASE.FADING,
  [PHASE.FADING]: PHASE.CALM
};

// Starting values (at t=0)
const INITIAL_RAIN_INTENSITY = 0.5;
const INITIAL_BALCONY_CHANCE = 0.95;
const INITIAL_CAR_SPAWN_CHANCE = 0.5;
const INITIAL_PLAYER_SPEED = 5.0;

// Target values (at t=60s)
const MAX_RAIN_INTENSITY = 1.0;
const MIN_BALCONY_CHANCE = 0.6;
const MAX_CAR_SPAWN_CHANCE = 0.9;
const MAX_PLAYER_SPEED = 8.0;

function lerp(start, end, t) {
  return start + (end - start) * t;
}

export class DifficultyManager {
  constructor() {
    this.gameTime = 0;
    this.difficulty = 0;
    
    // Phase system
    this.phase = PHASE.CALM;
    this.phaseTimer = 0;
    this.phaseDuration = this._randDur(PHASE_DURATIONS[PHASE.CALM]);
    this.phaseMultiplier = 1.0;
    this.targetPhaseMultiplier = 1.0;
  }

  _randDur(r) {
    return r[0] + Math.random() * (r[1] - r[0]);
  }

  update(delta) {
    this.gameTime += delta;
    this.difficulty = Math.min(this.gameTime / DIFFICULTY_RAMP_TIME, 1.0);
    
    // Phase system
    this.phaseTimer += delta;
    
    // Lerp phase multiplier toward target
    this.phaseMultiplier += (this.targetPhaseMultiplier - this.phaseMultiplier) * delta * 0.5;
    
    // Transition to next phase when duration reached
    if (this.phaseTimer >= this.phaseDuration) {
      const nextPhase = PHASE_TRANSITIONS[this.phase];
      this.phase = nextPhase;
      this.phaseTimer = 0;
      this.phaseDuration = this._randDur(PHASE_DURATIONS[nextPhase]);
      
      // Set target multiplier based on phase
      if (nextPhase === PHASE.STORM) {
        this.targetPhaseMultiplier = 1.0 + this.difficulty * 0.2;
      } else if (nextPhase === PHASE.CALM) {
        this.targetPhaseMultiplier = 0.3;
      } else {
        this.targetPhaseMultiplier = 1.0;
      }
    }
  }

  getRainIntensity() {
    const base = lerp(INITIAL_RAIN_INTENSITY, MAX_RAIN_INTENSITY, this.difficulty);
    return base * this.phaseMultiplier;
  }

  getBalconyChance() {
    const base = lerp(INITIAL_BALCONY_CHANCE, MIN_BALCONY_CHANCE, this.difficulty);
    // More balconies during storm (more cover), fewer during calm
    return base * this.phaseMultiplier;
  }

  getCarSpawnChance() {
    const base = lerp(INITIAL_CAR_SPAWN_CHANCE, MAX_CAR_SPAWN_CHANCE, this.difficulty);
    return base * this.phaseMultiplier;
  }

  getDifficultyMultiplier() {
    return this.difficulty;
  }

  getPhase() {
    return this.phase;
  }

  isStorm() {
    return this.phase === PHASE.STORM;
  }

  isCalm() {
    return this.phase === PHASE.CALM;
  }

  reset() {
    this.gameTime = 0;
    this.difficulty = 0;
    this.phase = PHASE.CALM;
    this.phaseTimer = 0;
    this.phaseDuration = this._randDur(PHASE_DURATIONS[PHASE.CALM]);
    this.phaseMultiplier = 1.0;
    this.targetPhaseMultiplier = 1.0;
  }

  getPlayerSpeed() {
    return lerp(INITIAL_PLAYER_SPEED, MAX_PLAYER_SPEED, this.difficulty);
  }

  getGameTime() {
    return this.gameTime;
  }
}