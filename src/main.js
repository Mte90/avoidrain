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
import { CollisionManager } from './systems/CollisionManager.js';
import { RippleSystem } from './world/RippleSystem.js';
import { ambientMusic } from './audio/AmbientMusic.js';
import { WindSystem } from './environment/WindSystem.js';
import { WindowSystem } from './environment/WindowSystem.js';
import { PLAYER, BOUNDARIES, SCORING, CAMERA, RENDERER, FOG, SCENE_BG, LIGHTNING, LIGHT, JUICE, RAIN, COLLISION, SIDEWALK } from './core/Constants.js';
import { gameEvents } from './core/EventBus.js';

export class Game {
  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(SCENE_BG);
    this.scene.fog = new THREE.Fog(FOG.COLOR, FOG.NEAR, FOG.FAR);

    this.backdropBuilder = new BackdropBuilder();
    this.backdrop = this.backdropBuilder.createBackdrop(8);
    this.backdrop.position.z = -80;
    this.scene.add(this.backdrop);

    this.camera = new THREE.PerspectiveCamera(
      CAMERA.FOV,
      window.innerWidth / window.innerHeight,
      CAMERA.NEAR,
      CAMERA.FAR
    );
    this.camera.position.set(CAMERA.POS_X, CAMERA.POS_Y, CAMERA.POS_Z);

