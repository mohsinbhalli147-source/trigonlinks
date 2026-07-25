import { test, expect } from '@playwright/test';
import { login, navigateToModule } from '../utils/test-helpers';

test.describe('Packages Module', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should display packages page', async ({ page }) => {
    await navigateToModule(page, 'packages');
    await expect(page).toHaveTitle(/TRIGONLINKS/);
  });
});
