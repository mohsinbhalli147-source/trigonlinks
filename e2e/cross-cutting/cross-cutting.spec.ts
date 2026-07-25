import { test, expect } from '@playwright/test';
import { login } from '../utils/test-helpers';

test.describe('Cross-Cutting Concerns', () => {
  test('should handle page refresh', async ({ page }) => {
    await login(page);
    await page.reload();
    await expect(page).toHaveTitle(/TRIGONLINKS/);
  });
});
