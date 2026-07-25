import { test, expect } from '@playwright/test';

test.describe('Comprehensive Areas Module Testing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'mohsinbhalli147@gmail.com');
    await page.fill('input[type="password"]', 'Zimal@123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: 15000 });
  });

  test('should navigate to areas page', async ({ page }) => {
    await page.goto('/areas');
    await expect(page).toHaveURL('/areas');
  });

  test('should display areas list', async ({ page }) => {
    await page.goto('/areas');
    await page.waitForTimeout(2000);
    const areasList = page.locator('table, .grid, .list');
    await expect(areasList.first()).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to add area page', async ({ page }) => {
    await page.goto('/areas/add');
    await expect(page).toHaveURL('/areas/add');
  });
});
