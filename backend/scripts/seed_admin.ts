import * as admin from 'firebase-admin';
import * as serviceAccount from '../src/firebase-service-account.json';
import * as bcrypt from 'bcryptjs';

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  databaseURL: 'https://trigonlinks-7438e-default-rtdb.asia-southeast1.firebasedatabase.app'
});

const db = admin.firestore();

async function createAdmin() {
  console.log('Creating initial admin user...');
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const adminRef = db.collection('users').doc('admin_user_1');
  await adminRef.set({
    email: 'admin@trigonlinks.com',
    password: hashedPassword,
    name: 'Mian Subhan',
    role: 'admin',
    phone: '03001234567',
    address: 'Main Bazar, Pasrur',
    isActive: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  console.log('Admin user created successfully.');
  process.exit(0);
}

createAdmin().catch(console.error);
