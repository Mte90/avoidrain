import * as THREE from 'three';

export class CharacterBuilder {
  constructor() {
    // Materials are created per-build() to avoid shared color mutation
  }

  build(position = { x: 0, y: 0, z: 0 }) {
    const group = new THREE.Group();
    // Store hair mesh reference for wetness effect
    group.userData.hairMesh = null;

    const shirtColors = [0x3498DB, 0xE74C3C, 0x2ECC71, 0x9B59B6, 0xF39C12, 0x1ABC9C];
    const pantsColors = [0x2C3E50, 0x34495E, 0x1A252F, 0x243447];
    
    const shirtMat = new THREE.MeshStandardMaterial({ 
      color: shirtColors[Math.floor(Math.random() * shirtColors.length)],
      roughness: 0.7,
      metalness: 0.1
    });
    const pantsMat = new THREE.MeshStandardMaterial({ 
      color: pantsColors[Math.floor(Math.random() * pantsColors.length)],
      roughness: 0.85,
      metalness: 0.05
    });
    const skinMat = new THREE.MeshStandardMaterial({ 
      color: 0xFFDAB9,
      roughness: 0.8
    });
    const shoeMat = new THREE.MeshStandardMaterial({ 
      color: 0x1A1A1A,
      roughness: 0.6,
      metalness: 0.2
    });
    const hairMat = new THREE.MeshStandardMaterial({ 
      color: 0x4A3728,
      roughness: 0.9,
      metalness: 0.0
    });

    const hipY = 0.9; // Legs hang down from here, feet at Y=0
    const torsoHeight = 0.7;
    const torsoWidth = 0.35;
    const torsoDepth = 0.2;
    const torsoGeo = new THREE.BoxGeometry(torsoWidth, torsoHeight, torsoDepth);
    const torso = new THREE.Mesh(torsoGeo, shirtMat);
    torso.position.y = hipY + torsoHeight / 2 + 0.05;
    torso.castShadow = true;
    torso.receiveShadow = true;
    group.add(torso);

    const headSize = 0.32;
    const headGeo = new THREE.SphereGeometry(headSize, 12, 12);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = hipY + torsoHeight + headSize - 0.05;
    head.castShadow = true;
    group.add(head);

    const hairGeo = new THREE.SphereGeometry(headSize * 1.15, 16, 16, 0, Math.PI * 2, 0, Math.PI / 1.8);
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.y = hipY + torsoHeight + headSize - 0.05;
    hair.rotation.x = 0.1;
    group.add(hair);

    const eyeGeo = new THREE.SphereGeometry(0.04, 8, 8);
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.3 });
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.1, hipY + torsoHeight + headSize * 0.8, headSize * 0.85);
    group.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.1, hipY + torsoHeight + headSize * 0.8, headSize * 0.85);
    group.add(rightEye);

    const pupilGeo = new THREE.SphereGeometry(0.02, 8, 8);
    const pupilMat = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.3 });
    const leftPupil = new THREE.Mesh(pupilGeo, pupilMat);
    leftPupil.position.set(-0.1, hipY + torsoHeight + headSize * 0.8, headSize * 0.92);
    group.add(leftPupil);

    const rightPupil = new THREE.Mesh(pupilGeo, pupilMat);
    rightPupil.position.set(0.1, hipY + torsoHeight + headSize * 0.8, headSize * 0.92);
    group.add(rightPupil);

    const armLength = 0.65;
    const armRadius = 0.1;
    const armGeo = new THREE.CylinderGeometry(armRadius, armRadius * 0.9, armLength, 12);
    
    const leftUpperArm = new THREE.Mesh(armGeo, shirtMat);
    leftUpperArm.position.set(-0.5, 1.3, 0);
    leftUpperArm.castShadow = true;
    group.add(leftUpperArm);

    const rightUpperArm = new THREE.Mesh(armGeo, shirtMat);
    rightUpperArm.position.set(0.5, 1.3, 0);
    rightUpperArm.castShadow = true;
    group.add(rightUpperArm);

    const forearmLength = 0.5;
    const forearmGeo = new THREE.CylinderGeometry(armRadius * 0.85, armRadius * 0.8, forearmLength, 12);
    
    const leftForearm = new THREE.Mesh(forearmGeo, skinMat);
    leftForearm.position.set(-0.5, 0.75, 0);
    leftForearm.castShadow = true;
    group.add(leftForearm);

    const rightForearm = new THREE.Mesh(forearmGeo, skinMat);
    rightForearm.position.set(0.5, 0.75, 0);
    rightForearm.castShadow = true;
    group.add(rightForearm);

    const handGeo = new THREE.SphereGeometry(0.11, 8, 8);
    handGeo.scale(1, 0.7, 1.2);
    
    const leftHand = new THREE.Mesh(handGeo, skinMat);
    leftHand.position.set(-0.5, 0.25, 0);
    leftHand.castShadow = true;
    group.add(leftHand);

    const rightHand = new THREE.Mesh(handGeo, skinMat);
    rightHand.position.set(0.5, 0.25, 0);
    rightHand.castShadow = true;
    group.add(rightHand);

    const legLength = 0.9;
    const legRadius = 0.12;
    const legGeo = new THREE.CylinderGeometry(legRadius * 0.9, legRadius, legLength, 12);
    legGeo.translate(0, -legLength / 2, 0);

    const leftLegGroup = new THREE.Group();
    leftLegGroup.name = 'leftLeg';
    leftLegGroup.position.set(-0.22, hipY, 0);
    const leftThigh = new THREE.Mesh(legGeo, pantsMat);
    leftThigh.castShadow = true;
    leftLegGroup.add(leftThigh);
    
    const footGeo = new THREE.BoxGeometry(0.12, 0.12, 0.22);
    const leftFoot = new THREE.Mesh(footGeo, shoeMat);
    leftFoot.position.set(0, -legLength, 0.02);
    leftFoot.castShadow = true;
    leftLegGroup.add(leftFoot);
    
    group.add(leftLegGroup);
    
    const rightLegGroup = new THREE.Group();
    rightLegGroup.name = 'rightLeg';
    rightLegGroup.position.set(0.22, hipY, 0);
    const rightThigh = new THREE.Mesh(legGeo, pantsMat);
    rightThigh.castShadow = true;
    rightLegGroup.add(rightThigh);
    
    const rightFoot = new THREE.Mesh(footGeo, shoeMat);
    rightFoot.position.set(0, -legLength, 0.02);
    rightFoot.castShadow = true;
    rightLegGroup.add(rightFoot);
    
    group.add(rightLegGroup);

    group.position.set(position.x, position.y, position.z);
    return group;
  }
}