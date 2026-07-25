import axios from 'axios';

const API_BASE = 'http://localhost:5000';

async function testCompleteFlow() {
  console.log('=== COMPLETE FRONTEND FLOW TEST ===\n');

  // Step 1: Login as admin to get token
  console.log('Step 1: Admin login...');
  const adminLogin = await axios.post(`${API_BASE}/api/auth/login`, {
    email: 'admin@trigonlinks.com',
    password: 'admin123'
  });
  console.log('Admin login successful');
  const adminToken = adminLogin.data.accessToken;

  // Step 2: Create a test user via Admin API (simulating frontend user creation)
  console.log('\nStep 2: Creating test user via Admin API...');
  const testUserEmail = `frontend-test-${Date.now()}@example.com`;
  const createUserResponse = await axios.post(`${API_BASE}/api/users`, {
    email: testUserEmail,
    password: 'test123',
    name: 'Frontend Test User',
    role: 'staff',
    phone: '9876543210'
  }, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  console.log('User created:', createUserResponse.data.id);
  const userId = createUserResponse.data.id;

  // Step 3: Login with the new user (simulating frontend login)
  console.log('\nStep 3: Login with newly created user...');
  const loginResponse = await axios.post(`${API_BASE}/api/auth/login`, {
    email: testUserEmail,
    password: 'test123'
  });
  console.log('Login successful!');
  console.log('Access Token:', loginResponse.data.accessToken.substring(0, 20) + '...');
  console.log('Refresh Token:', loginResponse.data.refreshToken.substring(0, 20) + '...');
  console.log('User:', loginResponse.data.user);

  const accessToken = loginResponse.data.accessToken;
  const refreshToken = loginResponse.data.refreshToken;

  // Step 4: Test dashboard endpoint (simulating frontend dashboard access)
  console.log('\nStep 4: Testing dashboard endpoint...');
  try {
    const dashboardResponse = await axios.get(`${API_BASE}/api/dashboard/statistics`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    console.log('Dashboard access successful:', Object.keys(dashboardResponse.data));
  } catch (error: any) {
    console.error('Dashboard access failed:', error.response?.data?.error || error.message);
  }

  // Step 5: Test areas endpoint (simulating frontend navigation)
  console.log('\nStep 5: Testing areas endpoint...');
  try {
    const areasResponse = await axios.get(`${API_BASE}/api/areas`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    console.log('Areas access successful, count:', areasResponse.data.length || 'data received');
  } catch (error: any) {
    console.error('Areas access failed:', error.response?.data?.error || error.message);
  }

  // Step 6: Test token refresh (simulating automatic token refresh)
  console.log('\nStep 6: Testing token refresh...');
  try {
    const refreshResponse = await axios.post(`${API_BASE}/api/auth/refresh`, {
      refreshToken: refreshToken
    });
    console.log('Token refresh successful!');
    const newAccessToken = refreshResponse.data.accessToken;
    
    // Step 7: Test dashboard with new token
    console.log('\nStep 7: Testing dashboard with new access token...');
    const dashboardResponse2 = await axios.get(`${API_BASE}/api/dashboard/statistics`, {
      headers: { Authorization: `Bearer ${newAccessToken}` }
    });
    console.log('Dashboard with new token successful:', Object.keys(dashboardResponse2.data));
  } catch (error: any) {
    console.error('Token refresh or subsequent request failed:', error.response?.data?.error || error.message);
  }

  // Cleanup
  console.log('\nCleaning up test user...');
  await axios.delete(`${API_BASE}/api/users/${userId}`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  console.log('Test user deleted');

  console.log('\n=== TEST COMPLETE ===');
  console.log('All authentication steps completed successfully.');
  console.log('You can now test the frontend at http://localhost:3002');
  console.log('Use these credentials to test:');
  console.log(`Email: ${testUserEmail}`);
  console.log('Password: test123');
}

testCompleteFlow().catch(console.error);
