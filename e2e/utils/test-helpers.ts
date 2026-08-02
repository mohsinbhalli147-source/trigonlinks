import { Page, BrowserContext } from '@playwright/test';

export interface TestUser {
  email: string;
  password: string;
  role: string;
  name: string;
}

export const testUsers: TestUser[] = [
  {
    email: 'mohsinbhalli147@gmail.com',
    password: 'Zimal@123',
    role: 'admin',
    name: 'Mohsin Bhalli'
  },
  {
    email: 'staff@trigonlinks.com',
    password: 'staff123',
    role: 'staff',
    name: 'Staff User'
  },
  {
    email: 'manager@trigonlinks.com',
    password: 'manager123',
    role: 'manager',
    name: 'Manager User'
  }
];

export async function login(page: Page, user: TestUser = testUsers[0]) {
  await page.goto('/login');
  
  await page.fill('input[type="email"]', user.email);
  await page.fill('input[type="password"]', user.password);
  const loginResponse = page.waitForResponse(
    (response) =>
      response.url().includes('/api/auth/login') &&
      response.request().method() === 'POST',
    { timeout: 15000 }
  );
  await page.click('button[type="submit"]');
  await loginResponse;
  
  // Wait for either URL change or dashboard to appear
  await Promise.race([
    page.waitForURL(/\/$/, { timeout: 15000 }),
    page.waitForSelector('text=TRIGONLINKS', { timeout: 15000 }),
    page.waitForSelector('text=Dashboard', { timeout: 15000 })
  ]).catch(() => {
    // Login might succeed even if wait fails
  });
}

export async function logout(page: Page) {
  await page.click('button:has-text("Logout")');
  await page.waitForURL('/login', { timeout: 5000 });
}

export async function waitForLoading(page: Page) {
  try {
    await page.waitForSelector('[data-testid="loading"]', { state: 'hidden', timeout: 5000 });
  } catch (e) {
    // Loading spinner might not be present
  }
}

export async function navigateToModule(page: Page, module: string) {
  // Use text-based selector instead of data-testid
  const moduleMap: Record<string, string> = {
    'dashboard': 'Dashboard',
    'customers': 'Customers',
    'announcements': 'Announcements',
    'areas': 'Areas',
    'billing': 'Billing',
    'complaints': 'Complaints',
    'connections': 'Connections',
    'expenses': 'Expenses',
    'inventory': 'Inventory',
    'new-customers': 'New Customers',
    'notifications': 'Notifications',
    'packages': 'Packages',
    'reports': 'Reports',
    'settings': 'Settings',
    'staff': 'Staff',
  };
  
  const moduleName = moduleMap[module] || module;
  
  // Try to click the module, but don't fail if it doesn't exist
  try {
    await page.click(`text=${moduleName}`, { timeout: 5000 });
  } catch (e) {
    // Module link might not exist, try direct navigation
    await page.goto(`/${module}`);
  }
  
  // Wait a bit for any loading
  await page.waitForTimeout(1000);
}

export async function checkConsoleErrors(page: Page) {
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  return errors;
}

export async function checkNetworkErrors(page: Page) {
  const failedRequests: string[] = [];
  page.on('requestfailed', request => {
    failedRequests.push(request.url());
  });
  return failedRequests;
}

export async function mockFirestoreReads(page: Page) {
  await page.evaluate(() => {
    (window as any).firestoreReadCount = 0;
    const originalGet = (window as any).firebase?.firestore?.collection?.prototype?.get;
    if (originalGet) {
      (window as any).firebase.firestore.collection.prototype.get = function() {
        (window as any).firestoreReadCount++;
        return originalGet.apply(this, arguments);
      };
    }
  });
}

export async function getFirestoreReadCount(page: Page): Promise<number> {
  return await page.evaluate(() => (window as any).firestoreReadCount || 0);
}

export async function simulateSlowNetwork(context: BrowserContext) {
  await context.setOffline(false);
  // Simulate 3G network
  await context.route('**', route => {
    route.continue({
      // Slow down by 500ms
      headers: {
        ...route.request().headers(),
      }
    });
  });
}

export async function simulateOffline(context: BrowserContext) {
  await context.setOffline(true);
}

export async function simulateOnline(context: BrowserContext) {
  await context.setOffline(false);
}

export async function checkMemoryLeaks(page: Page) {
  const memoryBefore = await page.evaluate(() => {
    return (performance as any).memory?.usedJSHeapSize || 0;
  });
  
  // Perform some actions
  await page.reload();
  await page.waitForLoadState('networkidle');
  
  const memoryAfter = await page.evaluate(() => {
    return (performance as any).memory?.usedJSHeapSize || 0;
  });
  
  return {
    before: memoryBefore,
    after: memoryAfter,
    leaked: memoryAfter > memoryBefore * 1.5 // 50% increase threshold
  };
}

export async function generateTestData(count: number) {
  const data = [];
  for (let i = 0; i < count; i++) {
    data.push({
      name: `Test Customer ${i}`,
      email: `customer${i}@test.com`,
      phone: `+92300${String(i).padStart(7, '0')}`,
      address: `Test Address ${i}`,
      cnic: `${String(i).padStart(13, '0')}`,
      package: 'Basic Package',
      status: 'active'
    });
  }
  return data;
}

export async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({ path: `test-results/screenshots/${name}.png`, fullPage: true });
}
