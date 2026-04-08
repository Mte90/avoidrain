import * as THREE from 'three';
import { materialCache } from '../utils/MaterialCache.js';

export class GroundBuilder {
  build(position = { x: 0, y: 0, z: 0 }, sidewalkWidth = 2, roadWidth = 3, length = 40) {
    const group = new THREE.Group();

    const sidingMat = materialCache.get('m-sidewalk');
    const curbMat = materialCache.get('m-gray');
    const roadMat = materialCache.get('m-road');
    const lineMat = materialCache.get('m-white');

    const roadY = 0;
    const sidewalkY = 0;

    const leftSidewalkGeo = new THREE.BoxGeometry(sidewalkWidth, 0.15, length);
    const leftSidewalk = new THREE.Mesh(leftSidewalkGeo, sidingMat);
    leftSidewalk.position.set(-roadWidth / 2 - sidewalkWidth / 2, sidewalkY + 0.075, 0);
    leftSidewalk.receiveShadow = true;
    group.add(leftSidewalk);

    const curbHeight = 0.15;
    const curbDepth = 0.15;
    const leftCurbGeo = new THREE.BoxGeometry(curbDepth, curbHeight, length);
    const leftCurb = new THREE.Mesh(leftCurbGeo, curbMat);
    leftCurb.position.set(-roadWidth / 2, curbHeight / 2, 0);
    leftCurb.receiveShadow = true;
    group.add(leftCurb);

    const rightSidewalkGeo = new THREE.BoxGeometry(sidewalkWidth, 0.15, length);
    const rightSidewalk = new THREE.Mesh(rightSidewalkGeo, sidingMat);
    rightSidewalk.position.set(roadWidth / 2 + sidewalkWidth / 2, sidewalkY + 0.075, 0);
    rightSidewalk.receiveShadow = true;
    group.add(rightSidewalk);

    const rightCurbGeo = new THREE.BoxGeometry(curbDepth, curbHeight, length);
    const rightCurb = new THREE.Mesh(rightCurbGeo, curbMat);
    rightCurb.position.set(roadWidth / 2, curbHeight / 2, 0);
    rightCurb.receiveShadow = true;
    group.add(rightCurb);

    const roadGeo = new THREE.BoxGeometry(roadWidth, 0.15, length);
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.position.set(0, roadY + 0.075, 0);
    road.receiveShadow = true;
    group.add(road);

    // Center lane markings (dashed white line)
    const segmentLength = 2.0;
    const gapLength = 1.5;
    const lineThickness = 0.05;
    const lineDepth = 0.12;
    
    let zPosition = length / 2 - segmentLength / 2;
    while (zPosition > -length / 2) {
      const lineGeo = new THREE.BoxGeometry(lineThickness, lineThickness, segmentLength);
      const laneLine = new THREE.Mesh(lineGeo, lineMat);
      laneLine.position.set(0, 0.16, -zPosition);
      group.add(laneLine);
      zPosition -= (segmentLength + gapLength);
    }

    // Edge lines (solid white lines on both sides of road)
    const edgeLineThickness = 0.08;
    const edgeLineGeo = new THREE.BoxGeometry(edgeLineThickness, 0.05, length);
    
    const leftEdgeLine = new THREE.Mesh(edgeLineGeo, lineMat);
    leftEdgeLine.position.set(-roadWidth / 2 + 0.15, 0.16, 0);
    group.add(leftEdgeLine);

    const rightEdgeLine = new THREE.Mesh(edgeLineGeo, lineMat);
    rightEdgeLine.position.set(roadWidth / 2 - 0.15, 0.16, 0);
    group.add(rightEdgeLine);

    // Crosswalk stripes (6 stripes, 0.4w x 2.0l, every ~80 units based on chunk Z)
    const crosswalkWidth = 0.4;
    const crosswalkLength = 2.0;
    const crosswalkSpacing = 80;
    
    const chunkZ = position.z;
    const stripeOffset = (chunkZ % crosswalkSpacing) - length / 2 + crosswalkSpacing / 2;
    
    for (let i = 0; i < 6; i++) {
      const crosswalkZ = stripeOffset + i * (crosswalkSpacing / 6);
      
      if (crosswalkZ >= -length / 2 && crosswalkZ <= length / 2) {
        const crosswalkGeo = new THREE.BoxGeometry(crosswalkWidth, 0.08, crosswalkLength);
        const crosswalk = new THREE.Mesh(crosswalkGeo, lineMat);
        crosswalk.position.set(0, 0.16, crosswalkZ);
        group.add(crosswalk);
      }
    }

    // Manhole covers
    const manholeMat = materialCache.get('m-manhole');
    const numManholes = 2;
    const manholeRadius = 0.3;
    
    for (let i = 0; i < numManholes; i++) {
      const manholeX = (Math.random() - 0.5) * roadWidth;
      const manholeZ = (Math.random() - 0.5) * length;
      
      const manholeGeo = new THREE.CircleGeometry(manholeRadius, 16);
      const manhole = new THREE.Mesh(manholeGeo, manholeMat);
      manhole.rotation.x = -Math.PI / 2;
      manhole.position.set(manholeX, 0.06, manholeZ);
      group.add(manhole);
    }

    // Sidewalk cracks
    const crackMat = materialCache.get('m-crack');
    const numTiles = Math.floor(length / 2);
    for (let i = 0; i < numTiles; i++) {
      const z = (i - numTiles / 2) * 2;
      
      if (Math.random() > 0.7) {
        const crackGeo = new THREE.BoxGeometry(0.3, 0.01, 0.05);
        const crack = new THREE.Mesh(crackGeo, crackMat);
        crack.position.set(
          (Math.random() > 0.5 ? -roadWidth / 2 - sidewalkWidth / 2 : roadWidth / 2 + sidewalkWidth / 2) + 
          (Math.random() - 0.5) * (sidewalkWidth - 0.4),
          0.025,
          z
        );
        group.add(crack);
      }
    }

    group.position.set(position.x, position.y, position.z);
    return group;
  }
}
