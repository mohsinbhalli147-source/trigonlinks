import { test, expect } from '@playwright/test';

test.describe('Comprehensive Staff Module Testing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'mohsinbhalli147@gmail.com');
    await page.fill('input[type="password"]', 'Zimal@123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: 15000 });
  });

  test('should navigate to staff page', async ({ page }) => {
    await page.goto('/staff');
    await expect(page).toHaveURL('/staff');
  });

  test('should display staff list', async ({ page }) => {
    await page.goto('/staff');
    await page.waitForTimeout(2000);
    const staffList = page.locator('table, .grid, .list');
    await expect(staffList.first()).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to add staff page', async ({ page }) => {
    await page.goto('/staff/add');
    await expect(page).toHaveURL('/staff/add');
  });
});
