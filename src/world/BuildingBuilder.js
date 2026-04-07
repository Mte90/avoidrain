import * as THREE from 'three';
import { materialCache } from '../utils/MaterialCache.js';

// Shared materials - MAX 15 for WebGL shader compatibility
const COLORS = {
  GRAY: 0x7A8B99,
  DARK_GRAY: 0x3a3a3a,
  LIGHT_GRAY: 0x555555,
  WHITE: 0xFFFFFF,
  BLACK: 0x1a1a1a,
  RED: 0xFF0000,
  BLUE: 0x3498DB,
  YELLOW: 0xFFFFCC,
  METAL: 0xC0C0C0
};

export class BuildingBuilder {
  constructor() {}

  build(position = { x: 0, y: 0, z: 0 }, width = 2.5, height = 6, depth = 3, hasBalcony = false, side = 'left') {
    const group = new THREE.Group();

    const facadeMat = materialCache.get('m-gray');
    const facadeAccentMat = materialCache.get('m-blue');
    const frameMat = materialCache.get('m-dark');
    const windowMat = materialCache.get('m-yellow');
    const balconyMat = materialCache.get('m-gray');
    const balconyRailingMat = materialCache.get('m-metal');
    const roofMat = materialCache.get('m-black');

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
    const windowWidth = 0.7;  // Increased from 0.5
    const windowHeight = 0.9;  // Increased from 0.7
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
        windowFrame.castShadow = false;  // No shadows on windows
        windowFrame.receiveShadow = false;
        group.add(windowFrame);

        const glassGeo = new THREE.BoxGeometry(0.04, windowHeight, windowWidth);
        const windowGlass = new THREE.Mesh(glassGeo, windowMat);
        windowGlass.position.set(facadeX + roadDir * 0.03, y, z);
        windowGlass.castShadow = false;  // No shadows on windows
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

    // Add rooftop elements (AC units, antennas, water tanks)
    const numElements = 1 + Math.floor(Math.random() * 2); // 1-2 elements
    for (let i = 0; i < numElements; i++) {
      const elementRandom = Math.random();
      
      if (elementRandom < 0.4) {
        // AC Unit (40% chance): BoxGeometry 0.6x0.4x0.5
        const acGeo = new THREE.BoxGeometry(0.6, 0.4, 0.5);
        const acColor = 0x5A6A78;
        const acMat = materialCache.get('m-blue', { color: acColor, roughness: 0.7, metalness: 0.3 });  // Share blue material
        const acUnit = new THREE.Mesh(acGeo, acMat);
        
        // Random position on roof surface (60% of roof width/depth)
        const acX = (Math.random() - 0.5) * (width * 0.6);
        const acZ = (Math.random() - 0.5) * (depth * 0.6);
        acUnit.position.set(acX, baseHeight + height + roofHeight / 2 + 0.2, acZ);
        acUnit.castShadow = true;
        group.add(acUnit);
      } else if (elementRandom < 0.65) {
        // Antenna (25% chance): CylinderGeometry 1.2 units tall with red light
        const antHeight = 1.2;
        const antGeo = new THREE.CylinderGeometry(0.03, 0.03, antHeight, 8);
        const antColor = 0xC0C0C0;
        const antMat = materialCache.get('m-dark', { color: antColor, roughness: 0.6, metalness: 0.4 });  // Share dark material
        const antenna = new THREE.Mesh(antGeo, antMat);
        
        // Random position on roof surface
        const antX = (Math.random() - 0.5) * (width * 0.6);
        const antZ = (Math.random() - 0.5) * (depth * 0.6);
        antenna.position.set(antX, baseHeight + height + roofHeight / 2 + antHeight / 2, antZ);
        antenna.castShadow = true;
        group.add(antenna);
        
        // Red blinking light at top
        const lightGeo = new THREE.SphereGeometry(0.08, 8, 8);
        const lightColor = 0xFF0000;
        const lightMat = materialCache.get('m-red', { color: 0xFF0000, roughness: 0.5 });  // Share red material
        const light = new THREE.Mesh(lightGeo, lightMat);
        light.position.set(antX, baseHeight + height + roofHeight / 2 + antHeight, antZ);
        group.add(light);
        
        // Store blinking data for animation
        antenna.userData = { isAntenna: true, light: light, blinkOffset: Math.random() * 100 };
      } else {
        // Water Tank (20% chance): CylinderGeometry 0.4x0.8
        const tankRadius = 0.4;
        const tankHeight = 0.8;
        const tankGeo = new THREE.CylinderGeometry(tankRadius, tankRadius, tankHeight, 8);
        const tankColor = 0x8B9BA8;
        const tankMat = materialCache.get('m-gray', { color: tankColor, roughness: 0.8, metalness: 0.1 });  // Share gray material
        const waterTank = new THREE.Mesh(tankGeo, tankMat);
        
        // Random position on roof surface
        const tankX = (Math.random() - 0.5) * (width * 0.6);
        const tankZ = (Math.random() - 0.5) * (depth * 0.6);
        waterTank.position.set(tankX, baseHeight + height + roofHeight / 2 + tankHeight / 2, tankZ);
        waterTank.castShadow = true;
        group.add(waterTank);
      }
    }

    if (hasBalcony) {
      const balconyProtrusion = 2.5;
      const balconyLength = 3.0;  // Full sidewalk coverage
      
      // Create multiple balconies at different heights
      const numBalconies = 1 + Math.floor(Math.random() * 2);  // 1-2 balconies per building
      const balconyFloorY = bottomY + height * 0.4;  // First balcony lower (was 0.8)
      
      for (let b = 0; b < numBalconies; b++) {
        const currentBalconyY = balconyFloorY + b * (height / (numBalconies + 1));
        const railingHeight = 1.0;
        const postCount = 4;

        const balconyX = roadDir * (width / 2 + balconyProtrusion / 2);

        // Floor
        const floorGeo = new THREE.BoxGeometry(balconyProtrusion, 0.12, balconyLength);
        const floorMat = materialCache.get('m-gray', { color: 0x5A5A5A, roughness: 0.85, metalness: 0.15 });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.position.set(balconyX, currentBalconyY, 0);
        floor.castShadow = true;
        floor.receiveShadow = true;
        group.add(floor);

        // Posts (RED)
        // Posts - RED for visibility
        const postGeo = new THREE.BoxGeometry(0.05, railingHeight, 0.05);
        const postMat = materialCache.get('m-red', { color: 0xFF0000, roughness: 0.6, metalness: 0.5 });  // Share red material
        for (let i = 0; i < postCount; i++) {
          const postZ = -balconyLength / 2 + (balconyLength / (postCount - 1)) * i;
          const post = new THREE.Mesh(postGeo, postMat);
          post.position.set(balconyX + roadDir * (balconyProtrusion / 2 - 0.025), currentBalconyY + 0.06 + railingHeight / 2, postZ);
          post.castShadow = true;
          group.add(post);
        }

        // Top rail - sits ON TOP of posts, connected to facade
        const railThickness = 0.05;  // Thin rail
        const railHeight = 0.04;
        const railLength = balconyLength;  // Match balcony length
        const railGeo = new THREE.BoxGeometry(railThickness, railHeight, railLength);
        const railMat = materialCache.get('m-metal', { color: COLORS.METAL, roughness: 0.6, metalness: 0.5 });
        const topRail = new THREE.Mesh(railGeo, railMat);
        // Position: on top of posts (post top = currentBalconyY + 0.06 + railingHeight)
        // X position: aligned with post outer edge
        topRail.position.set(balconyX + roadDir * (balconyProtrusion / 2 - 0.05), currentBalconyY + 0.06 + railingHeight + railHeight / 2, 0);
        topRail.castShadow = true;
        group.add(topRail);
        
        // Side rails - connect posts on left and right sides of balcony
        const sideRailGeo = new THREE.BoxGeometry(balconyProtrusion, railHeight, 0.04);
        const leftSideRail = new THREE.Mesh(sideRailGeo, railMat);
        leftSideRail.position.set(balconyX + roadDir * (balconyProtrusion / 2 - 0.05), currentBalconyY + 0.06 + railingHeight / 2, -balconyLength / 2);
        leftSideRail.castShadow = true;
        group.add(leftSideRail);
        
        const rightSideRail = new THREE.Mesh(sideRailGeo, railMat);
        rightSideRail.position.set(balconyX + roadDir * (balconyProtrusion / 2 - 0.05), currentBalconyY + 0.06 + railingHeight / 2, balconyLength / 2);
        rightSideRail.castShadow = true;
        group.add(rightSideRail);

        // Add window UNDER the first balcony only (at balcony floor level)
        // Window should be ~1.8m tall (player height) for access
        const underBalconyWindowY = bottomY + 0.9;  // Center at 0.9m, so bottom at 0m (ground level)
        const underBalconyWindowHeight = 1.8;  // Player height for access
        const underBalconyWindowWidth = 0.8;  // Slightly wider than regular windows
        
        if (b === 0 && underBalconyWindowY + underBalconyWindowHeight / 2 < currentBalconyY - 0.2) {  // Only for first balcony
          const underFrameGeo = new THREE.BoxGeometry(0.06, underBalconyWindowHeight + 0.08, underBalconyWindowWidth + 0.08);
          const underWindowFrame = new THREE.Mesh(underFrameGeo, frameMat);
          underWindowFrame.position.set(facadeX, underBalconyWindowY, 0);
          underWindowFrame.castShadow = false;  // No shadows on windows
          underWindowFrame.receiveShadow = false;
          group.add(underWindowFrame);

          const underGlassGeo = new THREE.BoxGeometry(0.04, underBalconyWindowHeight, underBalconyWindowWidth);
          const underWindowLit = Math.random() > 0.5;
          // No emissive - use bright color only
          const underWindowMat = materialCache.get('m-yellow');
          const underWindowGlass = new THREE.Mesh(underGlassGeo, underWindowMat);
          underWindowGlass.position.set(facadeX + roadDir * 0.03, underBalconyWindowY, 0);
          underWindowGlass.castShadow = false;  // No shadows on windows
          underWindowGlass.receiveShadow = false;
          group.add(underWindowGlass);
        }
      }

      // Remove bottom rail to make railing open (no brown background)
      // Only top rail + posts for open feel
    }

    if (Math.random() > 0.4) {
      const stripWidth = 0.15;
      const stripGeo = new THREE.BoxGeometry(stripWidth, height * 0.7, 0.08);
      const strip = new THREE.Mesh(stripGeo, facadeAccentMat);
      strip.position.set(roadDir * (width / 2 - stripWidth - 0.05), bottomY + height / 2, 0);
      group.add(strip);
    }

    group.position.set(position.x, position.y, position.z);
    return group;
  }
}
