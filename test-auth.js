const axios = require('axios');

const API_BASE = 'http://localhost:5000';

async function testHealth() {
  try {
    const response = await axios.get(`${API_BASE}/health`);
    console.log('✓ Health Check:', response.data);
    return true;
  } catch (error) {
    console.error('✗ Health Check Failed:', error.message);
    return false;
  }
}

async function testAdminLogin() {
  try {
    const response = await axios.post(`${API_BASE}/api/auth/login`, {
      email: 'admin@trigonlinks.com',
      password: 'admin123'
    });
    console.log('✓ Admin Login:', response.data.user.email, response.data.user.role);
    return response.data;
  } catch (error) {
    console.error('✗ Admin Login Failed:', error.response?.data || error.message);
    return null;
  }
}

async function testCustomerLogin() {
  try {
    const response = await axios.post(`${API_BASE}/api/auth/customer-login`, {
      username: 'testcustomer',
      cnic: '1234567890123'
    });
    console.log('✓ Customer Login:', response.data.user.name, response.data.user.role);
    return response.data;
  } catch (error) {
    console.error('✗ Customer Login Failed:', error.response?.data || error.message);
    return null;
  }
}

async function testRefreshToken(refreshToken) {
  try {
    const response = await axios.post(`${API_BASE}/api/auth/refresh`, {
      refreshToken
    });
    console.log('✓ Token Refresh Successful');
    return response.data;
  } catch (error) {
    console.error('✗ Token Refresh Failed:', error.response?.data || error.message);
    return null;
  }
}

async function testLogout(refreshToken) {
  try {
    const response = await axios.post(`${API_BASE}/api/auth/logout`, {
      refreshToken
    });
    console.log('✓ Logout Successful:', response.data);
    return true;
  } catch (error) {
    console.error('✗ Logout Failed:', error.response?.data || error.message);
    return false;
  }
}

async function testProtectedRoute(accessToken) {
  try {
    const response = await axios.get(`${API_BASE}/api/users/me`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    console.log('✓ Protected Route Access:', response.data.email);
    return true;
  } catch (error) {
    console.error('✗ Protected Route Failed:', error.response?.data || error.message);
    return false;
  }
}

async function runTests() {
  console.log('\n=== LIVE PRODUCTION VERIFICATION ===\n');
  
  console.log('1. Testing Health Check...');
  const healthOk = await testHealth();
  
  console.log('\n2. Testing Admin Login...');
  const adminData = await testAdminLogin();
  
  if (adminData) {
    console.log('\n3. Testing Protected Route with Admin Token...');
    await testProtectedRoute(adminData.accessToken);
    
    console.log('\n4. Testing Token Refresh...');
    const refreshData = await testRefreshToken(adminData.refreshToken);
    
    if (refreshData) {
      console.log('\n5. Testing Protected Route with New Token...');
      await testProtectedRoute(refreshData.accessToken);
    }
    
    console.log('\n6. Testing Logout...');
    await testLogout(adminData.refreshToken);
  }
  
  console.log('\n7. Testing Customer Login...');
  await testCustomerLogin();
  
  console.log('\n=== AUTHENTICATION TESTS COMPLETE ===\n');
}

runTests();
