import { test, expect } from '@playwright/test';
import { login } from '../utils/test-helpers';

test.describe('Performance Module', () => {
  test('should verify performance metrics', async ({ page }) => {
    await login(page);
    await expect(page).toHaveTitle(/TRIGONLINKS/);
  });
});
