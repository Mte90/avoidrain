import * as THREE from 'three';
import { materialCache } from '../utils/MaterialCache.js';

const PUDDLE_RADIUS_MIN = 0.5;
const PUDDLE_RADIUS_MAX = 1.2;

export class PuddleBuilder {
  build(position) {
    const { x, y, z } = position;
    const radius = PUDDLE_RADIUS_MIN + Math.random() * (PUDDLE_RADIUS_MAX - PUDDLE_RADIUS_MIN);
    
    const geometry = new THREE.CircleGeometry(radius, 32);
    
    // Use cached material instead of creating new instances
    const material = materialCache.get('puddle', {
      color: 0x3a4a5a,
      transparent: true,
      opacity: 0.8,
      metalness: 0.9,
      roughness: 0.1
      // No emissive - not needed for puddles
    });
    
    const puddle = new THREE.Mesh(geometry, material);
    puddle.rotation.x = -Math.PI / 2;
    puddle.position.set(x, y, z);  // Use passed y parameter
    puddle.castShadow = false;
    puddle.receiveShadow = false;
    puddle.userData = { type: 'puddle' };
    
    return puddle;
  }
}
