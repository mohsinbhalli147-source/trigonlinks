import { test, expect } from '@playwright/test';
import { login } from '../utils/test-helpers';

test.describe('Customers Module', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should navigate to customers page', async ({ page }) => {
    await page.goto('/customers/all');
    await expect(page).toHaveTitle(/TRIGONLINKS/);
  });
});
