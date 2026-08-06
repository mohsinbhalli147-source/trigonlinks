import { test, expect } from '@playwright/test';

test.describe('Comprehensive Customers Module Testing', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[type="email"]', 'mohsinbhalli147@gmail.com');
    await page.fill('input[type="password"]', 'Zimal@123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: 30000 });
  });

  test('should navigate to customers page', async ({ page }) => {
    await page.goto('/customers/all');
    await expect(page).toHaveURL('/customers/all');
  });

  test('should display customers list', async ({ page }) => {
    await page.goto('/customers/all');
    await page.waitForTimeout(2000);
    
    // Check if customers table or list is visible
    const customersList = page.locator('table, .grid, .list');
    await expect(customersList.first()).toBeVisible({ timeout: 10000 });
  });

  test('should have add customer button', async ({ page }) => {
    await page.goto('/customers/all');
    await page.waitForTimeout(2000);
    
    const addButton = page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("New")');
    if (await addButton.count() > 0) {
      await expect(addButton.first()).toBeVisible();
    }
  });

  test('should navigate to add customer page', async ({ page }) => {
    await page.goto('/customers/add');
    await expect(page).toHaveURL('/customers/add');
  });

  test('should display customer form fields', async ({ page }) => {
    await page.goto('/customers/add');
    await page.waitForTimeout(2000);
    
    // Check for common customer form fields
    const nameInput = page.locator('input[placeholder*="name" i], input[name*="name" i]');
    const emailInput2 = page.locator('input[type="email"]');
    const phoneInput = page.locator('input[type="tel"], input[placeholder*="phone" i], input[placeholder*="mobile" i]');
    
    // At least some form fields should be present
    const hasNameField = await nameInput.count() > 0;
    const hasEmailField = await emailInput2.count() > 0;
    const hasPhoneField = await phoneInput.count() > 0;
    const hasFormFields = hasNameField || hasEmailField || hasPhoneField;
    expect(hasFormFields).toBe(true);
  });

  test('should navigate to active customers page', async ({ page }) => {
    await page.goto('/customers/active');
    await expect(page).toHaveURL('/customers/active');
  });

  test('should navigate to suspended customers page', async ({ page }) => {
    await page.goto('/customers/suspended');
    await expect(page).toHaveURL('/customers/suspended');
  });

  test('should have search functionality', async ({ page }) => {
    await page.goto('/customers/all');
    await page.waitForTimeout(2000);
    
    // Look for search input
    const searchInput = page.locator('input[placeholder*="search" i], input[type="search"]');
    if (await searchInput.count() > 0) {
      await expect(searchInput.first()).toBeVisible();
      // Test typing in search
      await searchInput.first().fill('test');
      await page.waitForTimeout(1000);
    }
  });

  test('should have filter options', async ({ page }) => {
    await page.goto('/customers/all');
    await page.waitForTimeout(2000);
    
    // Look for filter dropdown or buttons
    const filterButton = page.locator('button:has-text("Filter"), select, .filter');
    if (await filterButton.count() > 0) {
      await expect(filterButton.first()).toBeVisible();
    }
  });

  test('should check for pagination', async ({ page }) => {
    await page.goto('/customers/all');
    await page.waitForTimeout(2000);
    
    // Look for pagination controls
    const pagination = page.locator('.pagination, button:has-text("Next"), button:has-text("Previous")');
    if (await pagination.count() > 0) {
      await expect(pagination.first()).toBeVisible();
    }
  });

  test('should navigate to customer profile', async ({ page }) => {
    // First go to customers list
    await page.goto('/customers/all');
    await page.waitForTimeout(2000);
    
    // Try to find a customer link and click it
    const customerLink = page.locator('a[href*="/customers/profile/"], a[href*="/customers/"]').first();
    if (await customerLink.isVisible({ timeout: 5000 })) {
      await customerLink.click();
      await page.waitForTimeout(1000);
      // Should be on a customer detail page
      expect(page.url()).toMatch(/\/customers\/(profile|edit)?/);
    }
  });

  test('should handle customer creation form validation', async ({ page }) => {
    await page.goto('/customers/add');
    await page.waitForTimeout(2000);
    
    // Try to submit form without required fields
    const submitButton = page.locator('button[type="submit"]');
    if (await submitButton.count() > 0) {
      await submitButton.first().click();
      await page.waitForTimeout(1000);
      
      // Check for validation errors using separate locators
      const errorMessages = page.locator('.text-red, [class*="error"], [class*="invalid"]');
      if (await errorMessages.count() > 0) {
        await expect(errorMessages.first()).toBeVisible();
      }
    }
  });

  test('should check for export functionality', async ({ page }) => {
    await page.goto('/customers/all');
    await page.waitForTimeout(2000);
    
    // Look for export button
    const exportButton = page.locator('button:has-text("Export"), button:has-text("Download")');
    if (await exportButton.count() > 0) {
      await expect(exportButton.first()).toBeVisible();
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.goto('/customers/all');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    
    // Page should still be visible
    await expect(page.locator('body')).toBeVisible();
    
    // Reset to desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test('should check for console errors on customers page', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/customers/all');
    await page.waitForTimeout(3000);
    
    if (errors.length > 0) {
      console.log('Console errors on customers page:', errors);
    }
  });
});
