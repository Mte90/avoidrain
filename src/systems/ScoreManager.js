export class ScoreManager {
  constructor() {
    this.score = 0;
    this.timeSurvived = 0;
    this.distanceTraveled = 0;
    this.dryBonus = 0;
    this.dryTimeAccumulator = 0;
    this.penalty = 0;
  }

  update(delta, isUnderShelter) {
    this.timeSurvived += delta;

    if (isUnderShelter) {
      this.dryTimeAccumulator += delta;
      this.dryBonus = this.dryTimeAccumulator * 10;
    } else {
      this.dryTimeAccumulator = 0;
      this.dryBonus = 0;
    }

    this.score = this.timeSurvived + this.distanceTraveled + this.dryBonus + this.penalty;
  }

  setDistance(distance) {
    this.distanceTraveled = distance;
    this.score = this.timeSurvived + this.distanceTraveled + this.dryBonus + this.penalty;
  }

  getScore() {
    return Math.floor(Math.max(0, this.score));
  }

  getScoreBreakdown() {
    return {
      timeSurvived: Math.floor(this.timeSurvived),
      distanceTraveled: Math.floor(this.distanceTraveled),
      dryBonus: Math.floor(this.dryBonus),
      total: Math.floor(this.score)
    };
  }

  reset() {
    this.score = 0;
    this.timeSurvived = 0;
    this.timeSurvived = 0;
    this.distanceTraveled = 0;
    this.dryBonus = 0;
    this.dryTimeAccumulator = 0;
    this.penalty = 0;
  }

  addPenalty(points) {
    this.penalty -= points;
    this.score = this.timeSurvived + this.distanceTraveled + this.dryBonus + this.penalty;
  }
}
