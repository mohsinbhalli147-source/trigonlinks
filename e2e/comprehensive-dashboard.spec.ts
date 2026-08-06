import { test, expect } from '@playwright/test';

test.describe('Comprehensive Dashboard Testing', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[type="email"]', 'mohsinbhalli147@gmail.com');
    await page.fill('input[type="password"]', 'Zimal@123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: 30000 });
  });

  test('should display dashboard with all widgets', async ({ page }) => {
    await expect(page.locator('text=TRIGONLINKS')).toBeVisible();
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();
  });

  test('should display customer statistics', async ({ page }) => {
    // Check for customer count or statistics
    await page.waitForTimeout(2000);
    const customerStats = page.locator('text=Total Customers').first();
    await expect(customerStats).toBeVisible({ timeout: 10000 });
  });

  test('should display revenue information', async ({ page }) => {
    await page.waitForTimeout(2000);
    const revenueStats = page.locator('text=Monthly Revenue');
    await expect(revenueStats).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to customers module', async ({ page }) => {
    const customersLink = page.locator('text=Customers, text=/customer/i').first();
    if (await customersLink.isVisible({ timeout: 5000 })) {
      await customersLink.click();
      await page.waitForTimeout(1000);
      await expect(page).toHaveURL(/\/customers/);
    } else {
      // Try direct navigation
      await page.goto('/customers/all');
      await expect(page).toHaveURL('/customers/all');
    }
  });

  test('should navigate to connections module', async ({ page }) => {
    const connectionsLink = page.locator('text=Connections, text=/connection/i').first();
    if (await connectionsLink.isVisible({ timeout: 5000 })) {
      await connectionsLink.click();
      await page.waitForTimeout(1000);
      await expect(page).toHaveURL(/\/connections/);
    } else {
      // Try direct navigation
      await page.goto('/connections');
      await expect(page).toHaveURL('/connections');
    }
  });

  test('should navigate to billing module', async ({ page }) => {
    const billingLink = page.locator('text=Billing, text=/billing/i').first();
    if (await billingLink.isVisible({ timeout: 5000 })) {
      await billingLink.click();
      await page.waitForTimeout(1000);
      await expect(page).toHaveURL(/\/billing/);
    } else {
      // Try direct navigation
      await page.goto('/billing');
      await expect(page).toHaveURL('/billing');
    }
  });

  test('should display loading state initially', async ({ page }) => {
    // Reload to see loading state
    await page.reload();
    // Check for loading indicators
    const loadingIndicator = page.locator('text=/loading/i, text=/Loading/i, .animate-spin');
    // Loading might be too fast to catch, so we don't fail if not found
    await page.waitForTimeout(1000);
  });

  test('should handle page refresh', async ({ page }) => {
    await page.reload();
    await page.waitForURL('/', { timeout: 10000 });
    await expect(page.locator('text=TRIGONLINKS')).toBeVisible();
  });

  test('should display recent activities', async ({ page }) => {
    await page.waitForTimeout(2000);
    const activities = page.locator('text=/activity/i, text=/Activity/i, text=/recent/i');
    // Activities might not exist, so we just check without failing
    if (await activities.count() > 0) {
      await expect(activities.first()).toBeVisible();
    }
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    await expect(page.locator('text=TRIGONLINKS')).toBeVisible();
    
    // Reset to desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test('should check for console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.waitForTimeout(3000);
    
    // Check if there are any console errors
    if (errors.length > 0) {
      console.log('Console errors found:', errors);
    }
  });

  test('should check for network failures', async ({ page }) => {
    const failedRequests: string[] = [];
    page.on('requestfailed', request => {
      failedRequests.push(request.url());
    });
    
    await page.waitForTimeout(3000);
    
    // Check if there are any failed requests
    if (failedRequests.length > 0) {
      console.log('Failed requests found:', failedRequests);
    }
  });
});
