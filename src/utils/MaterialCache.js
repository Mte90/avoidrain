import * as THREE from 'three';

export class MaterialCache {
  constructor() {
    this.cache = new Map();
  }

  get(key, config) {
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    const material = new THREE.MeshStandardMaterial(config);
    this.cache.set(key, material);
    return material;
  }

  dispose() {
    for (const material of this.cache.values()) {
      material.dispose();
    }
    this.cache.clear();
  }
}

export const materialCache = new MaterialCache();
