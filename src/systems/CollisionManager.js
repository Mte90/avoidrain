import * as THREE from 'three';
import { gameEvents } from '../core/EventBus.js';

export class CollisionManager {
  constructor() {
    this.playerBoxSize = new THREE.Vector3(0.6, 1.8, 0.6);
    this.pushbackStrength = 0.8;
    this.blinkDuration = 0.5;
    this.blinkInterval = 0.1;
    
    this.isBlinking = false;
    this.blinkTimer = 0;
    this.blinkState = true;
    this.nextBlinkToggle = 0;
  }

  /**
   * Check collision with obstacles (trash cans, benches, signs)
   * @param {THREE.Group} playerGroup - Player's group
   * @param {Array} obstacles - Array of obstacle objects {mesh}
   * @param {Function} onCollision - Callback when collision occurs
   * @returns {number} Total pushback X value to apply
   */
  checkObstacles(playerGroup, obstacles, onCollision = null) {
    let totalPushbackX = 0;
    
    const playerBox = new THREE.Box3().setFromCenterAndSize(
      playerGroup.position,
      this.playerBoxSize
    );

    for (const obs of obstacles) {
      if (!obs.mesh || !obs.mesh.visible) continue;
      
      const obstacleBox = new THREE.Box3().setFromObject(obs.mesh);
      
      if (playerBox.intersectsBox(obstacleBox)) {
        // Calculate push direction (away from obstacle center)
        const pushDir = new THREE.Vector3()
          .subVectors(playerGroup.position, obs.mesh.position)
          .normalize();
        
        // Only push horizontally
        pushDir.y = 0;
        
        const pushX = pushDir.x > 0 ? this.pushbackStrength : -this.pushbackStrength;
        totalPushbackX += pushX;
        
        if (onCollision) onCollision('obstacle', obs);
      }
    }

    return totalPushbackX;
  }

  /**
   * Check collision with cars
   * @param {THREE.Group} playerGroup - Player's group
   * @param {Array} cars - Array of car meshes
   * @param {Function} onCollision - Callback when collision occurs
   * @returns {number} Total pushback X value
   */
  checkCars(playerGroup, cars, onCollision = null) {
    let totalPushbackX = 0;
    
    const playerBox = new THREE.Box3().setFromCenterAndSize(
      playerGroup.position,
      this.playerBoxSize
    );

    for (const car of cars) {
      if (!car.visible) continue;
      
      const carBox = new THREE.Box3().setFromObject(car);
      
      // Expand car box slightly for better detection
      carBox.expandByScalar(0.2);
      
      if (playerBox.intersectsBox(carBox)) {
        // Push away from car
        const pushDir = new THREE.Vector3()
          .subVectors(playerGroup.position, car.position)
          .normalize();
        
        pushDir.y = 0;
        pushDir.z = 0;  // Cars only push horizontally
        
        const pushX = pushDir.x > 0 ? this.pushbackStrength : -this.pushbackStrength;
        totalPushbackX += pushX;
        
        if (onCollision) onCollision('car', car);
      }
    }

    return totalPushbackX;
  }

  /**
   * Check collision with puddles (splashes player)
   * @param {THREE.Group} playerGroup - Player's group
   * @param {Array} puddles - Array of puddle objects {mesh}
   * @param {Function} onCollision - Callback when collision occurs
   * @returns {boolean} True if collision occurred
   */
  checkPuddles(playerGroup, puddles, onCollision = null) {
    const playerPos = playerGroup.position;
    
    for (const puddle of puddles) {
      if (!puddle.mesh || !puddle.mesh.visible) continue;
      
      const puddlePos = puddle.mesh.position;
      
      // Simple distance check (puddles are flat circles)
      const dx = playerPos.x - puddlePos.x;
      const dz = playerPos.z - puddlePos.z;
      const distance = Math.sqrt(dx * dx + dz * dz);
      
      // Puddle radius is approximately 0.5-1.2, use 1.5 for safety
      if (distance < 1.5) {
        if (onCollision) onCollision('puddle', puddle);
        return true;
      }
    }
    
    return false;
  }

