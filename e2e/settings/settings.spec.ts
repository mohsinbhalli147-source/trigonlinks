import { test, expect } from '@playwright/test';
import { login, navigateToModule } from '../utils/test-helpers';

test.describe('Settings Module', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should display settings page', async ({ page }) => {
    await navigateToModule(page, 'settings');
    await expect(page).toHaveTitle(/TRIGONLINKS/);
  });
});
