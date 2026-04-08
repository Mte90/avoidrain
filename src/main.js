import * as THREE from 'three';
import { InputManager } from './input/InputManager.js';
import { GameState, GameStateMachine } from './systems/GameState.js';
import { WetMeter } from './systems/WetMeter.js';
import { PlayerController } from './player/PlayerController.js';
import { ChunkManager } from './world/ChunkManager.js';
import { RainSystem } from './environment/RainSystem.js';
import { audioManager } from './audio/AudioManager.js';
import { PowerUpManager } from './items/PowerUpManager.js';
import { DifficultyManager } from './systems/DifficultyManager.js';
import { ScoreManager } from './systems/ScoreManager.js';
import { UIManager } from './ui/UIManager.js';
import { BackdropBuilder } from './world/BackdropBuilder.js';
import { JuiceSystem } from './systems/JuiceSystem.js';
import { ObstacleManager } from './items/ObstacleManager.js';
import { PortalManager } from './utils/PortalManager.js';
import { MenuDemoManager } from './systems/MenuDemoManager.js';

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
    this.renderer.shadowMap.enabled = false;
    document.getElementById('canvas-container').appendChild(this.renderer.domElement);

    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    this.scene.add(this.ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xfff5e6, 1.0);
    directionalLight.position.set(10, 15, 10);
    this.scene.add(directionalLight);

    // Additional fill light for better building visibility
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
    fillLight.position.set(-10, 10, -10);
    this.scene.add(fillLight);

    // Rimosso HemisphereLight per ridurre complessità shader su mobile
    // const hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x8B7355, 0.3);
    // this.scene.add(hemisphereLight);

    this.gameState = new GameStateMachine();
    this.input = new InputManager();
    this.difficultyManager = new DifficultyManager();
    this.scoreManager = new ScoreManager();
    this.audioManager = audioManager;
    this.uiManager = new UIManager();

    this.player = new PlayerController(this.input, this.difficultyManager);
    this.player.setCamera(this.camera);
    this.scene.add(this.player.getGroup());

    this.chunkManager = new ChunkManager(this.scene);
    this.chunkManager.setDifficultyManager(this.difficultyManager);
    this.chunkManager.resize({ x: 0, y: 0, z: 0 });

    this.rainSystem = new RainSystem(this.scene, 0.5);
    this.rainSystem.setDifficultyManager(this.difficultyManager);

    this.wetMeter = new WetMeter(this.gameState);
    this.powerUpManager = new PowerUpManager(this.scene, this.player, this.wetMeter, this.difficultyManager);
    this.portalManager = new PortalManager();
    this.juiceSystem = new JuiceSystem(this.scene);
    this.obstacleManager = new ObstacleManager(this.scene);
    this.menuDemoManager = new MenuDemoManager(this.player, this.camera, this.chunkManager, this.difficultyManager);

    // Check for portal params from previous game
    this.portalParams = PortalManager.getPortalParams();
    if (this.portalParams) {
      console.log('Portal params detected:', this.portalParams);
    }

    this.lastTime = performance.now();
    this.isRunning = true;
    this.gameTime = 0;

    // Lightning system - random 10-30 seconds between strikes
    this.lightningTimer = 0;
    this.nextLightning = 10 + Math.random() * 20;

    this.setupEventListeners();
    this.uiManager.init();
    this.uiManager.updateGameState('MENU');
    
    this.menuDemoManager.start();
    
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
    this.menuDemoManager.stop();
    this.audioManager.playRain();
    this.audioManager.startFootsteps();
  }

  restartGame() {
    this.gameState.reset();
    this.resetGame();
    this.gameState.startPlaying();
    this.menuDemoManager.stop();
    this.audioManager.playRain();
    this.audioManager.startFootsteps();
  }

  resetGame() {
    this.gameTime = 0;
    this.difficultyManager.reset();
    this.scoreManager.reset();
    this.wetMeter.reset();
    
    this.portalManager.dispose(this.scene);
    
    this.player.getGroup().position.set(-3.5, 0.1, 0);
    this.player.currentSide = false;
    
    this.chunkManager.dispose();
    this.chunkManager = new ChunkManager(this.scene);
    this.chunkManager.setDifficultyManager(this.difficultyManager);
    this.chunkManager.resize({ x: 0, y: 0, z: 0 });
    
    // resize() already spawns chunks from z=-120 to z=120 (7 chunks)
    // Buildings will be visible at various Z positions within this range
    
    const playerPos = this.player.getPosition();
    this.rainSystem.setPlayerPosition(playerPos.x, playerPos.y, playerPos.z);
  }

  handleGameOver() {
    this.audioManager.stopFootsteps();
    this.audioManager.playGameOver();
    this.uiManager.setGameOverScore(this.scoreManager.getScore());
    
    const exitURL = PortalManager.createExitURL(
      this.portalParams?.username || 'Player',
      this.portalParams?.color || '#667eea',
      this.scoreManager.getScore() / 100
    );
    this.uiManager.showExitPortal(exitURL);
    
    this.portalManager.build(this.scene, { x: 0, y: 2, z: -20 });
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

    this.portalManager.update(delta);
    
    // Animate antenna blinking lights
    this.animateAntennas(delta);

    if (state === GameState.MENU) {
      this.menuDemoManager.update(delta);
      this.rainSystem.update(delta);
    }

    const playerPos = this.player.getPosition();
    
    // Make directional light follow player for shadows
    const directionalLight = this.scene.children.find(child => child.isDirectionalLight);
    if (directionalLight) {
      directionalLight.position.set(playerPos.x, 15, playerPos.z + 10);
      directionalLight.target.position.copy(this.player.getGroup().position);
      directionalLight.target.updateMatrixWorld();
    }
    
    this.rainSystem.setPlayerPosition(playerPos.x, playerPos.y, playerPos.z);

    this.chunkManager.updateCars(delta);

    if (state === GameState.PLAYING) {
      this.gameTime += delta;

      this.difficultyManager.update(delta);
      this.player.update(delta, this.chunkManager);
      this.chunkManager.update(playerPos.z);
      this.rainSystem.update(delta);

      this.backdropBuilder.updateBuildingPositions(this.backdrop, playerPos.z);

      const chunks = this.chunkManager.getActiveChunks();
      const cars = this.chunkManager.cars;
      const puddles = this.chunkManager.puddles;
      const wasHit = this.wetMeter.update(delta, playerPos, chunks, cars, puddles);
      
      if (wasHit) {
        this.audioManager.playSplash();
        this.audioManager.playHorn();
        this.juiceSystem.addScreenShake(0.3);
      }

      const pushback = this.wetMeter.getPushbackVelocity();
      if (pushback !== 0) {
        this.player.getGroup().position.x += pushback * delta;
      }

      this.scoreManager.setDistance(-playerPos.z);
      this.scoreManager.update(delta, this.wetMeter.getIsUnderShelter());

      this.player.setHairWetness(this.wetMeter.getWetMeter());
      
      this.powerUpManager.update(delta, playerPos);
      this.juiceSystem.update(delta);
      
      const obstaclePushback = this.obstacleManager.update(playerPos.z);
      if (obstaclePushback !== 0) {
        this.juiceSystem.addScreenShake(0.2);
      }

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
    const baseCameraPos = this.camera.position.clone();
    this.juiceSystem.applyCameraShake(this.camera, baseCameraPos);
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

