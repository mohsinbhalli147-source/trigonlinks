import { test, expect } from '@playwright/test';

test.describe('Comprehensive Notifications Module Testing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'mohsinbhalli147@gmail.com');
    await page.fill('input[type="password"]', 'Zimal@123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: 15000 });
  });

  test('should navigate to notifications page', async ({ page }) => {
    await page.goto('/notifications');
    await expect(page).toHaveURL('/notifications');
  });

  test('should display notifications list', async ({ page }) => {
    await page.goto('/notifications');
    await page.waitForTimeout(2000);
    const notificationsList = page.locator('table, .grid, .list');
    await expect(notificationsList.first()).toBeVisible({ timeout: 10000 });
  });
});
