import * as THREE from 'three';
import { materialCache } from '../utils/MaterialCache.js';

const TRASH_CAN_COLORS = [0x2E8B57, 0x8B7A34, 0x5D4037, 0x455A64];  // Green, gold, brown, slate
const BENCH_BACK_COLORS = [0x8B4513, 0xA0522D, 0xCD853F, 0xDEB887];  // Various wood tones
const SIGN_SIGNS = [0xFFD700, 0xFF6347, 0x9370DB, 0x40E0D0];  // Yellow, tomato, medium purple, Turk

export class ObstacleBuilder {
  constructor() {}

  /**
   * Build a trash can obstacle
   * @param {Object} position - {x, y, z} position
   * @returns {THREE.Group} Trash can group
   */
  buildTrashCan(position = { x: 0, y: 0, z: 0 }) {
    const group = new THREE.Group();
    
    const canColor = TRASH_CAN_COLORS[Math.floor(Math.random() * TRASH_CAN_COLORS.length)];
    const canMat = materialCache.get('m-gray');
    
    const bodyRadius = 0.5;
    const bodyHeight = 1.0;
    const bodyGeo = new THREE.CylinderGeometry(bodyRadius, bodyRadius * 0.85, bodyHeight, 16);
    const body = new THREE.Mesh(bodyGeo, canMat);
    body.position.y = bodyHeight / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);
    
    const bottomGeo = new THREE.CylinderGeometry(bodyRadius * 0.9, bodyRadius * 0.7, 0.15, 16);
    const bottom = new THREE.Mesh(bottomGeo, canMat);
    bottom.position.y = 0;
    bottom.receiveShadow = true;
    group.add(bottom);
    
    const topGeo = new THREE.CylinderGeometry(bodyRadius * 0.85, bodyRadius, 0.12, 16);
    const top = new THREE.Mesh(topGeo, canMat);
    top.position.y = bodyHeight;
    top.receiveShadow = true;
    group.add(top);
    
    const lidRadius = bodyRadius * 1.15;
    const lidGeo = new THREE.CylinderGeometry(lidRadius, lidRadius, 0.12, 16);
    const lidMat = materialCache.get('m-dark');
    const lid = new THREE.Mesh(lidGeo, lidMat);
    lid.position.y = bodyHeight + 0.06;
    lid.castShadow = true;
    group.add(lid);
    
    group.position.set(position.x, position.y, position.z);
    return group;
  }

  /**
   * Build a bench obstacle (bench + backrest)
   * @param {Object} position - {x, y, z} position
   * @returns {THREE.Group} Bench group
   */
  buildBench(position = { x: 0, y: 0, z: 0 }, side = 'right') {
    const group = new THREE.Group();
    
    // Back faces buildings: left side → 3π/2 (back to x=-6.5), right side → π/2 (back to x=6.5)
    group.rotation.y = side === 'left' ? 3 * Math.PI / 2 : Math.PI / 2;
    
    const woodColor = BENCH_BACK_COLORS[Math.floor(Math.random() * BENCH_BACK_COLORS.length)];
    const woodMat = materialCache.get('m-accent');
    const metalMat = materialCache.get('m-dark');
    
    const benchWidth = 2.5;
    const benchHeight = 0.5;
    const benchDepth = 0.4;
    const seatHeight = 0.6;
    
    // Seat
    const seatGeo = new THREE.BoxGeometry(benchWidth, benchHeight, benchDepth);
    const seat = new THREE.Mesh(seatGeo, woodMat);
    seat.position.y = seatHeight;
    seat.castShadow = true;
    seat.receiveShadow = true;
    group.add(seat);
    
    // Backrest
    const backHeight = 0.8;
    const backThickness = 0.05;
    const backGeo = new THREE.BoxGeometry(benchWidth, backHeight, backThickness);
    const backrest = new THREE.Mesh(backGeo, woodMat);
    backrest.position.set(0, seatHeight + benchHeight / 2 + backHeight / 2, benchDepth / 2);
    backrest.castShadow = true;
    backrest.receiveShadow = true;
    group.add(backrest);
    
    // Legs - 4 legs (2 front, 2 back)
    const legHeight = seatHeight;
    const legWidth = 0.1;
    const legDepth = 0.1;
    
    const legPositions = [
      { x: -benchWidth / 3, z: -benchDepth / 3 },
      { x: benchWidth / 3, z: -benchDepth / 3 },
      { x: -benchWidth / 3, z: benchDepth / 3 },
      { x: benchWidth / 3, z: benchDepth / 3 }
    ];
    
    const legGeo = new THREE.BoxGeometry(legWidth, legHeight, legDepth);
    for (const pos of legPositions) {
      const leg = new THREE.Mesh(legGeo, metalMat);
      leg.position.set(pos.x, legHeight / 2, pos.z);
      leg.castShadow = true;
      leg.receiveShadow = true;
      group.add(leg);
    }
    
    group.position.set(position.x, position.y, position.z);
    return group;
  }

  /**
   * Build a sign post with sign
   * @param {Object} position - {x, y, z} position
   * @returns {THREE.Group} Sign group
   */
  buildSign(position = { x: 0, y: 0, z: 0 }, side = 'right') {
    const group = new THREE.Group();
    
    const poleMat = materialCache.get('m-dark');
    
    const poleHeight = 3.0;
    const poleRadius = 0.12;
    const poleGeo = new THREE.CylinderGeometry(poleRadius, poleRadius, poleHeight, 12);
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.y = poleHeight / 2;
    pole.castShadow = true;
    pole.receiveShadow = true;
    group.add(pole);
    
    const baseSize = 0.4;
    const baseHeight = 0.1;
    const baseGeo = new THREE.BoxGeometry(baseSize, baseHeight, baseSize);
    const baseMat = materialCache.get('m-black', { color: 0x1a1a1a });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = baseHeight / 2;
    base.receiveShadow = true;
    group.add(base);
    
    const signWidth = 1.2;
    const signHeight = 0.6;
    
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('by Mte90', canvas.width / 2, canvas.height / 2);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    
    const signMat = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
    const signGeo = new THREE.BoxGeometry(signWidth, signHeight, 0.02);
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(0, poleHeight + signHeight / 2, 0);
    sign.rotation.y = side === 'left' ? 0 : Math.PI;
    sign.castShadow = false;
    group.add(sign);
    
    group.position.set(position.x, position.y, position.z);
    return group;
  }

  /**
   * Build a random obstacle type
   * @param {Object} position - {x, y, z} position
   * @param {string} type - 'trashCan', 'bench', 'sign', or 'random'
   * @returns {THREE.Group} Obstacle group
   */
  build(position = { x: 0, y: 0, z: 0 }, type = 'random', side = 'right') {
    if (type === 'random') {
      const types = ['trashCan', 'bench', 'sign'];
      type = types[Math.floor(Math.random() * types.length)];
    }
    
    switch (type) {
      case 'trashCan':
        return this.buildTrashCan(position);
      case 'bench':
        return this.buildBench(position, side);
      case 'sign':
        return this.buildSign(position);
      default:
        return this.buildTrashCan(position);
    }
  }

  /**
   * Get bounding box for an obstacle for collision detection
   * @param {THREE.Group} obstacle - The obstacle group
   * @returns {THREE.Box3} Bounding box
   */
  getBoundingBox(obstacle) {
    const box = new THREE.Box3().setFromObject(obstacle);
    return box;
  }
}
