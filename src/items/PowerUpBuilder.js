import * as THREE from 'three';
import { materialCache } from '../utils/MaterialCache.js';

export const PowerUpType = {
  UMBRELLA: 'umbrella',
  SPEED: 'speed',
  SHIELD: 'shield'
};

export class PowerUpBuilder {
  build(type, position) {
    const { x, y, z } = position;
    
    let color, geometry, label;
    
    switch(type) {
      case PowerUpType.UMBRELLA:
        color = 0x3498DB;
        geometry = new THREE.SphereGeometry(0.4, 16, 16);
        label = '🌂';
        break;
      case PowerUpType.SPEED:
        color = 0xF39C12;
        geometry = new THREE.OctahedronGeometry(0.35, 0);
        label = '⚡';
        break;
      case PowerUpType.SHIELD:
        color = 0x2ECC71;
        geometry = new THREE.TorusGeometry(0.3, 0.1, 8, 16);
        label = '🛡️';
        break;
      default:
        color = 0xFFFFFF;
        geometry = new THREE.SphereGeometry(0.3, 16, 16);
    }
    
    const material = materialCache.get('m-white', {
      color: color,
      emissive: color,
      emissiveIntensity: 0.6
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.userData = { 
      type, 
      isPowerUp: true,
      label
    };
    
    return mesh;
  }
}
