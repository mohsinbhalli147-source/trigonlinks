import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_BASE = `http://localhost:${process.env.PORT || 5000}/api`;

interface TestResult {
  endpoint: string;
  method: string;
  status: 'pass' | 'fail';
  error?: string;
  responseTime: number;
}

const results: TestResult[] = [];

async function testEndpoint(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  data?: any,
  headers?: any
): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    const config: any = {
      method,
      url: `${API_BASE}${endpoint}`,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    if (headers) {
      Object.assign(config.headers, headers);
    }
    
    const response = await axios(config);
    
    const responseTime = Date.now() - startTime;
    
    return {
      endpoint,
      method,
      status: 'pass',
      responseTime
    };
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    
    return {
      endpoint,
      method,
      status: 'fail',
      error: error.response?.data?.error || error.message,
      responseTime
    };
  }
}

async function runTests() {
  console.log('=== API Endpoint Testing ===\n');
  console.log(`Testing against: ${API_BASE}\n`);

  // Health check
  console.log('Testing health endpoint...');
  try {
    await axios.get(`http://localhost:${process.env.PORT || 5000}/health`);
    console.log('✓ Health check passed\n');
  } catch (error) {
    console.log('✗ Health check failed - server may not be running\n');
    console.log('Please start the backend server first: npm run dev');
    process.exit(1);
  }

  // Login to get token
  console.log('--- Authentication ---');
  let authToken = '';
  try {
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@trigonlinks.com',
      password: 'admin123'
    });
    authToken = loginResponse.data.accessToken; // Correct field name
    console.log('✓ Login successful, token obtained');
    console.log(`Token length: ${authToken.length}\n`);
  } catch (error: any) {
    console.log('✗ Login failed - using unauthenticated tests only');
    console.log(`  Error: ${error.response?.data?.error || error.message}\n`);
  }

  const authHeaders = authToken ? { Authorization: `Bearer ${authToken}` } : {};
  console.log(`Auth headers: ${JSON.stringify(authHeaders)}\n`);

  // Auth endpoints
  console.log('--- Auth Endpoints ---');
  results.push(await testEndpoint('/auth/login', 'POST', { email: 'admin@trigonlinks.com', password: 'wrong' }));
  results.push(await testEndpoint('/auth/register', 'POST', { email: 'test@test.com', password: 'test123', name: 'Test User' }));
  results.push(await testEndpoint('/auth/refresh', 'POST', { refreshToken: 'invalid' }));
  console.log();

  // Users endpoints
  console.log('--- Users Endpoints ---');
  results.push(await testEndpoint('/users', 'GET', undefined, authHeaders));
  results.push(await testEndpoint('/users/profile', 'GET', undefined, authHeaders));
  console.log();

  // Customers endpoints
  console.log('--- Customers Endpoints ---');
  results.push(await testEndpoint('/customers', 'GET', undefined, authHeaders));
  results.push(await testEndpoint('/customers/search?q=test', 'GET', undefined, authHeaders));
  console.log();

  // Staff endpoints
  console.log('--- Staff Endpoints ---');
  results.push(await testEndpoint('/staff', 'GET', undefined, authHeaders));
  console.log();

  // Areas endpoints
  console.log('--- Areas Endpoints ---');
  results.push(await testEndpoint('/areas', 'GET', undefined, authHeaders));
  console.log();

  // Packages endpoints
  console.log('--- Packages Endpoints ---');
  results.push(await testEndpoint('/packages', 'GET', undefined, authHeaders));
  console.log();

  // Connections endpoints
  console.log('--- Connections Endpoints ---');
  results.push(await testEndpoint('/connections', 'GET', undefined, authHeaders));
  console.log();

  // Invoices endpoints
  console.log('--- Invoices Endpoints ---');
  results.push(await testEndpoint('/invoices', 'GET', undefined, authHeaders));
  console.log();

  // Payments/Billing endpoints
  console.log('--- Billing Endpoints ---');
  results.push(await testEndpoint('/billing', 'GET', undefined, authHeaders));
  results.push(await testEndpoint('/billing/payments', 'GET', undefined, authHeaders));
  console.log();

  // Expenses endpoints
  console.log('--- Expenses Endpoints ---');
  results.push(await testEndpoint('/expenses', 'GET', undefined, authHeaders));
  results.push(await testEndpoint('/expenses/categories', 'GET', undefined, authHeaders));
  console.log();

  // Inventory endpoints
  console.log('--- Inventory Endpoints ---');
  results.push(await testEndpoint('/inventory', 'GET', undefined, authHeaders));
  console.log();

  // Complaints endpoints
  console.log('--- Complaints Endpoints ---');
  results.push(await testEndpoint('/complaints', 'GET', undefined, authHeaders));
  console.log();

  // Announcements endpoints
  console.log('--- Announcements Endpoints ---');
  results.push(await testEndpoint('/announcements', 'GET', undefined, authHeaders));
  console.log();

  // Notifications endpoints
  console.log('--- Notifications Endpoints ---');
  results.push(await testEndpoint('/notifications', 'GET', undefined, authHeaders));
  console.log();

  // Reports endpoints
  console.log('--- Reports Endpoints ---');
  results.push(await testEndpoint('/reports/summary', 'GET', undefined, authHeaders));
  console.log();

  // Dashboard endpoints
  console.log('--- Dashboard Endpoints ---');
  results.push(await testEndpoint('/dashboard', 'GET', undefined, authHeaders));
  console.log();

  // Roles endpoints
  console.log('--- Roles Endpoints ---');
  results.push(await testEndpoint('/roles', 'GET', undefined, authHeaders));
  console.log();

  // Logs endpoints
  console.log('--- Logs Endpoints ---');
  results.push(await testEndpoint('/logs', 'GET', undefined, authHeaders));
  console.log();

  // Print results
  console.log('=== Test Results ===');
  let passed = 0;
  let failed = 0;
  
  results.forEach(result => {
    const status = result.status === 'pass' ? '✓' : '✗';
    console.log(`${status} ${result.method} ${result.endpoint} (${result.responseTime}ms)`);
    if (result.error) {
      console.log(`  Error: ${result.error}`);
    }
    
    if (result.status === 'pass') passed++;
    else failed++;
  });

  console.log(`\nTotal: ${results.length} tests`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / results.length) * 100).toFixed(1)}%`);

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
