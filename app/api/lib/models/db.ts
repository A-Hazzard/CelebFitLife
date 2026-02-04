/**
 * Firebase Admin DB Configuration
 *
 * Initializes Firebase Admin SDK and provides Firestore access.
 * Uses connection caching to prevent multiple initializations during hot reloads.
 *
 * @module app/api/lib/models/db
 */

import admin from 'firebase-admin';
import type { Firestore } from 'firebase-admin/firestore';

function getFirebaseConfig() {
  const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
  const FIREBASE_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL;
  const FIREBASE_PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY;

  if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
    throw new Error(
      'Please define FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in .env.local'
    );
  }
  return { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY };
}

function formatFirebasePrivateKey(key: string): string {
  return key.replace(/\\n/g, '\n');
}

let firestoreInstance: Firestore | null = null;

/**
 * Initialize Firebase Admin and return Firestore instance.
 * Reuses existing connection across hot reloads.
 */
function getFirestore(): Firestore {
  if (!admin.apps.length) {
    const config = getFirebaseConfig();
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: config.FIREBASE_PROJECT_ID,
        clientEmail: config.FIREBASE_CLIENT_EMAIL,
        privateKey: formatFirebasePrivateKey(config.FIREBASE_PRIVATE_KEY),
      }),
      projectId: config.FIREBASE_PROJECT_ID,
    });
    console.log('✅ Firebase connected successfully');
  }

  if (!firestoreInstance) {
    firestoreInstance = admin.firestore();
  }

  return firestoreInstance;
}

/**
 * Connect to Firebase/Firestore.
 * Returns Firestore instance for compatibility with existing code that awaited connectDB().
 */
async function connectDB(): Promise<Firestore> {
  return getFirestore();
}

export default connectDB;
export { getFirestore };
