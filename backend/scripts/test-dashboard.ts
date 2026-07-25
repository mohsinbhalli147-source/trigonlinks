import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function testDashboard() {
  console.log('=== Testing Dashboard API ===\n');

  try {
    // Login first
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@trigonlinks.com',
      password: 'admin123'
    });
    
    const token = loginRes.data.accessToken;
    console.log('✓ Login successful');
    
    // Test dashboard statistics
    console.log('\nTesting /api/dashboard/statistics...');
    const dashRes = await axios.get('http://localhost:5000/api/dashboard/statistics', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✓ Dashboard statistics response:');
    console.log(JSON.stringify(dashRes.data, null, 2));
  } catch (error: any) {
    console.error('✗ Error:', error.response?.data || error.message);
  }
}

testDashboard().catch(console.error);
