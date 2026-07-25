import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { query } from '../src/database/client';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase Admin SDK (for data migration only)
const serviceAccountPath = path.join(__dirname, '../../trigonlinks-7438e-firebase-adminsdk-fbsvc-e2b6208993.json');

let firebaseApp: any = null;
let firestore: any = null;

async function initializeFirebase() {
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    
    if (!getApps().length) {
      firebaseApp = initializeApp({
        credential: cert(serviceAccount),
      });
    } else {
      firebaseApp = getApps()[0];
    }
    
    firestore = getFirestore(firebaseApp);
    console.log('Firebase initialized for data migration');
    return true;
  } else {
    console.log('Firebase service account not found, skipping data migration');
    return false;
  }
}

async function migrateUsers() {
  console.log('Migrating users...');
  
  const usersSnapshot = await firestore.collection('users').get();
  
  for (const doc of usersSnapshot.docs) {
    const data = doc.data();
    
    try {
      await query(
        `INSERT INTO users (uid, email, password_hash, name, role, phone, address, assigned_area, is_active, email_verified, created_at, updated_at, created_by, updated_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         ON CONFLICT (uid) DO UPDATE SET
           email = EXCLUDED.email,
           password_hash = EXCLUDED.password_hash,
           name = EXCLUDED.name,
           role = EXCLUDED.role,
           phone = EXCLUDED.phone,
           address = EXCLUDED.address,
           assigned_area = EXCLUDED.assigned_area,
           is_active = EXCLUDED.is_active,
           email_verified = EXCLUDED.email_verified,
           updated_at = EXCLUDED.updated_at`,
        [
          doc.id,
          data.email || '',
          data.password_hash || '',
          data.name || '',
          data.role || 'customer',
          data.phone || '',
          data.address || '',
          data.assigned_area || '',
          data.is_active !== false,
          data.email_verified || false,
          data.createdAt?.toMillis?.() || Date.now(),
          data.updatedAt?.toMillis?.() || Date.now(),
          data.created_by || '',
          data.updated_by || '',
        ]
      );
    } catch (error) {
      console.error(`Error migrating user ${doc.id}:`, error);
    }
  }
  
  console.log(`Migrated ${usersSnapshot.size} users`);
}

async function migrateStaff() {
  console.log('Migrating staff...');
  
  const staffSnapshot = await firestore.collection('staff').get();
  
  for (const doc of staffSnapshot.docs) {
    const data = doc.data();
    
    try {
      await query(
        `INSERT INTO staff (uid, name, email, phone, role, area, status, created_at, updated_at, created_by, updated_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (uid) DO UPDATE SET
           name = EXCLUDED.name,
           email = EXCLUDED.email,
           phone = EXCLUDED.phone,
           role = EXCLUDED.role,
           area = EXCLUDED.area,
           status = EXCLUDED.status,
           updated_at = EXCLUDED.updated_at`,
        [
          doc.id,
          data.name || '',
          data.email || '',
          data.phone || '',
          data.role || 'staff',
          data.area || '',
          data.status || 'active',
          data.createdAt?.toMillis?.() || Date.now(),
          data.updatedAt?.toMillis?.() || Date.now(),
          data.created_by || '',
          data.updated_by || '',
        ]
      );
    } catch (error) {
      console.error(`Error migrating staff ${doc.id}:`, error);
    }
  }
  
  console.log(`Migrated ${staffSnapshot.size} staff members`);
}

async function migrateAreas() {
  console.log('Migrating areas...');
  
  const areasSnapshot = await firestore.collection('areas').get();
  
  for (const doc of areasSnapshot.docs) {
    const data = doc.data();
    
    try {
      await query(
        `INSERT INTO areas (name, status, created_at, updated_at, created_by, updated_by)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (name) DO UPDATE SET
           status = EXCLUDED.status,
           updated_at = EXCLUDED.updated_at`,
        [
          doc.id,
          data.status || 'active',
          data.createdAt?.toMillis?.() || Date.now(),
          data.updatedAt?.toMillis?.() || Date.now(),
          data.created_by || '',
          data.updated_by || '',
        ]
      );
    } catch (error) {
      console.error(`Error migrating area ${doc.id}:`, error);
    }
  }
  
  console.log(`Migrated ${areasSnapshot.size} areas`);
}

