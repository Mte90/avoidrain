import * as THREE from 'three';
import { BuildingBuilder } from './BuildingBuilder.js';
import { CarBuilder } from './CarBuilder.js';
import { GroundBuilder } from './GroundBuilder.js';
import { PuddleBuilder } from './PuddleBuilder.js';
import { StreetLampBuilder } from './StreetLampBuilder.js';
import { DifficultyManager } from '../systems/DifficultyManager.js';

const CHUNK_SIZE = 40;
const MAX_CARS = 8;
const BUILDING_ZONE_LEFT = { min: -6, max: -3.5 };
const BUILDING_ZONE_RIGHT = { min: 3.5, max: 6 };
const SIDEWALK_ZONE_LEFT = { min: -4.5, max: -2.5 };
const SIDEWALK_ZONE_RIGHT = { min: 2.5, max: 4.5 };
const ROAD_ZONE = { min: -2.5, max: 2.5 };

export class ChunkManager {
  constructor(scene) {
    this.scene = scene;
    this.chunkPool = [];
    this.activeChunks = [];
    this.currentChunkZ = 0;
    this.playerZ = 0;
    this.chunkAheadDistance = CHUNK_SIZE * 3;
    this.chunkRecycleDistance = CHUNK_SIZE / 2;

    this.buildingBuilder = new BuildingBuilder();
    this.carBuilder = new CarBuilder();
    this.groundBuilder = new GroundBuilder();

    this.cars = [];
    this.carPool = [];
    this.buildingPositions = [];
    this.puddles = [];
    
    this.puddleBuilder = new PuddleBuilder();
    this.lastGeneratedChunkZ = 0;
  }

  setDifficultyManager(difficultyManager) {
    this.difficultyManager = difficultyManager;
  }

  initialize(startZ) {
    this.playerZ = startZ;
    this.buildingPositions = [];
    const endZ = startZ + this.chunkAheadDistance;
    this.currentChunkZ = this.getChunkStart(startZ - this.chunkAheadDistance);
    
    while (this.currentChunkZ <= endZ) {
      this.spawnChunk(this.currentChunkZ);
      this.currentChunkZ += CHUNK_SIZE;
    }
  }

  getChunkStart(z) {
    return Math.floor(z / CHUNK_SIZE) * CHUNK_SIZE;
  }

  getBalconyConfig() {
    const balconyChance = this.difficultyManager 
      ? this.difficultyManager.getBalconyChance() 
      : 0.98;
    
    if (this.difficultyManager && this.difficultyManager.getGameTime() < 60) {
      const configs = ['BOTH', 'BOTH', 'BOTH', 'LEFT', 'RIGHT'];
      return configs[Math.floor(Math.random() * configs.length)];
    }
    
    if (Math.random() > balconyChance) {
      return 'NEITHER';
    }
    
    const configs = ['BOTH', 'BOTH', 'LEFT', 'RIGHT'];
    return configs[Math.floor(Math.random() * configs.length)];
  }

