import { test, expect } from '@playwright/test';

test.describe('Comprehensive Inventory Module Testing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'mohsinbhalli147@gmail.com');
    await page.fill('input[type="password"]', 'Zimal@123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: 15000 });
  });

  test('should navigate to inventory page', async ({ page }) => {
    await page.goto('/inventory');
    await expect(page).toHaveURL('/inventory');
  });

  test('should display inventory list', async ({ page }) => {
    await page.goto('/inventory');
    await page.waitForTimeout(2000);
    const inventoryList = page.locator('table, .grid, .list');
    await expect(inventoryList.first()).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to add inventory page', async ({ page }) => {
    await page.goto('/inventory/add');
    await expect(page).toHaveURL('/inventory/add');
  });
});
