import * as THREE from 'three';
import { materialCache } from '../utils/MaterialCache.js';

const PUDDLE_RADIUS_MIN = 0.5;
const PUDDLE_RADIUS_MAX = 1.2;

export class PuddleBuilder {
  build(position) {
    const { x, y, z } = position;
    const radius = PUDDLE_RADIUS_MIN + Math.random() * (PUDDLE_RADIUS_MAX - PUDDLE_RADIUS_MIN);
    
    const geometry = new THREE.CircleGeometry(radius, 32);
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const dist = Math.sqrt(positions.getX(i) ** 2 + positions.getY(i) ** 2);
      if (dist > 0.1) {
        const noise = (Math.random() - 0.5) * 0.3;
        positions.setX(i, positions.getX(i) + noise);
        positions.setY(i, positions.getY(i) + noise);
      }
    }
    geometry.computeVertexNormals();
    
    const material = new THREE.MeshStandardMaterial({
      color: 0x4a6a7a,
      roughness: 0.05,
      metalness: 0.6,
      transparent: true,
      opacity: 0.85
    });
    
    const puddle = new THREE.Mesh(geometry, material);
    puddle.rotation.x = -Math.PI / 2;
    puddle.position.set(x, 0.15, z);
    puddle.castShadow = false;
    puddle.receiveShadow = false;
    puddle.userData = { 
      type: 'puddle',
      baseScale: 1.0,
      currentScale: 1.0,
      age: 0
    };
    
    return puddle;
  }
}
