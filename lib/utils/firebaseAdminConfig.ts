import { initializeApp, cert, getApps } from "firebase-admin/app";
import {
  getFirestore,
  Timestamp,
  DocumentSnapshot,
} from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

// Initialize Firebase Admin SDK if not already initialized
// This file should ONLY be imported in server components or API routes
function getFirebaseAdmin() {
  if (typeof window !== "undefined") {
    throw new Error("Firebase Admin SDK can only be used on the server side");
  }

  if (!getApps().length) {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (!serviceAccount) {
      throw new Error(
        "Firebase service account key is not provided in environment variables"
      );
    }

    try {
      initializeApp({
        credential: cert(JSON.parse(serviceAccount)),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      });
      console.log("Firebase Admin SDK initialized successfully");
    } catch (error) {
      console.error("Error initializing Firebase Admin SDK:", error);
      throw error;
    }
  }

  return {
    db: getFirestore(),
    auth: getAuth(),
  };
}

// Define a type for Firebase timestamp-like objects
type TimestampLike = {
  toDate?: () => Date;
  seconds?: number;
  nanoseconds?: number;
};

// Helper function to convert Firestore timestamp to ISO string
export function convertTimestampToISO(
  timestamp: Timestamp | TimestampLike | Date | string | null | undefined
): string {
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

// Helper function to convert Firestore document to plain object with ID
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

export default getFirebaseAdmin;
