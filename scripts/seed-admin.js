/**
 * Seed Admin User - Firebase
 *
 * Creates or updates the admin user in Firestore users collection.
 * Run with: node scripts/seed-admin.js
 */

require('dotenv').config();
const admin = require('firebase-admin');
const bcrypt = require('bcryptjs');

const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
const FIREBASE_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL;
const FIREBASE_PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

const ADMIN_EMAIL = 'celebfitlife@gmail.com';
const ADMIN_PASSWORD = 'CelebFitLife2025!';

async function seedAdmin() {
  try {
    if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
      throw new Error('Missing FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, or FIREBASE_PRIVATE_KEY in .env');
    }

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: FIREBASE_PROJECT_ID,
          clientEmail: FIREBASE_CLIENT_EMAIL,
          privateKey: FIREBASE_PRIVATE_KEY,
        }),
      });
    }

    const db = admin.firestore();
    const usersRef = db.collection('users');

    // Check if admin exists
    const snapshot = await usersRef.where('email', '==', ADMIN_EMAIL).limit(1).get();

    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
    const now = admin.firestore.Timestamp.now();

    const adminData = {
      email: ADMIN_EMAIL,
      paymentStatus: 'paid',
      role: 'admin',
      password: hashedPassword,
      isVerified: true,
      ip: '127.0.0.1',
      userAgent: 'Admin Script',
      deviceType: 'Desktop',
      country: 'AdminLand',
      createdAt: now,
      updatedAt: now,
    };

    if (snapshot.empty) {
      await usersRef.add(adminData);
      console.log('Admin user created.');
    } else {
      const doc = snapshot.docs[0];
      await doc.ref.update({
        ...adminData,
        updatedAt: now,
      });
      console.log('Admin user updated.');
    }

    console.log('Seed complete.');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

seedAdmin();
