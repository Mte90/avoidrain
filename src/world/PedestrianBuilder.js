import * as THREE from 'three';
import { materialCache } from '../utils/MaterialCache.js';

const SHIRT_KEYS = ['shirt-blue', 'shirt_red', 'shirt_green', 'shirt_purple', 'shirt_orange', 'shirt_teal'];
const PANTS_KEYS = ['pants_dark', 'pants_gray', 'pants_darker', 'pants_bluegray'];
const UMBRELLA_COLORS = [0xFF4444, 0x4444FF, 0x44FF44, 0xFFFF44, 0xFF44FF, 0x44FFFF, 0xFFFFFF, 0x222222];

export class PedestrianBuilder {
  constructor() {
    this._createSharedGeometries();
    this._createSharedMaterials();
  }

  _createSharedGeometries() {
    const hipY = 0.9;
    const torsoHeight = 0.7;
    const torsoWidth = 0.35;
    const torsoDepth = 0.2;

    this.torsoGeo = new THREE.BoxGeometry(torsoWidth, torsoHeight, torsoDepth);

    const headSize = 0.32;
    this.headGeo = new THREE.SphereGeometry(headSize, 16, 16);

    const eyeRadius = 0.055;
    this.eyeGeo = new THREE.SphereGeometry(eyeRadius, 8, 8);
    this.pupilGeo = new THREE.SphereGeometry(eyeRadius * 0.5, 6, 6);

    this.noseGeo = new THREE.ConeGeometry(0.03, 0.08, 6);

    const hairRadius = headSize * 1.15;
    this.hairGeo = new THREE.SphereGeometry(hairRadius, 16, 16, 0, Math.PI * 2, 0, Math.PI / 1.8);

    const armLength = 0.25;
    const armRadius = 0.08;
    this.armGeo = new THREE.CylinderGeometry(armRadius, armRadius * 0.9, armLength, 12);

    const forearmLength = 0.3;
    const forearmRadius = armRadius * 0.85;
    this.forearmGeo = new THREE.CylinderGeometry(forearmRadius, forearmRadius * 0.8, forearmLength, 12);

    this.handGeo = new THREE.SphereGeometry(0.08, 8, 8);

    const legLength = 0.9;
    const legRadius = 0.12;
    this.legGeo = new THREE.CylinderGeometry(legRadius * 0.9, legRadius, legLength, 12);
    this.legGeo.translate(0, -legLength / 2, 0);

    this.footGeo = new THREE.BoxGeometry(0.12, 0.12, 0.22);

    this.umbrellaConeGeo = new THREE.ConeGeometry(0.5, 0.3, 16);
    this.umbrellaPoleGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.8, 8);
  }

  _createSharedMaterials() {
    this.skinMat = materialCache.get('skin');
    this.shoeMat = materialCache.get('shoes');
    this.eyeMat = materialCache.get('m-eye');
    this.pupilMat = materialCache.get('m-pupil');
  }

  getRandomShirtMaterial() {
    const key = SHIRT_KEYS[Math.floor(Math.random() * SHIRT_KEYS.length)];
    return materialCache.get(key);
  }

  getRandomPantsMaterial() {
    const key = PANTS_KEYS[Math.floor(Math.random() * PANTS_KEYS.length)];
    return materialCache.get(key);
  }

  getRandomUmbrellaMaterial() {
    const color = UMBRELLA_COLORS[Math.floor(Math.random() * UMBRELLA_COLORS.length)];
    return new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.3,
      metalness: 0.1,
      side: THREE.DoubleSide
    });
  }

  build(position = { x: 0, y: 0, z: 0 }) {
    const group = new THREE.Group();
    const hipY = 0.9;

    const shirtMat = this.getRandomShirtMaterial();
    const pantsMat = this.getRandomPantsMaterial();
    const skinMat = this.skinMat;
    const shoeMat = this.shoeMat;
    const hairMat = materialCache.get('hair');

    const torsoHeight = 0.7;
    const torsoWidth = 0.35;
    const torsoDepth = 0.2;

    const torso = new THREE.Mesh(this.torsoGeo, shirtMat);
    torso.position.y = hipY + torsoHeight / 2 + 0.05;
    torso.castShadow = true;
    torso.receiveShadow = true;
    group.add(torso);
    group.userData.torso = torso;

    const headSize = 0.32;
    const head = new THREE.Mesh(this.headGeo, skinMat);
    head.position.y = hipY + torsoHeight + headSize - 0.05;
    head.scale.set(1, 1.1, 0.95);
    head.castShadow = false;
    group.add(head);
    group.userData.head = head;

    const leftEye = new THREE.Mesh(this.eyeGeo, this.eyeMat);
    leftEye.position.set(-0.1, hipY + torsoHeight + headSize + 0.02, headSize * 0.8);
    leftEye.scale.set(1, 1.1, 0.5);
    group.add(leftEye);

    const leftPupil = new THREE.Mesh(this.pupilGeo, this.pupilMat);
    leftPupil.position.set(-0.1, hipY + torsoHeight + headSize + 0.02, headSize * 0.85);
    leftPupil.scale.set(1, 1.1, 0.5);
    group.add(leftPupil);

    const rightEye = new THREE.Mesh(this.eyeGeo, this.eyeMat);
    rightEye.position.set(0.1, hipY + torsoHeight + headSize + 0.02, headSize * 0.8);
    rightEye.scale.set(1, 1.1, 0.5);
    group.add(rightEye);

    const rightPupil = new THREE.Mesh(this.pupilGeo, this.pupilMat);
    rightPupil.position.set(0.1, hipY + torsoHeight + headSize + 0.02, headSize * 0.85);
    rightPupil.scale.set(1, 1.1, 0.5);
    group.add(rightPupil);

    const nose = new THREE.Mesh(this.noseGeo, skinMat);
    nose.position.set(0, hipY + torsoHeight + headSize - 0.02, headSize * 0.9);
    nose.rotation.x = Math.PI / 2;
    group.add(nose);

    const hair = new THREE.Mesh(this.hairGeo, hairMat);
    hair.position.y = hipY + torsoHeight + headSize - 0.05;
    hair.rotation.x = 0.1;
    group.add(hair);
    group.userData.hair = hair;

    const armLength = 0.25;

    const leftArmGroup = new THREE.Group();
    leftArmGroup.name = 'leftArm';
    leftArmGroup.position.set(-0.35, 1.4, 0);

    const leftUpperArm = new THREE.Mesh(this.armGeo, shirtMat);
    leftUpperArm.position.set(0, -armLength / 2, 0);
    leftUpperArm.castShadow = false;
    leftArmGroup.add(leftUpperArm);

    const leftForearm = new THREE.Mesh(this.forearmGeo, skinMat);
    leftForearm.position.set(0, -armLength - 0.15 + 0.02, 0);
    leftForearm.castShadow = false;
    leftArmGroup.add(leftForearm);

    const leftHand = new THREE.Mesh(this.handGeo, skinMat);
    leftHand.position.set(0, -armLength - 0.3 - 0.1, 0);
    leftHand.castShadow = false;
    leftArmGroup.add(leftHand);

    group.add(leftArmGroup);
    group.userData.leftArm = leftArmGroup;

    const rightArmGroup = new THREE.Group();
    rightArmGroup.name = 'rightArm';
    rightArmGroup.position.set(0.35, 1.4, 0);

    const rightUpperArm = new THREE.Mesh(this.armGeo, shirtMat);
    rightUpperArm.position.set(0, -armLength / 2, 0);
    rightUpperArm.castShadow = false;
    rightArmGroup.add(rightUpperArm);

    const rightForearm = new THREE.Mesh(this.forearmGeo, skinMat);
    rightForearm.position.set(0, -armLength - 0.15 + 0.02, 0);
    rightForearm.castShadow = false;
    rightArmGroup.add(rightForearm);

    const rightHand = new THREE.Mesh(this.handGeo, skinMat);
    rightHand.position.set(0, -armLength - 0.3 - 0.1, 0);
    rightHand.castShadow = false;
    rightArmGroup.add(rightHand);

    group.add(rightArmGroup);
    group.userData.rightArm = rightArmGroup;

    const legLength = 0.9;

    const leftLegGroup = new THREE.Group();
    leftLegGroup.name = 'leftLeg';
    leftLegGroup.position.set(-0.22, hipY, 0);
    const leftThigh = new THREE.Mesh(this.legGeo, pantsMat);
    leftThigh.castShadow = false;
    leftLegGroup.add(leftThigh);

    const leftFoot = new THREE.Mesh(this.footGeo, shoeMat);
    leftFoot.position.set(0, -legLength, 0.02);
    leftFoot.castShadow = false;
    leftLegGroup.add(leftFoot);

    group.add(leftLegGroup);
    group.userData.leftLeg = leftLegGroup;

    const rightLegGroup = new THREE.Group();
    rightLegGroup.name = 'rightLeg';
    rightLegGroup.position.set(0.22, hipY, 0);
    const rightThigh = new THREE.Mesh(this.legGeo, pantsMat);
    rightThigh.castShadow = false;
    rightLegGroup.add(rightThigh);

    const rightFoot = new THREE.Mesh(this.footGeo, shoeMat);
    rightFoot.position.set(0, -legLength, 0.02);
    rightFoot.castShadow = false;
    rightLegGroup.add(rightFoot);

    group.add(rightLegGroup);
    group.userData.rightLeg = rightLegGroup;

    const hasUmbrella = Math.random() < 0.6;
    group.userData.hasUmbrella = hasUmbrella;

    if (hasUmbrella) {
      const umbrellaMat = this.getRandomUmbrellaMaterial();
      const umbrellaGroup = new THREE.Group();
      umbrellaGroup.name = 'umbrella';

      const umbrellaCone = new THREE.Mesh(this.umbrellaConeGeo, umbrellaMat);
      umbrellaCone.rotation.x = Math.PI;
      umbrellaCone.position.y = 0.15;
      umbrellaGroup.add(umbrellaCone);

      const pole = new THREE.Mesh(this.umbrellaPoleGeo, materialCache.get('m-black'));
      pole.position.y = -0.4;
      umbrellaGroup.add(pole);

      umbrellaGroup.position.set(0.15, 2.3, 0.1);
      umbrellaGroup.rotation.z = 0.1;
      umbrellaGroup.rotation.x = -0.05;
      group.add(umbrellaGroup);
      group.userData.umbrella = umbrellaGroup;
    }

    group.position.set(position.x, position.y, position.z);
    group.scale.set(0.8, 0.8, 0.8);

    group.userData.state = 'walking';
    group.userData.direction = Math.random() > 0.5 ? 1 : -1;
    group.userData.targetBalcony = null;
    group.userData.animTime = Math.random() * Math.PI * 2;

    return group;
  }

  animateWalk(pedestrian, delta) {
    const animSpeed = 8;
    pedestrian.userData.animTime += delta * animSpeed;
    const t = pedestrian.userData.animTime;

    const leftLeg = pedestrian.userData.leftLeg;
    const rightLeg = pedestrian.userData.rightLeg;
    const leftArm = pedestrian.userData.leftArm;
    const rightArm = pedestrian.userData.rightArm;

    if (leftLeg) leftLeg.rotation.x = Math.sin(t) * 0.5;
    if (rightLeg) rightLeg.rotation.x = Math.sin(t + Math.PI) * 0.5;
    if (leftArm) leftArm.rotation.x = Math.sin(t + Math.PI) * 0.3;
    if (rightArm) rightArm.rotation.x = Math.sin(t) * 0.3;
  }

  stopAnimation(pedestrian) {
    const leftLeg = pedestrian.userData.leftLeg;
    const rightLeg = pedestrian.userData.rightLeg;
    const leftArm = pedestrian.userData.leftArm;
    const rightArm = pedestrian.userData.rightArm;

    if (leftLeg) leftLeg.rotation.x = 0;
    if (rightLeg) rightLeg.rotation.x = 0;
    if (leftArm) leftArm.rotation.x = 0;
    if (rightArm) rightArm.rotation.x = 0;
  }
}