    this.renderer = new THREE.WebGLRenderer({ antialias: RENDERER.ANTIALIAS });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, RENDERER.MAX_PIXEL_RATIO));
    this.renderer.shadowMap.enabled = RENDERER.SHADOWS_ENABLED;
    document.getElementById('canvas-container').appendChild(this.renderer.domElement);

    this.ambientLight = new THREE.AmbientLight(LIGHT.AMBIENT_COLOR, LIGHT.AMBIENT_INTENSITY);
    this.scene.add(this.ambientLight);

    const directionalLight = new THREE.DirectionalLight(LIGHT.DIRECTIONAL_COLOR, LIGHT.DIRECTIONAL_INTENSITY);
    directionalLight.position.set(10, 15, 10);
    directionalLight.castShadow = RENDERER.SHADOWS_ENABLED;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    this.scene.add(directionalLight);

    const fillLight = new THREE.DirectionalLight(LIGHT.FILL_COLOR, LIGHT.FILL_INTENSITY);
    fillLight.position.set(-10, 10, -10);
    fillLight.castShadow = RENDERER.SHADOWS_ENABLED;
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

    this.player = new PlayerController(this.input, this.difficultyManager, this.gameState);
    this.player.setCamera(this.camera);
    this.scene.add(this.player.getGroup());

    this.chunkManager = new ChunkManager(this.scene);
    this.chunkManager.setDifficultyManager(this.difficultyManager);
    this.chunkManager.resize({ x: 0, y: 0, z: 0 });

    this.rainSystem = new RainSystem(this.scene, RAIN.INTENSITY);
    this.rainSystem.setDifficultyManager(this.difficultyManager);

    this.windSystem = new WindSystem();
    this.windowSystem = new WindowSystem();

    this.wetMeter = new WetMeter(this.gameState);
    this.powerUpManager = new PowerUpManager(this.scene, this.player, this.wetMeter, this.difficultyManager);
    this.portalManager = new PortalManager();
    this.juiceSystem = new JuiceSystem(this.scene);
    this.obstacleManager = new ObstacleManager(this.scene);
    this.collisionManager = new CollisionManager();
    this.rippleSystem = new RippleSystem(this.scene);
    this.menuDemoManager = new MenuDemoManager(this.player, this.camera, this.chunkManager, this.difficultyManager);

    // Check for portal params from previous game
    this.portalParams = PortalManager.getPortalParams();

    this.lastTime = performance.now();
    this.isRunning = true;
    this.gameTime = 0;

    // Lightning system - random 10-30 seconds between strikes
    this.lightningTimer = 0;
    this.nextLightning = LIGHTNING.MIN_INTERVAL + Math.random() * LIGHTNING.MAX_INTERVAL;

    // FPS counter (debug, toggle with F)
    this.showFPS = false;
    this.fpsElement = null;
    this.fpsFrames = [];
    this.fpsUpdateTime = 0;

    // Prevent multiple handleGameOver calls
    this.hasHandledGameOver = false;

    this.setupEventListeners();
    this.uiManager.init();
    this.uiManager.updateGameState('MENU');
    
    this.menuDemoManager.start();
    
    this.audioManager.init();
  }

  setupEventListeners() {
    this._onResize = () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    };
    this._onKeyDown = (e) => {
      if (e.key === 'Enter') {
        this.handleEnterKey();
      } else if (e.key === 'f' || e.key === 'F') {
        this.toggleFPS();
      }
    };
    this._onClick = () => {
      this.handleClick();
    };
    this._onMuteClick = (e) => {
      e.stopPropagation();
      const isMuted = this.audioManager.toggleMute();
      ambientMusic.setMuted(isMuted);
      muteBtn.textContent = isMuted ? '🔇' : '🔊';
    };

    // Visibility change handler - stop music when tab hidden, restart when visible
    this._onVisibilityChange = () => {
      if (document.hidden) {
        // Tab hidden - stop music
        if (this.gameState.getState() === GameState.PLAYING) {
          ambientMusic.stop();
        }
      } else {
        // Tab visible - restart music if playing
        if (this.gameState.getState() === GameState.PLAYING) {
          ambientMusic.start();
        }
      }
    };

    window.addEventListener('resize', this._onResize);
    document.addEventListener('keydown', this._onKeyDown);
    document.addEventListener('click', this._onClick);
    document.addEventListener('visibilitychange', this._onVisibilityChange);

    const muteBtn = document.getElementById('mute-btn');
    if (muteBtn) {
      muteBtn.addEventListener('click', this._onMuteClick);
      muteBtn.textContent = this.audioManager.getMuted() ? '🔇' : '🔊';
    }
  }

  dispose() {
    window.removeEventListener('resize', this._onResize);
    document.removeEventListener('keydown', this._onKeyDown);
    document.removeEventListener('click', this._onClick);
    document.removeEventListener('visibilitychange', this._onVisibilityChange);
    
    const muteBtn = document.getElementById('mute-btn');
    if (muteBtn) {
      muteBtn.removeEventListener('click', this._onMuteClick);
    }
    
    if (this.fpsElement) {
      this.fpsElement.remove();
      this.fpsElement = null;
    }
    
    ambientMusic.dispose();
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
    this.menuDemoManager.start();
    this.audioManager.playRain();
    this.audioManager.startFootsteps();
    this.audioManager.startTrafficAmbient();
    this.windowSystem.start();
    ambientMusic.start();
  }

  restartGame() {
    this.gameState.reset();
    this.resetGame();
    this.menuDemoManager.start();
    this.audioManager.playRain();
    this.audioManager.startFootsteps();
    this.audioManager.startTrafficAmbient();
    ambientMusic.start();
  }

  resetGame() {
    this.gameTime = 0;
    this.difficultyManager.reset();
    this.scoreManager.reset();
    this.wetMeter.reset();
    this.windSystem.reset();
    
    this.portalManager.dispose(this.scene);
    this.rainSystem.dispose();
    this.rainSystem = new RainSystem(this.scene, RAIN.INTENSITY);
    this.rainSystem.setDifficultyManager(this.difficultyManager);
    this.juiceSystem.dispose();
    this.collisionManager.reset();
    
    this.player.getGroup().position.set(PLAYER.START_X, PLAYER.START_Y, PLAYER.START_Z);
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
    this.audioManager.stopRain();
    this.audioManager.stopTrafficAmbient();
    ambientMusic.stop();
    this.audioManager.playGameOver();
    this.juiceSystem.resetShake();
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
    this.ambientLight.intensity = LIGHTNING.FLASH_INTENSITY;
    setTimeout(() => {
      this.ambientLight.intensity = LIGHTNING.RESTORE_INTENSITY;
    }, LIGHTNING.FLASH_DURATION_MS);

    const thunderDelay = LIGHTNING.THUNDER_MIN_DELAY + Math.random() * LIGHTNING.THUNDER_MAX_DELAY;
    setTimeout(() => {
      this.audioManager.playThunder();
    }, thunderDelay * 1000);

    // Schedule next lightning: 10-30 seconds
    this.lightningTimer = 0;
    this.nextLightning = LIGHTNING.MIN_INTERVAL + Math.random() * LIGHTNING.MAX_INTERVAL;
  }

  update(delta) {
    const state = this.gameState.getState();

    this.portalManager.update(delta);
    
    // Animate antenna blinking lights
    this.animateAntennas(delta);
    
    // Animate window shadows and shadow people
    this.animateShadows(delta);

    if (state === GameState.MENU) {
      this.menuDemoManager.update(delta);
      this.player.update(delta);
      this.rainSystem.update(delta);
      this.chunkManager.updateCars(delta);
      this.chunkManager.updatePuddles(delta);
      this.chunkManager.updatePedestrians(delta);
      this.chunkManager.updateBuildingWetness(this.difficultyManager.getRainIntensity(), this.gameTime);
      this.rippleSystem.update(delta, this.chunkManager.puddles);
      // Update chunks in demo mode too (player moves in demo)
      const playerPos = this.player.getPosition();
      this.chunkManager.update(playerPos.z);
    }

    const playerPos = this.player.getPosition();
    
    // Light is fixed in world space for realistic shadows
    // (removed: directional light following player)
    
    this.rainSystem.setPlayerPosition(playerPos.x, playerPos.y, playerPos.z);

    if (state === GameState.PLAYING) {
      this.gameTime += delta;

      this.difficultyManager.update(delta);
      this.player.update(delta, this.chunkManager);
      this.chunkManager.update(playerPos.z);
      this.chunkManager.updateCars(delta);
      this.chunkManager.updatePuddles(delta);
      this.chunkManager.updatePedestrians(delta);
      this.chunkManager.updateBuildingWetness(this.difficultyManager.getRainIntensity(), this.gameTime);
      this.rippleSystem.update(delta, this.chunkManager.puddles);
      this.rainSystem.update(delta);
      
      this.windSystem.update(delta, this.difficultyManager.getDifficultyMultiplier());

      this.backdropBuilder.updateBuildingPositions(this.backdrop, playerPos.z);

      const chunks = this.chunkManager.getActiveChunks();
      const cars = this.chunkManager.cars;
      const puddles = this.chunkManager.puddles;
      const balconies = this.chunkManager.balconies;
      const wasHit = this.wetMeter.update(delta, playerPos, chunks, cars, puddles, balconies);
      
      if (wasHit) {
        this.audioManager.playSplash();
        this.juiceSystem.addScreenShake(JUICE.SCREEN_SHAKE_INTENSITY);
        this.uiManager.showNotification('💥 Hit!', 'hit');
        this.rippleSystem.triggerSplash(playerPos.x, 0.15, playerPos.z);
      }

      const pushback = this.wetMeter.getPushbackVelocity();
      if (pushback !== 0) {
        this.wetMeter.setOriginalX(this.player.getGroup().position.x);
        this.player.getGroup().position.x += pushback * delta;
      }
      
      if (this.wetMeter.hasOriginalX() && 
          Math.abs(this.player.getGroup().position.x - this.wetMeter.getOriginalX()) > COLLISION.POSITION_THRESHOLD) {
        this.player.getGroup().position.x = this.wetMeter.getOriginalX();
        this.wetMeter.setOriginalX(null);
      }

      if (this.wetMeter.getIsUnderShelter() && !this.wasUnderShelter) {
        this.uiManager.showNotification('☔ Dry!', 'shelter');
        this.wasUnderShelter = true;
      } else if (!this.wetMeter.getIsUnderShelter()) {
        this.wasUnderShelter = false;
      }

      this.audioManager.setRainMuffled(this.wetMeter.getIsUnderShelter());
      this.audioManager.updateFootstepWetness(this.wetMeter.getWetMeter() > 20);

      this.scoreManager.setDistance(-playerPos.z);
      this.scoreManager.update(delta, this.wetMeter.getIsUnderShelter());

      this.player.setHairWetness(this.wetMeter.getWetMeter());
      this.player.setRainState(!this.wetMeter.getIsUnderShelter());
      this.player.setWetnessSpeedModifier(this.wetMeter.getWetMeter(), this.wetMeter.getIsUnderShelter());
      
      // Car horn feedback
      if (this.chunkManager.checkCarHorn(playerPos)) {
        this.audioManager.playHorn();
      }
      
      // Update traffic volume based on car count (0.03 + Math.min(carCount, 12) * 0.005)
      this.audioManager.updateTrafficVolume(this.chunkManager.cars.filter(c => c.visible).length);
      
      this.powerUpManager.update(delta, playerPos);
      this.juiceSystem.update(delta);
      
      if (this.difficultyManager.isStorm()) {
        this.scene.fog.near = FOG.DENSE_NEAR;
        this.scene.fog.far = FOG.DENSE_FAR;
      } else if (this.difficultyManager.isCalm()) {
        this.scene.fog.near = FOG.LIGHT_NEAR;
        this.scene.fog.far = FOG.LIGHT_FAR;
      } else {
        this.scene.fog.near = FOG.NEAR;
        this.scene.fog.far = FOG.FAR;
      }
    }

    if (state === GameState.MENU || state === GameState.PLAYING) {
      const worldData = {
        obstacles: this.chunkManager.obstacles,
        cars: this.chunkManager.cars,
        puddles: this.chunkManager.puddles,
        lampposts: this.chunkManager.lamps.map(lamp => lamp.mesh)
      };
      
      const collisionResult = this.collisionManager.checkAll(this.player.getGroup(), worldData);
      
      if (collisionResult.pushbackX !== 0) {
        this.player.getGroup().position.x += collisionResult.pushbackX * delta * COLLISION.PUSHBACK_FORCE;
        if (state === GameState.PLAYING) {
          this.juiceSystem.addScreenShake(JUICE.SCREEN_SHAKE_INTENSITY);
        }
      }
      
      if (collisionResult.collisionOccurred && !this.collisionManager.isBlinkingActive()) {
        this.collisionManager.triggerBlink();
        this.scoreManager.addPenalty(SCORING.COLLISION_PENALTY);
        const HIT_MESSAGES = {
          car: '🚗 Hit by a car! -5 pts',
          lamppost: '💡 Hit a lamppost! -5 pts',
          trashCan: '🗑️ Hit a trash can! -5 pts',
          bench: '🪑 Hit a bench! -5 pts',
          sign: '🪧 Hit a sign! -5 pts',
          puddle: '💦 Splashed! -5 pts'
        };
        const obsData = collisionResult.obstacleData;
        if (obsData && obsData.type) {
          const typeKey = obsData.type;
          this.uiManager.showNotification(HIT_MESSAGES[typeKey] || '🚧 Hit an obstacle! -5 pts', 'hit');
        } else if (collisionResult.hitType) {
          this.uiManager.showNotification(HIT_MESSAGES[collisionResult.hitType] || '💥 Ouch! -5 pts', 'hit');
        }
      }
      
      this.collisionManager.updateBlink(this.player.getGroup(), delta);
      
      const playerGroup = this.player.getGroup();
      if (collisionResult.collisionOccurred) {
        const playerX = playerGroup.position.x;
        const targetX = playerX < 0 ? SIDEWALK.LEFT_X : SIDEWALK.RIGHT_X;
        playerGroup.position.x = targetX;
      }
    }

    if (state === GameState.PLAYING) {
      
      const playerGroup = this.player.getGroup();
      if (playerGroup.position.x < BOUNDARIES.LEFT) {
        playerGroup.position.x += PLAYER.COLLISION_RECOVERY_SPEED * delta;
      }
      if (playerGroup.position.x > BOUNDARIES.RIGHT) {
        playerGroup.position.x -= PLAYER.COLLISION_RECOVERY_SPEED * delta;
      }
      
      // If player is far from sidewalk center, force back to center
      if (playerGroup.position.x > SIDEWALK.FORCE_CENTER_THRESHOLD_LOW && playerGroup.position.x < SIDEWALK.FORCE_CENTER_THRESHOLD_HIGH) {
        playerGroup.position.x = SIDEWALK.RIGHT_X;
      } else if (playerGroup.position.x < -SIDEWALK.FORCE_CENTER_THRESHOLD_LOW && playerGroup.position.x > -SIDEWALK.FORCE_CENTER_THRESHOLD_HIGH) {
        playerGroup.position.x = SIDEWALK.LEFT_X;
      }
    }

    if (this.gameState.getState() === GameState.GAME_OVER && !this.hasHandledGameOver) {
      this.hasHandledGameOver = true;
      this.handleGameOver();
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
    const now = performance.now();
    const delta = Math.min((now - this.lastTime) * 0.001, 1 / 30);
    this.lastTime = now;

    if (this.showFPS && this.fpsElement) {
      this.fpsFrames.push(now);
      const oneSecondAgo = now - 1000;
      while (this.fpsFrames.length > 0 && this.fpsFrames[0] < oneSecondAgo) {
        this.fpsFrames.shift();
      }
      const fps = this.fpsFrames.length;
      this.fpsElement.textContent = `FPS: ${fps}`;
      if (fps >= 55) {
        this.fpsElement.style.color = '#0f0';
      } else if (fps >= 30) {
        this.fpsElement.style.color = '#ff0';
      } else {
        this.fpsElement.style.color = '#f00';
      }
    }

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

  animateShadows(delta) {
    const time = this.gameTime;
    this.scene.traverse((child) => {
      if (child.userData && child.userData.isShadowPerson) {
        child.position.x = Math.sin(time + child.userData.offset) * 0.3;
      }
    });
  }

  toggleFPS() {
    this.showFPS = !this.showFPS;
    if (this.showFPS) {
      if (!this.fpsElement) {
        this.fpsElement = document.createElement('div');
        this.fpsElement.id = 'fps-counter';
        this.fpsElement.style.cssText = `
          position: fixed;
          top: 20px;
          right: 80px;
          background: rgba(0, 0, 0, 0.7);
          color: #0f0;
          padding: 8px 12px;
          border-radius: 4px;
          font-family: monospace;
          font-size: 14px;
          font-weight: bold;
          z-index: 1000;
          pointer-events: none;
        `;
        document.body.appendChild(this.fpsElement);
      }
      this.fpsUpdateTime = performance.now();
      this.fpsFrames = [];
    } else if (this.fpsElement) {
      this.fpsElement.remove();
      this.fpsElement = null;
    }
  }
}

const game = new Game();
game.start();
// Export game globally for testing
window.game = game;

