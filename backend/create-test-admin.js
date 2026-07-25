const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestAdmin() {
  console.log('Creating test admin user...');

  try {
    const email = 'admin@trigonlinks.com';
    const password = 'Admin@123';
    const name = 'System Admin';
    const role = 'admin';

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .limit(1);

    if (existingUser && existingUser.length > 0) {
      console.log('Admin user already exists, resetting password...');
      const hashedPassword = await bcrypt.hash(password, 10);

      const { error: updateError } = await supabase
        .from('users')
        .update({ password_hash: hashedPassword, updated_at: Date.now() })
        .eq('email', email);

      if (updateError) {
        console.error('Error updating password:', updateError);
        process.exit(1);
      }

      console.log('✓ Password reset successfully');
      console.log('Email:', email);
      console.log('Password:', password);
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate UUID
    const uid = require('crypto').randomUUID();

    // Create user
    const { data, error } = await supabase
      .from('users')
      .insert({
        uid,
        email,
        password_hash: hashedPassword,
        name,
        role,
        is_active: true,
        email_verified: true,
        created_at: Date.now(),
        updated_at: Date.now()
      })
      .select()
      .limit(1);

    if (error) {
      console.error('Error creating admin user:', error);
      process.exit(1);
    }

    console.log('✓ Test admin user created successfully');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('User ID:', data[0].id);

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createTestAdmin();
