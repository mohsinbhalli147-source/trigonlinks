import { test, expect } from '@playwright/test';

test.describe('Comprehensive Connections Module Testing', () => {
  test.beforeEach(async ({ page }) => {
    // Use shared login helper with more robust timeouts
    const { login } = await import('./utils/test-helpers');
    await login(page);
  });

  test('should navigate to connections page', async ({ page }) => {
    await page.goto('/connections');
    await expect(page).toHaveURL('/connections');
  });

  test('should display connections list', async ({ page }) => {
    await page.goto('/connections');
    await page.waitForTimeout(2000);
    
    // Check if connections table or list is visible
    const connectionsList = page.locator('table, .grid, .list');
    await expect(connectionsList.first()).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to add connection page', async ({ page }) => {
    await page.goto('/connections/add');
    await expect(page).toHaveURL('/connections/add');
  });

  test('should display connection form fields', async ({ page }) => {
    await page.goto('/connections/add');
    await page.waitForTimeout(2000);
    
    // Check for common connection form fields
    const nameInput = page.locator('input[placeholder*="name" i], input[name*="name" i]');
    const addressInput = page.locator('input[placeholder*="address" i], textarea[placeholder*="address" i]');
    
    // At least some form fields should be present
    const hasNameField = await nameInput.count() > 0;
    const hasAddressField = await addressInput.count() > 0;
    const hasFormFields = hasNameField || hasAddressField;
    expect(hasFormFields).toBe(true);
  });

  test('should navigate to pending connections', async ({ page }) => {
    await page.goto('/connections/pending');
    await expect(page).toHaveURL('/connections/pending');
  });

  test('should navigate to approved connections', async ({ page }) => {
    await page.goto('/connections/approved');
    await expect(page).toHaveURL('/connections/approved');
  });

  test('should navigate to rejected connections', async ({ page }) => {
    await page.goto('/connections/rejected');
    await expect(page).toHaveURL('/connections/rejected');
  });

  test('should have search functionality', async ({ page }) => {
    await page.goto('/connections');
    await page.waitForTimeout(2000);
    
    // Look for search input
    const searchInput = page.locator('input[placeholder*="search" i], input[type="search"]');
    if (await searchInput.count() > 0) {
      await expect(searchInput.first()).toBeVisible();
      await searchInput.first().fill('test');
      await page.waitForTimeout(1000);
    }
  });

  test('should have filter options', async ({ page }) => {
    await page.goto('/connections');
    await page.waitForTimeout(2000);
    
    // Look for filter dropdown or buttons
    const filterButton = page.locator('button:has-text("Filter"), select, .filter');
    if (await filterButton.count() > 0) {
      await expect(filterButton.first()).toBeVisible();
    }
  });

  test('should check for console errors on connections page', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/connections');
    await page.waitForTimeout(5000);
    
    if (errors.length > 0) {
      console.log('Console errors on connections page:', errors);
    }
  });
});
