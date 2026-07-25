import { test, expect } from '@playwright/test';
import { login, navigateToModule } from '../utils/test-helpers';

test.describe('Reports Module', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should display reports page', async ({ page }) => {
    await navigateToModule(page, 'reports');
    await expect(page).toHaveTitle(/TRIGONLINKS/);
  });
});
