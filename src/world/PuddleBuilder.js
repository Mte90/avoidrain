import * as THREE from 'three';

const PUDDLE_RADIUS_MIN = 0.3;
const PUDDLE_RADIUS_MAX = 0.8;

export class PuddleBuilder {
  build(position) {
    const { x, y, z } = position;
    const radius = PUDDLE_RADIUS_MIN + Math.random() * (PUDDLE_RADIUS_MAX - PUDDLE_RADIUS_MIN);
    
    const geometry = new THREE.CircleGeometry(radius, 32);
    const material = new THREE.MeshStandardMaterial({
      color: 0x1a2a2a,
      transparent: true,
      opacity: 0.8,
      metalness: 0.8,
      roughness: 0.2
    });
    
    const puddle = new THREE.Mesh(geometry, material);
    puddle.rotation.x = -Math.PI / 2;
    puddle.position.set(x, y, z);
    puddle.castShadow = false;
    puddle.receiveShadow = false;
    puddle.userData = { type: 'puddle' };
    
    return puddle;
  }
}
