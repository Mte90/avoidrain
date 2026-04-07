import * as THREE from 'three';

const RAIN_COUNT = 8000;
const VOLUME_WIDTH = 60;
const VOLUME_HEIGHT = 40;
const VOLUME_DEPTH = 60;

export class RainSystem {
  constructor(scene, rainIntensity = 0.5) {
    this.scene = scene;
    this.rainIntensity = rainIntensity;
    this.difficultyManager = null;
    this.playerPosition = new THREE.Vector3(0, 0, 0);
    
    this.velocities = new Float32Array(RAIN_COUNT);
    this.initialVelocities = new Float32Array(RAIN_COUNT);
    
    this.createRain();
    this.scene.add(this.rainPoints);
  }

  createRain() {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(RAIN_COUNT * 3);
    const sizes = new Float32Array(RAIN_COUNT);

    for (let i = 0; i < RAIN_COUNT; i++) {
      const i3 = i * 3;
      
      positions[i3] = (Math.random() - 0.5) * VOLUME_WIDTH;
      positions[i3 + 1] = Math.random() * VOLUME_HEIGHT;
      positions[i3 + 2] = (Math.random() - 0.5) * VOLUME_DEPTH;

      this.velocities[i] = 15 + Math.random() * 10;
      this.initialVelocities[i] = this.velocities[i];
      
      sizes[i] = 0.1 + Math.random() * 0.1;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      color: 0xaaccff,
      size: 0.15,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending
    });

    this.rainPoints = new THREE.Points(geometry, material);
    this.updateIntensity(this.rainIntensity);
  }

  setDifficultyManager(difficultyManager) {
    this.difficultyManager = difficultyManager;
    this.setIntensity(this.difficultyManager.getRainIntensity());
  }

  setPlayerPosition(x, y, z) {
    this.playerPosition.set(x, y, z);
    this.rainPoints.position.set(x, y, z);
  }

  update(delta) {
    if (this.difficultyManager) {
      this.setIntensity(this.difficultyManager.getRainIntensity());
    }
    
    const positions = this.rainPoints.geometry.attributes.position.array;
    const intensityFactor = this.rainIntensity;
    const speedMultiplier = 0.5 + intensityFactor;

    for (let i = 0; i < RAIN_COUNT; i++) {
      const i3 = i * 3;
      
      positions[i3 + 1] -= this.velocities[i] * delta * speedMultiplier;

      if (positions[i3 + 1] < -2) {
        positions[i3 + 1] = VOLUME_HEIGHT;
        positions[i3] = (Math.random() - 0.5) * VOLUME_WIDTH;
        positions[i3 + 2] = (Math.random() - 0.5) * VOLUME_DEPTH;
      }
    }

    this.rainPoints.geometry.attributes.position.needsUpdate = true;
  }

  setIntensity(value) {
    this.rainIntensity = Math.max(0, Math.min(1, value));
    this.updateIntensity(this.rainIntensity);
  }

  updateIntensity(intensity) {
    const visibleCount = Math.floor(RAIN_COUNT * intensity);
    
    const sizes = this.rainPoints.geometry.attributes.size.array;
    const sizeMultiplier = 0.5 + intensity;
    
    for (let i = 0; i < RAIN_COUNT; i++) {
      if (i < visibleCount) {
        sizes[i] = (0.1 + Math.random() * 0.1) * sizeMultiplier;
      } else {
        sizes[i] = 0;
      }
    }
    
    this.rainPoints.geometry.attributes.size.needsUpdate = true;
    this.rainPoints.material.opacity = 0.3 + intensity * 0.5;
    this.rainPoints.material.size = 0.1 + intensity * 0.1;
    
    this.rainPoints.visible = intensity > 0.05;
  }

  getIntensity() {
    return this.rainIntensity;
  }

  dispose() {
    this.scene.remove(this.rainPoints);
    this.rainPoints.geometry.dispose();
    this.rainPoints.material.dispose();
  }
}