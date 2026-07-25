import { test, expect } from '@playwright/test';
import { login, navigateToModule } from '../utils/test-helpers';

test.describe('Staff Module', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should display staff page', async ({ page }) => {
    await navigateToModule(page, 'staff');
    await expect(page).toHaveTitle(/TRIGONLINKS/);
  });
});
