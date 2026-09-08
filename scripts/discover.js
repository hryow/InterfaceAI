import 'dotenv/config';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import { proposeNextAction } from '../agent/gemini-client.js';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const GOAL = process.env.DISCOVERY_GOAL || 'Find member M-10482 and open the member details page.';
const MAX_STEPS = Number(process.env.MAX_STEPS || 10);
const ARTIFACT_PATH = process.env.ARTIFACT_PATH || 'evidence/discovery-member-details.json';
const ALLOWED_ACTIONS = new Set(['click', 'fill', 'select', 'wait', 'finish', 'escalate']);

function validateAction(action) {
  if (!action || !ALLOWED_ACTIONS.has(action.action)) {
    throw new Error(`Unsupported discovery action: ${action?.action || 'missing action'}`);
  }
  if (['click', 'fill', 'select'].includes(action.action) && !action.target) {
    throw new Error(`${action.action} action requires a target.`);
  }
  if (['fill', 'select'].includes(action.action) && action.value === null) {
    throw new Error(`${action.action} action requires a value.`);
  }
  return action;
}

async function capturePageState(page) {
  return {
    url: page.url(),
    title: await page.title(),
    accessibility: await page.locator('body').ariaSnapshot(),
  };
}

function redactText(value) {
  return value
    .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, '[REDACTED_EMAIL]')
    .replace(/\(\d{3}\) \d{3}-\d{4}/g, '[REDACTED_PHONE]')
    .replace(/Signed in as [\w-]+/g, 'Signed in as [REDACTED_OPERATOR]');
}

function redactPageState(pageState) {
  return { ...pageState, accessibility: redactText(pageState.accessibility) };
}

function recordedAction(index, action, checkpoint) {
  return {
    index,
    action: action.action,
    target: action.target ? redactText(action.target) : null,
    value: action.value,
    reason: redactText(action.reason),
    checkpoint: redactPageState(checkpoint),
  };
}

async function requestAction(goal, pageState) {
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await proposeNextAction({ goal, pageState });
    } catch (error) {
      const transient = /503|UNAVAILABLE|429|RESOURCE_EXHAUSTED/i.test(error.message);
      if (!transient || attempt === maxAttempts) throw error;
      const delayMs = attempt * 1000;
      console.log(`Gemini temporarily unavailable; retrying in ${delayMs}ms (${attempt}/${maxAttempts - 1})`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

function targetLocator(page, role, target) {
  return page.getByRole(role, { name: target, exact: true });
}

async function executeAction(page, action) {
  if (action.action === 'click') {
    const exact = targetLocator(page, 'button', action.target);
    if (await exact.count()) return exact.first().click();
    const partial = page.getByRole('button', { name: action.target });
    if (await partial.count()) return partial.first().click();
    throw new Error(`Could not find clickable target: ${action.target}`);
  }
  if (action.action === 'fill') {
    const field = targetLocator(page, 'textbox', action.target);
    if (!(await field.count())) throw new Error(`Could not find textbox target: ${action.target}`);
    return field.first().fill(action.value);
  }
  if (action.action === 'select') {
    const field = targetLocator(page, 'combobox', action.target);
    if (!(await field.count())) throw new Error(`Could not find combobox target: ${action.target}`);
    return field.first().selectOption({ label: action.value });
  }
  if (action.action === 'wait') await page.waitForTimeout(500);
}

async function bootstrapLogin(page) {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Operator ID').fill('memberops');
  await page.getByLabel('Passphrase').fill('northstar');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.getByRole('heading', { name: 'Find a member', exact: true }).waitFor();
}

function isGoalComplete(pageState) {
  return pageState.accessibility.includes('Accounts & balances');
}

async function main() {
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your-key-here') {
    throw new Error('GEMINI_API_KEY is missing. Copy .env.example to .env and add your key.');
  }

  const browser = await chromium.launch({
    headless: process.env.HEADLESS !== 'false',
    slowMo: process.env.HEADLESS === 'false' ? 250 : 0,
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  const steps = [];
  let status = 'hard_failure';
  let finalCheckpoint = null;

  try {
    await bootstrapLogin(page);
    for (let stepIndex = 1; stepIndex <= MAX_STEPS; stepIndex += 1) {
      const before = await capturePageState(page);
      if (isGoalComplete(before)) {
        status = 'completed';
        finalCheckpoint = redactPageState(before);
        break;
      }

      const action = validateAction(await requestAction(GOAL, before));
      console.log(`Step ${stepIndex}: ${action.action}${action.target ? ` ${action.target}` : ''}`);

      if (action.action === 'finish' || action.action === 'escalate') {
        status = action.action === 'finish' && isGoalComplete(before) ? 'completed' : 'escalated';
        finalCheckpoint = redactPageState(before);
        steps.push(recordedAction(stepIndex, action, before));
        break;
      }

      await executeAction(page, action);
      const after = await capturePageState(page);
      steps.push(recordedAction(stepIndex, action, after));
      if (isGoalComplete(after)) {
        status = 'completed';
        finalCheckpoint = redactPageState(after);
        break;
      }
      if (stepIndex === MAX_STEPS) {
        status = 'escalated';
        finalCheckpoint = redactPageState(after);
      }
    }
  } catch (error) {
    const errorCheckpoint = await capturePageState(page).catch(() => null);
    finalCheckpoint = errorCheckpoint ? redactPageState(errorCheckpoint) : null;
    steps.push({ index: steps.length + 1, action: 'error', target: null, value: null, reason: redactText(error.message) });
    console.error(`Discovery failed: ${error.message}`);
  } finally {
    await context.close();
    await browser.close();
  }

  await mkdir('evidence', { recursive: true });
  await writeFile(ARTIFACT_PATH, `${JSON.stringify({ goal: GOAL, status, maxSteps: MAX_STEPS, steps, finalCheckpoint }, null, 2)}\n`);
  console.log(`Artifact: ${ARTIFACT_PATH}`);
  if (status !== 'completed') process.exitCode = 1;
}

await main();