  createChunk(chunkZ) {
    const chunk = new THREE.Group();
    chunk.userData = { chunkZ };

    const length = CHUNK_SIZE;
    const sidewalkWidth = 2;
    const roadWidth = 5;

    const groundGroup = this.groundBuilder.build(
      { x: 0, y: 0, z: 0 },
      sidewalkWidth,
      roadWidth,
      length
    );
    groundGroup.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    chunk.add(groundGroup);

    const leftBalconyConfig = this.getBalconyConfig();
    const rightBalconyConfig = this.getBalconyConfig();

    const numBuildings = 2;
    const buildingSpacing = CHUNK_SIZE / numBuildings;
    const chunkWorldZ = chunkZ;
    const buildingsInThisChunk = [];
    
    for (let b = 0; b < numBuildings; b++) {
      const bz = -CHUNK_SIZE / 2 + buildingSpacing / 2 + b * buildingSpacing;
      const leftHeight = 5 + Math.random() * 3;
      const leftDepth = 14 + Math.random() * 4;
      const actualLeftDepth = Math.min(leftDepth, buildingSpacing - 1);
      const leftWorldZ = chunkWorldZ + bz;
      const leftMinZ = leftWorldZ - actualLeftDepth / 2;
      const leftMaxZ = leftWorldZ + actualLeftDepth / 2;
      
      let leftOverlaps = false;
      for (const pos of this.buildingPositions) {
        if (pos.side === 'left' && leftMinZ < pos.maxZ && leftMaxZ > pos.minZ) {
          leftOverlaps = true;
          break;
        }
      }
      
      if (!leftOverlaps) {
      const leftBuilding = this.buildingBuilder.build(
        { x: -6.5, y: 0.15, z: bz },  // Raised from y: 0 to y: 0.15 to sit on ground
          2.5,
          leftHeight,
          actualLeftDepth,
          leftBalconyConfig === 'LEFT' || leftBalconyConfig === 'BOTH',
          'left'
        );
        leftBuilding.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        chunk.add(leftBuilding);
        this.buildingPositions.push({ side: 'left', minZ: leftMinZ, maxZ: leftMaxZ, chunkZ });
        buildingsInThisChunk.push({ side: 'left', minZ: leftMinZ, maxZ: leftMaxZ });
      }

      const rightHeight = 5 + Math.random() * 3;
      const rightDepth = 14 + Math.random() * 4;
      const actualRightDepth = Math.min(rightDepth, buildingSpacing - 1);
      const rightWorldZ = chunkWorldZ + bz;
      const rightMinZ = rightWorldZ - actualRightDepth / 2;
      const rightMaxZ = rightWorldZ + actualRightDepth / 2;
      
      let rightOverlaps = false;
      for (const pos of this.buildingPositions) {
        if (pos.side === 'right' && rightMinZ < pos.maxZ && rightMaxZ > pos.minZ) {
          rightOverlaps = true;
          break;
        }
      }
      
      if (!rightOverlaps) {
      const rightBuilding = this.buildingBuilder.build(
        { x: 6.5, y: 0.15, z: bz },  // Raised from y: 0 to y: 0.15 to sit on ground
          2.5,
          rightHeight,
          actualRightDepth,
          rightBalconyConfig === 'RIGHT' || rightBalconyConfig === 'BOTH',
          'right'
        );
        rightBuilding.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        chunk.add(rightBuilding);
        this.buildingPositions.push({ side: 'right', minZ: rightMinZ, maxZ: rightMaxZ, chunkZ });
        buildingsInThisChunk.push({ side: 'right', minZ: rightMinZ, maxZ: rightMaxZ });
      }
    }
    
    chunk.userData.buildings = buildingsInThisChunk;

    // Add backdrop buildings (distant city silhouette)
    const backdropHeight = 8 + Math.random() * 12;
    const backdropDepth = 8 + Math.random() * 6;
    
    // Left backdrop building
    const backdropLeft = this.buildingBuilder.build(
      { x: -18, y: 0, z: 0 },
      2.5,
      backdropHeight,
      backdropDepth,
      false,  // No balconies on backdrop
      'left'
    );
    // Make darker for distance effect
    backdropLeft.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material.color.multiplyScalar(0.4);
        child.castShadow = false;
        child.receiveShadow = false;
      }
    });
    chunk.add(backdropLeft);
    
    // Right backdrop building
    const backdropRight = this.buildingBuilder.build(
      { x: 18, y: 0, z: 0 },
      2.5,
      backdropHeight,
      backdropDepth,
      false,  // No balconies on backdrop
      'right'
    );
    // Make darker for distance effect
    backdropRight.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material.color.multiplyScalar(0.4);
        child.castShadow = false;
        child.receiveShadow = false;
      }
    });
    chunk.add(backdropRight);

    this.spawnCarsForChunk(chunk, chunkZ);
    this.spawnStreetLampsForChunk(chunk, chunkZ);
    this.spawnPuddlesForChunk(chunk, chunkZ);

    return chunk;
  }

  spawnCarsForChunk(chunk, chunkZ) {
    if (this.cars.length >= MAX_CARS) return;
    
    const carSpawnChance = this.difficultyManager 
      ? this.difficultyManager.getCarSpawnChance() 
      : 0.2;
    
    if (Math.random() < carSpawnChance) {
      const length = CHUNK_SIZE;
      const carCount = Math.random() > 0.7 ? 2 : 1;
      for (let i = 0; i < carCount; i++) {
        const lane = Math.random() > 0.5 ? 0.5 : -0.5;
        const carZ = chunkZ - length / 2 + (i + 1) * (length / (carCount + 1));
        const car = this.createCar({ x: lane, y: 0, z: carZ });
        chunk.add(car);
      }
    }
  }

  spawnStreetLampsForChunk(chunk, chunkZ) {
    const streetLampBuilder = new StreetLampBuilder();
    const length = CHUNK_SIZE;
    const spawnInterval = 12 + Math.random() * 6;  // More frequent lamps (was 15-20)
    
    for (let z = chunkZ - length / 2 + 5; z < chunkZ + length / 2; z += spawnInterval) {
      const leftLamp = streetLampBuilder.build({ x: -3.5, y: 0, z: z });  // On sidewalk at -3.5 (was -7.5)
      leftLamp.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      chunk.add(leftLamp);

      const rightLamp = streetLampBuilder.build({ x: 3.5, y: 0, z: z });  // On sidewalk at 3.5 (was 7.5)
      rightLamp.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      chunk.add(rightLamp);
    }
  }

  spawnPuddlesForChunk(chunk, chunkZ) {
    const length = CHUNK_SIZE;
    const puddleSpawnChance = 0.15;
    
    for (let z = chunkZ - length / 2; z < chunkZ + length / 2; z += 2) {
      if (Math.random() < puddleSpawnChance) {
        const puddleX = -2 + Math.random() * 4;
        const puddle = this.puddleBuilder.build({ x: puddleX, y: 0, z: z });
        puddle.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = false;
            child.receiveShadow = false;
          }
        });
        chunk.add(puddle);
        this.puddles.push({ mesh: puddle, chunkZ, lastCollision: 0 });
      }
    }
  }

  createCar(position) {
    let car;
    if (this.carPool.length > 0) {
      car = this.carPool.pop();
      car.visible = true;
    } else {
      car = this.carBuilder.build({ x: 0, y: 0, z: 0 }, -1);
      car.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    }
    
    car.position.set(position.x, position.y, position.z);
    this.cars.push(car);
    return car;
  }

  hasChunkAtZ(z) {
    return this.activeChunks.some(c => c.position.z === z);
  }

  spawnChunk(chunkZ) {
    if (this.hasChunkAtZ(chunkZ)) {
      return;
    }
    
    let chunk;
    
    if (this.chunkPool.length > 0) {
      chunk = this.chunkPool.pop();
      chunk.visible = true;
      this.updateChunkContent(chunk, chunkZ);
    } else {
      chunk = this.createChunk(chunkZ);
    }
    
    chunk.position.z = chunkZ;
    this.scene.add(chunk);
    this.activeChunks.push(chunk);
  }

  updateChunkContent(chunk, chunkZ) {
    const oldChunkZ = chunk.userData.chunkZ;
    if (oldChunkZ !== undefined) {
      this.buildingPositions = this.buildingPositions.filter(
        pos => pos.chunkZ !== oldChunkZ
      );
    }

    while (chunk.children.length > 0) {
      const child = chunk.children[0];
      chunk.remove(child);
      
      if (child.userData.isCar) {
        this.recycleCar(child);
      } else if (child instanceof THREE.Group) {
        child.traverse((obj) => {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) {
            if (Array.isArray(obj.material)) {
              obj.material.forEach(m => m.dispose());
            } else {
              obj.material.dispose();
            }
          }
        });
      }
    }

    chunk.userData.chunkZ = chunkZ;

    const length = CHUNK_SIZE;
    const sidewalkWidth = 2;
    const roadWidth = 5;

    const groundGroup = this.groundBuilder.build(
      { x: 0, y: 0, z: 0 },
      sidewalkWidth,
      roadWidth,
      length
    );
    groundGroup.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    chunk.add(groundGroup);

    const leftBalconyConfig = this.getBalconyConfig();
    const rightBalconyConfig = this.getBalconyConfig();

    const numBuildings = 2;
    const buildingSpacing = CHUNK_SIZE / numBuildings;
    for (let b = 0; b < numBuildings; b++) {
      const bz = -CHUNK_SIZE / 2 + buildingSpacing / 2 + b * buildingSpacing;
      const leftHeight = 5 + Math.random() * 3;
      const leftDepth = 14 + Math.random() * 4;
      const leftBuilding = this.buildingBuilder.build(
        { x: -6.5, y: 0, z: bz },
        2.5,
        leftHeight,
        Math.min(leftDepth, buildingSpacing - 1),
        leftBalconyConfig === 'LEFT' || leftBalconyConfig === 'BOTH',
        'left'
      );
      leftBuilding.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      chunk.add(leftBuilding);

      const rightHeight = 5 + Math.random() * 3;
      const rightDepth = 14 + Math.random() * 4;
      const rightBuilding = this.buildingBuilder.build(
        { x: 6.5, y: 0, z: bz },
        2.5,
        rightHeight,
        Math.min(rightDepth, buildingSpacing - 1),
        rightBalconyConfig === 'RIGHT' || rightBalconyConfig === 'BOTH',
        'right'
      );
      rightBuilding.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      chunk.add(rightBuilding);
    }
    this.spawnCarsForChunk(chunk, chunkZ);
    this.spawnStreetLampsForChunk(chunk, chunkZ);
  }

  recycleCar(car) {
    const index = this.cars.indexOf(car);
    if (index > -1) {
      this.cars.splice(index, 1);
    }
    car.visible = false;
    this.carPool.push(car);
  }

  update(playerZ) {
    this.playerZ = playerZ;

    const chunkBehindPlayerThreshold = playerZ + this.chunkRecycleDistance;
    const furthestNeededZ = playerZ - this.chunkAheadDistance;

    for (let i = this.activeChunks.length - 1; i >= 0; i--) {
      const chunk = this.activeChunks[i];
      if (chunk.position.z > chunkBehindPlayerThreshold) {
        const removedChunkZ = chunk.position.z;
        this.buildingPositions = this.buildingPositions.filter(
          pos => pos.chunkZ !== removedChunkZ
        );
        this.scene.remove(chunk);
        this.chunkPool.push(chunk);
        this.activeChunks.splice(i, 1);
      }
    }

    if (this.currentChunkZ > furthestNeededZ) {
      while (this.currentChunkZ > furthestNeededZ) {
        this.currentChunkZ -= CHUNK_SIZE;
        this.spawnChunk(this.currentChunkZ);
      }
    } else if (this.currentChunkZ <= playerZ + CHUNK_SIZE) {
      while (this.currentChunkZ <= playerZ + CHUNK_SIZE) {
        this.spawnChunk(this.currentChunkZ);
        this.currentChunkZ += CHUNK_SIZE;
      }
    }
  }

  updateCars(delta) {
    const carSpeed = 8;
    for (const car of this.cars) {
      car.position.z += carSpeed * delta;
      if (car.position.z > 20) {
        car.position.z = -40;
      }
    }
  }

  getActiveChunks() {
    return this.activeChunks;
  }

  dispose() {
    for (const chunk of this.activeChunks) {
      this.scene.remove(chunk);
      chunk.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach(m => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
    }

    for (const car of this.carPool) {
      car.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach(m => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
    }

    this.activeChunks = [];
    this.chunkPool = [];
    this.cars = [];
    this.carPool = [];
    this.buildingPositions = [];
  }
}