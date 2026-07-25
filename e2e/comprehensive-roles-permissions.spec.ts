import { test, expect } from '@playwright/test';

test.describe('Comprehensive Roles & Permissions Testing', () => {
  test('should enforce admin-only routes', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[type="email"]', 'mohsinbhalli147@gmail.com');
    await page.fill('input[type="password"]', 'Zimal@123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: 15000 });
    
    // Try to access admin-only routes
    await page.goto('/staff');
    await page.waitForTimeout(2000);
    // Admin should be able to access staff page
    await expect(page).toHaveURL('/staff');
  });

  test('should redirect unauthorized users', async ({ page }) => {
    // Try to access protected route without login
    await page.goto('/staff');
    await page.waitForTimeout(2000);
    // Should redirect to login
    await expect(page).toHaveURL('/login');
  });

  test('should store user role in localStorage', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'mohsinbhalli147@gmail.com');
    await page.fill('input[type="password"]', 'Zimal@123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: 15000 });
    
    const userData = await page.evaluate(() => localStorage.getItem('userData'));
    expect(userData).not.toBeNull();
    
    if (userData) {
      const userObj = JSON.parse(userData);
      expect(userObj.role).toBeDefined();
    }
  });
});
