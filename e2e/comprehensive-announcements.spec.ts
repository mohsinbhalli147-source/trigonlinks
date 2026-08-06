import { test, expect } from '@playwright/test';

test.describe('Comprehensive Announcements Module Testing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'mohsinbhalli147@gmail.com');
    await page.fill('input[type="password"]', 'Zimal@123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: 15000 });
  });

  test('should navigate to announcements history page', async ({ page }) => {
    await page.goto('/announcements/history');
    await expect(page).toHaveURL('/announcements/history');
  });

  test('should display announcements list', async ({ page }) => {
    await page.goto('/announcements/history');
    await page.waitForTimeout(2000);
    const announcementsList = page.locator('table, .grid, .list');
    await expect(announcementsList.first()).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to add announcement page', async ({ page }) => {
    await page.goto('/announcements/add');
    await expect(page).toHaveURL('/announcements/add');
  });
});
