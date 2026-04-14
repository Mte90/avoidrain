import * as THREE from 'three';
import { materialCache, FACADE_KEYS } from '../utils/MaterialCache.js';

const ACCENT_COLORS = ['m-red', 'm-accent', 'm-yellow', 'm-metal'];
const WINDOW_FRAME_COLORS = [0x555555, 0x777777, 0x444444, 0x666666, 0x8B7355, 0x4A5568, 0x2F4F4F, 0x696969];

export class BuildingBuilder {
  constructor() {}

  build(position = { x: 0, y: 0, z: 0 }, width = 2.5, height = 6, depth = 3, hasBalcony = false, side = 'left', windowSystem = null) {
    const group = new THREE.Group();

    const facadeKey = FACADE_KEYS[Math.floor(Math.random() * FACADE_KEYS.length)];
    group.userData.facadeKey = facadeKey;
    group.userData.isBuilding = true;
    group.userData.dripLines = [];

    const facadeMat = materialCache.get(`facade-dry-${facadeKey}`).clone();
    facadeMat.userData = { facadeKey, isFacade: true };
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
      const balconyFloorY = bottomY + height * 0.35;
      balconyYPositions.push(balconyFloorY);
    }

    for (let row = 0; row < numWindowsY; row++) {
      for (let col = 0; col < numWindowsZ; col++) {
        const z = -depth / 2 + windowSpacingZ * (col + 1);
        
        // Calculate window Y position
        let y = bottomY + windowSpacingY * (row + 1);
        let currentWindowHeight = windowHeight;
        
        // Check if this window is directly under a balcony - make it taller (1.8m person height)
        for (const balconyY of balconyYPositions) {
          if (Math.abs(y - balconyY) < 1.0) {
            // Window under balcony: position it as low as possible without touching floor
            // Leave 0.2m gap from balcony floor, use full 1.8m height
            y = balconyY - 0.2 - 1.8 / 2;
            currentWindowHeight = 1.8;
            break;
          }
        }
        
        // Also skip windows that would overlap with balcony floor
        let tooCloseToBalcony = false;
        for (const balconyY of balconyYPositions) {
          if (y + currentWindowHeight / 2 > balconyY - 0.1) {
            tooCloseToBalcony = true;
            break;
          }
        }
        if (tooCloseToBalcony) continue;

        // Check if this window overlaps with any other window in the same column
        // by checking against already placed windows
        const minWindowGap = 0.2; // Minimum gap between windows
        for (let prevRow = 0; prevRow < row; prevRow++) {
          const prevY = bottomY + windowSpacingY * (prevRow + 1);
          let prevHeight = windowHeight;
          // Check if previous window was moved under balcony
          for (const balconyY of balconyYPositions) {
            if (Math.abs(prevY - balconyY) < 1.0) {
              prevHeight = 1.8;
              break;
            }
          }
          const prevTop = prevY + prevHeight / 2;
          const currentBottom = y - currentWindowHeight / 2;
          if (currentBottom < prevTop + minWindowGap) {
            tooCloseToBalcony = true; // Reuse this flag
            break;
          }
        }
        if (tooCloseToBalcony) continue;

        const frameGeo = new THREE.BoxGeometry(0.06, currentWindowHeight + 0.08, windowWidth + 0.08);
        const frameColor = WINDOW_FRAME_COLORS[Math.floor(Math.random() * WINDOW_FRAME_COLORS.length)];
        const windowFrame = new THREE.Mesh(frameGeo, new THREE.MeshStandardMaterial({ 
          color: frameColor, 
          roughness: 0.7, 
          metalness: 0.2
        }));
        windowFrame.position.set(facadeX, y, z);
        windowFrame.castShadow = false;
        windowFrame.receiveShadow = false;
        group.add(windowFrame);

        const glassGeo = new THREE.BoxGeometry(0.12, currentWindowHeight - 0.1, windowWidth - 0.2);
        const isLit = Math.random() > 0.5;
        const glassMat = new THREE.MeshStandardMaterial({
          color: 0x888888,
          roughness: 0.2,
          metalness: 0.7,
          emissive: isLit ? 0xFFFF00 : 0x222222,
          emissiveIntensity: isLit ? 0.8 : 0.2,
          transparent: false
        });
        const glass = new THREE.Mesh(glassGeo, glassMat);
        glass.position.set(facadeX + (roadDir * 0.06), y, z);
        glass.castShadow = false;
        group.add(glass);
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
      const balconyFloorY = bottomY + height * 0.35;
      
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

        const balconyWindowY = currentBalconyY + 0.06;  // Start above floor (rail thickness)
        const balconyWindowZ = 0;
        const balconyWindowWidth = 1.5;
        const balconyWindowHeight = 1.8;
        const balconyWindowFrameGeo = new THREE.BoxGeometry(0.06, balconyWindowHeight + 0.08, balconyWindowWidth + 0.08);
        const balconyWindowFrame = new THREE.Mesh(balconyWindowFrameGeo, frameMat);
        balconyWindowFrame.position.set(facadeX, balconyWindowY + balconyWindowHeight / 2, balconyWindowZ);
        balconyWindowFrame.castShadow = false;
        balconyWindowFrame.receiveShadow = false;
        group.add(balconyWindowFrame);

        const balconyGlassGeo = new THREE.PlaneGeometry(balconyWindowWidth - 0.1, balconyWindowHeight - 0.1);
        const balconyGlassMat = new THREE.MeshStandardMaterial({ 
          color: 0xFFFF00,
          roughness: 0.3,
          metalness: 0.1,
          emissive: 0xFFFF00,
          emissiveIntensity: 0.8,
          side: THREE.DoubleSide
        });
        const balconyGlass = new THREE.Mesh(balconyGlassGeo, balconyGlassMat);
        balconyGlass.position.set(facadeX + (roadDir * 0.06), balconyWindowY + balconyWindowHeight / 2, balconyWindowZ);
        balconyGlass.rotation.y = -Math.PI / 2 * roadDir;
        balconyGlass.castShadow = false;
        group.add(balconyGlass);
        
        // Add moving shadow person behind balcony window
        const shadowPersonGeo = new THREE.PlaneGeometry(0.6, 1.6);
        const shadowPersonMat = new THREE.MeshBasicMaterial({ 
          color: 0x000000, 
          transparent: true, 
          opacity: 0.6,
          side: THREE.DoubleSide
        });
        const shadowPerson = new THREE.Mesh(shadowPersonGeo, shadowPersonMat);
        shadowPerson.position.set(facadeX + (roadDir * -0.05), balconyWindowY + 0.9, balconyWindowZ);
        shadowPerson.userData.isShadowPerson = true;
        shadowPerson.userData.offset = Math.random() * Math.PI * 2;
        group.add(shadowPerson);

        const doorHeight = 2.1;
        const doorWidth = 1.0;
        const doorY = doorHeight / 2;
        const doorThickness = 0.05;
        
        // Door panel
        const doorGeo = new THREE.BoxGeometry(doorThickness, doorHeight, doorWidth);
        const doorMat = materialCache.get('m-brown');
        const door = new THREE.Mesh(doorGeo, doorMat);
        door.position.set(facadeX + (roadDir * doorThickness / 2), doorY, 0);
        door.castShadow = true;
        door.userData.isDoor = true;
        group.add(door);
        
        // Door frame
        const doorFrameGeo = new THREE.BoxGeometry(0.04, doorHeight + 0.08, doorWidth + 0.08);
        const doorFrame = new THREE.Mesh(doorFrameGeo, frameMat);
        doorFrame.position.set(facadeX, doorY, 0);
        doorFrame.castShadow = false;
        group.add(doorFrame);

        // Door handle - attached to door surface facing road
        const handleGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.12, 8);
        const handleMat = materialCache.get('m-red');
        const handle = new THREE.Mesh(handleGeo, handleMat);
        handle.rotation.x = Math.PI / 2;
        // Position on door surface (door is at facadeX + roadDir * doorThickness/2)
        // Handle local position relative to door center
        handle.position.set(roadDir * doorThickness / 2, -0.25, 0.35);
        handle.castShadow = false;
        handle.userData.isDoorHandle = true;
        door.add(handle);

        const numDrips = 2 + Math.floor(Math.random() * 3);
        for (let d = 0; d < numDrips; d++) {
          const dripGeo = new THREE.BoxGeometry(0.02, 0.5, 0.02);
          const dripMat = materialCache.get('m-blue');
          const drip = new THREE.Mesh(dripGeo, dripMat);
          const dripZ = (Math.random() - 0.5) * (balconyLength - 1);
          const baseY = currentBalconyY - 0.05;
          drip.position.set(balconyX + roadDir * (balconyProtrusion / 2 + 0.01), baseY, dripZ);
          drip.scale.y = 0.1;
          drip.userData.isDripLine = true;
          drip.userData.phase = Math.random() * Math.PI * 2;
          drip.userData.baseY = baseY;
          group.add(drip);
          group.userData.dripLines.push(drip);
        }
      }
    }

    if (Math.random() < 0.4) {
      const antennaHeight = 1.5 + Math.random() * 2;
      const antennaGeo = new THREE.CylinderGeometry(0.05, 0.08, antennaHeight, 6);
      const antennaMat = materialCache.get('m-gray', { color: 0x404040 });
      const antenna = new THREE.Mesh(antennaGeo, antennaMat);
      antenna.position.set(
        (Math.random() - 0.5) * depth * 0.6,
        height + antennaHeight / 2,
        (Math.random() - 0.5) * width * 0.6
      );
      group.add(antenna);
    }

    group.position.set(position.x, position.y, position.z);
    return group;
  }
}
