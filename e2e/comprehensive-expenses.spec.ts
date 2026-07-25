import { test, expect } from '@playwright/test';

test.describe('Comprehensive Expenses Module Testing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'mohsinbhalli147@gmail.com');
    await page.fill('input[type="password"]', 'Zimal@123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: 15000 });
  });

  test('should navigate to expenses page', async ({ page }) => {
    await page.goto('/expenses');
    await expect(page).toHaveURL('/expenses');
  });

  test('should display expenses list', async ({ page }) => {
    await page.goto('/expenses');
    await page.waitForTimeout(2000);
    const expensesList = page.locator('table, .grid, .list');
    await expect(expensesList.first()).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to add expense page', async ({ page }) => {
    await page.goto('/expenses/add');
    await expect(page).toHaveURL('/expenses/add');
  });
});
