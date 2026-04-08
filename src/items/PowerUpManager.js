import * as THREE from 'three';
import { PowerUpBuilder, PowerUpType } from './PowerUpBuilder.js';

export class PowerUpManager {
  constructor(scene, player, wetMeter, difficultyManager) {
    this.scene = scene;
    this.player = player;
    this.wetMeter = wetMeter;
    this.difficultyManager = difficultyManager;
    this.powerUpBuilder = new PowerUpBuilder();
    this.activePowerUps = [];
    this.powerUpPool = [];
    
    this.spawnChance = 0.02;
    this.minSpawnDistance = 30;
    
    this.activeEffects = {};
  }
  
  spawn(playerZ) {
    if (Math.random() > this.spawnChance) return null;
    
    const types = Object.values(PowerUpType);
    const type = types[Math.floor(Math.random() * types.length)];
    
    const x = (Math.random() - 0.5) * 4;
    const y = 0.5;
    const z = playerZ - this.minSpawnDistance;
    
    const powerUp = this.powerUpPool.length > 0 
      ? this.powerUpPool.pop()
      : this.powerUpBuilder.build(type, { x, y, z });
    
    powerUp.visible = true;
    powerUp.position.set(x, y, z);
    powerUp.userData.spawnTime = performance.now();
    
    this.scene.add(powerUp);
    this.activePowerUps.push(powerUp);
    
    return powerUp;
  }
  
  collectPowerUp(powerUp, playerPosition) {
    const type = powerUp.userData.type;
    
    switch(type) {
      case PowerUpType.UMBRELLA:
        this.applyUmbrellaEffect();
        break;
      case PowerUpType.SPEED:
        this.applySpeedEffect();
        break;
      case PowerUpType.SHIELD:
        this.applyShieldEffect();
        break;
    }
  }
  
  applyUmbrellaEffect() {
    this.wetMeter.reduceWetness(30);
  }
  
  applySpeedEffect() {
    if (this.difficultyManager) {
      const baseSpeed = this.player.baseSpeed;
      this.player.speed = baseSpeed * 1.5;
      this.activeEffects.speed = {
        endTime: performance.now() + 5000,
        restore: () => { this.player.speed = baseSpeed; }
      };
    }
  }
  
  applyShieldEffect() {
    this.wetMeter.setShielded(true);
    this.activeEffects.shield = {
      endTime: performance.now() + 3000,
      restore: () => { this.wetMeter.setShielded(false); }
    };
  }
  
  update(delta, playerPosition) {
    const now = performance.now();
    
    for (const effectName in this.activeEffects) {
      const effect = this.activeEffects[effectName];
      if (now >= effect.endTime) {
        effect.restore();
        delete this.activeEffects[effectName];
      }
    }
    
    for (let i = this.activePowerUps.length - 1; i >= 0; i--) {
      const powerUp = this.activePowerUps[i];
      
      if (powerUp.position.z > playerPosition.z + 10) {
        this.scene.remove(powerUp);
        this.powerUpPool.push(powerUp);
        this.activePowerUps.splice(i, 1);
        continue;
      }
      
      const distance = powerUp.position.distanceTo(playerPosition);
      if (distance < 1.5) {
        this.collectPowerUp(powerUp, playerPosition);
        this.scene.remove(powerUp);
        this.powerUpPool.push(powerUp);
        this.activePowerUps.splice(i, 1);
      }
    }
  }
  
  dispose() {
    for (const powerUp of this.activePowerUps) {
      this.scene.remove(powerUp);
      powerUp.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      });
    }
    this.activePowerUps = [];
    this.powerUpPool = [];
  }
}
