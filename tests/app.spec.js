import { expect, test } from '@playwright/test';

async function signIn(page) {
  await page.goto('/');
  await page.getByLabel('Operator ID').fill('memberops');
  await page.getByLabel('Passphrase').fill('northstar');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('heading', { name: 'Find a member' })).toBeVisible();
}

test('operator can look up a member and view account balances', async ({ page }) => {
  await signIn(page);

  await page.getByLabel('Member ID or name').fill('M-10482');
  await page.getByRole('button', { name: 'Search' }).click();
  await page.getByRole('button', { name: /Mara Ellison M-10482/ }).click();

  await expect(page.getByRole('heading', { name: 'Accounts & balances' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Everyday Checking', exact: true })).toBeVisible();
  await expect(page.getByRole('cell', { name: '$8,420.16' })).toBeVisible();
});

test('operator can create a new account for a member', async ({ page }) => {
  await signIn(page);
  await page.getByRole('button', { name: /Mara Ellison M-10482/ }).click();
  await page.getByRole('main').getByRole('button', { name: 'New account' }).click();

  await page.getByLabel('Account name').fill('Emergency Fund');
  await page.getByRole('button', { name: 'Create account' }).click();

  await expect(page.getByRole('status')).toContainText('Emergency Fund was created');
  await expect(page.getByRole('cell', { name: 'Emergency Fund', exact: true })).toBeVisible();
});

test('operator receives deterministic business error banners', async ({ page }) => {
  await signIn(page);
  await page.getByRole('button', { name: /Mara Ellison M-10482/ }).click();
  await page.getByRole('main').getByRole('button', { name: 'New account' }).click();
  await page.getByLabel('Account name').fill('Everyday Checking');
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByRole('alert')).toContainText('Duplicate Account Name');

  await page.getByRole('button', { name: 'Member lookup' }).click();
  await page.getByLabel('Member ID or name').fill('M-99999');
  await page.getByRole('button', { name: 'Search' }).click();
  await expect(page.getByRole('alert')).toContainText('Member Not Found');
});
