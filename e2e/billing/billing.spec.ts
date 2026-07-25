import { test, expect } from '@playwright/test';
import { login, navigateToModule } from '../utils/test-helpers';

test.describe('Billing Module', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should display billing page', async ({ page }) => {
    await navigateToModule(page, 'billing');
    await expect(page).toHaveTitle(/TRIGONLINKS/);
  });
});
