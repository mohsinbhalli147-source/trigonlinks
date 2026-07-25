import axios from 'axios';

const API_BASE = 'http://localhost:5000';

async function testAuthFlow() {
  console.log('=== AUTHENTICATION FLOW TEST ===\n');

  // Step 1: Create a test user via API (simulating Admin/User Management)
  console.log('Step 1: Creating test user...');
  try {
    // First login as admin to get token
    const adminLogin = await axios.post(`${API_BASE}/api/auth/login`, {
      email: 'admin@trigonlinks.com',
      password: 'admin123'
    });
    console.log('Admin login successful');
    const adminToken = adminLogin.data.accessToken;

    // Create test user
    const testUserEmail = `testuser${Date.now()}@example.com`;
    const createUserResponse = await axios.post(`${API_BASE}/api/users`, {
      email: testUserEmail,
      password: 'test123',
      name: 'Test User',
      role: 'staff',
      phone: '1234567890'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('User created via Admin API:', createUserResponse.data.id);
    const userId = createUserResponse.data.id;

    // Step 2: Try to login with the newly created user
    console.log('\nStep 2: Attempting login with newly created user...');
    const loginResponse = await axios.post(`${API_BASE}/api/auth/login`, {
      email: testUserEmail,
      password: 'test123'
    });
    console.log('Login successful!');
    console.log('Access Token received:', loginResponse.data.accessToken ? 'YES' : 'NO');
    console.log('Refresh Token received:', loginResponse.data.refreshToken ? 'YES' : 'NO');
    console.log('User data:', loginResponse.data.user);

    const accessToken = loginResponse.data.accessToken;
    const refreshToken = loginResponse.data.refreshToken;

    // Step 3: Test protected endpoint with access token
    console.log('\nStep 3: Testing protected endpoint with access token...');
    try {
      const profileResponse = await axios.get(`${API_BASE}/api/users/profile/me`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      console.log('Protected endpoint successful:', profileResponse.data.email);
    } catch (error: any) {
      console.error('Protected endpoint failed:', error.response?.data?.error || error.message);
    }

    // Step 4: Test token refresh
    console.log('\nStep 4: Testing token refresh...');
    try {
      const refreshResponse = await axios.post(`${API_BASE}/api/auth/refresh`, {
        refreshToken: refreshToken
      });
      console.log('Token refresh successful!');
      console.log('New Access Token received:', refreshResponse.data.accessToken ? 'YES' : 'NO');
      console.log('New Refresh Token received:', refreshResponse.data.refreshToken ? 'YES' : 'NO');

      // Step 5: Test protected endpoint with new access token
      console.log('\nStep 5: Testing protected endpoint with new access token...');
      const newAccessToken = refreshResponse.data.accessToken;
      const profileResponse2 = await axios.get(`${API_BASE}/api/users/profile/me`, {
        headers: { Authorization: `Bearer ${newAccessToken}` }
      });
      console.log('Protected endpoint with new token successful:', profileResponse2.data.email);

    } catch (error: any) {
      console.error('Token refresh failed:', error.response?.data?.error || error.message);
    }

    // Cleanup
    console.log('\nCleaning up test user...');
    await axios.delete(`${API_BASE}/api/users/${userId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('Test user deleted');

  } catch (error: any) {
    console.error('\n=== ERROR ===');
    console.error('Error:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testAuthFlow();
