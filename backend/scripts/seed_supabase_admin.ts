import { getSupabaseClient } from '../src/database/client';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

const supabase = getSupabaseClient();

async function createAdmin() {
  console.log('Creating initial admin user...');
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const uid = crypto.randomUUID();

  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', 'admin@trigonlinks.com')
    .limit(1);

  if (existingUser && existingUser.length > 0) {
    console.log('Admin user already exists.');
    process.exit(0);
  }

  const { error } = await supabase
    .from('users')
    .insert({
      uid,
      email: 'admin@trigonlinks.com',
      password_hash: hashedPassword,
      name: 'Mian Subhan',
      role: 'admin',
      phone: '03001234567',
      address: 'Main Bazar, Pasrur',
      is_active: true,
      email_verified: true,
      created_at: Date.now(),
      updated_at: Date.now()
    });

  if (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }

  console.log('Admin user created successfully.');
  console.log('Email: admin@trigonlinks.com');
  console.log('Password: admin123');
  process.exit(0);
}

createAdmin().catch(console.error);
