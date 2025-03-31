import admin from "firebase-admin";
import { DocumentSnapshot } from "firebase-admin/firestore";

// Initialize Firebase Admin SDK only on the server side
// Check if it's already initialized
if (!admin.apps.length) {
  try {
    // Use service account from environment variable
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (serviceAccount) {
      // If we have a JSON string service account
      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(serviceAccount)),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      });
    } else {
      // Fallback to individual credential parts
      const privateKey =
        process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n") ?? "";

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL || "",
          privateKey,
        }),
      });
    }

    console.log("Firebase Admin SDK initialized successfully");
  } catch (error) {
    console.error("Error initializing Firebase Admin SDK:", error);
    throw error;
  }
}

// Main exports - the admin instance and the Firestore database
export const adminAuth = admin.auth();
export const adminDb = admin.firestore();

// Define a type for Firebase timestamp-like objects
type TimestampLike = {
  toDate?: () => Date;
  seconds?: number;
  nanoseconds?: number;
};

/**
 * Converts Firestore timestamps to ISO strings
 */
export function convertTimestampToISO(timestamp: any): string {
  if (!timestamp) return new Date().toISOString();

  if (typeof timestamp === "string") {
    return new Date(timestamp).toISOString();
  }

  if (timestamp instanceof Date) {
    return timestamp.toISOString();
  }

  if (timestamp.toDate && typeof timestamp.toDate === "function") {
    return timestamp.toDate().toISOString();
  }

  if (timestamp.seconds) {
    return new Date(timestamp.seconds * 1000).toISOString();
  }

  return new Date().toISOString();
}

/**
 * Converts a Firestore document to a plain object with ID
 */
export function convertDocToObj<T>(doc: DocumentSnapshot): T | null {
  if (!doc.exists) return null;

  const data = doc.data();
  if (!data) return null;

  // Convert all timestamp fields to ISO strings
  const converted = { ...data, id: doc.id } as Record<string, unknown>;

  Object.keys(converted).forEach((key) => {
    const value = converted[key];
    if (
      value &&
      typeof value === "object" &&
      ((value as TimestampLike).seconds ||
        ((value as TimestampLike).toDate &&
          typeof (value as TimestampLike).toDate === "function"))
    ) {
      converted[key] = convertTimestampToISO(value as TimestampLike);
    }
  });

  return converted as T;
}
