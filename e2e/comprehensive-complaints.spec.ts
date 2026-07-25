import { test, expect } from '@playwright/test';

test.describe('Comprehensive Complaints Module Testing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'mohsinbhalli147@gmail.com');
    await page.fill('input[type="password"]', 'Zimal@123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: 15000 });
  });

  test('should navigate to complaints page', async ({ page }) => {
    await page.goto('/complaints');
    await expect(page).toHaveURL('/complaints');
  });

  test('should display complaints list', async ({ page }) => {
    await page.goto('/complaints');
    await page.waitForTimeout(2000);
    const complaintsList = page.locator('table, .grid, .list');
    await expect(complaintsList.first()).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to add complaint page', async ({ page }) => {
    await page.goto('/complaints/add');
    await expect(page).toHaveURL('/complaints/add');
  });
});
