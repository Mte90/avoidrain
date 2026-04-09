import * as THREE from 'three';
import { materialCache } from '../utils/MaterialCache.js';

const BUILDING_COLORS = [
  'm-gray', 'm-blue', 'm-accent', 'm-light', 'm-dark',
  'm-facade-1', 'm-facade-2', 'm-facade-3', 'm-facade-4',
  'm-facade-5', 'm-facade-6', 'm-facade-7', 'm-facade-8'
];
const ACCENT_COLORS = ['m-red', 'm-accent', 'm-yellow', 'm-metal'];
const WINDOW_FRAME_COLORS = ['m-black', 'm-dark', 'm-metal', 'm-gray'];

export class BuildingBuilder {
  constructor() {}

  build(position = { x: 0, y: 0, z: 0 }, width = 2.5, height = 6, depth = 3, hasBalcony = false, side = 'left') {
    const group = new THREE.Group();

    const facadeMat = materialCache.get(BUILDING_COLORS[Math.floor(Math.random() * BUILDING_COLORS.length)]);
    const facadeAccentMat = materialCache.get(ACCENT_COLORS[Math.floor(Math.random() * ACCENT_COLORS.length)]);
    const frameMat = materialCache.get(WINDOW_FRAME_COLORS[Math.floor(Math.random() * WINDOW_FRAME_COLORS.length)]);
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
    const windowWidth = 1.5;  // Realistic: 1.4-1.6m wide
    const windowHeight = 1.6;  // Realistic: 1.5-1.8m high
    const numWindowsZ = Math.max(1, Math.floor(depth / 3.0));  // Reduced density
    const numWindowsY = Math.max(1, Math.floor(height / 3.5));  // Reduced rows for spacing
    const windowSpacingZ = depth / (numWindowsZ + 1);
    const windowSpacingY = height / (numWindowsY + 1);

    // Track balcony Y positions to avoid placing windows under balconies
    const balconyYPositions = [];
    if (hasBalcony) {
      const balconyFloorY = bottomY + height * 0.4;
      balconyYPositions.push(balconyFloorY);
    }

    for (let row = 0; row < numWindowsY; row++) {
      for (let col = 0; col < numWindowsZ; col++) {
        const z = -depth / 2 + windowSpacingZ * (col + 1);
        const y = bottomY + windowSpacingY * (row + 1);

        // Skip windows that would be under a balcony (too close)
        let tooCloseToBalcony = false;
        for (const balconyY of balconyYPositions) {
          if (Math.abs(y - balconyY) < 2.0) {  // Don't place windows under/over balconies
            tooCloseToBalcony = true;
            break;
          }
        }
        if (tooCloseToBalcony) continue;

        const frameGeo = new THREE.BoxGeometry(0.06, windowHeight + 0.08, windowWidth + 0.08);
        const windowFrame = new THREE.Mesh(frameGeo, frameMat);
        windowFrame.position.set(facadeX, y, z);
        windowFrame.castShadow = false;
        windowFrame.receiveShadow = false;
        group.add(windowFrame);

        const glassGeo = new THREE.BoxGeometry(0.04, windowHeight, windowWidth);
        const isLit = Math.random() > 0.5;
        const windowMatToUse = isLit 
          ? materialCache.get('m-yellow') 
          : materialCache.get('m-gray');
        const windowGlass = new THREE.Mesh(glassGeo, windowMatToUse);
        windowGlass.position.set(facadeX + roadDir * (-0.03), y, z);  // Glass faces road (negative offset)
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
      const balconyLength = depth - 1;  // Almost full building length
      const numBalconies = Math.random() > 0.5 ? 2 : 1;  // 1-2 balconies random
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

        const balconyWindowY = currentBalconyY - 0.15;
        // Position window at balcony edge (right side for both buildings)
        const balconyWindowZ = 0;  // Edge, not middle
        const balconyWindowWidth = 1.5;
        const balconyWindowHeight = 1.8;
        const balconyWindowFrameGeo = new THREE.BoxGeometry(0.06, balconyWindowHeight + 0.08, balconyWindowWidth + 0.08);
        const balconyWindowFrame = new THREE.Mesh(balconyWindowFrameGeo, frameMat);
        balconyWindowFrame.position.set(facadeX, balconyWindowY, balconyWindowZ);
        balconyWindowFrame.castShadow = false;
        balconyWindowFrame.receiveShadow = false;
        group.add(balconyWindowFrame);
        const balconyWindowGlassGeo = new THREE.BoxGeometry(0.04, balconyWindowHeight, balconyWindowWidth);
        const balconyWindowGlass = new THREE.Mesh(balconyWindowGlassGeo, materialCache.get('m-yellow'));
        balconyWindowGlass.position.set(facadeX + roadDir * (-0.03), balconyWindowY, balconyWindowZ);
        balconyWindowGlass.castShadow = false;
        balconyWindowGlass.receiveShadow = false;
        group.add(balconyWindowGlass);

        const doorHeight = 2.1;  // Standard door height
        const doorWidth = 1.0;
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
