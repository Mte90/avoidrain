export const GameState = {
  MENU: 'MENU',
  PLAYING: 'PLAYING',
  GAME_OVER: 'GAME_OVER',
};

export class GameStateMachine {
  constructor() {
    this.state = GameState.MENU;
    this.onStateChange = null;
    this.wetMeter = 0;
  }

  getState() {
    return this.state;
  }

  setState(newState) {
    if (this.state === newState) return;

    const oldState = this.state;
    this.state = newState;

    if (this.onStateChange) {
      this.onStateChange(newState, oldState);
    }
  }

  updateWetMeter(delta) {
    if (this.state !== GameState.PLAYING) return;

    this.wetMeter = Math.min(this.wetMeter + delta * 10, 100);

    if (this.wetMeter >= 100) {
      this.setState(GameState.GAME_OVER);
    }
  }

  getWetMeter() {
    return this.wetMeter;
  }

  reset() {
    this.wetMeter = 0;
    this.setState(GameState.MENU);
  }

  startPlaying() {
    this.wetMeter = 0;
    this.setState(GameState.PLAYING);
  }
}
