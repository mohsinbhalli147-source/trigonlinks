const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000';

// Test credentials
const TEST_USER = {
  email: 'admin@trigonlinks.com',
  password: 'admin123'
};

let authToken = '';
let testConnectionId = '';

async function login() {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/auth/login`, TEST_USER);
    authToken = response.data.accessToken;
    console.log('✅ Login successful');
    return true;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    return false;
  }
}

async function testCreateConnection() {
  console.log('\n📝 Testing Create Connection...');
  try {
    const timestamp = Date.now();
    const connectionData = {
      name: 'Test Customer',
      fatherName: 'Test Father',
      phone: `0300${timestamp.toString().slice(-8)}`,
      cnic: `${timestamp.toString().slice(-5)}-${timestamp.toString().slice(-7)}-1`,
      address: '123 Test Street',
      area: 'Sector A',
      package: '10 Mbps',
      installationDate: '2024-08-01',
      billingDate: '15',
      connectionFee: 2500,
      monthlyFee: 2000,
      concession: 0,
      concessionReason: '',
      expenses: [
        {
          amount: 500,
          category: 'cable',
          description: 'Cable installation',
          inventoryItems: '100m cable'
        }
      ],
      notes: 'Test connection request',
      status: 'pending'
    };

    const response = await axios.post(`${API_BASE_URL}/api/connections`, connectionData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    testConnectionId = response.data.id;
    console.log('✅ Create Connection successful - ID:', testConnectionId);
    console.log('   Connection data:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Create Connection failed:', error.response?.data || error.message);
    return false;
  }
}

async function testReadConnections() {
  console.log('\n📖 Testing Read Connections...');
  try {
    const response = await axios.get(`${API_BASE_URL}/api/connections`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    console.log('✅ Read Connections successful - Total:', response.data.length || response.data.data?.length);
    console.log('   First connection:', JSON.stringify(response.data[0] || response.data.data?.[0], null, 2));
    return true;
  } catch (error) {
    console.error('❌ Read Connections failed:', error.response?.data || error.message);
    return false;
  }
}

async function testReadSingleConnection() {
  console.log('\n📖 Testing Read Single Connection...');
  if (!testConnectionId) {
    console.log('⚠️  Skipping - No test connection ID available');
    return false;
  }

  try {
    const response = await axios.get(`${API_BASE_URL}/api/connections/${testConnectionId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    console.log('✅ Read Single Connection successful');
    console.log('   Connection data:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Read Single Connection failed:', error.response?.data || error.message);
    return false;
  }
}