async function migratePackages() {
  console.log('Migrating packages...');
  
  const packagesSnapshot = await firestore.collection('packages').get();
  
  for (const doc of packagesSnapshot.docs) {
    const data = doc.data();
    
    try {
      await query(
        `INSERT INTO packages (name, speed, price, status, created_at, updated_at, created_by, updated_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (name) DO UPDATE SET
           speed = EXCLUDED.speed,
           price = EXCLUDED.price,
           status = EXCLUDED.status,
           updated_at = EXCLUDED.updated_at`,
        [
          doc.id,
          data.speed || '',
          data.price || 0,
          data.status || 'active',
          data.createdAt?.toMillis?.() || Date.now(),
          data.updatedAt?.toMillis?.() || Date.now(),
          data.created_by || '',
          data.updated_by || '',
        ]
      );
    } catch (error) {
      console.error(`Error migrating package ${doc.id}:`, error);
    }
  }
  
  console.log(`Migrated ${packagesSnapshot.size} packages`);
}

async function migrateCustomers() {
  console.log('Migrating customers...');
  
  const customersSnapshot = await firestore.collection('customers').get();
  
  for (const doc of customersSnapshot.docs) {
    const data = doc.data();
    
    try {
      await query(
        `INSERT INTO customers (uid, name, username, cnic, email, mobile, address, area, status, package, fee, install_date, iptv_enabled, live_ip_enabled, iptv_monthly_charges, live_ip_monthly_fee, created_at, updated_at, created_by, updated_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
         ON CONFLICT (uid) DO UPDATE SET
           name = EXCLUDED.name,
           username = EXCLUDED.username,
           cnic = EXCLUDED.cnic,
           email = EXCLUDED.email,
           mobile = EXCLUDED.mobile,
           address = EXCLUDED.address,
           area = EXCLUDED.area,
           status = EXCLUDED.status,
           package = EXCLUDED.package,
           fee = EXCLUDED.fee,
           install_date = EXCLUDED.install_date,
           iptv_enabled = EXCLUDED.iptv_enabled,
           live_ip_enabled = EXCLUDED.live_ip_enabled,
           iptv_monthly_charges = EXCLUDED.iptv_monthly_charges,
           live_ip_monthly_fee = EXCLUDED.live_ip_monthly_fee,
           updated_at = EXCLUDED.updated_at`,
        [
          doc.id,
          data.name || '',
          data.username || '',
          data.cnic || '',
          data.email || '',
          data.mobile || '',
          data.address || '',
          data.area || '',
          data.status || 'active',
          data.package || '',
          data.fee || 0,
          data.installDate?.toMillis?.() || null,
          data.iptv_enabled || false,
          data.live_ip_enabled || false,
          data.iptv_monthly_charges || 0,
          data.live_ip_monthly_fee || 0,
          data.createdAt?.toMillis?.() || Date.now(),
          data.updatedAt?.toMillis?.() || Date.now(),
          data.created_by || '',
          data.updated_by || '',
        ]
      );
    } catch (error) {
      console.error(`Error migrating customer ${doc.id}:`, error);
    }
  }
  
  console.log(`Migrated ${customersSnapshot.size} customers`);
}

async function runMigration() {
  try {
    const firebaseInitialized = await initializeFirebase();
    
    if (!firebaseInitialized) {
      console.log('Skipping Firebase data migration (no Firebase credentials)');
      return;
    }
    
    console.log('Starting Firebase to PostgreSQL migration...');
    
    // Migrate in order of dependencies
    await migrateAreas();
    await migratePackages();
    await migrateStaff();
    await migrateUsers();
    await migrateCustomers();
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

runMigration()
  .then(() => {
    console.log('Migration process completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration process failed:', error);
    process.exit(1);
  });
