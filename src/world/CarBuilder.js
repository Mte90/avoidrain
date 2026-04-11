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
    
    const bodyMat = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.3,
      metalness: 0.6
    });
    const cabinMat = materialCache.get('m-dark');
    const wheelMat = materialCache.get('m-black');
    const headlightMat = materialCache.get('m-emissive-yellow');
    const taillightMat = materialCache.get('m-emissive-red');
    const bumperMat = materialCache.get('m-car-bumper');
    const rimMat = materialCache.get('m-car-rim');
    const mirrorMat = materialCache.get('m-car-mirror');
    const housingMat = materialCache.get('m-black');
    
    const bodyLength = 4.5;
    const bodyWidth = 1.7;
    const bodyHeight = 1.0;
    const wheelRadius = 0.35;
    
    const mainBodyGeo = new THREE.BoxGeometry(3.8, 0.7, bodyWidth);
    const mainBody = new THREE.Mesh(mainBodyGeo, bodyMat);
    mainBody.position.y = 0.35 + wheelRadius;
    mainBody.castShadow = true;
    mainBody.receiveShadow = true;
    group.add(mainBody);
    
    const hoodGeo = new THREE.BoxGeometry(1.2, 0.4, bodyWidth - 0.1);
    const hood = new THREE.Mesh(hoodGeo, bodyMat);
    hood.position.set(1.8, 0.6 + wheelRadius, 0);
    hood.rotation.z = -0.15;
    hood.castShadow = true;
    group.add(hood);
    
    const cabinLength = 2.0;
    const cabinWidth = 1.5;
    const cabinHeight = 0.8;
    const cabinGeo = new THREE.BoxGeometry(cabinLength, cabinHeight, cabinWidth);
    const cabin = new THREE.Mesh(cabinGeo, cabinMat);
    cabin.position.set(-0.3, 1.0 + wheelRadius, 0);
    cabin.castShadow = true;
    group.add(cabin);
    
    const windshieldGeo = new THREE.BoxGeometry(0.08, 0.65, 1.3);
    const windshield = new THREE.Mesh(windshieldGeo, cabinMat);
    windshield.position.set(0.7, 1.0 + wheelRadius, 0);
    windshield.rotation.z = 0.6;
    group.add(windshield);
    
    const rearWindowGeo = new THREE.BoxGeometry(0.08, 0.55, 1.3);
    const rearWindow = new THREE.Mesh(rearWindowGeo, cabinMat);
    rearWindow.position.set(-1.2, 1.0 + wheelRadius, 0);
    rearWindow.rotation.z = -0.5;
    group.add(rearWindow);
    
    const frontFenderGeo = new THREE.BoxGeometry(0.8, 0.5, bodyWidth + 0.1);
    const frontFenderLeft = new THREE.Mesh(frontFenderGeo, bodyMat);
    frontFenderLeft.position.set(2.0, 0.4 + wheelRadius, 0);
    frontFenderLeft.rotation.z = 0.2;
    group.add(frontFenderLeft);
    
    const rearFenderGeo = new THREE.BoxGeometry(1.0, 0.5, bodyWidth + 0.1);
    const rearFenderRight = new THREE.Mesh(rearFenderGeo, bodyMat);
    rearFenderRight.position.set(-1.6, 0.4 + wheelRadius, 0);
    rearFenderRight.rotation.z = 0.1;
    group.add(rearFenderRight);
    const wheelWidth = 0.2;
    const wheelGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 16);
    wheelGeo.rotateX(Math.PI / 2);

    const wheelPositions = [
      { x: -1.0, y: wheelRadius, z: 0.6 },
      { x: 1.0, y: wheelRadius, z: 0.6 },
      { x: -1.0, y: wheelRadius, z: -0.6 },
      { x: 1.0, y: wheelRadius, z: -0.6 },
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

    const headlightGeo = new THREE.BoxGeometry(0.15, 0.15, 0.25);
    const leftHeadlight = new THREE.Mesh(headlightGeo, headlightMat);
    leftHeadlight.position.set(2.25, 0.5 + wheelRadius, 0.55);
    group.add(leftHeadlight);
    
    const rightHeadlight = new THREE.Mesh(headlightGeo, headlightMat);
    rightHeadlight.position.set(2.25, 0.5 + wheelRadius, -0.55);
    group.add(rightHeadlight);
    
    const leftHeadlightPoint = new THREE.PointLight(0xffffcc, 1, 15);
    leftHeadlightPoint.position.set(2.3, 0.5 + wheelRadius, 0.7);
    group.add(leftHeadlightPoint);
    
    const rightHeadlightPoint = new THREE.PointLight(0xffffcc, 1, 15);
    rightHeadlightPoint.position.set(2.3, 0.5 + wheelRadius, -0.7);
    group.add(rightHeadlightPoint);
    
    const housingGeo = new THREE.BoxGeometry(0.15, 0.2, 0.3);
    const leftHousing = new THREE.Mesh(housingGeo, housingMat);
    leftHousing.position.set(2.25, 0.5 + wheelRadius, 0.55);
    group.add(leftHousing);

    const rightHousing = new THREE.Mesh(housingGeo, housingMat);
    rightHousing.position.set(2.25, 0.5 + wheelRadius, -0.55);
    group.add(rightHousing);

    const taillightGeo = new THREE.BoxGeometry(0.05, 0.12, 0.2);
    const leftTaillight = new THREE.Mesh(taillightGeo, taillightMat);
    leftTaillight.position.set(-1.85, 0.5 + wheelRadius, 0.5);
    group.add(leftTaillight);

    const rightTaillight = new THREE.Mesh(taillightGeo, taillightMat);
    rightTaillight.position.set(-1.85, 0.5 + wheelRadius, -0.5);
    group.add(rightTaillight);

    const bumperGeo = new THREE.BoxGeometry(0.12, 0.25, bodyWidth - 0.1);
    const frontBumper = new THREE.Mesh(bumperGeo, bumperMat);
    frontBumper.position.set(2.3, 0.25 + wheelRadius, 0);
    frontBumper.castShadow = true;
    group.add(frontBumper);

    const rearBumper = new THREE.Mesh(bumperGeo, bumperMat);
    rearBumper.position.set(-1.95, 0.25 + wheelRadius, 0);
    rearBumper.castShadow = true;
    group.add(rearBumper);

    const mirrorGeo = new THREE.BoxGeometry(0.12, 0.1, 0.15);
    
    const leftMirror = new THREE.Mesh(mirrorGeo, mirrorMat);
    leftMirror.position.set(0.3, 1.0 + wheelRadius, 0.8);
    group.add(leftMirror);

    const rightMirror = new THREE.Mesh(mirrorGeo, mirrorMat);
    rightMirror.position.set(0.3, 1.0 + wheelRadius, -0.8);
    group.add(rightMirror);

    group.position.set(position.x, position.y, position.z);
    group.rotation.y = Math.PI / 2;
    return group;
  }
}
