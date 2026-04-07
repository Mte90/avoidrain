import * as THREE from 'three';
import { materialCache } from '../utils/MaterialCache.js';

export class PortalManager {
  constructor() {
    this.portalGroup = null;
    this.portalMesh = null;
    this.portalLight = null;
    this.animationTime = 0;
  }

  /**
   * Extract portal parameters from URL
   * Returns object with username, color, speed, ref or null if no portal params
   */
  static getPortalParams() {
    const params = new URLSearchParams(window.location.search);
    const username = params.get('username');
    const color = params.get('color');
    const speed = params.get('speed');
    const ref = params.get('ref');

    if (!username && !color && !speed && !ref) {
      return null;
    }

    return {
      username: username || 'Player',
      color: color || '#667eea',
      speed: parseFloat(speed) || 5,
      ref: ref || null
    };
  }

  /**
   * Create exit portal URL with current game stats
   */
  static createExitURL(username, color, speed) {
    const baseUrl = 'https://jam.pieter.com/portal/2026';
    const params = new URLSearchParams({
      username: username,
      color: color,
      speed: speed.toString()
    });

    // Add ref to current game
    if (window.location.origin) {
      params.set('ref', window.location.origin + window.location.pathname);
    }

    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Build 3D portal visualization
   */
  build(scene, position = { x: 0, y: 2, z: -20 }) {
    if (this.portalGroup) {
      scene.remove(this.portalGroup);
    }

    this.portalGroup = new THREE.Group();
    this.portalGroup.position.set(position.x, position.y, position.z);

    // Portal ring (torus)
    const ringGeometry = new THREE.TorusGeometry(2, 0.15, 16, 100);
    const ringMaterial = materialCache.get('m-purple', {
      color: 0x667eea,
      metalness: 0.8,
      roughness: 0.2
      // No emissive - portal glow is visual effect, not essential
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2;
    this.portalGroup.add(ring);

    // Portal glow (sphere with transparency)
    const glowGeometry = new THREE.SphereGeometry(1.8, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x667eea,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    this.portalGroup.add(glow);

    // Portal light
    this.portalLight = new THREE.PointLight(0x667eea, 1, 10);
    this.portalLight.position.set(0, 0, 0);
    this.portalGroup.add(this.portalLight);

    // Label (using sprite for 2D text)
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, 512, 128);
    ctx.font = 'bold 48px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText('Vibe Jam Portal', 256, 70);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(8, 2, 1);
    sprite.position.y = 3.5;
    this.portalGroup.add(sprite);

    scene.add(this.portalGroup);
  }

  /**
   * Update portal animation
   */
  update(delta) {
    if (!this.portalGroup) return;

    this.animationTime += delta;

    // Rotate ring
    const ring = this.portalGroup.children[0];
    if (ring) {
      ring.rotation.z = this.animationTime * 2;
    }

    // Pulse glow
    const glow = this.portalGroup.children[1];
    if (glow) {
      glow.material.opacity = 0.2 + Math.sin(this.animationTime * 3) * 0.1;
    }

    // Pulse light
    if (this.portalLight) {
      this.portalLight.intensity = 0.8 + Math.sin(this.animationTime * 4) * 0.4;
    }
  }

  /**
   * Remove portal from scene
   */
  dispose(scene) {
    if (this.portalGroup) {
      scene.remove(this.portalGroup);
      this.portalGroup.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
      this.portalGroup = null;
    }
  }
}

export const portalManager = new PortalManager();
