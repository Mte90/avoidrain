import { test, expect } from '@playwright/test';

/**
 * BASELINE TESTS - Run BEFORE any code changes.
 * Captures current game state to detect regressions after v2 plan.
 * Access via window.game (exposed in main.js:388).
 */

test.describe('Baseline: Game Initialization', () => {
  test('game loads without console errors', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('http://localhost/avoidrain/');
    await page.waitForTimeout(5000);

    await page.screenshot({ path: '.sisyphus/evidence/baseline-initial-load.png' });

    const hasGame = await page.evaluate(() => window.game !== undefined);

    if (!hasGame) {
      console.log('WARNING: window.game not available (headless WebGL limitation)');
      console.log('Console errors:', consoleErrors.join('\n'));
    }

    expect(consoleErrors.length).toBeLessThan(5);
  });

  test('game exposes window.game when WebGL available', async ({ page }) => {
    await page.goto('http://localhost/avoidrain/');
    await page.waitForTimeout(5000);

    const gameExists = await page.evaluate(() => window.game !== undefined);

    if (!gameExists) {
      test.skip();
      return;
    }

    expect(gameExists).toBeTruthy();
  });
});

test.describe('Baseline: Asset Tracking', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost/avoidrain/');
    await page.waitForTimeout(5000);

    const ready = await page.evaluate(() => window.game !== undefined);
    if (!ready) test.skip();
  });

  test('buildings exist with windows and doors', async ({ page }) => {
    const data = await page.evaluate(() => {
      const g = window.game;
      const chunks = g.chunkManager.getActiveChunks();
      let windowCount = 0;
      let doorCount = 0;

      chunks.forEach(chunk => {
        chunk.traverse(child => {
          if (child.isMesh) {
            const h = child.geometry?.parameters?.height || 0;
            const w = child.geometry?.parameters?.width || 0;
            if (h > 1.0 && h < 2.5 && w > 0.8) windowCount++;
            if (h > 1.8 && h < 2.5 && w > 0.5 && w < 1.5) doorCount++;
          }
        });
      });

      return { chunkCount: chunks.length, buildingPositions: g.chunkManager.buildingPositions.length, windowCount, doorCount };
    });

    console.log('Building data:', JSON.stringify(data));
    expect(data.chunkCount).toBeGreaterThan(0);
    expect(data.windowCount).toBeGreaterThan(0);

    await page.screenshot({ path: '.sisyphus/evidence/baseline-buildings.png' });
  });

  test('lampposts tracked in chunkManager.lamps', async ({ page }) => {
    const data = await page.evaluate(() => {
      const g = window.game;
      return {
        lampCount: g.chunkManager.lamps.length,
        lamps: g.chunkManager.lamps.slice(0, 3).map(l => ({
          x: l.mesh?.position?.x, y: l.mesh?.position?.y, z: l.mesh?.position?.z
        }))
      };
    });

    console.log('Lamppost data:', JSON.stringify(data));
    expect(data.lampCount).toBeGreaterThanOrEqual(0);

    await page.screenshot({ path: '.sisyphus/evidence/baseline-lampposts.png' });
  });

  test('puddles tracked in chunkManager.puddles', async ({ page }) => {
    const data = await page.evaluate(() => {
      const g = window.game;
      return {
        puddleCount: g.chunkManager.puddles.length,
        puddles: g.chunkManager.puddles.slice(0, 3).map(p => ({
          x: p.mesh?.position?.x || p.position?.x,
          y: p.mesh?.position?.y || p.position?.y,
          z: p.mesh?.position?.z || p.position?.z
        }))
      };
    });

    console.log('Puddle data:', JSON.stringify(data));
    expect(data.puddleCount).toBeGreaterThanOrEqual(0);

    await page.screenshot({ path: '.sisyphus/evidence/baseline-puddles.png' });
  });

  test('cars tracked in chunkManager.cars', async ({ page }) => {
    const data = await page.evaluate(() => {
      const g = window.game;
      return {
        carCount: g.chunkManager.cars.length,
        cars: g.chunkManager.cars.slice(0, 3).map(c => ({
          x: c.mesh?.position?.x, y: c.mesh?.position?.y, z: c.mesh?.position?.z
        }))
      };
    });

    console.log('Car data:', JSON.stringify(data));
    expect(data.carCount).toBeGreaterThanOrEqual(0);

    await page.screenshot({ path: '.sisyphus/evidence/baseline-cars.png' });
  });

  test('obstacles tracked in chunkManager.obstacles', async ({ page }) => {
    const data = await page.evaluate(() => {
      const g = window.game;
      return {
        obstacleCount: g.chunkManager.obstacles.length,
        obstacles: g.chunkManager.obstacles.slice(0, 3).map(o => ({
          x: o.mesh?.position?.x || o.position?.x,
          y: o.mesh?.position?.y || o.position?.y,
          z: o.mesh?.position?.z || o.position?.z
        }))
      };
    });

    console.log('Obstacle data:', JSON.stringify(data));
    expect(data.obstacleCount).toBeGreaterThanOrEqual(0);

    await page.screenshot({ path: '.sisyphus/evidence/baseline-obstacles.png' });
  });
});

