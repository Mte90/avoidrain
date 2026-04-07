import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  
  const consoleErrors = [];
  const consoleWarnings = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    } else if (msg.type() === 'warning') {
      consoleWarnings.push(msg.text());
    }
  });
  
  page.on('pageerror', error => {
    consoleErrors.push(`PAGE ERROR: ${error.message}`);
  });
  
  console.log('=== Navigating to http://localhost:5173 ===');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  
  await page.waitForTimeout(2000);
  
  console.log('Page title:', await page.title());
  console.log('Current URL:', page.url());
  
  // Check for canvas element (game)
  const canvas = await page.$('canvas');
  console.log('Canvas element found:', !!canvas);
  
  // Take screenshot of menu
  await page.screenshot({ path: '/home/mte90/Desktop/Prog/avoidrain/screenshots/menu.png', fullPage: true });
  console.log('Screenshot saved: screenshots/menu.png');
  
  // Check for any visible UI elements
  const bodyContent = await page.evaluate(() => document.body.innerText);
  console.log('Page content:', bodyContent.slice(0, 500));
  
  console.log('\n=== Console Errors ===');
  if (consoleErrors.length === 0) {
    console.log('No console errors detected!');
  } else {
    consoleErrors.forEach(e => console.log('ERROR:', e));
  }
  
  console.log('\n=== Console Warnings ===');
  if (consoleWarnings.length === 0) {
    console.log('No console warnings detected!');
  } else {
    consoleWarnings.forEach(w => console.log('WARNING:', w));
  }
  
  // Now test game interaction - press Enter to start
  console.log('\n=== Pressing Enter to start game ===');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(3000);
  
  await page.screenshot({ path: '/home/mte90/Desktop/Prog/avoidrain/screenshots/gameplay.png', fullPage: true });
  console.log('Screenshot saved: screenshots/gameplay.png');
  
  // Test player movement - press arrow keys
  console.log('\n=== Testing player movement ===');
  await page.keyboard.press('ArrowLeft');
  await page.waitForTimeout(500);
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(500);
  await page.keyboard.press('ArrowUp');
  await page.waitForTimeout(500);
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(500);
  
  await page.screenshot({ path: '/home/mte90/Desktop/Prog/avoidrain/screenshots/gameplay-moving.png', fullPage: true });
  console.log('Screenshot saved: screenshots/gameplay-moving.png');
  
  // Wait for game over (game should end when wet meter reaches 100%)
  console.log('\n=== Waiting for game over (30 seconds) ===');
  await page.waitForTimeout(30000);
  
  await page.screenshot({ path: '/home/mte90/Desktop/Prog/avoidrain/screenshots/gameover.png', fullPage: true });
  console.log('Screenshot saved: screenshots/gameover.png');
  
  // Check for game over state
  const gameOverContent = await page.evaluate(() => document.body.innerText);
  console.log('Game over content:', gameOverContent.slice(0, 500));
  
  // Press Enter to go back to menu
  console.log('\n=== Pressing Enter to return to menu ===');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2000);
  
  await page.screenshot({ path: '/home/mte90/Desktop/Prog/avoidrain/screenshots/menu-after-gameover.png', fullPage: true });
  console.log('Screenshot saved: screenshots/menu-after-gameover.png');
  
  // Final console error check
  console.log('\n=== Final Console Check ===');
  if (consoleErrors.length === 0) {
    console.log('No console errors detected during gameplay!');
  } else {
    console.log('ERRORS DETECTED:', consoleErrors);
  }
  
  await browser.close();
  
  console.log('\n=== TEST SUMMARY ===');
  console.log('Console Errors:', consoleErrors.length);
  console.log('Console Warnings:', consoleWarnings.length);
  
  if (consoleErrors.length === 0) {
    console.log('VERDICT: APPROVE');
  } else {
    console.log('VERDICT: REJECT');
  }
})();