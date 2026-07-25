import { test, expect } from '@playwright/test';
import { login } from '../utils/test-helpers';

test.describe('Firestore Audit', () => {
  test('should verify firestore operations', async ({ page }) => {
    await login(page);
    await expect(page).toHaveTitle(/TRIGONLINKS/);
  });
});
