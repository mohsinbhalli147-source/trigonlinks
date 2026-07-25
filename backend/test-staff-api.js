// Test script for staff management API
const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000';

async function testStaffAPI() {
  console.log('Testing Staff Management API...\n');

  // Test 1: Login to get auth token (try multiple credentials)
  console.log('1. Testing Login...');
  let token = null;
  const credentials = [
    { email: 'admin@trigonlinks.com', password: 'Admin@123' },
    { email: 'testadmin@trigonlinks.com', password: 'Test@123' },
    { email: 'admin', password: 'admin123' }
  ];

  for (const creds of credentials) {
    try {
      const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, creds);
      token = loginResponse.data.accessToken;
      console.log('✓ Login successful with:', creds.email);
      console.log('  Token:', token.substring(0, 20) + '...\n');
      break;
    } catch (error) {
      console.log('  Failed with:', creds.email, '-', error.response?.data?.error || error.message);
    }
  }

  if (!token) {
    console.log('\n✗ All login attempts failed');
    console.log('Please ensure you have a valid admin user in the database.');
    console.log('You can create one by running: npm run create-test-user');
    return;
  }

  // Set up axios with auth header
  const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    // Test 2: Get all staff
    console.log('2. Testing GET /api/staff (Get all staff)...');
    try {
      const staffResponse = await api.get('/api/staff');
      console.log('✓ Get all staff successful');
      console.log('  Staff count:', staffResponse.data.data?.data?.length || staffResponse.data.data?.length || 0);
      console.log('  Response:', JSON.stringify(staffResponse.data, null, 2).substring(0, 200) + '...\n');
    } catch (error) {
      console.log('✗ Get all staff failed:', error.response?.data || error.message, '\n');
    }

    // Test 3: Create a new staff member
    console.log('3. Testing POST /api/staff (Create staff)...');
    try {
      const newStaff = {
        name: 'Test Technician',
        email: 'technician@test.com',
        phone: '0300-1234567',
        username: 'technician_test',
        password: 'Test@123',
        role: 'technician',
        status: 'active',
        salary: 50000,
        hire_date: new Date().toISOString().split('T')[0],
        address: 'Test Address'
      };

      const createResponse = await api.post('/api/staff', newStaff);
      console.log('✓ Create staff successful');
      console.log('  Created staff ID:', createResponse.data.id);
      console.log('  Staff name:', createResponse.data.name, '\n');

      const newStaffId = createResponse.data.id;

      // Test 4: Get single staff member
      console.log('4. Testing GET /api/staff/:id (Get single staff)...');
      try {
        const singleStaffResponse = await api.get(`/api/staff/${newStaffId}`);
        console.log('✓ Get single staff successful');
        console.log('  Staff details:', JSON.stringify(singleStaffResponse.data, null, 2).substring(0, 300) + '...\n');
      } catch (error) {
        console.log('✗ Get single staff failed:', error.response?.data || error.message, '\n');
      }

      // Test 5: Update staff member
      console.log('5. Testing PUT /api/staff/:id (Update staff)...');
      try {
        const updateData = {
          name: 'Test Technician Updated',
          salary: 55000
        };

        const updateResponse = await api.put(`/api/staff/${newStaffId}`, updateData);
        console.log('✓ Update staff successful');
        console.log('  Updated name:', updateResponse.data.name, '\n');
      } catch (error) {
        console.log('✗ Update staff failed:', error.response?.data || error.message, '\n');
      }

      // Test 6: Delete staff member
      console.log('6. Testing DELETE /api/staff/:id (Delete staff)...');
      try {
        const deleteResponse = await api.delete(`/api/staff/${newStaffId}`);
        console.log('✓ Delete staff successful');
        console.log('  Message:', deleteResponse.data.message, '\n');
      } catch (error) {
        console.log('✗ Delete staff failed:', error.response?.data || error.message, '\n');
      }

    } catch (error) {
      console.log('✗ Create staff failed:', error.response?.data || error.message, '\n');
    }

    // Test 7: Get staff reports
    console.log('7. Testing GET /api/staff/reports (Get staff reports)...');
    try {
      const reportsResponse = await api.get('/api/staff/reports');
      console.log('✓ Get staff reports successful');
      console.log('  Reports count:', reportsResponse.data?.length || 0, '\n');
    } catch (error) {
      console.log('✗ Get staff reports failed:', error.response?.data || error.message, '\n');
    }

  console.log('\n=== Staff Management API Test Complete ===');
}

testStaffAPI().catch(console.error);
