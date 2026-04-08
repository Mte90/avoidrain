import * as THREE from 'three';

export class MenuDemoManager {
  constructor(player, camera, chunkManager, difficultyManager) {
    this.player = player;
    this.camera = camera;
    this.chunkManager = chunkManager;
    this.difficultyManager = difficultyManager;
    this.isRunning = false;
    this.demoSpeed = 4.0;
    this.currentSide = 0;
    this.currentZ = 0;
    this.pathTimer = 0;
    this.targetX = -3.5;
    this.legAngle = 0;
    this.lastPosition = new THREE.Vector3();
  }

  start() {
    this.isRunning = true;
    this.currentZ = 0;
    this.currentSide = 0;
    this.targetX = -3.5;
    this.pathTimer = 0;
    
    this.player.getGroup().position.set(-3.5, 0.1, 0);
  }

  stop() {
    this.isRunning = false;
  }

  update(delta) {
    if (!this.isRunning) return;

    this.lastPosition.copy(this.player.getGroup().position);

    this.pathTimer += delta;
    
    if (this.pathTimer > 5.0) {
      this.currentSide = Math.random() > 0.5 ? 1 : -1;
      this.targetX = this.currentSide * 3.5;
      this.pathTimer = 0;
    }

    const currentX = this.player.getGroup().position.x;
    if (Math.abs(currentX - this.targetX) > 0.1) {
      this.player.getGroup().position.x += Math.sign(this.targetX - currentX) * 2.0 * delta;
    }

    this.currentZ -= this.demoSpeed * delta;
    this.player.getGroup().position.z = this.currentZ;
    
    if (this.currentZ < -100) {
      this.currentZ = 20;
      this.player.getGroup().position.z = 20;
    }

    this.camera.position.x = this.player.getGroup().position.x * 0.3;
    this.camera.position.z = this.player.getGroup().position.z + 8;
    this.camera.lookAt(
      this.player.getGroup().position.x,
      this.player.getGroup().position.y + 1,
      this.player.getGroup().position.z - 5
    );

    const moved = this.player.getGroup().position.distanceTo(this.lastPosition);
    if (moved > 0.01) {
      this.legAngle += delta * 12;
      const leftLeg = this.player.getGroup().userData.leftLeg;
      const rightLeg = this.player.getGroup().userData.rightLeg;
      if (leftLeg && rightLeg) {
        leftLeg.rotation.x = Math.sin(this.legAngle) * 0.4;
        rightLeg.rotation.x = Math.sin(this.legAngle + Math.PI) * 0.4;
      }
    }
  }
}
