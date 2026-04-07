import * as THREE from 'three';

const BUILDING_COLORS = [
  0x6B7A8F, 0x7A8B99, 0x8B9BA8, 0x5A6A78, 0x7A8A9A,
  0x8B7B6B, 0x9B8B7B, 0x7B6B5B, 0x6B5B4B, 0x8B7B6B,
  0x5D6B7A, 0x6B7B8B, 0x4A5A6A
];
const WINDOW_FRAME_COLORS = [0x2C3E50, 0x34495E, 0x4A5A6A, 0x5A6A7A];
const WINDOW_LIGHT_COLORS = [0xFFFFCC, 0xFFE4B5, 0xE6E6FA, 0xB0E0E6];
const ACCENT_COLORS = [0xE74C3C, 0x3498DB, 0xF39C12, 0x9B59B6, 0x1ABC9C];

export class BuildingBuilder {
  constructor() {}

  build(position = { x: 0, y: 0, z: 0 }, width = 2.5, height = 6, depth = 3, hasBalcony = false, side = 'left') {
    const group = new THREE.Group();

    const facadeColor = BUILDING_COLORS[Math.floor(Math.random() * BUILDING_COLORS.length)];
    const facadeMat = new THREE.MeshStandardMaterial({ color: facadeColor, roughness: 0.9, metalness: 0.1 });
    const accentColor = ACCENT_COLORS[Math.floor(Math.random() * ACCENT_COLORS.length)];
    const facadeAccentMat = new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.8, metalness: 0.2 });
    const frameColor = WINDOW_FRAME_COLORS[Math.floor(Math.random() * WINDOW_FRAME_COLORS.length)];
    const frameMat = new THREE.MeshStandardMaterial({ color: frameColor, roughness: 0.7, metalness: 0.3 });
    const windowLightColor = WINDOW_LIGHT_COLORS[Math.floor(Math.random() * WINDOW_LIGHT_COLORS.length)];
    const windowLit = Math.random() > 0.4;
    const windowMat = new THREE.MeshStandardMaterial({
      color: windowLit ? windowLightColor : 0x1a1a1a, 
      emissive: windowLit ? windowLightColor : 0, 
      emissiveIntensity: windowLit ? 0.3 + Math.random() * 0.4 : 0
    });
    const balconyMat = new THREE.MeshStandardMaterial({ color: 0x4A3F35, roughness: 0.85, metalness: 0.15 });
    const balconyRailingMat = new THREE.MeshStandardMaterial({ color: 0x3A3A3A, roughness: 0.6, metalness: 0.5 });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x2C2C2C, roughness: 0.95, metalness: 0.05 });

    const baseHeight = 0.3;
    const baseGeo = new THREE.BoxGeometry(width, baseHeight, depth);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x4A4A4A, roughness: 0.95, metalness: 0.05 });
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
    const windowWidth = 0.5;
    const windowHeight = 0.7;
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
        group.add(windowFrame);

        const glassGeo = new THREE.BoxGeometry(0.04, windowHeight, windowWidth);
        const windowGlass = new THREE.Mesh(glassGeo, windowMat);
        windowGlass.position.set(facadeX + roadDir * 0.03, y, z);
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
        const acMat = new THREE.MeshStandardMaterial({ color: acColor, roughness: 0.7, metalness: 0.3 });
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
        const antMat = new THREE.MeshStandardMaterial({ color: antColor, roughness: 0.6, metalness: 0.4 });
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
        const lightMat = new THREE.MeshStandardMaterial({ 
          color: lightColor, 
          emissive: lightColor, 
          emissiveIntensity: 0.8 
        });
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
        const tankMat = new THREE.MeshStandardMaterial({ color: tankColor, roughness: 0.8, metalness: 0.1 });
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
const balconyFloorY = bottomY + height * 0.8;  // Above player head      const balconyThickness = 0.12;
      const railingHeight = 1.0;
      const postCount = 4;

      const balconyX = roadDir * (width / 2 + balconyProtrusion / 2);

      const floorGeo = new THREE.BoxGeometry(balconyProtrusion, balconyThickness, balconyLength);
      const floor = new THREE.Mesh(floorGeo, balconyMat);
      floor.position.set(balconyX, balconyFloorY, 0);
      floor.castShadow = true;
      floor.receiveShadow = true;
      group.add(floor);

      const postGeo = new THREE.BoxGeometry(0.05, railingHeight, 0.05);
      for (let i = 0; i < postCount; i++) {
        const postZ = -balconyLength / 2 + (balconyLength / (postCount - 1)) * i;
        const post = new THREE.Mesh(postGeo, balconyRailingMat);
        post.position.set(balconyX + roadDir * (balconyProtrusion / 2 - 0.025), balconyFloorY + balconyThickness / 2 + railingHeight / 2, postZ);
        post.castShadow = true;
        group.add(post);
      }

      const topRailGeo = new THREE.BoxGeometry(balconyProtrusion + 0.1, 0.04, balconyLength);
      const topRail = new THREE.Mesh(topRailGeo, balconyRailingMat);
      topRail.position.set(balconyX, balconyFloorY + balconyThickness + railingHeight, 0);
      group.add(topRail);

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
