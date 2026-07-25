import { test, expect } from '@playwright/test';

test.describe('Comprehensive Billing Module Testing', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[type="email"]', 'mohsinbhalli147@gmail.com');
    await page.fill('input[type="password"]', 'Zimal@123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: 15000 });
  });

  test('should navigate to billing page', async ({ page }) => {
    await page.goto('/billing');
    await expect(page).toHaveURL('/billing');
  });

  test('should display billing information', async ({ page }) => {
    await page.goto('/billing');
    await page.waitForTimeout(2000);
    
    // Check for billing content
    const billingContent = page.locator('table, .grid, .list, .card');
    await expect(billingContent.first()).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to billing receive page', async ({ page }) => {
    await page.goto('/billing/receive');
    await expect(page).toHaveURL('/billing/receive');
  });

  test('should navigate to billing approval page', async ({ page }) => {
    await page.goto('/billing/approval');
    await expect(page).toHaveURL('/billing/approval');
  });

  test('should navigate to billing invoices page', async ({ page }) => {
    await page.goto('/billing/invoices');
    await expect(page).toHaveURL('/billing/invoices');
  });

  test('should navigate to billing paid page', async ({ page }) => {
    await page.goto('/billing/paid');
    await expect(page).toHaveURL('/billing/paid');
  });

  test('should navigate to billing unpaid page', async ({ page }) => {
    await page.goto('/billing/unpaid');
    await expect(page).toHaveURL('/billing/unpaid');
  });

  test('should check for console errors on billing page', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/billing');
    await page.waitForTimeout(3000);
    
    if (errors.length > 0) {
      console.log('Console errors on billing page:', errors);
    }
  });
});
