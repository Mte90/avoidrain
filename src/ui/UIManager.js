/**
 * UIManager - Manages HTML UI overlay for the game
 * Handles wet meter, timer, score, and game state menus
 */

export class UIManager {
  constructor() {
    this.elements = {};
    this.isInitialized = false;
  }

  /**
   * Initialize UI by caching DOM element references
   */
  init() {
    this.elements = {
      wetMeterBar: document.getElementById('wet-meter-bar'),
      wetMeterText: document.getElementById('wet-meter-text'),
      timer: document.getElementById('timer'),
      score: document.getElementById('score'),
      menuScreen: document.getElementById('menu-screen'),
      gameOverScreen: document.getElementById('game-over-screen'),
      gameOverScore: document.getElementById('game-over-score'),
    };

    // Validate all required elements exist
    const requiredElements = [
      'wetMeterBar',
      'wetMeterText',
      'timer',
      'score',
      'menuScreen',
      'gameOverScreen',
      'gameOverScore',
    ];

    for (const key of requiredElements) {
      if (!this.elements[key]) {
        console.error(`UIManager: Missing required element #${key}`);
      }
    }

    this.isInitialized = true;
  }

  /**
   * Update UI based on game state
   * @param {number} wetMeter - Wet meter value (0-100)
   * @param {number} score - Current score
   * @param {number} time - Time survived in seconds
   * @param {string} gameState - Current game state (MENU, PLAYING, GAME_OVER)
   */
  update(wetMeter, score, time, gameState) {
    if (!this.isInitialized) {
      this.init();
    }

    // Update wet meter
    this.updateWetMeter(wetMeter);

    // Update timer (format as MM:SS)
    this.updateTimer(time);

    // Update score
    this.updateScore(score);

    // Update visibility based on game state
    this.updateGameState(gameState);
  }

  /**
   * Update wet meter display
   * @param {number} value - Wet meter value (0-100)
   */
  updateWetMeter(value) {
    if (!this.elements.wetMeterBar || !this.elements.wetMeterText) return;

    // Clamp value to 0-100
    const clampedValue = Math.max(0, Math.min(100, value));

    // Update progress bar width
    this.elements.wetMeterBar.style.width = `${clampedValue}%`;

    // Update text display
    this.elements.wetMeterText.textContent = `${Math.floor(clampedValue)}%`;

    // Update color based on value (green -> yellow -> red)
    if (clampedValue < 50) {
      this.elements.wetMeterBar.style.backgroundColor = '#4ade80'; // green
    } else if (clampedValue < 80) {
      this.elements.wetMeterBar.style.backgroundColor = '#facc15'; // yellow
    } else {
      this.elements.wetMeterBar.style.backgroundColor = '#ef4444'; // red
    }
  }

  /**
   * Update timer display
   * @param {number} seconds - Time in seconds
   */
  updateTimer(seconds) {
    if (!this.elements.timer) return;

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);

    this.elements.timer.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Update score display
   * @param {number} score - Current score
   */
  updateScore(score) {
    if (!this.elements.score) return;

    this.elements.score.textContent = Math.floor(score);
  }

  /**
   * Update UI visibility based on game state
   * @param {string} gameState - MENU, PLAYING, or GAME_OVER
   */
  updateGameState(gameState) {
    if (!this.elements.menuScreen || !this.elements.gameOverScreen) return;

    switch (gameState) {
      case 'MENU':
        this.elements.menuScreen.style.display = 'flex';
        this.elements.gameOverScreen.style.display = 'none';
        break;

      case 'PLAYING':
        this.elements.menuScreen.style.display = 'none';
        this.elements.gameOverScreen.style.display = 'none';
        break;

      case 'GAME_OVER':
        this.elements.menuScreen.style.display = 'none';
        this.elements.gameOverScreen.style.display = 'flex';
        break;

      default:
        console.warn(`UIManager: Unknown game state "${gameState}"`);
    }
  }

  /**
   * Update game over score display
   * @param {number} score - Final score
   */
  setGameOverScore(score) {
    if (!this.elements.gameOverScore) return;

    this.elements.gameOverScore.textContent = Math.floor(score);
  }

  /**
   * Hide all UI screens (for debugging or special states)
   */
  hideAll() {
    if (this.elements.menuScreen) {
      this.elements.menuScreen.style.display = 'none';
    }
    if (this.elements.gameOverScreen) {
      this.elements.gameOverScreen.style.display = 'none';
    }
  }

  /**
   * Show menu screen
   */
  showMenu() {
    if (this.elements.menuScreen) {
      this.elements.menuScreen.style.display = 'flex';
    }
  }

  /**
   * Show exit portal button that redirects to Vibe Jam Portal
   * @param {string} exitURL - URL to redirect to
   */
  showExitPortal(exitURL) {
    // Create or get portal button
    let portalButton = document.getElementById('exit-portal-button');
    
    if (!portalButton) {
      portalButton = document.createElement('a');
      portalButton.id = 'exit-portal-button';
      portalButton.href = exitURL;
      portalButton.className = 'exit-portal-button';
      portalButton.target = '_blank';
      portalButton.textContent = '🌀 Vibe Jam Portal';
      
      // Insert before the "Press ENTER to Restart" hint
      const gameOverScreen = document.getElementById('game-over-screen');
      const hint = gameOverScreen.querySelector('.menu-hint');
      if (hint) {
        hint.insertAdjacentElement('beforebegin', portalButton);
      }
    } else {
      portalButton.href = exitURL;
    }
  }
}
