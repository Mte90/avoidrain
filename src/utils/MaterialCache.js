import * as THREE from 'three';

export class MaterialCache {
  constructor() {
    this.cache = new Map();
    this.init();
  }

  init() {
    const list = [
      // Building materials
      ['m-gray', 0x7A8B99, 0.7, 0.1],
      ['m-dark', 0x2C2C2C, 0.8, 0.1],
      ['m-light', 0x959595, 0.9, 0.02],
      ['m-black', 0x1A1A1A, 0.9, 0.1],
      ['m-white', 0xFFFFFF, 0.9, 0.02],
      ['m-blue', 0x3498DB, 0.5, 0.3],
      ['m-metal', 0xC0C0C0, 0.3, 0.8],
      ['m-yellow', 0xFFFF99, 0.3, 0.0, 0xFFFF00, 0.8],
      ['m-red', 0x8B0000, 0.3, 0.3],
      ['m-purple', 0x667eea, 0.2, 0.8],
      // Car materials
      ['m-car-body', 0x4A5568, 0.4, 0.6],
      ['m-car-taillight', 0xDC2626, 0.8, 0.3],
      ['m-car-headlight', 0xFFFFCC, 0.9, 0.0],
      ['m-car-bumper', 0x1F2937, 0.7, 0.5],
      ['m-car-rim', 0xD1D5DB, 0.3, 0.9],
      ['m-car-mirror', 0x374151, 0.5, 0.7],
      // Ground materials
      ['m-road', 0x3A3A3A, 0.8, 0.2],
      ['m-sidewalk', 0x808080, 0.9, 0.1],
      ['m-manhole', 0x2A2A2A, 0.7, 0.4],
      ['m-crack', 0x1A1A1A, 0.9, 0.0],
      // Balcony materials
      ['m-balcony', 0x5A5A5A, 0.8, 0.2],
      ['m-railing', 0x8B0000, 0.5, 0.3],
      // Street lamp materials
      ['m-lamp-pole', 0x2D3748, 0.6, 0.5],
      ['m-lamp-head', 0xFFFACD, 0.9, 0.0],
      ['m-lamp-base', 0x1A202C, 0.7, 0.4],
      // Obstacle materials
      ['m-can', 0xA0A0A0, 0.4, 0.7],
      ['m-wood', 0x8B7355, 0.9, 0.1],
      ['m-sign', 0xF5F5DC, 0.8, 0.0],
      ['m-pole', 0x4A5568, 0.5, 0.6],
      // Character materials - shirts (pre-defined colors)
      ['shirt-blue', 0x3498DB, 0.7, 0.1],
      ['shirt_red', 0xE74C3C, 0.7, 0.1],
      ['shirt_green', 0x2ECC71, 0.7, 0.1],
      ['shirt_purple', 0x9B59B6, 0.7, 0.1],
      ['shirt_orange', 0xF39C12, 0.7, 0.1],
      ['shirt_teal', 0x1ABC9C, 0.7, 0.1],
      // Character materials - pants
      ['pants_dark', 0x2C3E50, 0.8, 0.1],
      ['pants_gray', 0x34495E, 0.8, 0.1],
      ['pants_darker', 0x1A252F, 0.8, 0.1],
      ['pants_bluegray', 0x243447, 0.8, 0.1],
      // Character materials - skin & hair
      ['skin', 0xFFDAB9, 0.8, 0.02],
      ['hair', 0x4A3728, 0.9, 0.0],
      ['shoes', 0x1A1A1A, 0.6, 0.2],
      ['m-eye', 0xFFFFFF, 0.3, 0.0],
      ['m-pupil', 0x000000, 0.9, 0.0],
      ['puddle', 0x5a6a7a, 0.05, 0.95],
      ['m-portal', 0x9333EA, 0.4, 0.8],
      // Emissive materials (essential lights only)
      ['m-emissive-yellow', 0xFFFF00, 1.0, 0.0, 0x887700, 0.5],
      ['m-emissive-red', 0xFF0000, 1.0, 0.0, 0x440000, 0.3],
    ];
    for (const item of list) {
      const [key, c, r, m] = item;
      if (item.length === 6) {
        // Emissive material
        const mat = new THREE.MeshStandardMaterial({ 
          color: c, 
          roughness: r, 
          metalness: m,
          emissive: item[4],
          emissiveIntensity: item[5]
        });
        this.cache.set(key, mat);
      } else {
        this.cache.set(key, new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m }));
      }
    }
  }

  get(key, overrides = {}) {
    const baseMat = this.cache.get(key);
    if (!baseMat) {
      console.warn(`MaterialCache: Unknown key '${key}'`);
      return baseMat;
    }
    
    return baseMat;
  }

  dispose() {
    for (const mat of this.cache.values()) mat.dispose();
    this.cache.clear();
  }
}

export const materialCache = new MaterialCache();