  /**
   * Check collision with lampposts
   * @param {THREE.Group} playerGroup - Player's group
   * @param {Array} lampposts - Array of lamppost meshes
   * @param {Function} onCollision - Callback when collision occurs
   * @returns {number} Total pushback X value
   */
  checkLampposts(playerGroup, lampposts, onCollision = null) {
    let totalPushbackX = 0;
    
    const playerBox = new THREE.Box3().setFromCenterAndSize(
      playerGroup.position,
      this.playerBoxSize
    );

    for (const lamp of lampposts) {
      if (!lamp.visible) continue;
      
      const lampBox = new THREE.Box3().setFromObject(lamp);
      
      if (playerBox.intersectsBox(lampBox)) {
        const pushDir = new THREE.Vector3()
          .subVectors(playerGroup.position, lamp.position)
          .normalize();
        
        pushDir.y = 0;
        
        const pushX = pushDir.x > 0 ? this.pushbackStrength : -this.pushbackStrength;
        totalPushbackX += pushX;
        
        if (onCollision) onCollision('lamppost', lamp);
      }
    }

    return totalPushbackX;
  }

  /**
   * Full collision check - run all collision types
   * @param {THREE.Group} playerGroup - Player's group
   * @param {Object} worldData - Object containing obstacles, cars, puddles, lampposts
   * @returns {Object} { pushbackX, collisionOccurred }
   */
  checkAll(playerGroup, worldData) {
    const { 
      obstacles = [], 
      cars = [], 
      puddles = [], 
      lampposts = [],
      onCollision = null 
    } = worldData;
    
    let totalPushbackX = 0;
    let collisionOccurred = false;
    let hitType = null;

    const obsPushback = this.checkObstacles(playerGroup, obstacles, onCollision);
    if (Math.abs(obsPushback) > 0) {
      totalPushbackX += obsPushback;
      collisionOccurred = true;
      if (!hitType) hitType = 'obstacle';
    }

    const carPushback = this.checkCars(playerGroup, cars, onCollision);
    if (Math.abs(carPushback) > 0) {
      totalPushbackX += carPushback;
      collisionOccurred = true;
      if (!hitType) hitType = 'car';
    }

    const lampPushback = this.checkLampposts(playerGroup, lampposts, onCollision);
    if (Math.abs(lampPushback) > 0) {
      totalPushbackX += lampPushback;
      collisionOccurred = true;
      if (!hitType) hitType = 'lamppost';
    }

    const puddleHit = this.checkPuddles(playerGroup, puddles, onCollision);
    if (puddleHit) {
      collisionOccurred = true;
      if (!hitType) hitType = 'puddle';
    }

    totalPushbackX = Math.max(-this.pushbackStrength * 2, 
                       Math.min(this.pushbackStrength * 2, totalPushbackX));

    return { 
      pushbackX: totalPushbackX, 
      collisionOccurred,
      hitType
    };
  }

  /**
   * Start blinking effect
   */
  triggerBlink() {
    this.isBlinking = true;
    this.blinkTimer = this.blinkDuration;
    this.blinkState = true;
    this.nextBlinkToggle = this.blinkInterval;
  }

  /**
   * Update blink effect - call each frame
   * @param {THREE.Group} playerGroup - Player group to toggle visibility
   * @param {number} delta - Time since last frame
   * @returns {boolean} Whether player is currently visible
   */
  updateBlink(playerGroup, delta) {
    if (!this.isBlinking) return true;
    
    this.blinkTimer -= delta;
    
    if (this.blinkTimer <= 0) {
      // Reset visibility
      this.isBlinking = false;
      playerGroup.visible = true;
      return true;
    }
    
    // Toggle blink state
    this.nextBlinkToggle -= delta;
    if (this.nextBlinkToggle <= 0) {
      this.blinkState = !this.blinkState;
      playerGroup.visible = this.blinkState;
      this.nextBlinkToggle = this.blinkInterval;
    }
    
    return this.blinkState;
  }

  /**
   * Check if player is currently blinking
   */
  isBlinkingActive() {
    return this.isBlinking;
  }

  /**
   * Get remaining blink time
   */
  getBlinkTimeRemaining() {
    return this.blinkTimer;
  }

  /**
   * Reset collision state
   */
  reset() {
    this.isBlinking = false;
    this.blinkTimer = 0;
    this.blinkState = true;
  }
}

export const collisionManager = new CollisionManager();