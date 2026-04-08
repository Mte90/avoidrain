import * as THREE from 'three';

export class PowerUpManager {
  constructor(scene) {
    this.scene = scene;
    this.activePowerUps = [];
    this.powerUpTypes = ['speed', 'shield', 'magnet'];
    this.spawnTimer = 0;
    this.nextSpawn = 30;
  }

  update(delta, playerPosition) {
    this.spawnTimer += delta;
    if (this.spawnTimer >= this.nextSpawn) {
      this.spawnPowerUp(playerPosition);
      this.spawnTimer = 0;
      this.nextSpawn = 25 + Math.random() * 20;
    }

    for (let i = this.activePowerUps.length - 1; i >= 0; i--) {
      const powerUp = this.activePowerUps[i];
      powerUp.duration -= delta;
      
      if (powerUp.duration <= 0) {
        this.scene.remove(powerUp.mesh);
        this.activePowerUps.splice(i, 1);
      }
    }

    for (const powerUp of this.activePowerUps) {
      const distance = powerUp.mesh.position.distanceTo(playerPosition);
      if (distance < 1.5) {
        this.activatePowerUp(powerUp);
        this.scene.remove(powerUp.mesh);
        this.activePowerUps.splice(this.activePowerUps.indexOf(powerUp), 1);
      }
    }
  }

  spawnPowerUp(playerZ) {
    const type = this.powerUpTypes[Math.floor(Math.random() * this.powerUpTypes.length)];
    const x = (Math.random() > 0.5 ? 1 : -1) * (4 + Math.random() * 2);
    const z = playerZ - (50 + Math.random() * 100);

    const color = type === 'speed' ? 0xFFFF00 : type === 'shield' ? 0x00FFFF : 0xFF00FF;
    const geometry = new THREE.SphereGeometry(0.4, 16, 16);
    const material = new THREE.MeshBasicMaterial({ color });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, 0.5, z);
    mesh.userData = { type };

    this.scene.add(mesh);
    this.activePowerUps.push({ mesh, type, duration: 0 });
  }

  activatePowerUp(powerUp) {
    const duration = powerUp.type === 'speed' ? 5 : powerUp.type === 'shield' ? 3 : 5;
    
    return {
      type: powerUp.type,
      duration,
      message: this.getPowerUpMessage(powerUp.type, duration)
    };
  }
  
  getPowerUpMessage(type, duration) {
    const messages = {
      speed: `Speed boost! +50% speed for ${duration}s`,
      shield: `Shield active! Immune to water for ${duration}s`,
      magnet: `Magnet activated! Attracts puddles for ${duration}s`
    };
    return messages[type] || 'Power-up activated!';
  }

  dispose() {
    for (const powerUp of this.activePowerUps) {
      this.scene.remove(powerUp.mesh);
    }
    this.activePowerUps = [];
  }
}
