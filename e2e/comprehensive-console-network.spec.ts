import { test, expect } from '@playwright/test';

test.describe('Comprehensive Console & Network Testing', () => {
  test('should check for console errors across pages', async ({ page }) => {
    const allErrors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        allErrors.push(msg.text());
      }
    });
    
    // Test multiple pages
    const pages = ['/login', '/customers/all', '/billing', '/inventory', '/staff'];
    
    for (const url of pages) {
      await page.goto(url);
      await page.waitForTimeout(2000);
    }
    
    if (allErrors.length > 0) {
      console.log('Total console errors found:', allErrors.length);
      console.log('Errors:', allErrors);
    } else {
      console.log('No console errors found');
    }
  });

  test('should check for network failures', async ({ page }) => {
    const failedRequests: any[] = [];
    
    page.on('requestfailed', request => {
      failedRequests.push({
        url: request.url(),
        failure: request.failure()
      });
    });
    
    await page.goto('/login');
    await page.fill('input[type="email"]', 'mohsinbhalli147@gmail.com');
    await page.fill('input[type="password"]', 'Zimal@123');
    await page.click('button[type="submit"]');
    
    try {
      await page.waitForURL('/', { timeout: 15000 });
      await page.goto('/customers/all');
      await page.waitForTimeout(3000);
    } catch (e) {
      // Navigation might fail, but we still check for network errors
    }
    
    if (failedRequests.length > 0) {
      console.log('Total failed requests:', failedRequests.length);
      console.log('Failed requests:', failedRequests);
    } else {
      console.log('No network failures found');
    }
  });

  test('should check for slow API responses', async ({ page }) => {
    const responseTimes: any[] = [];
    
    page.on('response', response => {
      const startTime = Date.now();
      response.finished().then(() => {
        const duration = Date.now() - startTime;
        if (duration > 3000) {
          responseTimes.push({
            url: response.url(),
            duration: duration
          });
        }
      });
    });
    
    await page.goto('/login');
    await page.fill('input[type="email"]', 'mohsinbhalli147@gmail.com');
    await page.fill('input[type="password"]', 'Zimal@123');
    await page.click('button[type="submit"]');
    
    try {
      await page.waitForURL('/', { timeout: 15000 });
      await page.waitForTimeout(3000);
    } catch (e) {
      // Continue anyway
    }
    
    if (responseTimes.length > 0) {
      console.log('Slow API responses found:', responseTimes.length);
      console.log('Slow requests:', responseTimes);
    } else {
      console.log('All API responses are within acceptable time limits');
    }
  });
});
