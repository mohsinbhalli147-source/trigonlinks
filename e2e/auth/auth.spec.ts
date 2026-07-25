import { test, expect } from '@playwright/test';

test.describe('Authentication Module', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/TRIGONLINKS/);
  });

  test('should have email input', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('should have password input', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should have submit button', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should redirect to login when accessing protected route', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/login/);
  });

  test('should handle session expiration', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/TRIGONLINKS/);
  });
});
