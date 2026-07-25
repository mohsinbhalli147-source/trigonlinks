import { test, expect } from '@playwright/test';
import { login, navigateToModule } from '../utils/test-helpers';

test.describe('New Customers Module', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should display new customers page', async ({ page }) => {
    await navigateToModule(page, 'new-customers');
    await expect(page).toHaveTitle(/TRIGONLINKS/);
  });
});
