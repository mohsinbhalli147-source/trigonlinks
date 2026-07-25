import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_BASE = `http://localhost:${process.env.PORT || 5000}/api`;

async function testCustomerLogin() {
  console.log('=== Testing Customer Login ===\n');

  try {
    // First, login as admin to get token
    console.log('Logging in as admin to get token...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@trigonlinks.com',
      password: 'admin123'
    });

    const adminToken = loginResponse.data.accessToken;
    console.log('✓ Admin login successful');

    // Get the actual customer credentials
    console.log('\nFetching customers...');
    const { data: customers } = await axios.get(`${API_BASE}/customers`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (customers && customers.data && customers.data.length > 0) {
      const testCustomer = customers.data[0];
      console.log('Using customer:', testCustomer.name);
      console.log('Username:', testCustomer.username);
      console.log('CNIC:', testCustomer.cnic);

      // Test customer login with actual credentials
      console.log('\nTesting customer login with actual credentials...');
      const response = await axios.post(`${API_BASE}/auth/customer-login`, {
        username: testCustomer.username,
        cnic: testCustomer.cnic
      });

      console.log('✓ Customer login successful');
      console.log('Response:', JSON.stringify(response.data, null, 2));
    } else {
      console.log('No customers found to test with');
    }
  } catch (error: any) {
    console.log('✗ Customer login failed');
    console.log('Error:', error.response?.data || error.message);
  }
}

testCustomerLogin().catch(console.error);
