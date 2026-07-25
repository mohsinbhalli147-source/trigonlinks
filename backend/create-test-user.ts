import axios from 'axios';

const API_BASE = 'http://localhost:5000';

async function createTestUser() {
  console.log('Creating persistent test user for frontend testing...\n');

  // Login as admin
  const adminLogin = await axios.post(`${API_BASE}/api/auth/login`, {
    email: 'admin@trigonlinks.com',
    password: 'admin123'
  });
  const adminToken = adminLogin.data.accessToken;

  // Create test user
  const testUserEmail = 'testuser@trigonlinks.com';
  try {
    const createUserResponse = await axios.post(`${API_BASE}/api/users`, {
      email: testUserEmail,
      password: 'test123',
      name: 'Test User',
      role: 'staff',
      phone: '1234567890'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('Test user created:', createUserResponse.data.id);
  } catch (error: any) {
    if (error.response?.status === 400 && error.response?.data?.error?.includes('already exists')) {
      console.log('Test user already exists');
    } else {
      throw error;
    }
  }

  console.log('\nTest user credentials:');
  console.log('Email: testuser@trigonlinks.com');
  console.log('Password: test123');
  console.log('\nYou can now test the frontend at http://localhost:3002');
}

createTestUser().catch(console.error);
