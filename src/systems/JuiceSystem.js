import * as THREE from 'three';
import { materialCache } from '../utils/MaterialCache.js';

export class JuiceSystem {
  constructor(scene) {
    this.scene = scene;
    this.shakeIntensity = 0;
    this.shakeDecay = 5;
    this.particles = [];
    this.particleLifetime = 0.5;
  }

  addScreenShake(intensity) {
    this.shakeIntensity = Math.min(this.shakeIntensity + intensity, 0.5);
  }

  resetShake() {
    this.shakeIntensity = 0;
  }

  createExplosion(position, color = 0xFFFF00, count = 15) {
    const particleGeo = new THREE.SphereGeometry(0.1, 8, 8);
    
    for (let i = 0; i < count; i++) {
      const particleMat = materialCache.get('m-yellow', {
        color: color,
        emissive: color,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 1.0
      });
      
      const particle = new THREE.Mesh(particleGeo, particleMat);
      particle.position.copy(position);
      
      particle.userData.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 5,
        (Math.random() - 0.5) * 5 + 2,
        (Math.random() - 0.5) * 5
      );
      
      particle.userData.life = this.particleLifetime;
      particle.userData.maxLife = this.particleLifetime;
      
      this.scene.add(particle);
      this.particles.push(particle);
    }
    
    if (this.particles.length > 100) {
      this.particles = this.particles.slice(-50);
    }
  }

  update(delta) {
    if (this.shakeIntensity > 0) {
      this.shakeIntensity = Math.max(0, this.shakeIntensity - this.shakeDecay * delta);
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      
      particle.position.addScaledVector(particle.userData.velocity, delta);
      particle.userData.velocity.y -= 9.8 * delta;
      
      particle.userData.life -= delta;
      const lifeRatio = particle.userData.life / particle.userData.maxLife;
      particle.material.opacity = lifeRatio;
      
      if (particle.userData.life <= 0) {
        this.scene.remove(particle);
        particle.geometry.dispose();
        particle.material.dispose();
        this.particles.splice(i, 1);
      }
    }
  }

  applyCameraShake(camera, basePosition) {
    if (this.shakeIntensity > 0) {
      camera.position.x = basePosition.x + (Math.random() - 0.5) * this.shakeIntensity;
      camera.position.y = basePosition.y + (Math.random() - 0.5) * this.shakeIntensity;
      camera.position.z = basePosition.z + (Math.random() - 0.5) * this.shakeIntensity * 0.5;
    }
  }

  dispose() {
    for (const particle of this.particles) {
      this.scene.remove(particle);
      particle.geometry.dispose();
      particle.material.dispose();
    }
    this.particles = [];
  }
}
