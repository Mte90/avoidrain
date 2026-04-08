import * as THREE from 'three';
import { materialCache } from '../utils/MaterialCache.js';

const BUILDING_COLORS = [
  'm-gray', 'm-blue', 'm-accent', 'm-light', 'm-dark',
  'm-facade-1', 'm-facade-2', 'm-facade-3', 'm-facade-4',
  'm-facade-5', 'm-facade-6', 'm-facade-7', 'm-facade-8'
];
const ACCENT_COLORS = ['m-red', 'm-accent', 'm-yellow', 'm-metal'];

export class BuildingBuilder {
  constructor() {}

  build(position = { x: 0, y: 0, z: 0 }, width = 2.5, height = 6, depth = 3, hasBalcony = false, side = 'left') {
    const group = new THREE.Group();

    const facadeMat = materialCache.get(BUILDING_COLORS[Math.floor(Math.random() * BUILDING_COLORS.length)]);
    const facadeAccentMat = materialCache.get(ACCENT_COLORS[Math.floor(Math.random() * ACCENT_COLORS.length)]);
    const frameMat = materialCache.get(ACCENT_COLORS[Math.floor(Math.random() * ACCENT_COLORS.length)]);
    const balconyMat = materialCache.get('m-balcony');
    const roofMat = materialCache.get('m-dark');
    const balconyRailingMat = materialCache.get('m-red');

    const baseHeight = 0.3;
    const baseGeo = new THREE.BoxGeometry(width, baseHeight, depth);
    const baseMat = materialCache.get('m-light');
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.set(0, baseHeight / 2, 0);
    base.receiveShadow = true;
    group.add(base);

    const facadeGeo = new THREE.BoxGeometry(width, height, depth);
    const facade = new THREE.Mesh(facadeGeo, facadeMat);
    facade.position.set(0, baseHeight + height / 2, 0);
    facade.castShadow = true;
    facade.receiveShadow = true;
    group.add(facade);

    const bottomY = baseHeight;

    const roadDir = side === 'left' ? 1 : -1;
    const facadeX = roadDir * (width / 2 + 0.01);
    const windowWidth = 0.7;
    const windowHeight = 1.2;
    const numWindowsZ = Math.max(2, Math.floor(depth / 2.5));
    const numWindowsY = Math.max(2, Math.floor(height / 2.0));
    const windowSpacingZ = depth / (numWindowsZ + 1);
    const windowSpacingY = height / (numWindowsY + 1);

    for (let row = 0; row < numWindowsY; row++) {
      for (let col = 0; col < numWindowsZ; col++) {
        const z = -depth / 2 + windowSpacingZ * (col + 1);
        const y = bottomY + windowSpacingY * (row + 1);

        const frameGeo = new THREE.BoxGeometry(0.06, windowHeight + 0.08, windowWidth + 0.08);
        const windowFrame = new THREE.Mesh(frameGeo, frameMat);
        windowFrame.position.set(facadeX, y, z);
        windowFrame.castShadow = false;
        windowFrame.receiveShadow = false;
        group.add(windowFrame);

        const glassGeo = new THREE.BoxGeometry(0.04, windowHeight, windowWidth);
        const isLit = Math.random() > 0.4;
        const windowMatToUse = isLit ? materialCache.get('m-yellow') : materialCache.get('m-dark');
        const windowGlass = new THREE.Mesh(glassGeo, windowMatToUse);
        windowGlass.position.set(facadeX + roadDir * 0.03, y, z);
        windowGlass.castShadow = false;
        windowGlass.receiveShadow = false;
        group.add(windowGlass);
      }
    }

    const roofHeight = 0.3;
    const roofGeo = new THREE.BoxGeometry(width + 0.2, roofHeight, depth + 0.2);
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(0, baseHeight + height + roofHeight / 2, 0);
    roof.castShadow = true;
    group.add(roof);

    if (hasBalcony) {
      const balconyProtrusion = 2.5;
      const balconyLength = 3.0;
      const numBalconies = 1;
      const balconyFloorY = bottomY + height * 0.4;
      
      for (let b = 0; b < numBalconies; b++) {
        const currentBalconyY = balconyFloorY;
        const railingHeight = 1.0;
        const postCount = 4;

        const balconyX = roadDir * (width / 2 + balconyProtrusion / 2);

        const floorGeo = new THREE.BoxGeometry(balconyProtrusion, 0.12, balconyLength);
        const floorMat = materialCache.get('m-balcony');
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.position.set(balconyX, currentBalconyY, 0);
        floor.castShadow = true;
        floor.receiveShadow = true;
        group.add(floor);

        const postGeo = new THREE.BoxGeometry(0.05, railingHeight, 0.05);
        const postMat = materialCache.get('m-red');
        for (let i = 0; i < postCount; i++) {
          const postZ = -balconyLength / 2 + (balconyLength / (postCount - 1)) * i;
          const post = new THREE.Mesh(postGeo, postMat);
          post.position.set(balconyX + roadDir * (balconyProtrusion / 2 - 0.025), currentBalconyY + 0.06 + railingHeight / 2, postZ);
          post.castShadow = false;
          group.add(post);
        }

        const railThickness = 0.05;
        const railHeight = 0.04;
        const railLength = balconyLength;
        const railGeo = new THREE.BoxGeometry(railThickness, railHeight, railLength);
        const railMat = materialCache.get('m-metal');
        
        const topRail = new THREE.Mesh(railGeo, railMat);
        topRail.position.set(balconyX + roadDir * (balconyProtrusion / 2 - 0.05), currentBalconyY + 0.06 + railingHeight + railHeight / 2, 0);
        topRail.castShadow = false;
        group.add(topRail);
        
        const sideRailGeo = new THREE.BoxGeometry(balconyProtrusion, 0.04, 0.04);
        
        const leftSideRail = new THREE.Mesh(sideRailGeo, railMat);
        leftSideRail.position.set(balconyX, currentBalconyY + 0.06 + railingHeight + railHeight / 2, -balconyLength / 2);
        leftSideRail.castShadow = false;
        group.add(leftSideRail);
        
        const rightSideRail = new THREE.Mesh(sideRailGeo, railMat);
        rightSideRail.position.set(balconyX, currentBalconyY + 0.06 + railingHeight + railHeight / 2, balconyLength / 2);
        rightSideRail.castShadow = false;
        group.add(rightSideRail);

        const doorHeight = 2.5;
        const doorWidth = 0.7;
        const doorY = doorHeight / 2;
        const doorFrameGeo = new THREE.BoxGeometry(0.06, doorHeight + 0.08, doorWidth + 0.08);
        const doorFrame = new THREE.Mesh(doorFrameGeo, frameMat);
        doorFrame.position.set(facadeX, doorY, 0);
        doorFrame.castShadow = false;
        group.add(doorFrame);

        const doorGlassGeo = new THREE.BoxGeometry(0.04, doorHeight, doorWidth);
        const doorGlass = new THREE.Mesh(doorGlassGeo, materialCache.get('m-yellow'));
        doorGlass.position.set(facadeX + roadDir * 0.03, doorY, 0);
        doorGlass.castShadow = false;
        group.add(doorGlass);
      }
    }

    group.position.set(position.x, position.y, position.z);
    return group;
  }
}
