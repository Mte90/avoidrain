import * as THREE from 'three';
import { materialCache } from '../utils/MaterialCache.js';

export class BackdropBuilder {
  constructor() {
    this.leftBuildings = [];
    this.rightBuildings = [];
  }

  createBackdrop(numBuildings = 5) {
    const group = new THREE.Group();
    this.leftBuildings = [];
    this.rightBuildings = [];

    for (let i = 0; i < numBuildings; i++) {
      const width = 2 + Math.random() * 2;
      const height = 8 + Math.random() * 15;
      const depth = 3 + Math.random() * 2;

      const leftBuilding = this._createBuilding(-18, height, width, depth);
      group.add(leftBuilding);
      this.leftBuildings.push(leftBuilding);

      const rightBuilding = this._createBuilding(18, height, width, depth);
      group.add(rightBuilding);
      this.rightBuildings.push(rightBuilding);
    }

    return group;
  }

  _createBuilding(x, height, width, depth) {
    const material = materialCache.get('m-backdrop');
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const building = new THREE.Mesh(geometry, material);

    building.position.set(x, height * 0.6, 0);
    building.castShadow = false;
    building.receiveShadow = false;

    return building;
  }

  updateBuildingPositions(backdropGroup, playerZ) {
    const targetZ = playerZ - 80;
    
    if (Math.abs(backdropGroup.position.z - targetZ) > 0.5) {
      backdropGroup.position.z = targetZ;
    }
  }

  getLeftBuildings() {
    return this.leftBuildings;
  }

  getRightBuildings() {
    return this.rightBuildings;
  }
}
