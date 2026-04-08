import * as THREE from 'three';

export class GeometryPool {
  constructor() {
    this.geometries = {
      box: new THREE.BoxGeometry(1, 1, 1),
      cylinder: new THREE.CylinderGeometry(1, 1, 1, 16),
      plane: new THREE.PlaneGeometry(1, 1),
      sphere: new THREE.SphereGeometry(1, 16, 16),
      torus: new THREE.TorusGeometry(1, 0.2, 8, 16),
      cone: new THREE.ConeGeometry(1, 1, 16),
      sphereSegment: new THREE.SphereGeometry(1, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2),
    };
    
    this.stats = {
      totalRequests: 0,
      cacheHits: 0
    };
  }
  
  getBox() {
    this.stats.totalRequests++;
    this.stats.cacheHits++;
    return this.geometries.box;
  }
  
  getCylinder() {
    this.stats.totalRequests++;
    this.stats.cacheHits++;
    return this.geometries.cylinder;
  }
  
  getPlane() {
    this.stats.totalRequests++;
    this.stats.cacheHits++;
    return this.geometries.plane;
  }
  
  getSphere() {
    this.stats.totalRequests++;
    this.stats.cacheHits++;
    return this.geometries.sphere;
  }
  
  getTorus() {
    this.stats.totalRequests++;
    this.stats.cacheHits++;
    return this.geometries.torus;
  }
  
  getCone() {
    this.stats.totalRequests++;
    this.stats.cacheHits++;
    return this.geometries.cone;
  }
  
  getSphereSegment() {
    this.stats.totalRequests++;
    this.stats.cacheHits++;
    return this.geometries.sphereSegment;
  }
  
  getStats() {
    return {
      geometriesPooled: Object.keys(this.geometries).length,
      totalRequests: this.stats.totalRequests,
      cacheHits: this.stats.cacheHits,
      hitRate: this.stats.totalRequests > 0 
        ? ((this.stats.cacheHits / this.stats.totalRequests) * 100).toFixed(1) + '%'
        : '0%'
    };
  }
  
  dispose() {
    for (const key in this.geometries) {
      this.geometries[key].dispose();
    }
    this.geometries = {};
  }
}

export const geometryPool = new GeometryPool();
