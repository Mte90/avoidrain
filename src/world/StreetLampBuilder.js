import * as THREE from 'three';
import { materialCache } from '../utils/MaterialCache.js';

export class StreetLampBuilder {
  constructor() {}

  build(position = { x: 0, y: 0, z: 0 }) {
    const group = new THREE.Group();

    const poleHeight = 3.5;
    const poleRadius = 0.15;
    const poleGeo = new THREE.CylinderGeometry(poleRadius, poleRadius, poleHeight, 16);
    const poleMat = materialCache.get('m-lamp-pole');
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.set(0, poleHeight / 2, 0);
    pole.castShadow = true;
    pole.receiveShadow = true;
    group.add(pole);

    const headWidth = 0.6;
    const headHeight = 0.3;
    const headDepth = 0.25;
    const headGeo = new THREE.BoxGeometry(headWidth, headHeight, headDepth);
    const headMat = materialCache.get('m-emissive-yellow');
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.set(0, poleHeight + headHeight / 2, 0);
    head.castShadow = true;
    head.receiveShadow = true;
    group.add(head);

    const pointLight = new THREE.PointLight(0xFFAA44, 1.0, 12);
    pointLight.position.set(0, poleHeight + 0.3, 0);
    pointLight.castShadow = true;
    pointLight.shadow.mapSize.width = 256;
    pointLight.shadow.mapSize.height = 256;
    pointLight.shadow.bias = -0.0001;
    group.add(pointLight);

    const baseHeight = 0.2;
    const baseRadius = 0.3;
    const baseGeo = new THREE.CylinderGeometry(baseRadius, baseRadius, baseHeight, 16);
    const baseMat = materialCache.get('m-lamp-base');
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.set(0, baseHeight / 2, 0);
    base.receiveShadow = true;
    group.add(base);

    group.position.set(position.x, position.y, position.z);
    group.userData = { isLamp: true };

    return group;
  }
}
