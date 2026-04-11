import * as THREE from 'three';
import { materialCache } from '../utils/MaterialCache.js';
import { BuildingBuilder } from './BuildingBuilder.js';
import { CarBuilder } from './CarBuilder.js';
import { GroundBuilder } from './GroundBuilder.js';
import { PuddleBuilder } from './PuddleBuilder.js';
import { StreetLampBuilder } from './StreetLampBuilder.js';
import { ObstacleBuilder } from './ObstacleBuilder.js';
import { DifficultyManager } from '../systems/DifficultyManager.js';

const CHUNK_SIZE = 40;
const MAX_CARS = 12;
const BUILDING_ZONE_LEFT = { min: -13, max: -5.5 };
const BUILDING_ZONE_RIGHT = { min: 5.5, max: 13 };
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
    this.chunkAheadDistance = CHUNK_SIZE * 4;
    this.chunkRecycleDistance = CHUNK_SIZE / 2;

    this.buildingBuilder = new BuildingBuilder();
    this.carBuilder = new CarBuilder();
    this.groundBuilder = new GroundBuilder();

    this.cars = [];
    this.carPool = [];
    this.buildingPositions = [];
    this.puddles = [];
    this.obstacles = [];
    this.lamps = [];
    this.balconies = [];
    
    this.puddleBuilder = new PuddleBuilder();
    this.lastGeneratedChunkZ = 0;
    this.obstacleBuilder = new ObstacleBuilder();
    
    // Create global ground immediately in constructor
    this.createGlobalGround();
  }

  setDifficultyManager(difficultyManager) {
    this.difficultyManager = difficultyManager;
  }

  createGlobalGround() {
    // Dark ground plane under everything (y=-0.5)
    const groundGeo = new THREE.PlaneGeometry(2000, 2000);
    const groundMat = materialCache.get('m-gray', {
      color: 0x3a3a3a,  // Lighter gray for visibility
      roughness: 0.95,
      metalness: 0.02
    });
    this.globalGround = new THREE.Mesh(groundGeo, groundMat);
    this.globalGround.rotation.x = -Math.PI / 2;
    this.globalGround.position.set(0, -0.5, 0);
    this.globalGround.receiveShadow = true;
    this.scene.add(this.globalGround);
  }

  initialize(scene) {
    this.scene = scene;
    this.chunkPool = [];
    this.activeChunks = [];
    this.currentChunkZ = 0;
    this.playerZ = 0;
    this.chunkAheadDistance = CHUNK_SIZE * 4;
    this.chunkRecycleDistance = CHUNK_SIZE / 2;

    this.buildingBuilder = new BuildingBuilder();
    this.carBuilder = new CarBuilder();
    this.groundBuilder = new GroundBuilder();
    this.puddleBuilder = new PuddleBuilder();
    this.streetLampBuilder = new StreetLampBuilder();
    
    this.cars = [];
    this.carPool = [];
    this.buildingPositions = [];
    this.puddles = [];
    this.obstacles = [];
    this.lamps = [];
    
    this.createGlobalGround();
  }

  resize(position = { x: 0, y: 0, z: 0 }) {
    this.playerZ = position.z;
    this.buildingPositions = [];
    const endZ = position.z + this.chunkAheadDistance;
    this.currentChunkZ = this.getChunkStart(position.z - this.chunkAheadDistance);
    
    while (this.currentChunkZ <= endZ) {
      this.spawnChunk(this.currentChunkZ);
      this.currentChunkZ += CHUNK_SIZE;
    }
  }

  getChunkStart(z) {
    return Math.floor(z / CHUNK_SIZE) * CHUNK_SIZE;
  }

  getBalconyConfig() {
    const forceSide = Math.random() < 0.5 ? 'LEFT' : 'RIGHT';
    const leftHasBalcony = Math.random() < 0.7 || forceSide === 'LEFT';
    const rightHasBalcony = Math.random() < 0.7 || forceSide === 'RIGHT';
    return { leftHasBalcony, rightHasBalcony };
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

    const balconyConfig = this.getBalconyConfig();

    const numBuildings = 2;
    const buildingSpacing = CHUNK_SIZE / numBuildings;
    const chunkWorldZ = chunkZ;
    const buildingsInThisChunk = [];
    
    for (let b = 0; b < numBuildings; b++) {
      const bz = -CHUNK_SIZE / 2 + buildingSpacing / 2 + b * buildingSpacing;
      const leftHeight = 6 + Math.random() * 18;  // 6-24 units, more height variety
      const leftDepth = 30 + Math.random() * 20;  // 30-50 units, much deeper
      const actualLeftDepth = Math.min(leftDepth, buildingSpacing - 0.5);
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
        { x: -6.0, y: 0.15, z: bz + (Math.random() - 0.5) },
        2.5,
        leftHeight,
        actualLeftDepth,
        balconyConfig.leftHasBalcony,
        'left'
      );        leftBuilding.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        chunk.add(leftBuilding);
        this.buildingPositions.push({ side: 'left', minZ: leftMinZ, maxZ: leftMaxZ, chunkZ });
        buildingsInThisChunk.push({ side: 'left', minZ: leftMinZ, maxZ: leftMaxZ });
        if (balconyConfig.leftHasBalcony) {
          this.balconies.push({ side: 'left', x: -6.5, z: bz + (Math.random() - 0.5), chunkZ });
        }
      }

      const rightHeight = 6 + Math.random() * 18;  // 6-24 units
      const rightDepth = 30 + Math.random() * 20;  // 30-50 units
      const actualRightDepth = Math.min(rightDepth, buildingSpacing - 0.5);
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
        { x: 6.0, y: 0.15, z: bz + (Math.random() - 0.5) },
        2.5,
        rightHeight,
        actualRightDepth,
        balconyConfig.rightHasBalcony,
        'right'
      );        rightBuilding.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        chunk.add(rightBuilding);
        this.buildingPositions.push({ side: 'right', minZ: rightMinZ, maxZ: rightMaxZ, chunkZ });
        buildingsInThisChunk.push({ side: 'right', minZ: rightMinZ, maxZ: rightMaxZ });
        if (balconyConfig.rightHasBalcony) {
          this.balconies.push({ side: 'right', x: 6.5, z: bz + (Math.random() - 0.5), chunkZ });
        }
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
      false,
      'left'
    );
    backdropLeft.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material.opacity = 1.0;
        child.material.transparent = false;
        child.material.color.setHex(0x2a2a2a);
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
      false,
      'right'
    );
    backdropRight.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material.opacity = 1.0;
        child.material.transparent = false;
        child.material.color.setHex(0x2a2a2a);
        child.castShadow = false;
        child.receiveShadow = false;
      }
    });
    chunk.add(backdropRight);

    this.spawnCarsForChunk(chunk, chunkZ);
    this.spawnStreetLampsForChunk(chunk, chunkZ);
    this.spawnPuddlesForChunk(chunk, chunkZ);
    this.spawnObstaclesForChunk(chunk, chunkZ);

    return chunk;
  }

  spawnCarsForChunk(chunk, chunkZ) {
    if (this.cars.length >= MAX_CARS) return;
    
    const carSpawnChance = this.difficultyManager 
      ? this.difficultyManager.getCarSpawnChance() 
      : 0.8;
    
    if (Math.random() < carSpawnChance) {
      const length = CHUNK_SIZE;
      const carCount = Math.random() > 0.7 ? 2 : 1;
      
      const lanes = carCount === 2 ? [1.0, -1.0] : [Math.random() > 0.5 ? 1.0 : -1.0];
      
      for (let i = 0; i < carCount; i++) {
        const lane = lanes[i];
        const direction = lane > 0 ? 1 : -1;
        
        let carZ;
        if (direction > 0) {
          carZ = chunkZ - length / 2 + 2;
        } else {
          carZ = chunkZ + length / 2 - 2;
        }
        
        const car = this.createCar({ x: lane, y: 0.15, z: carZ });
        car.userData.direction = direction;
        
        if (direction < 0) {
          car.rotation.y = -Math.PI / 2;
        }
        chunk.add(car);
      }
    }
  }

  spawnStreetLampsForChunk(chunk, chunkZ) {
    const streetLampBuilder = new StreetLampBuilder();
    const length = CHUNK_SIZE;
    const spawnInterval = 30 + Math.random() * 15;
    const buildingsInChunk = chunk.userData.buildings || [];
    const chunkBalconies = this.balconies.filter(b => b.chunkZ === chunkZ);
    
    
    for (let localZ = -length / 2 + 8; localZ < length / 2; localZ += spawnInterval) {
      const worldZ = chunkZ + localZ;
      
      let isLeftLamp = (Math.floor((localZ - (-length / 2 + 8)) / spawnInterval) % 2 === 0);
      
      const hasBalconyAtLeft = chunkBalconies.some(b => 
        b.side === 'left' && Math.abs(b.z - localZ) < 3
      );
      const hasBalconyAtRight = chunkBalconies.some(b => 
        b.side === 'right' && Math.abs(b.z - localZ) < 3
      );
      
      if (isLeftLamp && hasBalconyAtLeft) {
        continue;
      } else if (!isLeftLamp && hasBalconyAtRight) {
        continue;
      }
      
      if (isLeftLamp) {
        const leftLamp = streetLampBuilder.build({ x: -3.5, y: 0.15, z: 0 });
        leftLamp.position.z = localZ;
        leftLamp.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        chunk.add(leftLamp);
        this.lamps.push({ mesh: leftLamp, chunkZ, side: 'left' });
      } else {
        const rightLamp = streetLampBuilder.build({ x: 3.5, y: 0.15, z: 0 });
        rightLamp.position.z = localZ;
        rightLamp.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        chunk.add(rightLamp);
        this.lamps.push({ mesh: rightLamp, chunkZ, side: 'right' });
      }
    }
  }

  spawnPuddlesForChunk(chunk, chunkZ) {
    const length = CHUNK_SIZE;
    const puddleSpawnChance = 0.40;

    for (let z = chunkZ - length / 2; z < chunkZ + length / 2; z += 3) {
      if (Math.random() < puddleSpawnChance) {
        const onLeftLane = Math.random() > 0.5;
        let puddleX;

        const onRoad = Math.random() > 0.4;
        if (onRoad) {
          if (onLeftLane) {
            puddleX = -0.5 - Math.random() * 0.8;
          } else {
            puddleX = 0.5 + Math.random() * 0.8;
          }
        } else {
          if (onLeftLane) {
            puddleX = -3.0 - Math.random() * 1.0;
          } else {
            puddleX = 3.0 + Math.random() * 1.0;
          }
        }

        const puddle = this.puddleBuilder.build({ x: puddleX, y: 0.02, z: z });
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

  spawnObstaclesForChunk(chunk, chunkZ) {
    if (!this.obstacleBuilder) {
      this.obstacleBuilder = new ObstacleBuilder();
    }
    const length = CHUNK_SIZE;
    const obstacleCount = 3;
    const spawnInterval = 20;
    
    const obstacleTypes = ['trashCan', 'bench', 'sign'];
    const usedPositions = [];
    
    for (let i = 0; i < obstacleCount; i++) {
      const side = Math.random() > 0.5 ? 'left' : 'right';
      const sidewalkX = side === 'left' ? -3.5 : 3.5;
      const localZ = -length/2 + 10 + (i * spawnInterval) + Math.random() * 8;
      const worldZ = chunkZ + localZ;
      
      let tooClose = false;
      for (const pos of usedPositions) {
        if (pos.side === side && Math.abs(pos.z - localZ) < 15) {
          tooClose = true;
          break;
        }
      }
      if (tooClose) continue;
      
      for (const lamp of this.lamps) {
        const lampWorldZ = lamp.mesh.position.z;
        if (Math.abs(worldZ - lampWorldZ) < 5) {
          tooClose = true;
          break;
        }
      }
      if (tooClose) continue;
      
      const doorZones = [3, 8, 13, 18, 23, 28, 33, 38];
      let nearDoor = false;
      for (const doorZ of doorZones) {
        if (Math.abs(localZ - doorZ) < 4) {
          nearDoor = true;
          break;
        }
      }
      if (nearDoor) continue;
      
      usedPositions.push({ side, z: localZ });
      
      const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
      const obstacle = this.obstacleBuilder.build({ x: 0, y: 0, z: 0 }, type, side);
      const benchX = type === 'bench' ? (side === 'left' ? -4.5 : 4.5) : sidewalkX;
      obstacle.position.set(benchX, 0.5, localZ);
      
      obstacle.userData.side = side;
      obstacle.userData.obstacleType = type;
      
      obstacle.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = false;
          child.receiveShadow = false;
        }
      });
      chunk.add(obstacle);
      this.obstacles.push({ mesh: obstacle, chunkZ, side, type });
    }
  }

  createCar(position) {
    let car;
    if (this.carPool.length > 0) {
      car = this.carPool.pop();
      car.visible = true;
    } else {
      const colorIndex = Math.floor(Math.random() * 14);
      car = this.carBuilder.build({ x: 0, y: 0, z: 0 }, colorIndex);
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

    const balconyConfig = this.getBalconyConfig();

    const numBuildings = 2;
    const buildingSpacing = CHUNK_SIZE / numBuildings;
    for (let b = 0; b < numBuildings; b++) {
      const bz = -CHUNK_SIZE / 2 + buildingSpacing / 2 + b * buildingSpacing;
      const leftHeight = 6 + Math.random() * 18;
      const leftDepth = 30 + Math.random() * 20;
      const leftBuilding = this.buildingBuilder.build(
        { x: -6.0, y: 0.15, z: bz + (Math.random() - 0.5) },
        2.5,
        leftHeight,
        Math.min(leftDepth, buildingSpacing - 0.5),
        balconyConfig.leftHasBalcony,
        'left'
      );
      leftBuilding.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      chunk.add(leftBuilding);

      const rightHeight = 6 + Math.random() * 18;
      const rightDepth = 30 + Math.random() * 20;
      const rightBuilding = this.buildingBuilder.build(
        { x: 6.0, y: 0.15, z: bz + (Math.random() - 0.5) },
        2.5,
        rightHeight,
        Math.min(rightDepth, buildingSpacing - 0.5),
        balconyConfig.rightHasBalcony,
        'right'
      );
      rightBuilding.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      chunk.add(rightBuilding);
      
      if (balconyConfig.leftHasBalcony) {
        this.balconies.push({ side: 'left', x: -6.5, z: bz + (Math.random() - 0.5), chunkZ });
      }
      if (balconyConfig.rightHasBalcony) {
        this.balconies.push({ side: 'right', x: 6.5, z: bz + (Math.random() - 0.5), chunkZ });
      }
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

    const farBehindThreshold = playerZ - 200;
    for (let i = this.activeChunks.length - 1; i >= 0; i--) {
      const chunk = this.activeChunks[i];
      if (chunk.position.z < farBehindThreshold) {
        const removedChunkZ = chunk.position.z;
        this.buildingPositions = this.buildingPositions.filter(
          pos => pos.chunkZ !== removedChunkZ
        );
        this.lamps = this.lamps.filter(lamp => {
          if (lamp.chunkZ === removedChunkZ) {
            lamp.mesh.traverse((child) => {
              if (child.isMesh && child.geometry) {
                child.geometry.dispose();
              }
            });
            return false;
          }
          return true;
        });
        this.puddles = this.puddles.filter(puddle => {
          if (puddle.chunkZ === removedChunkZ) {
            puddle.mesh.traverse((child) => {
              if (child.isMesh && child.geometry) {
                child.geometry.dispose();
              }
            });
            return false;
          }
          return true;
        });
        this.scene.remove(chunk);
        chunk.visible = false;
        this.chunkPool.push(chunk);
        this.activeChunks.splice(i, 1);
      }
    }

    const furthestNeededZ = playerZ - this.chunkAheadDistance;

    for (let i = this.activeChunks.length - 1; i >= 0; i--) {
      const chunk = this.activeChunks[i];
      if (chunk.position.z > playerZ + CHUNK_SIZE * 3) {
        const removedChunkZ = chunk.position.z;
        this.buildingPositions = this.buildingPositions.filter(
          pos => pos.chunkZ !== removedChunkZ
        );
        this.lamps = this.lamps.filter(lamp => {
          if (lamp.chunkZ === removedChunkZ) {
            lamp.mesh.traverse((child) => {
              if (child.isMesh && child.geometry) {
                child.geometry.dispose();
              }
            });
            return false;
          }
          return true;
        });
        this.puddles = this.puddles.filter(puddle => {
          if (puddle.chunkZ === removedChunkZ) {
            puddle.mesh.traverse((child) => {
              if (child.isMesh && child.geometry) {
                child.geometry.dispose();
              }
            });
            return false;
          }
          return true;
        });
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
    for (let i = this.cars.length - 1; i >= 0; i--) {
      const car = this.cars[i];
      const direction = car.userData.direction || 1;
      car.position.z += carSpeed * direction * delta;
      
      // Hide cars when they go out of view behind camera
      const cameraZ = 180;
      if (direction > 0 && car.position.z > cameraZ + 2) {
        car.visible = false;
      } else if (direction < 0 && car.position.z < -cameraZ - 2) {
        car.visible = false;
      } else {
        car.visible = true;
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
    this.lamps = [];
  }
}