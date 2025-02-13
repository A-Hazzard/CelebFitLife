import admin from "firebase-admin";

const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n") ?? "";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey
    }),
  });
}

const adminDb = admin.firestore();

export { admin, adminDb };