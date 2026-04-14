import * as THREE from 'three';
import { materialCache } from '../utils/MaterialCache.js';
import { BuildingBuilder } from './BuildingBuilder.js';
import { CarBuilder } from './CarBuilder.js';
import { GroundBuilder } from './GroundBuilder.js';
import { PuddleBuilder } from './PuddleBuilder.js';
import { StreetLampBuilder } from './StreetLampBuilder.js';
import { ObstacleBuilder } from './ObstacleBuilder.js';
import { PedestrianBuilder } from './PedestrianBuilder.js';
import { DifficultyManager } from '../systems/DifficultyManager.js';
import { RENDERER } from '../core/Constants.js';

const CHUNK_SIZE = 40;
const MAX_CARS = 12;
const MAX_PEDESTRIANS = 8;
const SIDEWALK_LEFT = -3.5;
const SIDEWALK_RIGHT = 3.5;

const PED_STATES = {
  WALKING: 'walking',
  SEEKING: 'seeking',
  SHELTERING: 'sheltering'
};

const PED_TRANSITIONS = {
  [PED_STATES.WALKING]: {
    condition: (ped, rainIntensity) => rainIntensity > 0.7 && !ped.userData.hasUmbrella,
    nextState: PED_STATES.SEEKING
  },
  [PED_STATES.SEEKING]: {
    condition: (ped, rainIntensity, arrived) => arrived,
    nextState: PED_STATES.SHELTERING
  },
  [PED_STATES.SHELTERING]: {
    condition: (ped, rainIntensity) => rainIntensity < 0.5,
    nextState: PED_STATES.WALKING
  }
};
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
    this.buildings = [];
    this.dripLines = [];
    
    this.puddleBuilder = new PuddleBuilder();
    this.lastGeneratedChunkZ = 0;
    this.obstacleBuilder = new ObstacleBuilder();
    this.pedestrianBuilder = new PedestrianBuilder();

    this.pedestrians = [];
    this.pedestrianPool = [];
    
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
    this.pedestrians = [];
    this.pedestrianPool = [];
    
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
      if (child.isMesh && RENDERER.SHADOWS_ENABLED) {
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
        this.buildings.push({ group: leftBuilding, chunkZ });
        if (leftBuilding.userData.dripLines) {
          for (const drip of leftBuilding.userData.dripLines) {
            this.dripLines.push({ mesh: drip, chunkZ });
          }
        }
        if (balconyConfig.leftHasBalcony) {
          const balconyFloorY = 0.15 + leftHeight * 0.35;
          this.balconies.push({ side: 'left', x: -6.5, z: bz + (Math.random() - 0.5), chunkZ, y: balconyFloorY });
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
        this.buildings.push({ group: rightBuilding, chunkZ });
        if (rightBuilding.userData.dripLines) {
          for (const drip of rightBuilding.userData.dripLines) {
            this.dripLines.push({ mesh: drip, chunkZ });
          }
        }
        if (balconyConfig.rightHasBalcony) {
          const balconyFloorY = 0.15 + rightHeight * 0.35;
          this.balconies.push({ side: 'right', x: 6.5, z: bz + (Math.random() - 0.5), chunkZ, y: balconyFloorY });
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
    this.spawnPedestriansForChunk(chunk, chunkZ);

    return chunk;
  }

  spawnPedestriansForChunk(chunk, chunkZ) {
    if (this.pedestrians.length >= MAX_PEDESTRIANS) return;
    
    if (Math.random() < 0.5) {
      const side = Math.random() > 0.5 ? 'left' : 'right';
      const sidewalkX = side === 'left' ? SIDEWALK_LEFT : SIDEWALK_RIGHT;
      const direction = side === 'left' ? 1 : -1;
      
      const length = CHUNK_SIZE;
      const localZ = -length / 2 + 5 + Math.random() * (length - 10);
      const worldZ = chunkZ + localZ;

      const hasOverlap = this.pedestrians.some(p => {
        return Math.abs(p.position.z - worldZ) < 8 && 
               ((p.position.x > 0 && sidewalkX > 0) || (p.position.x < 0 && sidewalkX < 0));
      });

      if (hasOverlap) return;

      let pedestrian;
      if (this.pedestrianPool.length > 0) {
        pedestrian = this.pedestrianPool.pop();
        pedestrian.visible = true;
      } else {
        pedestrian = this.pedestrianBuilder.build({ x: sidewalkX, y: 0, z: worldZ });
      }

      pedestrian.position.z = worldZ;
      pedestrian.userData.direction = direction;
      pedestrian.userData.state = PED_STATES.WALKING;
      pedestrian.userData.chunkZ = chunkZ;
      pedestrian.userData.side = side;

      chunk.add(pedestrian);
      this.pedestrians.push(pedestrian);
    }
  }

  findNearestBalcony(pedestrian) {
    const side = pedestrian.userData.side;
    const pos = pedestrian.position;
    
    let nearest = null;
    let nearestDist = Infinity;

    for (const balcony of this.balconies) {
      if (balcony.side !== side) continue;
      
      const dist = Math.abs(balcony.z - pos.z);
      if (dist < nearestDist && dist < 20) {
        nearest = balcony;
        nearestDist = dist;
      }
    }

    return nearest;
  }

  recyclePedestrian(pedestrian) {
    const index = this.pedestrians.indexOf(pedestrian);
    if (index > -1) {
      this.pedestrians.splice(index, 1);
    }
    pedestrian.visible = false;
    this.pedestrianPool.push(pedestrian);
  }

  updatePedestrians(delta) {
    if (!this.difficultyManager) return;
    
    const rainIntensity = this.difficultyManager.getRainIntensity();

    for (const ped of this.pedestrians) {
      const currentState = ped.userData.state;
      const transition = PED_TRANSITIONS[currentState];
      
      if (!transition) continue;

      let arrived = false;
      
      if (currentState === PED_STATES.SEEKING) {
        const target = ped.userData.targetBalcony;
        if (target) {
          const dx = target.x - ped.position.x;
          const dz = target.z - ped.position.z;
          const dist = Math.sqrt(dx * dx + dz * dz);
          
          if (dist < 1.5) {
            arrived = true;
            ped.userData.targetBalcony = null;
          } else {
            const speed = 4;
            const angle = Math.atan2(dz, dx);
            ped.position.x += Math.cos(angle) * speed * delta;
            ped.position.z += Math.sin(angle) * speed * delta;
          }
        }
      }

      const shouldTransition = transition.condition(ped, rainIntensity, arrived);
      
      if (shouldTransition && transition.nextState) {
        const newState = transition.nextState;
        
        if (newState === PED_STATES.SEEKING && !ped.userData.hasUmbrella) {
          const balcony = this.findNearestBalcony(ped);
          if (balcony) {
            ped.userData.targetBalcony = balcony;
            ped.userData.state = newState;
          }
        } else if (newState === PED_STATES.SHELTERING) {
          ped.userData.state = newState;
        } else if (newState === PED_STATES.WALKING) {
          ped.userData.state = newState;
          ped.userData.targetBalcony = null;
        }
      }

      if (ped.userData.state === PED_STATES.WALKING || ped.userData.state === PED_STATES.SEEKING) {
        const speed = ped.userData.state === PED_STATES.SEEKING ? 4 : 2;
        ped.position.z += speed * ped.userData.direction * delta;
        
        if (ped.position.z > this.playerZ + 100 || ped.position.z < this.playerZ - 100) {
          this.recyclePedestrian(ped);
          continue;
        }
        
        this.pedestrianBuilder.animateWalk(ped, delta);
      } else {
        this.pedestrianBuilder.stopAnimation(ped);
      }
    }
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
        
        const overlap = this.cars.some(c => {
          const cDir = c.userData.direction || 1;
          if (cDir !== direction) return false;
          const cLane = c.position.x;
          if (Math.abs(cLane - lane) > 0.5) return false;
          return Math.abs(c.position.z - carZ) < 15;
        });
        
        if (overlap) continue; // Skip spawning this car
        
        const car = this.createCar({ x: lane, y: 0.15, z: carZ });
        car.userData.direction = direction;
        
        if (direction < 0) {
          car.rotation.y = -Math.PI / 2;
        }
        chunk.add(car);
        this.cars.push(car);
      }
    }
  }

  spawnStreetLampsForChunk(chunk, chunkZ) {
    const streetLampBuilder = new StreetLampBuilder();
    const length = CHUNK_SIZE;
    const spawnInterval = 30 + Math.random() * 15;
    const chunkBalconies = this.balconies.filter(b => b.chunkZ === chunkZ);
    const STREET_LAMP_HEIGHT = 3.5;
    
    for (let localZ = -length / 2 + 8; localZ < length / 2; localZ += spawnInterval) {
      const isLeftLamp = (Math.floor((localZ - (-length / 2 + 8)) / spawnInterval) % 2 === 0);
      const balconiesAtLeft = chunkBalconies.filter(b => b.side === 'left' && Math.abs(b.z - localZ) < 3);
      const balconiesAtRight = chunkBalconies.filter(b => b.side === 'right' && Math.abs(b.z - localZ) < 3);
      
      if (balconiesAtLeft.some(b => b.y < STREET_LAMP_HEIGHT)) continue;
      if (balconiesAtRight.some(b => b.y < STREET_LAMP_HEIGHT)) continue;
      
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

        const onRoad = Math.random() < 0.6;
        if (onRoad) {
          if (onLeftLane) {
            puddleX = -0.5 - Math.random() * 0.8;
          } else {
            puddleX = 0.5 + Math.random() * 0.8;
          }
        } else {
          if (onLeftLane) {
            puddleX = -2.5 - Math.random() * 1.5;
          } else {
            puddleX = 2.5 + Math.random() * 1.5;
          }
        }

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

  spawnObstaclesForChunk(chunk, chunkZ) {
    if (!this.obstacleBuilder) {
      this.obstacleBuilder = new ObstacleBuilder();
    }
    const length = CHUNK_SIZE;
    const obstacleCount = 6;
    const spawnInterval = 12;
    
    const obstacleTypes = ['trashCan', 'bench', 'sign'];
    const usedPositions = [];
    const chunkBalconies = this.balconies.filter(b => b.chunkZ === chunkZ);
    const SIGN_POST_POLE_TOP_Y = 2.0;  // Pole height 3.0, so top is at Y=1.5
    
    for (let i = 0; i < obstacleCount; i++) {
      const side = Math.random() > 0.5 ? 'left' : 'right';
      const sidewalkX = side === 'left' ? -3.5 : 3.5;
      const localZ = -length/2 + 10 + (i * spawnInterval) + Math.random() * 8;
      const worldZ = chunkZ + localZ;
      
      // Check for sign posts - don't place under ANY low balcony
      const balconiesAtPos = chunkBalconies.filter(b => b.side === side && Math.abs(b.z - localZ) < 3);
      if (balconiesAtPos.some(b => b.y < SIGN_POST_POLE_TOP_Y)) continue;
      
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
      const benchY = type === 'bench' ? 0.15 : 0.5;
      obstacle.position.set(benchX, benchY, localZ);
      
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
    car.userData.speed = 8 + Math.random() * 6; // 8-14 m/s realistic city speeds
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
      
      // Track buildings for wetness updates
      this.buildings.push({ group: leftBuilding, chunkZ });
      this.buildings.push({ group: rightBuilding, chunkZ });
      // Extract and track drip lines from buildings
      leftBuilding.userData.dripLines.forEach(drip => {
        this.dripLines.push({ mesh: drip, chunkZ });
      });
      rightBuilding.userData.dripLines.forEach(drip => {
        this.dripLines.push({ mesh: drip, chunkZ });
      });
      
      if (balconyConfig.leftHasBalcony) {
        const balconyFloorY = 0.15 + leftHeight * 0.35;
        this.balconies.push({ side: 'left', x: -6.5, z: bz + (Math.random() - 0.5), chunkZ, y: balconyFloorY });
      }
      if (balconyConfig.rightHasBalcony) {
        const balconyFloorY = 0.15 + rightHeight * 0.35;
        this.balconies.push({ side: 'right', x: 6.5, z: bz + (Math.random() - 0.5), chunkZ, y: balconyFloorY });
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
        this.balconies = this.balconies.filter(b => b.chunkZ !== removedChunkZ);
        this.buildings = this.buildings.filter(b => b.chunkZ !== removedChunkZ);
        this.dripLines = this.dripLines.filter(d => d.chunkZ !== removedChunkZ);
        this.obstacles = this.obstacles.filter(o => o.chunkZ !== removedChunkZ);
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

        for (const ped of this.pedestrians) {
          if (ped.userData.chunkZ === removedChunkZ) {
            this.recyclePedestrian(ped);
          }
        }
        this.pedestrians = this.pedestrians.filter(p => p.userData.chunkZ !== removedChunkZ && p.visible);

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
        this.balconies = this.balconies.filter(b => b.chunkZ !== removedChunkZ);
        this.buildings = this.buildings.filter(b => b.chunkZ !== removedChunkZ);
        this.dripLines = this.dripLines.filter(d => d.chunkZ !== removedChunkZ);
        this.obstacles = this.obstacles.filter(o => o.chunkZ !== removedChunkZ);
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

  checkCarHorn(playerPos) {
    const HORN_DISTANCE = 8;
    const HORN_COOLDOWN = 4;
    const playerX = playerPos.x;

    if (playerX >= 2.5 || playerX <= -2.5) return false;

    for (const car of this.cars) {
      const dx = Math.abs(car.position.x - playerX);
      const dz = Math.abs(car.position.z - playerPos.z);
      
      if (dx < 2.5 && dz < HORN_DISTANCE) {
        const cooldown = car.userData.lastHornTime || 0;
        const now = performance.now() / 1000;
        
        if (now - cooldown > HORN_COOLDOWN) {
          car.userData.lastHornTime = now;
          return true;
        }
      }
    }
    return false;
  }

  updateCars(delta) {
    const lanes = { left: [], right: [] };
    const SAFE_DISTANCE = 12;
    const cameraZ = 180;

    for (const car of this.cars) {
      const lane = car.userData.direction > 0 ? 'right' : 'left';
      lanes[lane].push(car);
    }

    for (const lane of ['left', 'right']) {
      lanes[lane].sort((a, b) => lane === 'right' 
        ? a.position.z - b.position.z 
        : b.position.z - a.position.z
      );

      for (let i = 0; i < lanes[lane].length; i++) {
        const car = lanes[lane][i];
        const baseSpeed = car.userData.speed || 8;
        const direction = car.userData.direction || 1;
        let speed = baseSpeed;

        if (i > 0) {
          const carAhead = lanes[lane][i - 1];
          const distToCarAhead = Math.abs(carAhead.position.z - car.position.z);
          
          if (distToCarAhead < SAFE_DISTANCE) {
            const slowdownFactor = Math.max(0.2, (distToCarAhead - 3) / (SAFE_DISTANCE - 3));
            speed = baseSpeed * slowdownFactor;
          }
        }

        car.position.z += speed * direction * delta;

        if (direction > 0 && car.position.z > cameraZ + 2) {
          car.visible = false;
        } else if (direction < 0 && car.position.z < -cameraZ - 2) {
          car.visible = false;
        } else {
          car.visible = true;
        }
      }
    }
  }

  updatePuddles(delta) {
    if (!this.difficultyManager) return;
    const rainIntensity = this.difficultyManager.getRainIntensity();
    
    for (const puddleData of this.puddles) {
      const mesh = puddleData.mesh;
      mesh.userData.age += delta;
      
      // Reduced growth under balconies
      const px = mesh.position.x;
      const pz = mesh.position.z;
      let underBalcony = false;
      for (const b of this.balconies) {
        if (Math.abs(px - b.x) < 3 && Math.abs(pz - b.z) < 5) {
          underBalcony = true;
          break;
        }
      }
      
      const growthRate = underBalcony ? 0.02 : 0.08;
      const targetScale = 1.0 + Math.min(mesh.userData.age * growthRate * rainIntensity, 0.5);
      mesh.userData.currentScale = targetScale;
      mesh.scale.set(targetScale, 1, targetScale);
    }
  }

  updateBuildingWetness(rainIntensity, gameTime) {
    if (!this.difficultyManager) return;
    
    for (const buildingData of this.buildings) {
      const building = buildingData.group;
      const facadeKey = building.userData.facadeKey;
      
      if (!facadeKey) continue;
      
      const wetMat = materialCache.cache.get(`facade-wet-${facadeKey}`);
      const dryMat = materialCache.cache.get(`facade-dry-${facadeKey}`);
      if (!wetMat || !dryMat) continue;
      
      building.traverse((child) => {
        if (child.isMesh && child.material && child.material.color) {
          if (child.material.emissive && child.material.emissiveIntensity > 0) return;
          if (child.material.transparent && child.material.opacity < 0.95) return;
          if (child.userData.isDoor || child.userData.isDoorHandle) return;
          if (child.material.color.getHex() === 0x8B4513) return;
          if (child.material.color.getHex() === 0x8B0000) return;
          if (child.material.userData && child.material.userData.isFacade) {
            if (!child.userData._facadeColor) {
              const dryMat = materialCache.cache.get(`facade-dry-${child.material.userData.facadeKey}`);
              child.userData._facadeColor = dryMat.color.clone();
            }
            const wetMat = materialCache.cache.get(`facade-wet-${child.material.userData.facadeKey}`);
            const dryMat = materialCache.cache.get(`facade-dry-${child.material.userData.facadeKey}`);
            const lerpFactor = rainIntensity * 0.4;
            child.userData._facadeColor.lerpColors(dryMat.color, wetMat.color, lerpFactor);
            child.material.color.copy(child.userData._facadeColor);
          }
        }
      });
      
      for (const drip of building.userData.dripLines || []) {
        if (!drip.userData.phase) continue;
        
        const phase = drip.userData.phase;
        const baseY = drip.userData.baseY;
        const progress = (Math.sin(gameTime * 3 + phase) + 1) / 2;
        
        if (rainIntensity > 0.1) {
          drip.scale.y = 0.1 + progress * 0.9 * rainIntensity;
          drip.position.y = baseY - progress * 0.25 * rainIntensity;
          drip.visible = true;
        } else {
          drip.scale.y = 0.1;
          drip.position.y = baseY;
          drip.visible = false;
        }
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