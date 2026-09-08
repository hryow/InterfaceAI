// This script should:
// Launch Chromium.
// Open http://localhost:3000.
// Log in with the demo credentials.
// Capture the page’s accessibility snapshot.
// Send the snapshot and goal to proposeNextAction().
// Validate the returned action.
// Execute the action through Playwright.
// Record the action and resulting state.
// Repeat until Gemini returns finish or escalate.

import { chromium } from '@playwright/test';

// Launch Chromium and open the page
const browser = await chromium.launch({
  headless: process.env.HEADLESS !== 'false',
  slowMo: process.env.HEADLESS === 'false' ? 250 : 0,
});

const context = await browser.newContext();
const page = await context.newPage();

try {
// Open localhost:3000 and wait for the DOM content to load
  await page.goto('http://localhost:3000/', {
    waitUntil: 'domcontentloaded',
  });

  console.log(`Opened ${page.url()}`);
  console.log(await page.title());
} finally {
  await context.close();
  await browser.close();
}