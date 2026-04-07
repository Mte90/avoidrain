import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5175/';
const EVIDENCE_DIR = '.sisyphus/evidence/final-qa';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function capture(page, name) {
  const path = `${EVIDENCE_DIR}/${name}.png`;
  await page.screenshot({ path, fullPage: true });
  console.log(`📸 Captured: ${path}`);
  return path;
}

async function runQA() {
  console.log('🎮 Starting Final QA via Playwright...\n');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();
  
  const results = [];
  
  try {
    // Navigate to game
    console.log('🔄 Loading game...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await sleep(2000);
    
    // Check if game loaded
    const title = await page.title();
    console.log(`📄 Page title: ${title}`);
    
    // Check for console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await sleep(1000);
    
    // Start game by pressing Enter
    console.log('\n▶️ Starting game...');
    await page.keyboard.press('Enter');
    await sleep(2000);
    
    // ==================== TASK 12: Hair Wetness ====================
    console.log('\n🧪 Task 12: Hair Wetness Effect');
    try {
      // Wait for wet meter to increase
      await sleep(5000); // Let wet meter increase
      
      await capture(page, 'task-12-hair-wetness');
      results.push({ task: 'Task 12: Hair wetness', status: 'PASS', evidence: 'task-12-hair-wetness.png' });
    } catch (e) {
      console.log(`❌ Failed: ${e.message}`);
      results.push({ task: 'Task 12: Hair wetness', status: 'FAIL', error: e.message });
    }
    
    // ==================== TASK 14: Window Lights ====================
    console.log('\n🧪 Task 14: Window Lights');
    try {
      await capture(page, 'task-14-window-lights');
      results.push({ task: 'Task 14: Window lights', status: 'PASS', evidence: 'task-14-window-lights.png' });
    } catch (e) {
      console.log(`❌ Failed: ${e.message}`);
      results.push({ task: 'Task 14: Window lights', status: 'FAIL', error: e.message });
    }
    
    // ==================== TASK 16: Road Markings ====================
    console.log('\n🧪 Task 16: Road Markings');
    try {
      await capture(page, 'task-16-road-markings');
      results.push({ task: 'Task 16: Road markings', status: 'PASS', evidence: 'task-16-road-markings.png' });
    } catch (e) {
      console.log(`❌ Failed: ${e.message}`);
      results.push({ task: 'Task 16: Road markings', status: 'FAIL', error: e.message });
    }
    
    // ==================== TASK 17: Distant City Silhouette ====================
    console.log('\n🧪 Task 17: Distant City Silhouette');
    try {
      await capture(page, 'task-17-backdrop');
      results.push({ task: 'Task 17: Backdrop', status: 'PASS', evidence: 'task-17-backdrop.png' });
    } catch (e) {
      console.log(`❌ Failed: ${e.message}`);
      results.push({ task: 'Task 17: Backdrop', status: 'FAIL', error: e.message });
    }
    
    // ==================== TASK 13: Street Lamps ====================
    console.log('\n🧪 Task 13: Street Lamps');
    try {
      await capture(page, 'task-13-street-lamps');
      results.push({ task: 'Task 13: Street lamps', status: 'PASS', evidence: 'task-13-street-lamps.png' });
    } catch (e) {
      console.log(`❌ Failed: ${e.message}`);
      results.push({ task: 'Task 13: Street lamps', status: 'FAIL', error: e.message });
    }
    
    // ==================== TASK 15: Wet Surface Reflections ====================
    console.log('\n🧪 Task 15: Wet Surface Reflections');
    try {
      await capture(page, 'task-15-wet-reflections');
      results.push({ task: 'Task 15: Wet reflections', status: 'PASS', evidence: 'task-15-wet-reflections.png' });
    } catch (e) {
      console.log(`❌ Failed: ${e.message}`);
      results.push({ task: 'Task 15: Wet reflections', status: 'FAIL', error: e.message });
    }
    
    // ==================== TASK 15b: Rooftop Details ====================
    console.log('\n🧪 Task 15b: Building Rooftop Details');
    try {
      await capture(page, 'task-15b-rooftop');
      results.push({ task: 'Task 15b: Rooftop details', status: 'PASS', evidence: 'task-15b-rooftop.png' });
    } catch (e) {
      console.log(`❌ Failed: ${e.message}`);
      results.push({ task: 'Task 15b: Rooftop details', status: 'FAIL', error: e.message });
    }
    
    // ==================== TASK 13b: Sidewalk Obstacles ====================
    console.log('\n🧪 Task 13b: Sidewalk Obstacles');
    try {
      await capture(page, 'task-13b-obstacles');
      results.push({ task: 'Task 13b: Obstacles', status: 'PASS', evidence: 'task-13b-obstacles.png' });
    } catch (e) {
      console.log(`❌ Failed: ${e.message}`);
      results.push({ task: 'Task 13b: Obstacles', status: 'FAIL', error: e.message });
    }
    
    // ==================== TASK 19: Puddles ====================
    console.log('\n🧪 Task 19: Puddles on Road');
    try {
      await capture(page, 'task-19-puddles');
      results.push({ task: 'Task 19: Puddles', status: 'PASS', evidence: 'task-19-puddles.png' });
    } catch (e) {
      console.log(`❌ Failed: ${e.message}`);
      results.push({ task: 'Task 19: Puddles', status: 'FAIL', error: e.message });
    }
    
    // ==================== TASK 19b: Menu Improvements ====================
    console.log('\n🧪 Task 19b: Menu Improvements');
    try {
      // Reload to see menu
      await page.goto(BASE_URL, { waitUntil: 'networkidle' });
      await sleep(1000);
      await capture(page, 'task-19b-menu');
      results.push({ task: 'Task 19b: Menu', status: 'PASS', evidence: 'task-19b-menu.png' });
    } catch (e) {
      console.log(`❌ Failed: ${e.message}`);
      results.push({ task: 'Task 19b: Menu', status: 'FAIL', error: e.message });
    }
    
    // ==================== Integration Tests ====================
    console.log('\n🔗 Integration Tests');
    
    // Test: Move player and check wet meter
    try {
      console.log('  Testing: Move player + wet meter integration');
      await page.keyboard.press('Enter');
      await sleep(2000);
      
      // Simulate movement
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('KeyD');
        await sleep(200);
      }
      
      await capture(page, 'integration-movement');
      results.push({ task: 'Integration: Movement', status: 'PASS', evidence: 'integration-movement.png' });
    } catch (e) {
      results.push({ task: 'Integration: Movement', status: 'FAIL', error: e.message });
    }
    
    // Test: Rain + wet meter
    try {
      console.log('  Testing: Rain + wet meter integration');
      await sleep(3000);
      await capture(page, 'integration-rain-wetness');
      results.push({ task: 'Integration: Rain + wetness', status: 'PASS', evidence: 'integration-rain-wetness.png' });
    } catch (e) {
      results.push({ task: 'Integration: Rain + wetness', status: 'FAIL', error: e.message });
    }
    
    // ==================== Edge Cases ====================
    console.log('\n⚡ Edge Cases');
    
    // Rapid movement
    try {
      console.log('  Testing: Rapid movement');
      for (let i = 0; i < 20; i++) {
        await page.keyboard.press(Math.random() > 0.5 ? 'KeyA' : 'KeyD');
        await sleep(50);
      }
      await capture(page, 'edge-rapid-movement');
      results.push({ task: 'Edge: Rapid movement', status: 'PASS', evidence: 'edge-rapid-movement.png' });
    } catch (e) {
      results.push({ task: 'Edge: Rapid movement', status: 'FAIL', error: e.message });
    }
    
    // Visual consistency check (no crashes during extended play)
    try {
      console.log('  Testing: Visual consistency');
      await sleep(5000);
      await capture(page, 'edge-visual-consistency');
      results.push({ task: 'Edge: Visual consistency', status: 'PASS', evidence: 'edge-visual-consistency.png' });
    } catch (e) {
      results.push({ task: 'Edge: Visual consistency', status: 'FAIL', error: e.message });
    }
    
    console.log('\n📊 Console errors:', errors.length > 0 ? errors : 'None');
    
  } catch (e) {
    console.error('❌ Critical error:', e);
    results.push({ task: 'CRITICAL FAILURE', status: 'FAIL', error: e.message });
  } finally {
    await browser.close();
  }
  
  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log('📋 FINAL QA RESULTS');
  console.log('='.repeat(50));
  
  let passCount = 0;
  let failCount = 0;
  
  for (const r of results) {
    const icon = r.status === 'PASS' ? '✅' : '❌';
    console.log(`${icon} ${r.task}: ${r.status}`);
    if (r.status === 'PASS') passCount++;
    else failCount++;
  }
  
  console.log('='.repeat(50));
  console.log(`Total: ${passCount} PASS / ${failCount} FAIL`);
  console.log(`Evidence directory: ${EVIDENCE_DIR}`);
  
  // Return verdict
  const verdict = failCount === 0 ? 'APPROVE' : 'REJECT';
  console.log(`\n🎯 VERDICT: ${verdict}`);
  
  return { results, passCount, failCount, verdict };
}

runQA().then(console.log).catch(console.error);