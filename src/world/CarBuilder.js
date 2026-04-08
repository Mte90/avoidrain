import * as THREE from 'three';
import { materialCache } from '../utils/MaterialCache.js';

// Shared materials - must match BuildingBuilder COLORS
const COLORS = {
  GRAY: 0x7A8B99, DARK_GRAY: 0x3a3a3a, LIGHT_GRAY: 0x555555,
  WHITE: 0xFFFFFF, BLACK: 0x1a1a1a, RED: 0xFF0000,
  BLUE: 0x3498DB, YELLOW: 0xFFFFCC, METAL: 0xC0C0C0
};

const CAR_COLORS = [
  0xC0392B, 0x2980B9, 0x27AE60, 0xF39C12, 0xECF0F1, 
  0xF1C40F, 0x8E44AD, 0x16A085, 0xFFB6C1, 0x34495E,
  0xE74C3C, 0x3498DB, 0x00CED1, 0xFF6347
];

export class CarBuilder {
  constructor() {}

  build(position = { x: 0, y: 0, z: 0 }, colorIndex = -1) {
    const group = new THREE.Group();

    const color = CAR_COLORS[colorIndex >= 0 ? colorIndex : Math.floor(Math.random() * CAR_COLORS.length)];
    
    const bodyMat = materialCache.get('m-car-body');
    const cabinMat = materialCache.get('m-dark');
    const wheelMat = materialCache.get('m-black');
    const headlightMat = materialCache.get('m-emissive-yellow');
    const taillightMat = materialCache.get('m-emissive-red');
    const bumperMat = materialCache.get('m-car-bumper');
    const rimMat = materialCache.get('m-car-rim');
    const mirrorMat = materialCache.get('m-car-mirror');
    const housingMat = materialCache.get('m-black');

    const bodyLength = 2.2;
    const bodyWidth = 0.8;
    const bodyHeight = 1.1;
    const bodyGeo = new THREE.BoxGeometry(bodyLength, bodyHeight, bodyWidth);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.75;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    const cabinLength = 1.4;
    const cabinWidth = 0.7;
    const cabinHeight = 0.9;
    const cabinGeo = new THREE.BoxGeometry(cabinLength, cabinHeight, cabinWidth);
    const cabin = new THREE.Mesh(cabinGeo, cabinMat);
    cabin.position.set(-0.35, 1.4, 0.1);
    cabin.castShadow = true;
    group.add(cabin);

    const wheelRadius = 0.25;
    const wheelWidth = 0.2;
    const wheelGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 16);
    wheelGeo.rotateX(Math.PI / 2);

    const wheelPositions = [
      { x: -0.5, y: 0.55, z: 0.35 },
      { x: 0.5, y: 0.55, z: 0.35 },
      { x: -0.5, y: 0.55, z: -0.35 },
      { x: 0.5, y: 0.55, z: -0.35 },
    ];

    for (const pos of wheelPositions) {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.position.set(pos.x, pos.y, pos.z);
      wheel.castShadow = true;
      group.add(wheel);

      const rimGeo = new THREE.CylinderGeometry(wheelRadius * 0.5, wheelRadius * 0.5, wheelWidth + 0.02, 8);
      rimGeo.rotateX(Math.PI / 2);
      const rim = new THREE.Mesh(rimGeo, rimMat);
      rim.position.set(pos.x, pos.y, pos.z);
      group.add(rim);
    }

    const headlightGeo = new THREE.BoxGeometry(0.15, 0.1, 0.08);
    const leftHeadlight = new THREE.Mesh(headlightGeo, headlightMat);
    leftHeadlight.position.set(-1.1, 0.8, 0.4);
    group.add(leftHeadlight);

    const rightHeadlight = new THREE.Mesh(headlightGeo, headlightMat);
    rightHeadlight.position.set(-1.1, 0.8, -0.4);
    group.add(rightHeadlight);

    const housingGeo = new THREE.BoxGeometry(0.2, 0.15, 0.08);
    const leftHousing = new THREE.Mesh(housingGeo, housingMat);
    leftHousing.position.set(-1.1, 0.8, 0.4);
    group.add(leftHousing);

    const rightHousing = new THREE.Mesh(housingGeo, housingMat);
    rightHousing.position.set(-1.1, 0.8, -0.4);
    group.add(rightHousing);

    const taillightGeo = new THREE.BoxGeometry(0.06, 0.1, 0.15);
    const leftTaillight = new THREE.Mesh(taillightGeo, taillightMat);
    leftTaillight.position.set(1.1, 0.8, 0.3);
    group.add(leftTaillight);

    const rightTaillight = new THREE.Mesh(taillightGeo, taillightMat);
    rightTaillight.position.set(1.1, 0.8, -0.3);
    group.add(rightTaillight);

    const bumperGeo = new THREE.BoxGeometry(0.15, 0.2, bodyWidth - 0.15);
    const frontBumper = new THREE.Mesh(bumperGeo, bumperMat);
    frontBumper.position.set(-1.2, 0.45, 0);
    frontBumper.castShadow = true;
    group.add(frontBumper);

    const rearBumper = new THREE.Mesh(bumperGeo, bumperMat);
    rearBumper.position.set(1.2, 0.45, 0);
    rearBumper.castShadow = true;
    group.add(rearBumper);

    const mirrorGeo = new THREE.BoxGeometry(0.1, 0.1, 0.15);
    
    const leftMirror = new THREE.Mesh(mirrorGeo, mirrorMat);
    leftMirror.position.set(-0.7, 0.9, 0.55);
    group.add(leftMirror);

    const rightMirror = new THREE.Mesh(mirrorGeo, mirrorMat);
    rightMirror.position.set(-0.7, 0.9, -0.55);
    group.add(rightMirror);

    group.position.set(position.x, position.y, position.z);
    // Rotate car to face -Z direction (along the road)
    group.rotation.y = Math.PI / 2;
    return group;
  }
}
