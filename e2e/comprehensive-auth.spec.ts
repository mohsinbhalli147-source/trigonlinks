import { test, expect } from '@playwright/test';
import { login } from './utils/test-helpers';

test.describe('Comprehensive Authentication Testing', () => {
  test('should login with valid admin credentials', async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/\/$/, { timeout: 15000 });
    await expect(page.locator('text=TRIGONLINKS')).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[type="email"]', 'invalid@test.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    const loginResponse = page.waitForResponse(
      (response) =>
        response.url().includes('/api/auth/login') &&
        response.request().method() === 'POST',
      { timeout: 15000 }
    );
    await page.click('button[type="submit"]');
    await expect(await loginResponse).toHaveProperty('status', 401);
    await expect(page).toHaveURL(/\/login$/, { timeout: 5000 });
  });

  test('should handle customer login', async ({ page }) => {
    await page.goto('/login');
    
    // Switch to customer tab
    await page.click('text=Customer Login');
    
    // Fill in customer credentials
    await page.fill('input[placeholder="e.g. ali_khan"]', 'test_customer');
    await page.fill('input[placeholder="XXXXX-XXXXXXX-X"]', '1234567890123');
    await page.click('button:has-text("Sign In to Portal")');
    
    // Wait for response
    await page.waitForTimeout(2000);
  });

  test('should logout successfully', async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/\/$/, { timeout: 15000 });
    
    // Find and click logout button
    const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign Out")');
    if (await logoutButton.isVisible({ timeout: 5000 })) {
      await logoutButton.click();
      await page.waitForURL('/login', { timeout: 5000 });
      await expect(page).toHaveURL('/login');
    }
  });

  test('should redirect to login when accessing protected route without auth', async ({ page }) => {
    await page.goto('/customers/all');
    
    await expect(page).toHaveURL(/\/login$/, { timeout: 5000 });
  });

  test('should store tokens in localStorage after login', async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/\/$/, { timeout: 15000 });
    
    // Check localStorage for tokens
    const authToken = await page.evaluate(() => localStorage.getItem('authToken'));
    const refreshToken = await page.evaluate(() => localStorage.getItem('refreshToken'));
    const userData = await page.evaluate(() => localStorage.getItem('userData'));
    
    expect(authToken).not.toBeNull();
    expect(refreshToken).not.toBeNull();
    expect(userData).not.toBeNull();
  });

  test('should validate email format', async ({ page }) => {
    await page.goto('/login');
    
    // Try invalid email
    await page.fill('input[type="email"]', 'invalid-email');
    await page.fill('input[type="password"]', 'password123');
    
    // Browser should validate email format
    const emailInput = page.locator('input[type="email"]');
    const isValid = await emailInput.evaluate(el => (el as HTMLInputElement).checkValidity());
    
    expect(isValid).toBe(false);
  });

  test('should require both email and password', async ({ page }) => {
    await page.goto('/login');
    
    // Try submitting without password
    await page.fill('input[type="email"]', 'test@test.com');
    await page.click('button[type="submit"]');
    
    // Browser should validate required field
    const passwordInput = page.locator('input[type="password"]');
    const isValid = await passwordInput.evaluate(el => (el as HTMLInputElement).checkValidity());
    
    expect(isValid).toBe(false);
  });
});
