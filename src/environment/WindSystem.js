import { gameEvents } from '../core/EventBus.js';

const MIN_WIND_ANGLE = -0.3;
const MAX_WIND_ANGLE = 0.3;
const MIN_CHANGE_INTERVAL = 10;
const MAX_CHANGE_INTERVAL = 20;
const LERP_SPEED = 0.5;

export class WindSystem {
  constructor() {
    this.windAngle = 0;
    this.windStrength = 1.0;
    this.targetAngle = 0;
    this.timer = 0;
    this.nextChangeTime = this.getRandomInterval();
    this.lastEmittedAngle = 0;
  }

  getRandomInterval() {
    return MIN_CHANGE_INTERVAL + Math.random() * (MAX_CHANGE_INTERVAL - MIN_CHANGE_INTERVAL);
  }

  getRandomAngle() {
    return MIN_WIND_ANGLE + Math.random() * (MAX_WIND_ANGLE - MIN_WIND_ANGLE);
  }

  update(delta, difficulty = 1.0) {
    this.timer += delta;

    // Change target wind angle every 10-20 seconds
    if (this.timer >= this.nextChangeTime) {
      this.targetAngle = this.getRandomAngle() * difficulty;
      this.timer = 0;
      this.nextChangeTime = this.getRandomInterval();
    }

    // Lerp current wind angle toward target
    const prevAngle = this.windAngle;
    this.windAngle += (this.targetAngle - this.windAngle) * LERP_SPEED * delta;

    // Clamp to max ±0.6 radians as specified
    this.windAngle = Math.max(-0.6, Math.min(0.6, this.windAngle));

    // Emit event when angle changes significantly (more than 0.01 radians)
    if (Math.abs(this.windAngle - this.lastEmittedAngle) > 0.01) {
      gameEvents.publish('wind:changed', {
        windAngle: this.windAngle,
        windStrength: this.windStrength,
        difficulty: difficulty
      });
      this.lastEmittedAngle = this.windAngle;
    }
  }

  getWindAngle() {
    return this.windAngle;
  }

  getWindStrength() {
    return this.windStrength;
  }

  reset() {
    this.windAngle = 0;
    this.targetAngle = 0;
    this.timer = 0;
    this.nextChangeTime = this.getRandomInterval();
    this.lastEmittedAngle = 0;
  }
}