import { createClient } from '@supabase/supabase-js';
import { hashPassword } from './utils/auth';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

async function seedDatabase() {
  // Prevent seeding in production
  if (process.env.NODE_ENV === 'production') {
    console.log('ERROR: Seeding is disabled in production mode');
    console.log('To seed production data, use the production seeding script with proper safeguards');
    process.exit(1);
  }

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  console.log('Seeding database (development mode only)...');

  try {
    // Check if admin user already exists
    const { data: adminData } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'admin@trigonlinks.com')
      .limit(1);
    
    if (!adminData || adminData.length === 0) {
      // Create admin user
      const hashedPassword = await hashPassword('admin123');
      const uid = uuidv4();
      
      const { error } = await supabase
        .from('users')
        .insert({
          uid,
          email: 'admin@trigonlinks.com',
          password_hash: hashedPassword,
          name: 'Admin User',
          role: 'admin',
          phone: '+92 300 1234567',
          address: 'Pasrur, Pakistan',
          is_active: true,
          email_verified: true,
          created_at: Date.now(),
          updated_at: Date.now()
        });

      if (error) throw error;
      console.log('Admin user created successfully:', uid);
    } else {
      console.log('Admin user already exists');
    }

    // Create real user (mohsinbhalli147@gmail.com)
    const { data: realUserData } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'mohsinbhalli147@gmail.com')
      .limit(1);
    
    if (!realUserData || realUserData.length === 0) {
      const hashedPassword = await hashPassword('Zimal@123');
      const uid = uuidv4();
      
      const { error } = await supabase
        .from('users')
        .insert({
          uid,
          email: 'mohsinbhalli147@gmail.com',
          password_hash: hashedPassword,
          name: 'Mohsin Bhalli',
          role: 'admin',
          phone: '+92 300 1234570',
          address: 'Pasrur, Pakistan',
          is_active: true,
          email_verified: true,
          created_at: Date.now(),
          updated_at: Date.now()
        });

      if (error) throw error;
      console.log('Real user created successfully:', uid);
    } else {
      console.log('Real user already exists');
    }

    // Create trigonlinks admin user
    const { data: trigonlinksData } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'trigonlinks@gmail.com')
      .limit(1);
    
    if (!trigonlinksData || trigonlinksData.length === 0) {
      const hashedPassword = await hashPassword('Trigon786@');
      const uid = uuidv4();
      
      const { error } = await supabase
        .from('users')
        .insert({
          uid,
          email: 'trigonlinks@gmail.com',
          password_hash: hashedPassword,
          name: 'TrigonLinks Admin',
          role: 'admin',
          phone: '+92 300 1234571',
          address: 'Pasrur, Pakistan',
          is_active: true,
          email_verified: true,
          created_at: Date.now(),
          updated_at: Date.now()
        });

      if (error) throw error;
      console.log('TrigonLinks admin user created successfully:', uid);
    } else {
      console.log('TrigonLinks admin user already exists');
    }

    // Create staff user
    const { data: staffData } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'staff@trigonlinks.com')
      .limit(1);
    
    if (!staffData || staffData.length === 0) {
      const hashedPassword = await hashPassword('staff123');
      const uid = uuidv4();
      
      const { error } = await supabase
        .from('users')
        .insert({
          uid,
          email: 'staff@trigonlinks.com',
          password_hash: hashedPassword,
          name: 'Staff User',
          role: 'staff',
          phone: '+92 300 1234568',
          address: 'Pasrur, Pakistan',
          is_active: true,
          email_verified: true,
          created_at: Date.now(),
          updated_at: Date.now()
        });

      if (error) throw error;
      console.log('Staff user created successfully:', uid);
    } else {
      console.log('Staff user already exists');
    }

    // Create sample areas if they don't exist
    const { data: areasData } = await supabase
      .from('areas')
      .select('*');
    
    if (!areasData || areasData.length === 0) {
      const areas = [
        { name: 'City Center', status: 'active', created_at: Date.now() },
        { name: 'Model Town', status: 'active', created_at: Date.now() },
        { name: 'Satellite Town', status: 'active', created_at: Date.now() },
        { name: 'Railway Road', status: 'active', created_at: Date.now() },
      ];

      const { error } = await supabase
        .from('areas')
        .insert(areas);

      if (error) throw error;
      console.log('Sample areas created');
    }

    // Create sample packages if they don't exist
    const { data: packagesData } = await supabase
      .from('packages')
      .select('*');
    
    if (!packagesData || packagesData.length === 0) {
      const packages = [
        { name: 'Basic', speed: '10 Mbps', price: 1500, status: 'active', created_at: Date.now() },
        { name: 'Standard', speed: '25 Mbps', price: 2500, status: 'active', created_at: Date.now() },
        { name: 'Premium', speed: '50 Mbps', price: 4000, status: 'active', created_at: Date.now() },
        { name: 'Business', speed: '100 Mbps', price: 7000, status: 'active', created_at: Date.now() },
      ];

      const { error } = await supabase
        .from('packages')
        .insert(packages);

      if (error) throw error;
      console.log('Sample packages created');
    }

    // Create sample customers for customer portal testing
    const { data: customersData } = await supabase
      .from('customers')
      .select('*');
    
    if (!customersData || customersData.length === 0) {
      const uid = uuidv4();
      const customers = [
        {
          uid,
          username: 'test_customer',
          cnic: '12345-1234567-1',
          name: 'Test Customer',
          mobile: '+92 300 1234569',
          address: 'Test Address, Pasrur',
          area: 'City Center',
          status: 'active',
          package: 'Basic',
          fee: 1500,
          install_date: Date.now(),
          iptv_enabled: false,
          live_ip_enabled: false,
          iptv_monthly_charges: 0,
          live_ip_monthly_fee: 0,
          created_at: Date.now(),
          updated_at: Date.now()
        }
      ];

      const { error } = await supabase
        .from('customers')
        .insert(customers);

      if (error) throw error;
      console.log('Sample customer created for testing');
    } else {
      console.log('Customers already exist');
    }

    console.log('Database seeding completed successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase().then(() => {
  console.log('Seed process completed');
  process.exit(0);
});
