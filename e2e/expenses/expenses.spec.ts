import { test, expect } from '@playwright/test';
import { login, navigateToModule } from '../utils/test-helpers';

test.describe('Expenses Module', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should display expenses page', async ({ page }) => {
    await navigateToModule(page, 'expenses');
    await expect(page).toHaveTitle(/TRIGONLINKS/);
  });
});
