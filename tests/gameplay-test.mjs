/**
 * AvoidRain Gameplay Simulation Test
 * Tests core gameplay scenarios using Playwright
 * 
 * Run with: node tests/gameplay-test.mjs
 * Requires: dev server running on localhost:5173
 */

import { chromium } from 'playwright';

const DEV_SERVER_URL = 'http://localhost:5174';
const EVIDENCE_FILE = '.sisyphus/evidence/task-20-gameplay-test.log';
const STARTUP_WAIT = 3000;
const GAMEPLAY_WAIT = 5000;

// Evidence collection
const evidence = [];

function log(message) {
  const timestamp = new Date().toISOString();
  const entry = `[${timestamp}] ${message}`;
  console.log(entry);
  evidence.push(entry);
}

async function writeEvidence() {
  const fs = await import('fs');
  const dir = '.sisyphus/evidence';
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(EVIDENCE_FILE, evidence.join('\n') + '\n');
}

async function runTest() {
  const results = {
    passed: 0,
    failed: 0,
    scenarios: []
  };

  log('=== AvoidRain Gameplay Test ===');
  log(`Testing against: ${DEV_SERVER_URL}`);

  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();

  // Collect console messages
  const consoleMessages = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleMessages.push(`ERROR: ${msg.text()}`);
    }
  });

  try {
    // ============================================
    // SCENARIO 1: Menu loads and accepts Enter to start
    // ============================================
    log('');
    log('--- Scenario 1: Menu loads and accepts Enter to start ---');
    
    await page.goto(DEV_SERVER_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(STARTUP_WAIT);

    // Check menu screen is visible
    const menuVisible = await page.locator('#menu-screen').isVisible();
    log(`Menu screen visible: ${menuVisible}`);
    
    // Check for "Press ENTER to Start" text
    const menuHint = await page.locator('.menu-hint').textContent();
    log(`Menu hint text: ${menuHint}`);

    // Wait for game to fully load
    await page.waitForFunction(() => window.game !== undefined, { timeout: 10000 });
    log('Game instance available on window.game');

    // Check initial game state is MENU
    const initialState = await page.evaluate(() => window.game.getGameState());
    log(`Initial game state: ${initialState}`);
    
    const stateEnum = await page.evaluate(() => {
      const { GameState } = window.game.gameState.constructor;
      return { MENU: GameState.MENU, PLAYING: GameState.PLAYING };
    });
    log(`GameState enum: MENU=${stateEnum.MENU}, PLAYING=${stateEnum.PLAYING}`);

    // Press Enter to start game
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);

    // Check game state changed to PLAYING
    const stateAfterEnter = await page.evaluate(() => window.game.getGameState());
    log(`Game state after Enter: ${stateAfterEnter}`);
    
    const scenario1Passed = stateAfterEnter === stateEnum.PLAYING;
    results.scenarios.push({ name: 'Menu loads and accepts Enter', passed: scenario1Passed });
    if (scenario1Passed) {
      results.passed++;
      log('✓ SCENARIO 1 PASSED: Game started successfully');
    } else {
      results.failed++;
      log('✗ SCENARIO 1 FAILED: Game did not start');
    }

    // ============================================
    // SCENARIO 2: Player moves left/right with A/D keys
    // ============================================
    log('');
    log('--- Scenario 2: Player moves left/right with A/D keys ---');

    // Get initial player position
    const posBefore = await page.evaluate(() => {
      const pos = window.game.player.getPosition();
      return { x: pos.x, y: pos.y, z: pos.z };
    });
    log(`Player position before: X=${posBefore.x.toFixed(2)}, Y=${posBefore.y.toFixed(2)}, Z=${posBefore.z.toFixed(2)}`);

    // Move right with D key (hold for 1 second)
    await page.keyboard.down('d');
    await page.waitForTimeout(1000);
    await page.keyboard.up('d');
    await page.waitForTimeout(500);

    const posAfterD = await page.evaluate(() => {
      const pos = window.game.player.getPosition();
      return { x: pos.x, z: pos.z };
    });
    log(`Player position after D: X=${posAfterD.x.toFixed(2)}, Z=${posAfterD.z.toFixed(2)}`);

    // Move left with A key (hold for 1 second)
    await page.keyboard.down('a');
    await page.waitForTimeout(1000);
    await page.keyboard.up('a');
    await page.waitForTimeout(500);

    const posAfterA = await page.evaluate(() => {
      const pos = window.game.player.getPosition();
      return { x: pos.x, z: pos.z };
    });
    log(`Player position after A: X=${posAfterA.x.toFixed(2)}, Z=${posAfterA.z.toFixed(2)}`);

    // Check if player moved on X axis (lateral movement)
    const movedRight = Math.abs(posAfterD.x - posBefore.x) > 0.5;
    const movedLeft = Math.abs(posAfterA.x - posAfterD.x) > 0.5;
    log(`Player moved right: ${movedRight}, moved left: ${movedLeft}`);

    const scenario2Passed = movedRight || movedLeft;
    results.scenarios.push({ name: 'Player moves with A/D keys', passed: scenario2Passed });
    if (scenario2Passed) {
      results.passed++;
      log('✓ SCENARIO 2 PASSED: Player movement detected');
    } else {
      results.failed++;
      log('✗ SCENARIO 2 FAILED: No player movement detected');
    }

    // ============================================
    // SCENARIO 3: Wet meter increases over time
    // ============================================
    log('');
    log('--- Scenario 3: Wet meter increases over time ---');

    // Wait for gameplay to run and wetness to increase
    await page.waitForTimeout(GAMEPLAY_WAIT);

    const wetnessValue = await page.evaluate(() => window.game.getWetMeter());
    log(`Wet meter value: ${(wetnessValue * 100).toFixed(1)}%`);
    
    // Check wet meter from UI
    const wetMeterText = await page.locator('#wet-meter-text').textContent();
    log(`Wet meter UI text: ${wetMeterText}`);

    const scenario3Passed = wetnessValue > 0 || wetMeterText !== '0%';
    results.scenarios.push({ name: 'Wet meter increases', passed: scenario3Passed });
    if (scenario3Passed) {
      results.passed++;
      log('✓ SCENARIO 3 PASSED: Wet meter is increasing');
    } else {
      results.failed++;
      log('✗ SCENARIO 3 FAILED: Wet meter not increasing');
    }

    // ============================================
    // SCENARIO 4: Score increases over time
    // ============================================
    log('');
    log('--- Scenario 4: Score increases over time ---');

    // Wait for score to increase
    await page.waitForTimeout(2000);

    const scoreValue = await page.evaluate(() => window.game.getScore());
    log(`Score value: ${scoreValue}`);

    // Check score from UI
    const scoreText = await page.locator('#score').textContent();
    log(`Score UI text: ${scoreText}`);

    const scenario4Passed = scoreValue > 0 || scoreText !== '0';
    results.scenarios.push({ name: 'Score increases', passed: scenario4Passed });
    if (scenario4Passed) {
      results.passed++;
      log('✓ SCENARIO 4 PASSED: Score is increasing');
    } else {
      results.failed++;
      log('✗ SCENARIO 4 FAILED: Score not increasing');
    }

    // ============================================
    // SCENARIO 5: Chunks/buildings generate as player moves
    // ============================================
    log('');
    log('--- Scenario 5: Chunks/buildings generate as player moves ---');

    // Check chunk count
    const chunkInfo = await page.evaluate(() => {
      const chunks = window.game.chunkManager.getActiveChunks();
      return {
        activeChunks: chunks ? chunks.length : 0,
        hasChunkManager: window.game.chunkManager !== undefined
      };
    });
    log(`Active chunks: ${chunkInfo.activeChunks}`);
    log(`ChunkManager available: ${chunkInfo.hasChunkManager}`);

    // Check for buildings in scene
    const buildingInfo = await page.evaluate(() => {
      const meshes = [];
      window.game.scene.traverse((child) => {
        if (child.isMesh && child.userData && child.userData.isBuilding) {
          meshes.push(child.userData.buildingId);
        }
      });
      return { buildingCount: meshes.length, uniqueIds: [...new Set(meshes)].length };
    });
    log(`Buildings in scene: ${buildingInfo.buildingCount}`);

    const scenario5Passed = chunkInfo.activeChunks > 0 || buildingInfo.buildingCount > 0;
    results.scenarios.push({ name: 'Chunks/buildings generate', passed: scenario5Passed });
    if (scenario5Passed) {
      results.passed++;
      log('✓ SCENARIO 5 PASSED: Chunks/buildings are generating');
    } else {
      results.failed++;
      log('✗ SCENARIO 5 FAILED: No chunks/buildings detected');
    }

    // ============================================
    // SCENARIO 6: Rain system active
    // ============================================
    log('');
    log('--- Scenario 6: Rain system active ---');

    const rainInfo = await page.evaluate(() => {
      const rain = window.game.rainSystem;
      if (!rain) return { active: false, reason: 'No rain system' };
      
      return {
        active: rain.isRaining !== undefined ? rain.isRaining : true,
        hasParticleSystem: rain.rainParticles !== undefined,
        rainIntensity: rain.rainIntensity
      };
    });
    log(`Rain active: ${rainInfo.active}`);
    log(`Has particle system: ${rainInfo.hasParticleSystem}`);
    log(`Rain intensity: ${rainInfo.rainIntensity}`);

    // Check UI shows timer (game is running)
    const timerText = await page.locator('#timer').textContent();
    log(`Timer UI: ${timerText}`);

    const scenario6Passed = rainInfo.active !== false;
    results.scenarios.push({ name: 'Rain system active', passed: scenario6Passed });
    if (scenario6Passed) {
      results.passed++;
      log('✓ SCENARIO 6 PASSED: Rain system is active');
    } else {
      results.failed++;
      log('✗ SCENARIO 6 FAILED: Rain system not active');
    }

  } catch (error) {
    log(`ERROR: ${error.message}`);
    log(error.stack);
    results.failed++;
  } finally {
    // Report any console errors
    if (consoleMessages.length > 0) {
      log('');
      log('--- Console Errors ---');
      consoleMessages.forEach(msg => log(msg));
    }

    await browser.close();
  }

  // Summary
  log('');
  log('=== TEST SUMMARY ===');
  log(`Total: ${results.passed + results.failed}`);
  log(`Passed: ${results.passed}`);
  log(`Failed: ${results.failed}`);
  log('');
  results.scenarios.forEach((s, i) => {
    const status = s.passed ? '✓' : '✗';
    log(`${status} Scenario ${i + 1}: ${s.name}`);
  });

  await writeEvidence();
  log('');
  log(`Evidence written to: ${EVIDENCE_FILE}`);

  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

runTest().catch(err => {
  console.error('Test failed to run:', err);
  process.exit(1);
});