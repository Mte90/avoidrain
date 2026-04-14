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
    
    let color, label;
    const group = new THREE.Group();
    
    switch(type) {
      case PowerUpType.UMBRELLA:
        color = 0x3498DB;
        label = '🌂';
        
        // Umbrella pole (sticks out of ground)
        const poleHeight = 0.8;
        const poleGeo = new THREE.CylinderGeometry(0.03, 0.03, poleHeight, 8);
        const poleMat = materialCache.get('m-dark');
        const pole = new THREE.Mesh(poleGeo, poleMat);
        pole.position.y = poleHeight / 2;
        pole.castShadow = true;
        group.add(pole);
        
        // Umbrella canopy (cone shape)
        const canopyRadius = 0.6;
        const canopyHeight = 0.4;
        const canopyGeo = new THREE.ConeGeometry(canopyRadius, canopyHeight, 16, 1, true);
        const canopyMat = materialCache.get('m-white', {
          color: color,
          emissive: color,
          emissiveIntensity: 0.3
        });
        const canopy = new THREE.Mesh(canopyGeo, canopyMat);
        canopy.position.y = poleHeight + canopyHeight / 2;
        canopy.castShadow = true;
        group.add(canopy);
        
        // Umbrella tip
        const tipGeo = new THREE.SphereGeometry(0.05, 8, 8);
        const tipMat = materialCache.get('m-metal');
        const tip = new THREE.Mesh(tipGeo, tipMat);
        tip.position.y = poleHeight + canopyHeight;
        group.add(tip);
        
        break;
      case PowerUpType.SPEED:
        color = 0xF39C12;
        label = '⚡';
        break;
      case PowerUpType.SHIELD:
        color = 0x2ECC71;
        label = '🛡️';
        break;
      default:
        color = 0xFFFFFF;
    }
    
    // Main power-up orb (for non-umbrella types)
    if (type !== PowerUpType.UMBRELLA) {
      let geometry;
      switch(type) {
        case PowerUpType.SPEED:
          geometry = new THREE.OctahedronGeometry(0.35, 0);
          break;
        case PowerUpType.SHIELD:
          geometry = new THREE.TorusGeometry(0.3, 0.1, 8, 16);
          break;
        default:
          geometry = new THREE.SphereGeometry(0.3, 16, 16);
      }
      
      const material = materialCache.get('m-white', {
        color: color,
        emissive: color,
        emissiveIntensity: 0.6
      });
      
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.y = 0.4; // Float above ground
      group.add(mesh);
    }
    
    const material = materialCache.get('m-white', {
      color: color,
      emissive: color,
      emissiveIntensity: 0.6
    });
    
    // Power-up base/orb at ground level
    const baseGeo = new THREE.SphereGeometry(0.25, 16, 16);
    const base = new THREE.Mesh(baseGeo, material);
    base.position.y = 0.25;
    base.userData = { 
      type, 
      isPowerUp: true,
      label
    };
    group.add(base);
    
    group.position.set(x, y, z);
    
    return group;
  }
}
