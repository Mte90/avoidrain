import * as THREE from 'three';
import { GameState } from './GameState.js';

const FILL_RATE = 10;
const DRAIN_RATE = 15;
const CAR_HIT_PENALTY = 20;
const PUDDLE_WETNESS = 5;

const PLAYER_RADIUS = 0.3;
const BALCONY_WIDTH = 2.0;
const BALCONY_DEPTH = 2.0;
const CAR_WIDTH = 2;
const CAR_DEPTH = 1;
const LEFT_SIDEWALK_X = -2.5;
const RIGHT_SIDEWALK_X = 2.5;
const PUDDLE_COLLISION_COOLDOWN = 0.5;

export class WetMeter {
  constructor(gameState) {
    this.gameState = gameState;
    this.wetMeter = 0;
    this.isUnderShelter = false;
    this.isShielded = false;
    this.lastCarHitTime = 0;
    this.carHitCooldown = 1.0;
    this.pushbackVelocity = 0;
    this.pushbackDecay = 5.0;
  }

  checkAABBCollision(ax, az, aw, ad, bx, bz, bw, bd) {
    return (
      ax - aw / 2 < bx + bw / 2 &&
      ax + aw / 2 > bx - bw / 2 &&
      az - ad / 2 < bz + bd / 2 &&
      az + ad / 2 > bz - bd / 2
    );
  }

  checkBalconyShelter(playerX, playerZ, chunks) {
    const playerWidth = PLAYER_RADIUS * 2;
    const playerDepth = PLAYER_RADIUS * 2;
    
    for (const chunk of chunks) {
      const chunkZ = chunk.position.z;
      
      for (const child of chunk.children) {
        if (child instanceof THREE.Group) {
          const hasBalcony = this.checkHasBalcony(child);
          if (!hasBalcony) continue;
          
          const buildingX = child.position.x;
          const buildingZ = child.position.z;
          const buildingWorldZ = chunkZ + buildingZ;
          // Building at x=-6.5, width=2.5, balcony protrudes 2.5 toward road
          // Building edge: -6.5 + 1.25 = -5.25
          // Balcony center: -5.25 + 1.25 = -4.0 (covers -5.25 to -2.75)
          // Left sidewalk: -4.5 to -2.5, player at -3.5
          // Right building at x=6.5: edge at 5.25, balcony covers 2.75 to 5.25
          const buildingWidth = 2.5;
          const balconyProtrusion = 2.5;
          const buildingEdge = buildingX < 0 ? buildingX + buildingWidth / 2 : buildingX - buildingWidth / 2;
          const shelterX = buildingEdge + (buildingX < 0 ? balconyProtrusion / 2 : -balconyProtrusion / 2);
          const shelterZ = buildingWorldZ;
          
          if (this.checkAABBCollision(
            playerX, playerZ, playerWidth, playerDepth,
            shelterX, shelterZ, BALCONY_WIDTH, BALCONY_DEPTH
          )) {
            return true;
          }
        }
      }
    }
    
    return false;
  }

  checkHasBalcony(buildingGroup) {
    for (const child of buildingGroup.children) {
      if (child.geometry) {
        const dims = child.geometry.parameters;
        if (dims && dims.height === 0.2 && dims.depth === 2.0) {
          return true;
        }
      }
    }
    return false;
  }

  checkCarCollision(playerX, playerZ, cars) {
    const currentTime = performance.now() * 0.001;
    if (currentTime - this.lastCarHitTime < this.carHitCooldown) {
      return false;
    }
    
    const playerWidth = PLAYER_RADIUS * 2;
    const playerDepth = PLAYER_RADIUS * 2;
    
    for (const car of cars) {
      if (!car.visible) continue;
      
      const carX = car.position.x;
      const carZ = car.position.z;
      
      if (this.checkAABBCollision(
        playerX, playerZ, playerWidth, playerDepth,
        carX, carZ, CAR_WIDTH, CAR_DEPTH
      )) {
        this.wetMeter = Math.min(this.wetMeter + CAR_HIT_PENALTY, 100);
        this.lastCarHitTime = currentTime;
        
        this.pushbackVelocity = playerX < carX ? -5 : 5;
        
        return true;
      }
    }
    
    return false;
  }

  checkPuddleCollision(playerPosition, puddles) {
    const currentTime = performance.now() * 0.001;
    const playerX = playerPosition.x;
    const playerZ = playerPosition.z;
    
    for (const puddle of puddles) {
      const puddleMesh = puddle.mesh;
      if (!puddleMesh.parent) continue;
      
      const puddleX = puddleMesh.position.x;
      const puddleZ = puddleMesh.position.z;
      const distance = Math.sqrt((playerX - puddleX) ** 2 + (playerZ - puddleZ) ** 2);
      
      if (distance < 0.5 && currentTime - puddle.lastCollision > PUDDLE_COLLISION_COOLDOWN) {
        this.wetMeter = Math.min(this.wetMeter + PUDDLE_WETNESS, 100);
        puddle.lastCollision = currentTime;
      }
    }
  }

  update(delta, playerPosition, chunks, cars, puddles) {
    if (this.gameState.getState() !== GameState.PLAYING) {
      return false;
    }
    
    const playerX = playerPosition.x;
    const playerZ = playerPosition.z;
    
    this.isUnderShelter = this.checkBalconyShelter(playerX, playerZ, chunks);
    
    if (this.isUnderShelter) {
      this.wetMeter = Math.max(0, this.wetMeter - DRAIN_RATE * delta);
    } else {
      this.wetMeter = Math.min(100, this.wetMeter + FILL_RATE * delta);
    }
    
    const wasHit = this.checkCarCollision(playerX, playerZ, cars);
    
    if (this.pushbackVelocity !== 0) {
      this.pushbackVelocity *= Math.exp(-this.pushbackDecay * delta);
      if (Math.abs(this.pushbackVelocity) < 0.1) {
        this.pushbackVelocity = 0;
      }
    }
    
    if (puddles) {
      this.checkPuddleCollision(playerPosition, puddles);
    }
    
    this.gameState.wetMeter = this.wetMeter;
    
    if (this.wetMeter >= 100) {
      this.gameState.setState(GameState.GAME_OVER);
    }
    
    return wasHit;
  }

  getWetMeter() {
    return this.wetMeter;
  }

  getPushbackVelocity() {
    return this.pushbackVelocity;
  }

  getIsUnderShelter() {
    return this.isUnderShelter;
  }
  
  setShielded(shielded) {
    this.isShielded = shielded;
  }
  
  reduceWetness(percent) {
    if (!this.isShielded) {
      this.wetMeter = Math.max(0, this.wetMeter - percent);
    }
  }

  reset() {
    this.wetMeter = 0;
    this.isUnderShelter = false;
    this.isShielded = false;
    this.pushbackVelocity = 0;
    this.lastCarHitTime = 0;
  }
}