import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

const output = [];
page.on('console', msg => output.push(msg.text()));

await page.goto('http://localhost:5175/tests/game-simulation-test.html', { waitUntil: 'networkidle' });
await page.waitForTimeout(5000);

const text = await page.textContent('#output');
console.log(text);

const hasFailure = text && text.includes('FAILED');
await browser.close();
process.exit(hasFailure ? 1 : 0);