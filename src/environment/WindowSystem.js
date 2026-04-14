export class WindowSystem {
  constructor() {
    this.windows = [];
    this.updateInterval = 2000;
    this.isRunning = false;
  }

  registerWindow(windowMesh) {
    if (!windowMesh || !windowMesh.material) return;

    const isLit = Math.random() > 0.5;
    windowMesh.material.color.set(isLit ? 0xFFFF00 : 0x888888);
    windowMesh.material.emissive.set(isLit ? 0xFFFF00 : 0x000000);
    windowMesh.material.emissiveIntensity = isLit ? 0.8 : 0;

    this.windows.push({ mesh: windowMesh, isLit });
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;

    setInterval(() => this.updateWindows(), this.updateInterval);
  }

  stop() {
    this.isRunning = false;
    this.windows = [];
  }

  updateWindows() {
    if (!this.isRunning) return;

    this.windows.forEach(w => {
      if (Math.random() < 0.1) {
        w.isLit = !w.isLit;
        w.mesh.material.color.set(w.isLit ? 0xFFFF00 : 0x888888);
        w.mesh.material.emissive.set(w.isLit ? 0xFFFF00 : 0x000000);
        w.mesh.material.emissiveIntensity = w.isLit ? 0.8 : 0;
      }
    });
  }

  dispose() {
    this.stop();
  }
}
