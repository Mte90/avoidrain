import * as THREE from 'three';

const SIDING_COLORS = [0x959595, 0xA5A5A5, 0x8A8A8A, 0x9A9A9A];
const ROAD_COLOR = 0x2C2C2C;
const LINE_COLOR = 0xFFFFFF;
const CURB_COLORS = [0x666666, 0x777777, 0x6A6A6A];

export class GroundBuilder {
  constructor() {
    this.baseSidewalkRoughness = 0.95;
    this.baseRoadRoughness = 0.85;
    
    this.sidingMat = new THREE.MeshStandardMaterial({ 
      color: SIDING_COLORS[0],
      roughness: this.baseSidewalkRoughness,
      metalness: 0.02
    });
    this.roadMat = new THREE.MeshStandardMaterial({ 
      color: ROAD_COLOR,
      roughness: this.baseRoadRoughness,
      metalness: 0.05
    });
    this.lineMat = new THREE.MeshStandardMaterial({ 
      color: LINE_COLOR,
      roughness: 0.9,
      metalness: 0.02
    });
    this.curbMat = new THREE.MeshStandardMaterial({ 
      color: CURB_COLORS[0],
      roughness: 0.9,
      metalness: 0.05
    });
  }

  build(position = { x: 0, y: 0, z: 0 }, sidewalkWidth = 2, roadWidth = 3, length = 40) {
    const group = new THREE.Group();

    const sidewalkColor = SIDING_COLORS[Math.floor(Math.random() * SIDING_COLORS.length)];
    this.sidingMat.color.setHex(sidewalkColor);

    const curbColor = CURB_COLORS[Math.floor(Math.random() * CURB_COLORS.length)];
    this.curbMat.color.setHex(curbColor);

    // Raise everything by 0.5m so road is clearly visible
    const groundY = 0.5;

    const leftSidewalkGeo = new THREE.BoxGeometry(sidewalkWidth, 0.12, length);
    const leftSidewalk = new THREE.Mesh(leftSidewalkGeo, this.sidingMat);
    leftSidewalk.position.set(-roadWidth / 2 - sidewalkWidth / 2, groundY + 0.02, 0);
    leftSidewalk.receiveShadow = true;
    group.add(leftSidewalk);

    const curbHeight = 0.15;
    const curbDepth = 0.15;
    const leftCurbGeo = new THREE.BoxGeometry(curbDepth, curbHeight, length);
    const leftCurb = new THREE.Mesh(leftCurbGeo, this.curbMat);
    leftCurb.position.set(-roadWidth / 2 - sidewalkWidth + curbDepth / 2, curbHeight / 2, 0);
    leftCurb.receiveShadow = true;
    group.add(leftCurb);

    const rightSidewalkGeo = new THREE.BoxGeometry(sidewalkWidth, 0.12, length);
    const rightSidewalk = new THREE.Mesh(rightSidewalkGeo, this.sidingMat);
    rightSidewalk.position.set(roadWidth / 2 + sidewalkWidth / 2, 0.02, 0);
    rightSidewalk.receiveShadow = true;
    group.add(rightSidewalk);

    const rightCurbGeo = new THREE.BoxGeometry(curbDepth, curbHeight, length);
    const rightCurb = new THREE.Mesh(rightCurbGeo, this.curbMat);
    rightCurb.position.set(roadWidth / 2 + sidewalkWidth - curbDepth / 2, curbHeight / 2, 0);
    rightCurb.receiveShadow = true;
    group.add(rightCurb);

    const roadGeo = new THREE.BoxGeometry(roadWidth, 0.1, length);
    const road = new THREE.Mesh(roadGeo, this.roadMat);
    road.position.set(0, 0, 0);
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
      const laneLine = new THREE.Mesh(lineGeo, this.lineMat);
      laneLine.position.set(0, 0.06, -zPosition);
      group.add(laneLine);
      zPosition -= (segmentLength + gapLength);
    }

    // Edge lines (solid white lines on both sides of road)
    const edgeLineThickness = 0.08;
    const edgeLineGeo = new THREE.BoxGeometry(edgeLineThickness, 0.05, length);
    
    const leftEdgeLine = new THREE.Mesh(edgeLineGeo, this.lineMat);
    leftEdgeLine.position.set(-roadWidth / 2 + 0.15, 0.06, 0);
    group.add(leftEdgeLine);

    const rightEdgeLine = new THREE.Mesh(edgeLineGeo, this.lineMat);
    rightEdgeLine.position.set(roadWidth / 2 - 0.15, 0.06, 0);
    group.add(rightEdgeLine);

    // Crosswalk stripes (6 stripes, 0.4w x 2.0l, every ~80 units based on chunk Z)
    const crosswalkWidth = 0.4;
    const crosswalkLength = 2.0;
    const crosswalkSpacing = 80;
    
    // Position based on chunk Z to ensure consistent crosswalk placement across segments
    const chunkZ = position.z;
    const stripeOffset = (chunkZ % crosswalkSpacing) - length / 2 + crosswalkSpacing / 2;
    
    for (let i = 0; i < 6; i++) {
      const crosswalkZ = stripeOffset + i * (crosswalkSpacing / 6);
      
      // Only add if the stripe is within the current segment length
      if (crosswalkZ >= -length / 2 && crosswalkZ <= length / 2) {
        const crosswalkGeo = new THREE.BoxGeometry(crosswalkWidth, 0.08, crosswalkLength);
        const crosswalk = new THREE.Mesh(crosswalkGeo, this.lineMat);
        crosswalk.position.set(0, 0.06, crosswalkZ);
        group.add(crosswalk);
      }
    }

    // Manhole covers (2 random positions on road surface, radius 0.3 circles)
    const numManholes = 2;
    const manholeRadius = 0.3;
    
    for (let i = 0; i < numManholes; i++) {
      // Random X position on road (within road width)
      const manholeX = (Math.random() - 0.5) * roadWidth;
      // Random Z position along the road
      const manholeZ = (Math.random() - 0.5) * length;
      
      const manholeGeo = new THREE.CircleGeometry(manholeRadius, 16);
      const manholeMat = new THREE.MeshStandardMaterial({ 
        color: 0x1a1a1a,
        roughness: 0.95,
        metalness: 0.05
      });
      const manhole = new THREE.Mesh(manholeGeo, manholeMat);
      manhole.rotation.x = -Math.PI / 2;
      manhole.position.set(manholeX, 0.06, manholeZ);
      group.add(manhole);
    }

    // Sidewalk texture details - random subtle variations
    const numTiles = Math.floor(length / 2);
    for (let i = 0; i < numTiles; i++) {
      const z = (i - numTiles / 2) * 2;
      
      // Small cracks/imperfections on sidewalk (very subtle)
      if (Math.random() > 0.7) {
        const crackGeo = new THREE.BoxGeometry(0.3, 0.01, 0.05);
        const crackMat = new THREE.MeshStandardMaterial({ color: 0x1A1A1A, roughness: 1.0 });
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

  updateWetness(rainIntensity) {
    const sidewalkRoughnessReduction = 0.35;
    const roadRoughnessReduction = 0.3;
    
    this.sidingMat.roughness = this.baseSidewalkRoughness - (rainIntensity * sidewalkRoughnessReduction);
    this.roadMat.roughness = this.baseRoadRoughness - (rainIntensity * roadRoughnessReduction);
  }
}
