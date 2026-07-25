import { test, expect } from '@playwright/test';
import { login, navigateToModule } from '../utils/test-helpers';

test.describe('Notifications Module', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should display notifications page', async ({ page }) => {
    await navigateToModule(page, 'notifications');
    await expect(page).toHaveTitle(/TRIGONLINKS/);
  });
});
