import * as THREE from 'three';
import { materialCache } from '../utils/MaterialCache.js';

export class CharacterBuilder {
  constructor() {
    // Materials are created per-build() to avoid shared color mutation
    // But we cache by color to reduce unique material count
  }

  build(position = { x: 0, y: 0, z: 0 }) {
    const group = new THREE.Group();
    group.userData.hairMesh = null;

    const shirtKeys = ['shirt-blue', 'shirt_red', 'shirt_green', 'shirt_purple', 'shirt_orange', 'shirt_teal'];
    const pantsKeys = ['pants_dark', 'pants_gray', 'pants_darker', 'pants_bluegray'];
    const shirtKey = shirtKeys[Math.floor(Math.random() * shirtKeys.length)];
    const pantsKey = pantsKeys[Math.floor(Math.random() * pantsKeys.length)];
    
    const shirtMat = materialCache.get(shirtKey);
    const pantsMat = materialCache.get(pantsKey);
    const skinMat = materialCache.get('skin');
    const shoeMat = materialCache.get('shoes');
    const hairMat = materialCache.get('hair');

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
    const headGeo = new THREE.SphereGeometry(headSize, 16, 16);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = hipY + torsoHeight + headSize - 0.05;
    head.scale.set(1, 1.1, 0.95);
    head.castShadow = false;
    group.add(head);
    
    const eyeRadius = 0.055;
    const eyeGeo = new THREE.SphereGeometry(eyeRadius, 8, 8);
    const pupilGeo = new THREE.SphereGeometry(eyeRadius * 0.5, 6, 6);
    const eyeMat = materialCache.get('m-eye');
    const pupilMat = materialCache.get('m-pupil');
    
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.1, hipY + torsoHeight + headSize + 0.02, headSize * 0.8);
    leftEye.scale.set(1, 1.1, 0.5);
    group.add(leftEye);
    const leftPupil = new THREE.Mesh(pupilGeo, pupilMat);
    leftPupil.position.set(-0.1, hipY + torsoHeight + headSize + 0.02, headSize * 0.85);
    leftPupil.scale.set(1, 1.1, 0.5);
    group.add(leftPupil);
    
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.1, hipY + torsoHeight + headSize + 0.02, headSize * 0.8);
    rightEye.scale.set(1, 1.1, 0.5);
    group.add(rightEye);
    const rightPupil = new THREE.Mesh(pupilGeo, pupilMat);
    rightPupil.position.set(0.1, hipY + torsoHeight + headSize + 0.02, headSize * 0.85);
    rightPupil.scale.set(1, 1.1, 0.5);
    group.add(rightPupil);
    
    const noseGeo = new THREE.ConeGeometry(0.03, 0.08, 6);
    const nose = new THREE.Mesh(noseGeo, skinMat);
    nose.position.set(0, hipY + torsoHeight + headSize - 0.02, headSize * 0.9);
    nose.rotation.x = Math.PI / 2;
    group.add(nose);

    const hairGeo = new THREE.SphereGeometry(headSize * 1.15, 16, 16, 0, Math.PI * 2, 0, Math.PI / 1.8);
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.y = hipY + torsoHeight + headSize - 0.05;
    hair.rotation.x = 0.1;
    group.add(hair);

    const armLength = 0.25;
    const armRadius = 0.08;
    const armGeo = new THREE.CylinderGeometry(armRadius, armRadius * 0.9, armLength, 12);
    
    // Arm groups for animation
    const leftArmGroup = new THREE.Group();
    leftArmGroup.name = 'leftArm';
    leftArmGroup.position.set(-0.22, 1.4, 0);
    
    const leftUpperArm = new THREE.Mesh(armGeo, shirtMat);
    leftUpperArm.position.set(0, -armLength / 2, 0);
    leftUpperArm.castShadow = false;
    leftArmGroup.add(leftUpperArm);
    
    const forearmLength = 0.3;
    const forearmGeo = new THREE.CylinderGeometry(armRadius * 0.85, armRadius * 0.8, forearmLength, 12);
    
    const leftForearm = new THREE.Mesh(forearmGeo, skinMat);
    leftForearm.position.set(0, -armLength - forearmLength / 2 + 0.02, 0);
    leftForearm.castShadow = false;
    leftArmGroup.add(leftForearm);
    
    const handGeo = new THREE.SphereGeometry(0.08, 8, 8);
    handGeo.scale(1, 0.7, 1.2);
    
    const leftHand = new THREE.Mesh(handGeo, skinMat);
    leftHand.position.set(0, -armLength - forearmLength - 0.1, 0);
    leftHand.castShadow = false;
    leftArmGroup.add(leftHand);
    
    group.add(leftArmGroup);
    
    const rightArmGroup = new THREE.Group();
    rightArmGroup.name = 'rightArm';
    rightArmGroup.position.set(0.22, 1.4, 0);
    
    const rightUpperArm = new THREE.Mesh(armGeo, shirtMat);
    rightUpperArm.position.set(0, -armLength / 2, 0);
    rightUpperArm.castShadow = false;
    rightArmGroup.add(rightUpperArm);
    
    const rightForearm = new THREE.Mesh(forearmGeo, skinMat);
    rightForearm.position.set(0, -armLength - forearmLength / 2 + 0.02, 0);
    rightForearm.castShadow = false;
    rightArmGroup.add(rightForearm);
    
    const rightHand = new THREE.Mesh(handGeo, skinMat);
    rightHand.position.set(0, -armLength - forearmLength - 0.1, 0);
    rightHand.castShadow = false;
    rightArmGroup.add(rightHand);
    
    group.add(rightArmGroup);
    
    const legLength = 0.9;
    const legRadius = 0.12;
    const legGeo = new THREE.CylinderGeometry(legRadius * 0.9, legRadius, legLength, 12);
    legGeo.translate(0, -legLength / 2, 0);

    const leftLegGroup = new THREE.Group();
    leftLegGroup.name = 'leftLeg';
    leftLegGroup.position.set(-0.22, hipY, 0);
    const leftThigh = new THREE.Mesh(legGeo, pantsMat);
    leftThigh.castShadow = false;
    leftLegGroup.add(leftThigh);
    
    const footGeo = new THREE.BoxGeometry(0.12, 0.12, 0.22);
    const leftFoot = new THREE.Mesh(footGeo, shoeMat);
    leftFoot.position.set(0, -legLength, 0.02);
    leftFoot.castShadow = false;
    leftLegGroup.add(leftFoot);
    
    group.add(leftLegGroup);
    
    const rightLegGroup = new THREE.Group();
    rightLegGroup.name = 'rightLeg';
    rightLegGroup.position.set(0.22, hipY, 0);
    const rightThigh = new THREE.Mesh(legGeo, pantsMat);
    rightThigh.castShadow = false;
    rightLegGroup.add(rightThigh);
    
    const rightFoot = new THREE.Mesh(footGeo, shoeMat);
    rightFoot.position.set(0, -legLength, 0.02);
    rightFoot.castShadow = false;
    rightLegGroup.add(rightFoot);
    
    group.add(rightLegGroup);

    group.position.set(position.x, position.y, position.z);
    group.userData.hairMesh = hair;
    group.userData.leftArm = leftArmGroup;
    group.userData.rightArm = rightArmGroup;
    group.userData.leftLeg = leftLegGroup;
    group.userData.rightLeg = rightLegGroup;
    return group;
  }

  updateHairWetness(group, wetnessPercent) {
    const hairMesh = group.userData.hairMesh;
    if (!hairMesh) return;
    
    const dryColor = new THREE.Color(0x4A3728);
    const wetColor = new THREE.Color(0x2a1a10);
    const normalizedWetness = Math.max(0, Math.min(1, wetnessPercent / 100));
    hairMesh.material.color.lerpColors(dryColor, wetColor, normalizedWetness);
  }
}
