import * as THREE from 'three';

const MAX_RIPPLES = 10;
const RIPPLE_LIFETIME = 0.8;

export class RippleSystem {
  constructor(scene) {
    this.scene = scene;
    this.ripples = [];
    this.ripplePool = [];
    
    // Pre-allocate shared resources
    this.ringGeo = new THREE.RingGeometry(0.1, 0.15, 16);
    this.ringMat = new THREE.MeshBasicMaterial({
      color: 0x88aacc,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide
    });
    
    // Pre-allocate pool
    for (let i = 0; i < MAX_RIPPLES; i++) {
      const mesh = new THREE.Mesh(this.ringGeo, this.ringMat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.visible = false;
      this.scene.add(mesh);
      this.ripplePool.push(mesh);
    }
    
    this.spawnTimers = new Map();
  }

  spawnRipple(x, y, z) {
    if (this.ripplePool.length === 0) return;
    
    const mesh = this.ripplePool.pop();
    mesh.position.set(x, y + 0.01, z);
    mesh.scale.set(0.1, 0.1, 0.1);
    mesh.visible = true;
    mesh.userData.life = RIPPLE_LIFETIME;
    mesh.userData.maxLife = RIPPLE_LIFETIME;
    this.ripples.push(mesh);
  }

  update(delta, puddles) {
    // Auto-spawn ripples
    for (const puddleData of puddles) {
      const mesh = puddleData.mesh;
      const id = mesh.uuid;
      if (!this.spawnTimers.has(id)) {
        this.spawnTimers.set(id, Math.random() * 2);
      }
      
      this.spawnTimers.set(id, this.spawnTimers.get(id) - delta);
      if (this.spawnTimers.get(id) <= 0) {
        this.spawnRipple(
          mesh.position.x + (Math.random() - 0.5) * 0.3,
          mesh.position.y,
          mesh.position.z + (Math.random() - 0.5) * 0.3
        );
        this.spawnTimers.set(id, 0.5 + Math.random() * 1.5);
      }
    }

    // Animate
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const ripple = this.ripples[i];
      ripple.userData.life -= delta;
      const progress = 1 - (ripple.userData.life / ripple.userData.maxLife);
      const scale = progress * 0.6;
      ripple.scale.set(scale, scale, scale);
      ripple.material.opacity = 0.4 * (1 - progress);
      
      if (ripple.userData.life <= 0) {
        ripple.visible = false;
        this.ripplePool.push(ripple);
        this.ripples.splice(i, 1);
      }
    }
  }

  triggerSplash(x, y, z) {
    for (let i = 0; i < 3; i++) {
      this.spawnRipple(x + (Math.random() - 0.5) * 0.2, y, z + (Math.random() - 0.5) * 0.2);
    }
  }

  dispose() {
    for (const r of [...this.ripples, ...this.ripplePool]) {
      this.scene.remove(r);
    }
    this.ripples = [];
    this.ripplePool = [];
    this.spawnTimers.clear();
    this.ringGeo.dispose();
    this.ringMat.dispose();
  }
}
