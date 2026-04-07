import * as THREE from 'three';
import { InputManager } from './input/InputManager.js';
import { GameState, GameStateMachine } from './systems/GameState.js';
import { PlayerController } from './player/PlayerController.js';
import { ChunkManager } from './world/ChunkManager.js';
import { RainSystem } from './environment/RainSystem.js';
import { audioManager } from './audio/AudioManager.js';
import { WetMeter } from './systems/WetMeter.js';
import { DifficultyManager } from './systems/DifficultyManager.js';
import { ScoreManager } from './systems/ScoreManager.js';
import { UIManager } from './ui/UIManager.js';
import { BackdropBuilder } from './world/BackdropBuilder.js';

export class Game {
  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x3a4a5a);
    this.scene.fog = new THREE.Fog(0x8899aa, 25, 90);

    this.backdropBuilder = new BackdropBuilder();
    this.backdrop = this.backdropBuilder.createBackdrop(8);
    this.backdrop.position.z = -80;
    this.scene.add(this.backdrop);

    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 5, 8);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('canvas-container').appendChild(this.renderer.domElement);

    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
    this.scene.add(this.ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xfff5e6, 1.0);
    directionalLight.position.set(10, 15, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 80;
    directionalLight.shadow.camera.left = -30;
    directionalLight.shadow.camera.right = 30;
    directionalLight.shadow.camera.top = 30;
    directionalLight.shadow.camera.bottom = -30;
    directionalLight.shadow.bias = -0.0001;
    this.scene.add(directionalLight);

    const hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x8B7355, 0.3);
    this.scene.add(hemisphereLight);

    this.gameState = new GameStateMachine();
    this.input = new InputManager();
    this.difficultyManager = new DifficultyManager();
    this.scoreManager = new ScoreManager();
    this.audioManager = audioManager;
    this.uiManager = new UIManager();

    this.player = new PlayerController(this.input);
    this.player.setCamera(this.camera);
    this.scene.add(this.player.getGroup());

    this.chunkManager = new ChunkManager(this.scene);
    this.chunkManager.setDifficultyManager(this.difficultyManager);
    this.chunkManager.initialize(0);

    this.rainSystem = new RainSystem(this.scene, 0.5);
    this.rainSystem.setDifficultyManager(this.difficultyManager);

    this.wetMeter = new WetMeter(this.gameState);

    this.lastTime = performance.now();
    this.isRunning = true;
    this.gameTime = 0;

    // Lightning system - random 10-30 seconds between strikes
    this.lightningTimer = 0;
    this.nextLightning = 10 + Math.random() * 20;

    this.setupEventListeners();
    this.uiManager.init();
    this.uiManager.updateGameState('MENU');

    this.audioManager.init();
  }

  setupEventListeners() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.handleEnterKey();
      }
    });

    document.addEventListener('click', () => {
      this.handleClick();
    });
  }

  handleEnterKey() {
    const state = this.gameState.getState();
    
    if (state === GameState.MENU) {
      this.startGame();
    } else if (state === GameState.GAME_OVER) {
      this.restartGame();
    }
  }

  handleClick() {
    const state = this.gameState.getState();
    
    if (state === GameState.MENU) {
      this.startGame();
    } else if (state === GameState.GAME_OVER) {
      this.restartGame();
    }
  }

  startGame() {
    this.gameState.startPlaying();
    this.resetGame();
    this.audioManager.playRain();
    this.audioManager.startFootsteps();
  }

  restartGame() {
    this.gameState.reset();
    this.resetGame();
    this.gameState.startPlaying();
    this.audioManager.playRain();
    this.audioManager.startFootsteps();
  }

  resetGame() {
    this.gameTime = 0;
    this.difficultyManager.reset();
    this.scoreManager.reset();
    this.wetMeter.reset();
    
    this.player.getGroup().position.set(-3.5, 0.1, 0);
    this.player.currentSide = false;
    
    this.chunkManager.dispose();
    this.chunkManager = new ChunkManager(this.scene);
    this.chunkManager.setDifficultyManager(this.difficultyManager);
    this.chunkManager.initialize(0);
    const playerPos = this.player.getPosition();
    this.rainSystem.setPlayerPosition(playerPos.x, playerPos.y, playerPos.z);
  }

  handleGameOver() {
    this.audioManager.stopFootsteps();
    this.audioManager.playGameOver();
    this.uiManager.setGameOverScore(this.scoreManager.getScore());
  }

  triggerLightning() {
    // Flash: increase ambient light to 3.0 for 100ms
    this.ambientLight.intensity = 3.0;
    setTimeout(() => {
      this.ambientLight.intensity = 0.55;
    }, 100);

    // Thunder: play after delay (0.5-3 seconds for distance effect)
    const thunderDelay = 0.5 + Math.random() * 2.5;
    setTimeout(() => {
      this.audioManager.playThunder();
    }, thunderDelay * 1000);

    // Schedule next lightning: 10-30 seconds
    this.lightningTimer = 0;
    this.nextLightning = 10 + Math.random() * 20;
  }

  update(delta) {
    const state = this.gameState.getState();

    const playerPos = this.player.getPosition();
    
    // Make directional light follow player for shadows
    const directionalLight = this.scene.children.find(child => child.isDirectionalLight);
    if (directionalLight) {
      directionalLight.position.set(playerPos.x, 15, playerPos.z + 10);
      directionalLight.target.position.copy(this.player.getGroup().position);
      directionalLight.target.updateMatrixWorld();
    }
    
    this.rainSystem.setPlayerPosition(playerPos.x, playerPos.y, playerPos.z);
    
    // Animate antenna blinking lights
    this.animateAntennas(delta);

    if (state === GameState.PLAYING) {
      this.gameTime += delta;

      this.difficultyManager.update(delta);
      this.player.update(delta, this.chunkManager);
      this.chunkManager.update(playerPos.z);
      this.chunkManager.groundBuilder.updateWetness(this.difficultyManager.getRainIntensity());
      this.chunkManager.updateCars(delta);
      this.rainSystem.update(delta);

      this.backdropBuilder.updateBuildingPositions(this.backdrop, playerPos.z);

      const chunks = this.chunkManager.getActiveChunks();
      const cars = this.chunkManager.cars;
      const puddles = this.chunkManager.puddles;
      const wasHit = this.wetMeter.update(delta, playerPos, chunks, cars, puddles);
      
      if (wasHit) {
        this.audioManager.playSplash();
        this.audioManager.playHorn();
      }

      const pushback = this.wetMeter.getPushbackVelocity();
      if (pushback !== 0) {
        this.player.getGroup().position.x += pushback * delta;
      }

      this.scoreManager.setDistance(-playerPos.z);
      this.scoreManager.update(delta, this.wetMeter.getIsUnderShelter());

      this.player.setHairWetness(this.wetMeter.getWetMeter());

      if (this.gameState.getState() === GameState.GAME_OVER) {        this.handleGameOver();
      }
    }

    const wetMeterValue = this.wetMeter.getWetMeter();
    const score = this.scoreManager.getScore();
    this.uiManager.update(wetMeterValue, score, this.gameTime, this.gameState.getState());

    this.lightningTimer += delta;
    if (this.lightningTimer >= this.nextLightning) {
      this.triggerLightning();
    }
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  loop() {
    if (!this.isRunning) return;

    const now = performance.now();
    const delta = Math.min((now - this.lastTime) * 0.001, 1 / 20);
    this.lastTime = now;

    this.update(delta);
    this.render();

    requestAnimationFrame(() => this.loop());
  }

  start() {
    this.isRunning = true;
    this.loop();
  }

  stop() {
    this.isRunning = false;
  }

  getGameState() {
    return this.gameState.getState();
  }

  getWetMeter() {
    return this.wetMeter.getWetMeter();
  }

  getScore() {
    return this.scoreManager.getScore();
  }

  getScoreManager() {
    return this.scoreManager;
  }

  getDifficultyManager() {
    return this.difficultyManager;
  }

  animateAntennas(delta) {
    this.scene.traverse((child) => {
      if (child.userData && child.userData.isAntenna) {
        const light = child.userData.light;
        if (light && light.material) {
          const blinkSpeed = 10 + child.userData.blinkOffset;
          const intensity = (Math.sin(this.gameTime * blinkSpeed) + 1) / 2;
          light.material.emissiveIntensity = 0.3 + intensity * 0.7;
        }
      }
    });
  }
}

const game = new Game();
game.start();
// Export game globally for testing
window.game = game;

