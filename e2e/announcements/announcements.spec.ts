import { test, expect } from '@playwright/test';
import { login, navigateToModule } from '../utils/test-helpers';

test.describe('Announcements Module', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should display announcements page', async ({ page }) => {
    await navigateToModule(page, 'announcements');
    await expect(page).toHaveTitle(/TRIGONLINKS/);
  });
});
