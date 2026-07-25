import { test, expect } from '@playwright/test';
import { login, navigateToModule } from '../utils/test-helpers';

test.describe('Complaints Module', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should display complaints page', async ({ page }) => {
    await navigateToModule(page, 'complaints');
    await expect(page).toHaveTitle(/TRIGONLINKS/);
  });
});
