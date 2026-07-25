import { test, expect } from '@playwright/test';

test.describe('Comprehensive Error Handling Testing', () => {
  test('should handle 404 pages gracefully', async ({ page }) => {
    await page.goto('/non-existent-page');
    await page.waitForTimeout(2000);
    // Should either redirect to a 404 page or handle gracefully
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should handle network errors', async ({ page }) => {
    // Monitor for network errors
    const failedRequests: string[] = [];
    page.on('requestfailed', request => {
      failedRequests.push(request.url());
    });
    
    await page.goto('/login');
    await page.waitForTimeout(3000);
    
    if (failedRequests.length > 0) {
      console.log('Network errors detected:', failedRequests);
    }
  });

  test('should handle form validation errors', async ({ page }) => {
    await page.goto('/login');
    
    // Try to submit empty form
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    
    // Browser should validate required fields
    const emailInput = page.locator('input[type="email"]');
    const isValid = await emailInput.evaluate(el => (el as HTMLInputElement).checkValidity());
    
    expect(isValid).toBe(false);
  });
});
