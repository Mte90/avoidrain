import * as THREE from 'three';

const CAR_COLORS = [
  0xC0392B, 0x2980B9, 0x27AE60, 0xF39C12, 0xECF0F1, 
  0xF1C40F, 0x8E44AD, 0x16A085, 0xFFB6C1, 0x34495E,
  0xE74C3C, 0x3498DB, 0x00CED1, 0xFF6347
];

export class CarBuilder {
  constructor() {
  }

  build(position = { x: 0, y: 0, z: 0 }, colorIndex = -1) {
    const group = new THREE.Group();

    const color = CAR_COLORS[colorIndex >= 0 ? colorIndex : Math.floor(Math.random() * CAR_COLORS.length)];
    
    const bodyMat = new THREE.MeshStandardMaterial({ 
      color: color,
      roughness: 0.2,
      metalness: 0.7
    });
    const cabinMat = new THREE.MeshStandardMaterial({ 
      color: 0x2C3E50,
      roughness: 0.1,
      metalness: 0.3,
      transparent: true,
      opacity: 0.85
    });
    const wheelMat = new THREE.MeshStandardMaterial({ 
      color: 0x1A1A1A,
      roughness: 0.9,
      metalness: 0.1
    });
    const headlightMat = new THREE.MeshStandardMaterial({ 
      color: 0xFFFFE0,
      emissive: 0xFFFFAA,
      emissiveIntensity: 0.5
    });
    const taillightMat = new THREE.MeshStandardMaterial({ 
      color: 0x8B0000,
      emissive: 0xFF0000,
      emissiveIntensity: 0.4
    });
    const bumperMat = new THREE.MeshStandardMaterial({ 
      color: 0x1A1A1A,
      roughness: 0.5,
      metalness: 0.3
    });

    // Main body - more realistic car proportions
    const bodyLength = 4.0;
    const bodyWidth = 1.8;
    const bodyHeight = 0.6;
    const bodyGeo = new THREE.BoxGeometry(bodyLength, bodyHeight, bodyWidth);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.4;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Cabin - more aerodynamic shape
    const cabinLength = 2.4;
    const cabinWidth = 1.4;
    const cabinHeight = 0.7;
    const cabinGeo = new THREE.BoxGeometry(cabinLength, cabinHeight, cabinWidth);
    const cabin = new THREE.Mesh(cabinGeo, cabinMat);
    cabin.position.set(0, 1.0, 0.2);
    cabin.castShadow = true;
    group.add(cabin);

    // Wheels - properly sized and positioned
    const wheelRadius = 0.4;
    const wheelWidth = 0.35;
    const wheelGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 16);
    wheelGeo.rotateZ(Math.PI / 2);

    const wheelPositions = [
      { x: -1.4, y: 0.4, z: 0.7 },
      { x: 1.4, y: 0.4, z: 0.7 },
      { x: -1.4, y: 0.4, z: -0.7 },
      { x: 1.4, y: 0.4, z: -0.7 },
    ];

    for (const pos of wheelPositions) {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.position.set(pos.x, pos.y, pos.z);
      wheel.castShadow = true;
      group.add(wheel);

      // Wheel rim detail
      const rimGeo = new THREE.CylinderGeometry(wheelRadius * 0.5, wheelRadius * 0.5, wheelWidth + 0.02, 8);
      rimGeo.rotateZ(Math.PI / 2);
      const rimMat = new THREE.MeshStandardMaterial({ 
        color: 0xC0C0C0,
        roughness: 0.3,
        metalness: 0.8
      });
      const rim = new THREE.Mesh(rimGeo, rimMat);
      rim.position.set(pos.x, pos.y, pos.z);
      group.add(rim);
    }

    // Headlights - more visible and detailed
    const headlightGeo = new THREE.BoxGeometry(0.3, 0.2, 0.15);
    const leftHeadlight = new THREE.Mesh(headlightGeo, headlightMat);
    leftHeadlight.position.set(-1.6, 0.4, 0.5);
    group.add(leftHeadlight);

    const rightHeadlight = new THREE.Mesh(headlightGeo, headlightMat);
    rightHeadlight.position.set(-1.6, 0.4, -0.5);
    group.add(rightHeadlight);

    // Headlight housings
    const housingGeo = new THREE.BoxGeometry(0.35, 0.25, 0.2);
    const housingMat = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.8 });
    const leftHousing = new THREE.Mesh(housingGeo, housingMat);
    leftHousing.position.set(-1.6, 0.4, 0.5);
    group.add(leftHousing);

    const rightHousing = new THREE.Mesh(housingGeo, housingMat);
    rightHousing.position.set(-1.6, 0.4, -0.5);
    group.add(rightHousing);

    // Taillights
    const taillightGeo = new THREE.BoxGeometry(0.1, 0.25, 0.4);
    const leftTaillight = new THREE.Mesh(taillightGeo, taillightMat);
    leftTaillight.position.set(1.6, 0.5, 0.4);
    group.add(leftTaillight);

    const rightTaillight = new THREE.Mesh(taillightGeo, taillightMat);
    rightTaillight.position.set(1.6, 0.5, -0.4);
    group.add(rightTaillight);

    // Front bumper
    const bumperGeo = new THREE.BoxGeometry(0.2, 0.35, bodyWidth - 0.2);
    const frontBumper = new THREE.Mesh(bumperGeo, bumperMat);
    frontBumper.position.set(-2.0, 0.25, 0);
    frontBumper.castShadow = true;
    group.add(frontBumper);

    // Rear bumper
    const rearBumper = new THREE.Mesh(bumperGeo, bumperMat);
    rearBumper.position.set(2.0, 0.25, 0);
    rearBumper.castShadow = true;
    group.add(rearBumper);

    // Side mirrors
    const mirrorGeo = new THREE.BoxGeometry(0.15, 0.15, 0.25);
    const mirrorMat = new THREE.MeshStandardMaterial({ 
      color: color,
      roughness: 0.2,
      metalness: 0.7
    });
    
    const leftMirror = new THREE.Mesh(mirrorGeo, mirrorMat);
    leftMirror.position.set(-1.2, 0.95, 0.75);
    group.add(leftMirror);

    const rightMirror = new THREE.Mesh(mirrorGeo, mirrorMat);
    rightMirror.position.set(-1.2, 0.95, -0.75);
    group.add(rightMirror);

    group.position.set(position.x, position.y, position.z);
    // Rotate car to face -Z direction (along the road)
    group.rotation.y = Math.PI / 2;
    return group;
  }
}
