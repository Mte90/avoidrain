import * as THREE from 'three';
import { GameState } from './GameState.js';
import { RAIN } from '../core/Constants.js';
import { gameEvents } from '../core/EventBus.js';

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
    this.windAngle = 0;
    
    this.unsubscribe = gameEvents.subscribe('wind:changed', (data) => {
      this.windAngle = data.windAngle;
    });
  }

  checkAABBCollision(ax, az, aw, ad, bx, bz, bw, bd) {
    return (
      ax - aw / 2 < bx + bw / 2 &&
      ax + aw / 2 > bx - bw / 2 &&
      az - ad / 2 < bz + bd / 2 &&
      az + ad / 2 > bz - bd / 2
    );
  }

  checkBalconyShelter(playerX, playerZ, chunks, balconies = []) {
    const playerWidth = PLAYER_RADIUS * 2;
    const playerDepth = PLAYER_RADIUS * 2;
    const playerY = 0.1;
    
    for (const balcony of balconies) {
      // Balcony protrudes 2.5m from building edge
      // Left building at x=-6.5, width=2.5 → building right edge at -5.25
      // Balcony extends from -5.25 to -2.75 (center at -4.0)
      // Right building at x=6.5, width=2.5 → building left edge at 5.25
      // Balcony extends from 5.25 to 2.75 (center at 4.0)
      const buildingWidth = 2.5;
      const balconyProtrusion = 2.5;
      
      const buildingEdge = balcony.x < 0 
        ? balcony.x + buildingWidth / 2  // Right edge of left building
        : balcony.x - buildingWidth / 2;  // Left edge of right building
      
      const shelterCenterX = buildingEdge + (balcony.x < 0 ? balconyProtrusion / 2 : -balconyProtrusion / 2);
      const shelterZ = balcony.chunkZ + balcony.z;
      
      // Balcony covers: center ± 1.0m in X (total 2.0m width)
      // Balcony covers: shelterZ ± 1.0m in Z (total 2.0m depth)
      if (this.checkAABBCollision(
        playerX, playerZ, playerWidth, playerDepth,
        shelterCenterX, shelterZ, BALCONY_WIDTH, BALCONY_DEPTH
      )) {
        // Player height is 1.8m, standing at y=0.1, so top is at 1.9m
        // Balcony floor must be above 1.9m to provide shelter
        const playerTopY = playerY + 1.8;
        if (playerTopY < balcony.y - 0.1) {  // Add small buffer for safety
          return true;
        }
      }
    }
    
    return false;
  }

  checkHasBalcony(buildingGroup) {
    for (const child of buildingGroup.children) {
      if (child.geometry) {
        const dims = child.geometry.parameters;
        if (dims && dims.height >= 0.1 && dims.depth >= 1.5) {
          return true;
        }
      }
    }
    return false;
  }

  checkCarCollision(playerX, playerZ, cars) {
    if (!cars || cars.length === 0) return false;
    
    const now = performance.now() * 0.001;
    if (now - this.lastCarHitTime < this.carHitCooldown) {
      return false;
    }
    
    const playerRadius = PLAYER_RADIUS;
    
    for (const car of cars) {
      if (!car.visible) continue;
      
      const carX = car.position.x;
      const carZ = car.position.z;
      const direction = car.userData.direction || 1;
      
      const carLaneX = direction > 0 ? -1.5 : 1.5;
      
      const distX = Math.abs(playerX - carLaneX);
      const distZ = Math.abs(playerZ - carZ);
      
      const collisionDistX = (CAR_WIDTH / 2) + playerRadius;
      const collisionDistZ = (CAR_DEPTH / 2) + playerRadius;
      
      if (distX < collisionDistX && distZ < collisionDistZ) {
        this.lastCarHitTime = now;
        this.wetMeter = Math.min(this.wetMeter + CAR_HIT_PENALTY, 100);
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

  update(delta, playerPosition, chunks, cars, puddles, balconies = []) {
    if (this.gameState.getState() !== GameState.PLAYING) {
      return false;
    }
    
    const playerX = playerPosition.x;
    const playerZ = playerPosition.z;
    
    this.isUnderShelter = this.checkBalconyShelter(playerX, playerZ, chunks, balconies);
    
    if (this.isUnderShelter) {
      this.wetMeter = Math.max(0, this.wetMeter - RAIN.WETNESS_DRAIN_RATE * delta);
    } else {
      this.wetMeter = Math.min(100, this.wetMeter + RAIN.WETNESS_FILL_RATE * delta);
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
    
    if (this.wetMeter >= RAIN.GAME_OVER_THRESHOLD) {
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
    this.originalX = null;
    this.windAngle = 0;
  }

  setOriginalX(x) {
    this.originalX = x;
  }

  hasOriginalX() {
    return this.originalX !== null;
  }

  getOriginalX() {
    return this.originalX;
  }
}