import { test, expect } from '@playwright/test';

test.describe('Comprehensive Packages Module Testing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'mohsinbhalli147@gmail.com');
    await page.fill('input[type="password"]', 'Zimal@123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: 15000 });
  });

  test('should navigate to packages page', async ({ page }) => {
    await page.goto('/packages/all');
    await expect(page).toHaveURL('/packages/all');
  });

  test('should display packages list', async ({ page }) => {
    await page.goto('/packages/all');
    await page.waitForTimeout(2000);
    const packagesList = page.locator('table, .grid, .list');
    await expect(packagesList.first()).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to add package page', async ({ page }) => {
    await page.goto('/packages/add');
    await expect(page).toHaveURL('/packages/add');
  });
});