async function testUpdateConnection() {
  console.log('\n✏️  Testing Update Connection...');
  if (!testConnectionId) {
    console.log('⚠️  Skipping - No test connection ID available');
    return false;
  }

  try {
    const updateData = {
      name: 'Test Customer Updated',
      monthlyFee: 2500,
      notes: 'Updated test connection'
    };

    const response = await axios.put(`${API_BASE_URL}/api/connections/${testConnectionId}`, updateData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    console.log('✅ Update Connection successful');
    console.log('   Updated data:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Update Connection failed:', error.response?.data || error.message);
    return false;
  }
}

async function testUpdateStatus() {
  console.log('\n🔄 Testing Status Update (Pending → Approved)...');
  if (!testConnectionId) {
    console.log('⚠️  Skipping - No test connection ID available');
    return false;
  }

  try {
    const response = await axios.put(`${API_BASE_URL}/api/connections/${testConnectionId}`, 
      { status: 'approved' },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    console.log('✅ Status Update successful');
    console.log('   Updated status:', response.data.status);
    return true;
  } catch (error) {
    console.error('❌ Status Update failed:', error.response?.data || error.message);
    return false;
  }
}

async function testDeleteConnection() {
  console.log('\n🗑️  Testing Delete Connection...');
  if (!testConnectionId) {
    console.log('⚠️  Skipping - No test connection ID available');
    return false;
  }

  try {
    await axios.delete(`${API_BASE_URL}/api/connections/${testConnectionId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    console.log('✅ Delete Connection successful');
    testConnectionId = '';
    return true;
  } catch (error) {
    console.error('❌ Delete Connection failed:', error.response?.data || error.message);
    return false;
  }
}

async function testValidation() {
  console.log('\n🔍 Testing Validation...');
  try {
    // Test with missing required fields
    const invalidData = {
      name: '', // Missing required field
      phone: '03001234567'
    };

    await axios.post(`${API_BASE_URL}/api/connections`, invalidData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    console.log('❌ Validation failed - Should have rejected invalid data');
    return false;
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ Validation successful - Correctly rejected invalid data');
      console.log('   Validation errors:', error.response.data.errors || error.response.data.error);
      return true;
    } else {
      console.error('❌ Validation test failed:', error.response?.data || error.message);
      return false;
    }
  }
}

async function testSearch() {
  console.log('\n🔍 Testing Search...');
  try {
    const response = await axios.get(`${API_BASE_URL}/api/connections?search=Test`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    console.log('✅ Search successful');
    console.log('   Results:', response.data.data?.length || response.data.length);
    return true;
  } catch (error) {
    console.error('❌ Search failed:', error.response?.data || error.message);
    return false;
  }
}

async function testPagination() {
  console.log('\n📄 Testing Pagination...');
  try {
    const response = await axios.get(`${API_BASE_URL}/api/connections?page=1&limit=5`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    console.log('✅ Pagination successful');
    console.log('   Page:', response.data.pagination?.page);
    console.log('   Limit:', response.data.pagination?.limit);
    console.log('   Total:', response.data.pagination?.total);
    return true;
  } catch (error) {
    console.error('❌ Pagination failed:', error.response?.data || error.message);
    return false;
  }
}

async function testFilters() {
  console.log('\n🔍 Testing Filters (by status)...');
  try {
    const response = await axios.get(`${API_BASE_URL}/api/connections?status=pending`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    console.log('✅ Filters successful');
    console.log('   Filtered results:', response.data.data?.length || response.data.length);
    return true;
  } catch (error) {
    console.error('❌ Filters failed:', error.response?.data || error.message);
    return false;
  }
}

async function testSorting() {
  console.log('\n📊 Testing Sorting...');
  try {
    const response = await axios.get(`${API_BASE_URL}/api/connections?sortBy=created_at&sortOrder=desc`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    console.log('✅ Sorting successful');
    console.log('   Results:', response.data.data?.length || response.data.length);
    return true;
  } catch (error) {
    console.error('❌ Sorting failed:', error.response?.data || error.message);
    return false;
  }
}

async function testDuplicatePrevention() {
  console.log('\n🔒 Testing Duplicate Prevention (same phone)...');
  try {
    // Create first connection
    const connectionData = {
      name: 'Duplicate Test Customer',
      fatherName: 'Test Father',
      phone: '03009998877',
      cnic: '12345-1234567-1',
      address: '123 Test Street',
      area: 'Sector A',
      package: '10 Mbps',
      installationDate: '2024-08-01',
      billingDate: '15',
      connectionFee: 2500,
      monthlyFee: 2000,
      status: 'pending'
    };

    await axios.post(`${API_BASE_URL}/api/connections`, connectionData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    // Try to create duplicate with same phone
    const duplicateData = {
      name: 'Duplicate Test Customer 2',
      fatherName: 'Test Father 2',
      phone: '03009998877', // Same phone number
      cnic: '54321-7654321-9',
      address: '456 Test Street',
      area: 'Sector B',
      package: '20 Mbps',
      installationDate: '2024-08-02',
      billingDate: '20',
      connectionFee: 3000,
      monthlyFee: 2500,
      status: 'pending'
    };

    await axios.post(`${API_BASE_URL}/api/connections`, duplicateData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    console.log('❌ Duplicate prevention failed - Should have rejected duplicate phone');
    return false;
  } catch (error) {
    if (error.response?.status === 400 || error.response?.status === 409) {
      console.log('✅ Duplicate prevention successful - Correctly rejected duplicate');
      console.log('   Error:', error.response?.data?.error || 'Duplicate detected');
      return true;
    } else {
      console.error('❌ Duplicate prevention test failed:', error.response?.data || error.message);
      return false;
    }
  }
}

async function runTests() {
  console.log('🚀 Starting Connection Module E2E Tests\n');
  console.log('=' .repeat(50));

  const results = {
    login: await login(),
    create: await testCreateConnection(),
    read: await testReadConnections(),
    readSingle: await testReadSingleConnection(),
    update: await testUpdateConnection(),
    statusUpdate: await testUpdateStatus(),
    search: await testSearch(),
    pagination: await testPagination(),
    filters: await testFilters(),
    sorting: await testSorting(),
    duplicatePrevention: await testDuplicatePrevention(),
    validation: await testValidation(),
    delete: await testDeleteConnection()
  };

  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Results Summary:\n');

  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} - ${test}`);
  });

  const passedCount = Object.values(results).filter(r => r).length;
  const totalCount = Object.keys(results).length;
  console.log(`\nTotal: ${passedCount}/${totalCount} tests passed`);

  if (passedCount === totalCount) {
    console.log('\n🎉 All tests passed!');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the errors above.');
  }
}

runTests().catch(console.error);
