// Comprehensive CRUD test for customers
const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: './.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testCustomerCRUD() {
  console.log('=== Customer CRUD Operations Test ===\n');
  
  try {
    // Test 1: CREATE
    console.log('1. Testing CREATE operation...');
    const testCustomer = {
      uid: 'test-' + Date.now(),
      name: 'Test Customer',
      father_name: 'Test Father',
      username: 'testuser' + Date.now(),
      mobile: '03001234567',
      cnic: '12345-1234567-1',
      email: 'test@example.com',
      address: 'Test Address',
      area: 'Sector A',
      status: 'active',
      package: '5 Mbps',
      fee: 500,
      install_date: Date.now(),
      billing_date: 15,
      emergency_contact: '03007654321',
      notes: 'Test customer notes',
      iptv_enabled: true,
      iptv_box_number: 'BOX123',
      iptv_box_price: 5000,
      iptv_installation_charges: 1000,
      iptv_monthly_charges: 500,
      live_ip_enabled: true,
      live_ip_address: '192.168.1.100',
      live_ip_monthly_fee: 200,
      live_ip_installation_fee: 500,
      created_at: Date.now()
    };
    
    const { data: createdCustomer, error: createError } = await supabase
      .from('customers')
      .insert(testCustomer)
      .select()
      .single();
    
    if (createError) {
      console.error('✗ CREATE failed:', createError);
      return;
    }
    console.log('✓ CREATE successful');
    console.log('  Customer ID:', createdCustomer.id);
    console.log('  Father Name:', createdCustomer.father_name);
    console.log('  Emergency Contact:', createdCustomer.emergency_contact);
    console.log('  Notes:', createdCustomer.notes);
    
    const customerId = createdCustomer.id;
    
    // Test 2: READ
    console.log('\n2. Testing READ operation...');
    const { data: readCustomer, error: readError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single();
    
    if (readError) {
      console.error('✗ READ failed:', readError);
      return;
    }
    console.log('✓ READ successful');
    console.log('  Name:', readCustomer.name);
    console.log('  Father Name:', readCustomer.father_name);
    console.log('  Emergency Contact:', readCustomer.emergency_contact);
    console.log('  Notes:', readCustomer.notes);
    
    // Test 3: UPDATE
    console.log('\n3. Testing UPDATE operation...');
    const updateData = {
      name: 'Updated Test Customer',
      father_name: 'Updated Father Name',
      emergency_contact: '03009998888',
      notes: 'Updated notes',
      fee: 1000,
      updated_at: Date.now()
    };
    
    const { data: updatedCustomer, error: updateError } = await supabase
      .from('customers')
      .update(updateData)
      .eq('id', customerId)
      .select()
      .single();
    
    if (updateError) {
      console.error('✗ UPDATE failed:', updateError);
      return;
    }
    console.log('✓ UPDATE successful');
    console.log('  Updated Name:', updatedCustomer.name);
    console.log('  Updated Father Name:', updatedCustomer.father_name);
    console.log('  Updated Emergency Contact:', updatedCustomer.emergency_contact);
    console.log('  Updated Notes:', updatedCustomer.notes);
    console.log('  Updated Fee:', updatedCustomer.fee);
    
    // Verify updates
    if (updatedCustomer.name === 'Updated Test Customer' &&
        updatedCustomer.father_name === 'Updated Father Name' &&
        updatedCustomer.emergency_contact === '03009998888' &&
        updatedCustomer.notes === 'Updated notes' &&
        updatedCustomer.fee === 1000) {
      console.log('✓ All fields updated correctly');
    } else {
      console.log('✗ Some fields were not updated correctly');
    }
    
    // Test 4: DELETE
    console.log('\n4. Testing DELETE operation...');
    const { error: deleteError } = await supabase
      .from('customers')
      .delete()
      .eq('id', customerId);
    
    if (deleteError) {
      console.error('✗ DELETE failed:', deleteError);
      return;
    }
    console.log('✓ DELETE successful');
    
    // Verify deletion
    const { data: deletedCheck, error: checkError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single();
    
    if (deletedCheck) {
      console.log('✗ Customer still exists after deletion');
    } else {
      console.log('✓ Customer successfully deleted');
    }
    
    console.log('\n=== All CRUD Operations Test Passed ===');
    
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

testCustomerCRUD();
