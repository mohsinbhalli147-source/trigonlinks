// Test script to verify customer update functionality
const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000';

async function testCustomerUpdate() {
  console.log('=== Customer Update Test ===\n');
  
  try {
    // First, login to get auth token
    console.log('1. Logging in as admin...');
    const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email: 'admin@trigonlinks.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.accessToken;
    console.log('✓ Login successful');
    
    // Get all customers to find one to update
    console.log('\n2. Fetching customers...');
    const customersResponse = await axios.get(`${API_BASE_URL}/api/customers`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const customers = customersResponse.data.data;
    console.log(`✓ Found ${customers.length} customers`);
    
    if (customers.length === 0) {
      console.log('✗ No customers found to update');
      return;
    }
    
    const customerToUpdate = customers[0];
    console.log(`\n3. Testing update for customer: ${customerToUpdate.name} (ID: ${customerToUpdate.id})`);
    
    // Test update with camelCase fields
    const updateData = {
      name: 'Updated Test Customer',
      fatherName: 'Test Father Name',
      emergencyContact: '0300-1234567',
      notes: 'Test update notes',
      mobile: customerToUpdate.mobile,
      address: customerToUpdate.address,
      area: customerToUpdate.area,
      status: customerToUpdate.status,
      package: customerToUpdate.package,
      fee: customerToUpdate.fee,
      iptv_enabled: customerToUpdate.iptv_enabled,
      live_ip_enabled: customerToUpdate.live_ip_enabled,
      iptv_monthly_charges: customerToUpdate.iptv_monthly_charges,
      live_ip_monthly_fee: customerToUpdate.live_ip_monthly_fee
    };
    
    console.log('4. Sending update request with camelCase fields...');
    console.log('Update data:', JSON.stringify(updateData, null, 2));
    
    const updateResponse = await axios.put(
      `${API_BASE_URL}/api/customers/${customerToUpdate.id}`,
      updateData,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    console.log('\n✓ Update successful!');
    console.log('Response data:', JSON.stringify(updateResponse.data, null, 2));
    
    // Verify the update by fetching the customer again
    console.log('\n5. Verifying update by fetching customer again...');
    const verifyResponse = await axios.get(
      `${API_BASE_URL}/api/customers/${customerToUpdate.id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    const updatedCustomer = verifyResponse.data;
    console.log('Updated customer:', JSON.stringify(updatedCustomer, null, 2));
    
    // Check if fields were updated correctly
    if (updatedCustomer.name === 'Updated Test Customer' &&
        updatedCustomer.fatherName === 'Test Father Name' &&
        updatedCustomer.emergencyContact === '0300-1234567' &&
        updatedCustomer.notes === 'Test update notes') {
      console.log('\n✓ All fields updated correctly!');
      console.log('✓ camelCase to snake_case conversion working properly');
    } else {
      console.log('\n✗ Some fields were not updated correctly');
      console.log('Expected name: Updated Test Customer, Got:', updatedCustomer.name);
      console.log('Expected fatherName: Test Father Name, Got:', updatedCustomer.fatherName);
    }
    
  } catch (error) {
    console.error('\n✗ Test failed with error:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Message:', error.message);
    }
  }
}

testCustomerUpdate();
