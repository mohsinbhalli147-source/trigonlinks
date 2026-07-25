import { test, expect } from '@playwright/test';
import { login, navigateToModule } from '../utils/test-helpers';

test.describe('Inventory Module', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should display inventory page', async ({ page }) => {
    await navigateToModule(page, 'inventory');
    await expect(page).toHaveTitle(/TRIGONLINKS/);
  });
});
