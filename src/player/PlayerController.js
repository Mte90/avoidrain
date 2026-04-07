import * as THREE from 'three';
import { CharacterBuilder } from './CharacterBuilder.js';

export class PlayerController {
  constructor(inputManager) {
    this.input = inputManager;
    
    this.LEFT_SIDE = -3.5;
    this.RIGHT_SIDE = 3.5;
    
    // Current side state (false = left, true = right)
    this.currentSide = false;
    
    // Player speed
    this.speed = 8.0;
    
    // Lane transition
    this.isTransitioning = false;
    this.transitionDuration = 0.3;
    this.transitionElapsed = 0;
    this.startX = this.LEFT_SIDE;
    this.targetX = this.LEFT_SIDE;
    
    // Leg animation
    this.legAnimationSpeed = 12.0;
    this.legSwingAngle = Math.PI / 4;
    this.leftLeg = null;
    this.rightLeg = null;
    
    // Build character - start at Y=1.8 so body is above road, legs hang down
    this.characterBuilder = new CharacterBuilder();
    this.group = this.characterBuilder.build({ x: this.LEFT_SIDE, y: 0.1, z: 0 });
    
    // Get leg references for animation
    this._findLegs();
    
    // Camera follow
    this.cameraOffset = new THREE.Vector3(0, 4, 7);
    this.cameraLerpSpeed = 3.0;
    this.camera = null;
  }
  
  _findLegs() {
    this.leftLeg = this.group.getObjectByName('leftLeg');
    this.rightLeg = this.group.getObjectByName('rightLeg');
  }
  
  setCamera(camera) {
    this.camera = camera;
    // Set initial camera position
    if (this.camera) {
      this.camera.position.copy(this.group.position).add(this.cameraOffset);
    }
  }
  
  switchSide() {
    if (this.isTransitioning) return;
    
    this.isTransitioning = true;
    this.transitionElapsed = 0;
    this.startX = this.group.position.x;
    this.currentSide = !this.currentSide;
    this.targetX = this.currentSide ? this.RIGHT_SIDE : this.LEFT_SIDE;
  }
  
  update(delta) {
    // Handle input for lane switching
    const direction = this.input.getDirection();
    if (direction.x !== 0 && !this.isTransitioning) {
      const wantsRight = direction.x > 0;
      const shouldSwitch = (wantsRight && !this.currentSide) || (!wantsRight && this.currentSide);
      if (shouldSwitch) {
        this.switchSide();
      }
    }
    
    // Update lane transition with lerp
    if (this.isTransitioning) {
      this.transitionElapsed += delta;
      const t = Math.min(this.transitionElapsed / this.transitionDuration, 1.0);
      // Smooth step interpolation
      const smoothT = t * t * (3 - 2 * t);
      this.group.position.x = this.startX + (this.targetX - this.startX) * smoothT;
      
      if (t >= 1.0) {
        this.isTransitioning = false;
        this.group.position.x = this.targetX;
      }
    }
    
    // Auto-forward movement
    this.group.position.z -= this.speed * delta;
    
    // Animate legs while running (swing forward/back on X axis)
    if (this.leftLeg && this.rightLeg) {
      const time = performance.now() * 0.001;
      const swing = Math.sin(time * this.legAnimationSpeed) * this.legSwingAngle;
      this.leftLeg.rotation.x = swing;
      this.rightLeg.rotation.x = -swing;
    }
    
    // Update camera follow
    if (this.camera) {
      const targetCameraPos = new THREE.Vector3(
        this.group.position.x,
        this.group.position.y + this.cameraOffset.y,
        this.group.position.z + this.cameraOffset.z
      );
      this.camera.position.lerp(targetCameraPos, this.cameraLerpSpeed * delta);
      this.camera.lookAt(this.group.position.x, this.group.position.y + 1, this.group.position.z);
    }
  }
  
  getPosition() {
    return this.group.position.clone();
  }
  
  isOnRoad() {
    return this.group.position.x > this.LEFT_SIDE + 0.1 && this.group.position.x < this.RIGHT_SIDE - 0.1;
  }
  
  getGroup() {
    return this.group;
  }
}