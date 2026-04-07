import { test, expect } from '@playwright/test';

test.describe('Game Launch Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/avoidrain/');
  });

  test('game loads without console errors', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    page.on('pageerror', err => {
      consoleErrors.push(err.message);
    });

    await page.waitForSelector('canvas', { timeout: 5000 });
    
    expect(consoleErrors.length).toBe(0);
  });

  test('canvas is rendered', async ({ page }) => {
    const canvas = await page.locator('canvas').first();
    await expect(canvas).toBeVisible();
    
    const boundingBox = await canvas.boundingBox();
    expect(boundingBox).toBeTruthy();
    expect(boundingBox.width).toBeGreaterThan(0);
    expect(boundingBox.height).toBeGreaterThan(0);
  });

  test('game start button is visible', async ({ page }) => {
    // Wait for menu screen and find start button
    await page.waitForSelector('text=Click', { timeout: 5000 });
    
    // Look for any clickable element (button or link)
    const startButton = await page.locator('button, a').first();
    await expect(startButton).toBeVisible({ timeout: 3000 });
  });

  test('no WebGL errors', async ({ page }) => {
    const webglErrors = [];
    
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('WebGL') && text.includes('error')) {
        webglErrors.push(text);
      }
    });

    await page.waitForTimeout(2000);
    expect(webglErrors.length).toBe(0);
  });
});
