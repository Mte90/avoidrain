import * as THREE from 'three';
import { materialCache } from '../utils/MaterialCache.js';
import { ObstacleBuilder } from '../world/ObstacleBuilder.js';

export class ObstacleManager {
  constructor(scene) {
    this.scene = scene;
    this.obstacles = [];
    this.obstaclePool = [];
    this.obstacleBuilder = new ObstacleBuilder();
    this.spawnDistance = 50;
    this.removeDistance = 150;
  }

  spawnObstaclesForChunk(chunkZ, chunk) {
    const count = Math.floor(Math.random() * 2) + 1;
    
    for (let i = 0; i < count; i++) {
      const side = Math.random() > 0.5 ? 1 : -1;
      const sidewalkX = side * 3.5;
      
      const obstacle = this.createObstacle();
      obstacle.position.set(sidewalkX, 0.5, chunkZ + (Math.random() - 0.5) * 20);
      chunk.add(obstacle);
      
      this.obstacles.push({
        mesh: obstacle,
        chunkZ: chunkZ,
        boundingBox: new THREE.Box3()
      });
    }
  }

  createObstacle() {
    let obstacle;
    
    if (this.obstaclePool.length > 0) {
      obstacle = this.obstaclePool.pop();
      obstacle.visible = true;
    } else {
      obstacle = this.obstacleBuilder.build({ x: 0, y: 0, z: 0 });
    }
    
    return obstacle;
  }

  update(playerZ) {
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      
      if (obs.mesh.position.z - playerZ > this.removeDistance) {
        obs.mesh.visible = false;
        this.obstaclePool.push(obs.mesh);
        this.obstacles.splice(i, 1);
      }
    }
    
    const playerBox = new THREE.Box3();
    const playerPos = this.scene.getObjectByName('player')?.position || new THREE.Vector3();
    playerBox.setFromCenterAndSize(playerPos, new THREE.Vector3(0.5, 1.8, 0.5));
    
    for (const obs of this.obstacles) {
      obs.boundingBox.setFromObject(obs.mesh);
      
      if (playerBox.intersectsBox(obs.boundingBox)) {
        const pushDirection = playerPos.x < obs.mesh.position.x ? -1 : 1;
        return pushDirection * 0.5;
      }
    }
    
    return 0;
  }

  dispose() {
    for (const obs of this.obstacles) {
      this.scene.remove(obs.mesh);
    }
    this.obstacles = [];
    this.obstaclePool = [];
  }
}
