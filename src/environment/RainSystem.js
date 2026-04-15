import * as THREE from 'three';
import { gameEvents } from '../core/EventBus.js';

const RAIN_COUNT = 3000;
const VOLUME_WIDTH = 60;
const VOLUME_HEIGHT = 40;
const VOLUME_DEPTH = 60;

export class RainSystem {
  constructor(scene, rainIntensity = 0.5) {
    this.scene = scene;
    this.rainIntensity = rainIntensity;
    this.difficultyManager = null;
    this.playerPosition = new THREE.Vector3(0, 0, 0);
    this.windAngle = 0.15;
    
    this.velocities = new Float32Array(RAIN_COUNT);
    this.initialVelocities = new Float32Array(RAIN_COUNT);
    
    this.createRain();
    this.scene.add(this.rainLines);
    
    this.unsubscribe = gameEvents.subscribe('wind:changed', (data) => {
      this.windAngle = data.windAngle;
    });
  }

  createRain() {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(RAIN_COUNT * 6);
    const colors = new Float32Array(RAIN_COUNT * 6);
    const sizes = new Float32Array(RAIN_COUNT);

    for (let i = 0; i < RAIN_COUNT; i++) {
      const i6 = i * 6;
      const dropLength = 0.3 + Math.random() * 0.4;
      
      const x = (Math.random() - 0.5) * VOLUME_WIDTH;
      const y = Math.random() * VOLUME_HEIGHT;
      const z = (Math.random() - 0.5) * VOLUME_DEPTH;
      
      positions[i6] = x;
      positions[i6 + 1] = y;
      positions[i6 + 2] = z;
      positions[i6 + 3] = x;
      positions[i6 + 4] = y - dropLength;
      positions[i6 + 5] = z;

      const alpha = 0.3 + Math.random() * 0.4;
      colors[i6] = 0.7 * alpha;
      colors[i6 + 1] = 0.8 * alpha;
      colors[i6 + 2] = 1.0 * alpha;
      colors[i6 + 3] = 0.5 * alpha;
      colors[i6 + 4] = 0.6 * alpha;
      colors[i6 + 5] = 0.8 * alpha;

      this.velocities[i] = 15 + Math.random() * 10;
      this.initialVelocities[i] = this.velocities[i];
      
      sizes[i] = dropLength;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending
    });

    this.rainLines = new THREE.LineSegments(geometry, material);
    this.updateIntensity(this.rainIntensity);
  }

  setDifficultyManager(difficultyManager) {
    this.difficultyManager = difficultyManager;
    this.setIntensity(this.difficultyManager.getRainIntensity());
  }

  setPlayerPosition(x, y, z) {
    this.playerPosition.set(x, y, z);
    this.rainLines.position.set(x, y, z);
  }

  update(delta) {
    if (this.difficultyManager) {
      this.setIntensity(this.difficultyManager.getRainIntensity());
    }
    
    const positions = this.rainLines.geometry.attributes.position.array;
    const intensityFactor = this.rainIntensity;
    const speedMultiplier = 0.5 + intensityFactor;

    for (let i = 0; i < RAIN_COUNT; i++) {
      const i6 = i * 6;
      
      positions[i6 + 1] -= this.velocities[i] * delta * speedMultiplier;
      positions[i6 + 4] -= this.velocities[i] * delta * speedMultiplier;
      
      const windDrift = this.windAngle * this.velocities[i] * delta;
      positions[i6] += windDrift;
      positions[i6 + 3] += windDrift;
      
      if (positions[i6 + 1] < 0.5) {        const newY = VOLUME_HEIGHT;
        const newX = (Math.random() - 0.5) * VOLUME_WIDTH;
        const newZ = (Math.random() - 0.5) * VOLUME_DEPTH;
        const dropLength = 0.3 + Math.random() * 0.4;
        
        positions[i6] = newX;
        positions[i6 + 1] = newY;
        positions[i6 + 2] = newZ;
        positions[i6 + 3] = newX - this.windAngle * dropLength;
        positions[i6 + 4] = newY - dropLength;
        positions[i6 + 5] = newZ;
      }
    }

    this.rainLines.geometry.attributes.position.needsUpdate = true;
  }

  setIntensity(value) {
    this.rainIntensity = Math.max(0, Math.min(1, value));
    this.updateIntensity(this.rainIntensity);
  }

  updateIntensity(intensity) {
    const visibleCount = Math.floor(RAIN_COUNT * intensity);
    
    const sizes = this.rainLines.geometry.attributes.size.array;
    const sizeMultiplier = 0.5 + intensity;
    
    for (let i = 0; i < RAIN_COUNT; i++) {
      if (i < visibleCount) {
        sizes[i] = (0.1 + Math.random() * 0.1) * sizeMultiplier;
      } else {
        sizes[i] = 0;
      }
    }
    
    this.rainLines.geometry.attributes.size.needsUpdate = true;
    this.rainLines.material.opacity = 0.3 + intensity * 0.5;
    this.rainLines.material.size = 0.1 + intensity * 0.1;
    
    this.rainLines.visible = intensity > 0.05;
  }

  getIntensity() {
    return this.rainIntensity;
  }

  dispose() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    this.scene.remove(this.rainLines);
    this.rainLines.geometry.dispose();
    this.rainLines.material.dispose();
  }
}