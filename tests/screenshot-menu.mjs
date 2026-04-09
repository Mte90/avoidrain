import { test } from '@playwright/test';
import fs from 'fs';

test('screenshot menu', async ({ page }) => {
  await page.goto('http://localhost/avoidrain/');
  await page.waitForTimeout(2000); // Wait for game to initialize
  
  // Take screenshot
  await page.screenshot({ 
    path: 'menu-screenshot.png',
    fullPage: true 
  });
  
  console.log('Screenshot saved to menu-screenshot.png');
});
