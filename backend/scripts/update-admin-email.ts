import admin from 'firebase-admin';
import * as serviceAccount from '../src/firebase-service-account.json';
import { hashPassword } from '../src/utils/auth';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL
});

export const db = admin.firestore();

async function updateAdminEmail() {
  console.log('Updating admin email...');

  try {
    // Find old admin user
    const oldAdminSnapshot = await db.collection('users').where('email', '==', 'admin@trigonlinks.pk').get();
    
    if (!oldAdminSnapshot.empty) {
      const oldAdminDoc = oldAdminSnapshot.docs[0];
      console.log('Found old admin user:', oldAdminDoc.id);
      
      // Update email
      await oldAdminDoc.ref.update({
        email: 'admin@trigonlinks.com',
        updatedAt: Date.now(),
      });
      
      console.log('Admin email updated successfully from admin@trigonlinks.pk to admin@trigonlinks.com');
    } else {
      console.log('Old admin user not found, checking if new admin already exists...');
      
      // Check if new admin already exists
      const newAdminSnapshot = await db.collection('users').where('email', '==', 'admin@trigonlinks.com').get();
      if (newAdminSnapshot.empty) {
        console.log('Creating new admin user with admin@trigonlinks.com');
        const hashedPassword = await hashPassword('admin123');
        
        const adminRef = await db.collection('users').add({
          uid: '',
          email: 'admin@trigonlinks.com',
          password: hashedPassword,
          name: 'Admin User',
          role: 'admin',
          phone: '+92 300 1234567',
          address: 'Pasrur, Pakistan',
          isActive: true,
          emailVerified: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        
        await adminRef.update({ uid: adminRef.id });
        console.log('New admin user created successfully:', adminRef.id);
      } else {
        console.log('Admin user with admin@trigonlinks.com already exists');
      }
    }

    console.log('Admin email update completed successfully');
  } catch (error) {
    console.error('Error updating admin email:', error);
    process.exit(1);
  }
}

updateAdminEmail().then(() => {
  console.log('Update process completed');
  process.exit(0);
});
