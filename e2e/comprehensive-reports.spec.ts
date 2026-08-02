import { test, expect } from '@playwright/test';
import { login } from './utils/test-helpers';

test.describe('Comprehensive Reports Module Testing', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/\/$/, { timeout: 15000 });
  });

  test('should navigate to reports page', async ({ page }) => {
    await page.goto('/reports');
    await expect(page).toHaveURL(/\/reports$/);
  });

  test('should display reports options', async ({ page }) => {
    await page.goto('/reports');
    await page.waitForTimeout(2000);
    const reportsContent = page.locator('table, .grid, .list, .card, button');
    await expect(reportsContent.first()).toBeVisible({ timeout: 10000 });
  });
});
