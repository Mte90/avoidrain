import * as THREE from 'three';
import { materialCache } from '../utils/MaterialCache.js';

const PUDDLE_RADIUS_MIN = 0.5;
const PUDDLE_RADIUS_MAX = 1.2;

export class PuddleBuilder {
  build(position) {
    const { x, y, z } = position;
    const radius = PUDDLE_RADIUS_MIN + Math.random() * (PUDDLE_RADIUS_MAX - PUDDLE_RADIUS_MIN);
    
    const geometry = new THREE.CircleGeometry(radius, 32);
    const material = materialCache.get('puddle');
    
    const puddle = new THREE.Mesh(geometry, material);
    puddle.rotation.x = -Math.PI / 2;
    puddle.position.set(x, y + 0.15, z);
    puddle.castShadow = false;
    puddle.receiveShadow = false;
    puddle.userData = { type: 'puddle' };
    
    return puddle;
  }
}
