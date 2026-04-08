// Difficulty configuration - all curves span 60 seconds
const DIFFICULTY_RAMP_TIME = 60; // seconds to reach max difficulty

// Starting values (at t=0)
const INITIAL_RAIN_INTENSITY = 0.5;
const INITIAL_BALCONY_CHANCE = 0.95;
const INITIAL_CAR_SPAWN_CHANCE = 0.2;
const INITIAL_PLAYER_SPEED = 5.0; // meters per second

// Target values (at t=60s)
const MAX_RAIN_INTENSITY = 1.0;
const MIN_BALCONY_CHANCE = 0.6;
const MAX_CAR_SPAWN_CHANCE = 0.6;
const MAX_PLAYER_SPEED = 8.0; // 60% faster

/**
 * Linear interpolation between start and end values
 */
function lerp(start, end, t) {
  return start + (end - start) * t;
}

export class DifficultyManager {
  constructor() {
    this.gameTime = 0; // Total game time in seconds
    this.difficulty = 0; // 0.0 to 1.0 normalized difficulty
  }

  /**
   * Update difficulty based on elapsed game time
   * @param {number} delta - Time since last update in seconds
   */
  update(delta) {
    this.gameTime += delta;
    
    // Normalize time to 0-1 range (0 at start, 1 at DIFFICULTY_RAMP_TIME)
    this.difficulty = Math.min(this.gameTime / DIFFICULTY_RAMP_TIME, 1.0);
  }

  /**
   * Get current rain intensity (0.5 → 1.0 over 60s)
   * @returns {number} Rain intensity between 0.5 and 1.0
   */
  getRainIntensity() {
    return lerp(INITIAL_RAIN_INTENSITY, MAX_RAIN_INTENSITY, this.difficulty);
  }

  /**
   * Get balcony spawn chance (70% → 30% over 60s)
   * Lower = harder (fewer cover spots)
   * @returns {number} Probability between 0.3 and 0.7
   */
  getBalconyChance() {
    // Decreasing: start high (easy), end low (harder)
    return lerp(INITIAL_BALCONY_CHANCE, MIN_BALCONY_CHANCE, this.difficulty);
  }

  /**
   * Get car spawn chance (20% → 60% over 60s)
   * Higher = harder (more obstacles)
   * @returns {number} Probability between 0.2 and 0.6
   */
  getCarSpawnChance() {
    return lerp(INITIAL_CAR_SPAWN_CHANCE, MAX_CAR_SPAWN_CHANCE, this.difficulty);
  }

  /**
   * Get current difficulty multiplier (0.0 to 1.0)
   * Useful for other systems that want smooth difficulty scaling
   * @returns {number} Normalized difficulty
   */
  getDifficultyMultiplier() {
    return this.difficulty;
  }

  /**
   * Reset difficulty to initial state (for new game)
   */
  reset() {
    this.gameTime = 0;
    this.difficulty = 0;
  }

  /**
   * Get current player speed (5.0 → 8.0 m/s over 60s)
   */
  getPlayerSpeed() {
    return lerp(INITIAL_PLAYER_SPEED, MAX_PLAYER_SPEED, this.difficulty);
  }

  /**
   * Get game time in seconds
   */
  getGameTime() {
    return this.gameTime;
  }
}