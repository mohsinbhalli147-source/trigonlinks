import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 100 },  // Ramp up to 100 users
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 500 },  // Ramp up to 500 users
    { duration: '5m', target: 500 },  // Stay at 500 users
    { duration: '2m', target: 1000 }, // Ramp up to 1000 users
    { duration: '5m', target: 1000 }, // Stay at 1000 users
    { duration: '2m', target: 2000 }, // Ramp up to 2000 users
    { duration: '5m', target: 2000 }, // Stay at 2000 users
    { duration: '2m', target: 0 },    // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests must complete below 2s
    http_req_failed: ['rate<0.05'],     // Error rate must be below 5%
  },
};

// Base URL
const BASE_URL = __ENV.BASE_URL || 'http://localhost:5173';
const API_BASE = __ENV.API_BASE || 'http://localhost:5000/api';

// Test data
const customers = new SharedArray('customers', function () {
  const data = [];
  for (let i = 0; i < 10000; i++) {
    data.push({
      name: `Load Test Customer ${i}`,
      email: `loadtest${i}@example.com`,
      phone: `0300${String(i).padStart(7, '0')}`,
      cnic: `${String(i).padStart(13, '0')}`,
      address: `Test Address ${i}`,
    });
  }
  return data;
});

// Helper functions
function randomCustomer() {
  return customers[Math.floor(Math.random() * customers.length)];
}

export function setup() {
  // Setup: Create test user and get auth token
  const loginRes = http.post(`${API_BASE}/auth/login`, JSON.stringify({
    email: 'admin@trigonlinks.com',
    password: 'Admin@123456',
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  let token = '';
  if (loginRes.status === 200) {
    token = loginRes.json('token');
  }

  return { token };
}

export default function (data) {
  const { token } = data;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  // Test 1: Login
  const loginRes = http.post(`${API_BASE}/auth/login`, JSON.stringify({
    email: 'admin@trigonlinks.com',
    password: 'Admin@123456',
  }), { headers: { 'Content-Type': 'application/json' } });

  check(loginRes, {
    'login status is 200': (r) => r.status === 200,
    'login has token': (r) => r.json('token') !== undefined,
  });

  // Test 2: Get Dashboard
  const dashboardRes = http.get(`${API_BASE}/dashboard/stats`, { headers });
  check(dashboardRes, {
    'dashboard status is 200': (r) => r.status === 200,
    'dashboard response time < 1s': (r) => r.timings.duration < 1000,
  });

  // Test 3: Get Customers (pagination test)
  const customersRes = http.get(`${API_BASE}/customers?page=1&limit=50`, { headers });
  check(customersRes, {
    'customers status is 200': (r) => r.status === 200,
    'customers has data': (r) => r.json('data') !== undefined,
  });

  // Test 4: Search Customers
  const customer = randomCustomer();
  const searchRes = http.get(`${API_BASE}/customers?search=${customer.name}`, { headers });
  check(searchRes, {
    'search status is 200': (r) => r.status === 200,
  });

  // Test 5: Create Customer (write operation)
  const createRes = http.post(`${API_BASE}/customers`, JSON.stringify({
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    cnic: customer.cnic,
    address: customer.address,
    package: 'basic',
    area: 'area1',
  }), { headers });

  check(createRes, {
    'create customer status is 201': (r) => r.status === 201 || r.status === 200,
    'create customer has ID': (r) => r.json('id') !== undefined,
  });

  // Test 6: Get Connections
  const connectionsRes = http.get(`${API_BASE}/connections?page=1&limit=50`, { headers });
  check(connectionsRes, {
    'connections status is 200': (r) => r.status === 200,
  });

  // Test 7: Get Billing
  const billingRes = http.get(`${API_BASE}/billing/invoices?page=1&limit=50`, { headers });
  check(billingRes, {
    'billing status is 200': (r) => r.status === 200,
  });

  // Test 8: Get Reports
  const reportsRes = http.get(`${API_BASE}/reports/summary`, { headers });
  check(reportsRes, {
    'reports status is 200': (r) => r.status === 200,
  });

  // Test 9: Get Packages
  const packagesRes = http.get(`${API_BASE}/packages`, { headers });
  check(packagesRes, {
    'packages status is 200': (r) => r.status === 200,
  });

  // Test 10: Get Inventory
  const inventoryRes = http.get(`${API_BASE}/inventory?page=1&limit=50`, { headers });
  check(inventoryRes, {
    'inventory status is 200': (r) => r.status === 200,
  });

  // Test 11: Get Staff
  const staffRes = http.get(`${API_BASE}/staff?page=1&limit=50`, { headers });
  check(staffRes, {
    'staff status is 200': (r) => r.status === 200,
  });

  // Test 12: Get Areas
  const areasRes = http.get(`${API_BASE}/areas`, { headers });
  check(areasRes, {
    'areas status is 200': (r) => r.status === 200,
  });

  // Test 13: Get Expenses
  const expensesRes = http.get(`${API_BASE}/expenses?page=1&limit=50`, { headers });
  check(expensesRes, {
    'expenses status is 200': (r) => r.status === 200,
  });

  // Test 14: Get Complaints
  const complaintsRes = http.get(`${API_BASE}/complaints?page=1&limit=50`, { headers });
  check(complaintsRes, {
    'complaints status is 200': (r) => r.status === 200,
  });

  // Test 15: Get Announcements
  const announcementsRes = http.get(`${API_BASE}/announcements`, { headers });
  check(announcementsRes, {
    'announcements status is 200': (r) => r.status === 200,
  });

  // Test 16: Get Notifications
  const notificationsRes = http.get(`${API_BASE}/notifications`, { headers });
  check(notificationsRes, {
    'notifications status is 200': (r) => r.status === 200,
  });

  // Simulate user think time
  sleep(Math.random() * 3 + 1); // 1-4 seconds think time
}

export function teardown(data) {
  // Cleanup: Delete test data if needed
  console.log('Load test completed');
}
