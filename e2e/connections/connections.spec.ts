import { test, expect } from '@playwright/test';
import { login, navigateToModule } from '../utils/test-helpers';

test.describe('Connections Module', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should display connections page', async ({ page }) => {
    await navigateToModule(page, 'connections');
    await expect(page).toHaveTitle(/TRIGONLINKS/);
  });
});