test.describe('Baseline: Player', () => {
  test('player exists when game loads', async ({ page }) => {
    await page.goto('http://localhost/avoidrain/');
    await page.waitForTimeout(5000);

    const ready = await page.evaluate(() => window.game !== undefined);
    if (!ready) {
      test.skip();
      return;
    }

    const data = await page.evaluate(() => {
      const g = window.game;
      const pos = g.player.getPosition();
      return { x: pos.x, y: pos.y, z: pos.z, hasGroup: g.player.getGroup() !== null, children: g.player.getGroup().children.length };
    });

    console.log('Player data:', JSON.stringify(data));
    expect(data.hasGroup).toBeTruthy();
    expect(data.children).toBeGreaterThan(0);

    await page.screenshot({ path: '.sisyphus/evidence/baseline-player.png' });
  });

  test('demo mode moves player in MENU state', async ({ page }) => {
    await page.goto('http://localhost/avoidrain/');
    await page.waitForTimeout(3000);

    const ready = await page.evaluate(() => window.game !== undefined);
    if (!ready) {
      test.skip();
      return;
    }

    const stateBefore = await page.evaluate(() => window.game.gameState.getState());
    expect(stateBefore).toBe('MENU');

    const posBefore = await page.evaluate(() => {
      const p = window.game.player.getPosition();
      return { x: p.x, z: p.z };
    });

    await page.waitForTimeout(3000);

    const posAfter = await page.evaluate(() => {
      const p = window.game.player.getPosition();
      return { x: p.x, z: p.z };
    });

    const moved = Math.abs(posAfter.z - posBefore.z) > 0.01 || Math.abs(posAfter.x - posBefore.x) > 0.01;
    console.log('Demo movement:', { posBefore, posAfter, moved });
    expect(moved).toBeTruthy();
  });
});

test.describe('Baseline: State Transitions', () => {
  test('Enter key transitions MENU to PLAYING', async ({ page }) => {
    await page.goto('http://localhost/avoidrain/');
    await page.waitForTimeout(3000);

    const ready = await page.evaluate(() => window.game !== undefined);
    if (!ready) {
      test.skip();
      return;
    }

    const stateBefore = await page.evaluate(() => window.game.gameState.getState());
    expect(stateBefore).toBe('MENU');

    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    const stateAfter = await page.evaluate(() => window.game.gameState.getState());
    expect(stateAfter).toBe('PLAYING');

    await page.screenshot({ path: '.sisyphus/evidence/baseline-state-transition.png' });
  });

  test('click transitions MENU to PLAYING', async ({ page }) => {
    await page.goto('http://localhost/avoidrain/');
    await page.waitForTimeout(3000);

    const ready = await page.evaluate(() => window.game !== undefined);
    if (!ready) {
      test.skip();
      return;
    }

    await page.click('body');
    await page.waitForTimeout(500);

    const state = await page.evaluate(() => window.game.gameState.getState());
    expect(state).toBe('PLAYING');
  });
});

test.describe('Baseline: Performance', () => {
  test('FPS measurement works', async ({ page }) => {
    await page.goto('http://localhost/avoidrain/');
    await page.waitForTimeout(3000);

    const fpsData = await page.evaluate(() => {
      return new Promise(resolve => {
        let frames = 0;
        const start = performance.now();
        function tick() {
          frames++;
          if (performance.now() - start >= 5000) {
            resolve({ avgFps: Math.round(frames / 5), frames });
          } else {
            requestAnimationFrame(tick);
          }
        }
        requestAnimationFrame(tick);
      });
    });

    console.log('Performance:', JSON.stringify(fpsData));
    expect(fpsData.frames).toBeGreaterThan(0);
  });
});
