import { 
  getAuth, 
  createUserWithEmailAndPassword,
  updateProfile 
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/config/firebase";
import { RegistrationData } from "@/lib/types/auth";
import bcrypt from 'bcryptjs';
import { auth } from "@/lib/firebase";

interface FirebaseRegisterResult {
  success: boolean;
  user: {
    id: string;
    username: string;
    email: string;
    uid: string;
    age?: number;
    phone?: string;
    country?: string;
    city?: string;
    role?: {
      viewer: boolean;
      streamer: boolean;
      admin: boolean;
    };
    myStreamers?: string[];
    createdAt?: string;
  };
}

export interface UserData {
  email: string;
  username: string;
  password: string;
  age?: number;
  phone?: string;
  country?: string;
  city?: string;
  role?: string;
  plan?: string;
  myStreamers?: string[];
  createdAt?: string;
}

/**
 * Registers a user directly with Firebase, bypassing the server API
 */
export async function registerUserWithFirebase(userData: UserData): Promise<FirebaseRegisterResult> {
  try {
    // Hash the password before storing
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);

    // Create user with Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      userData.email,
      userData.password // Use original password for auth
    );

    // Update display name
    await updateProfile(userCredential.user, {
      displayName: userData.username,
    });

    // Prepare user data for Firestore
    const userDataForFirestore = {
      ...userData,
      uid: userCredential.user.uid,
      password: hashedPassword, // Store hashed password
      createdAt: userData.createdAt || new Date().toISOString(),
      role: userData.role || 'user',
      plan: userData.plan || 'basic',
      myStreamers: userData.myStreamers || []
    };

    // Remove sensitive/redundant fields
    delete userDataForFirestore.planDetails;
    delete userDataForFirestore.planId;
    delete userDataForFirestore.selectedStreamers;

    // Save to Firestore using email as document ID
    await setDoc(doc(db, "users", userData.email), userDataForFirestore);

    return {
      success: true,
      user: userCredential.user,
    };
  } catch (error: any) {
    console.error("[FIREBASE] Registration error:", error);
    
    // Handle Firebase specific errors
    const firebaseError = error as { code?: string; message?: string };
    if (firebaseError.code === 'auth/email-already-in-use') {
      throw new Error("This email is already registered");
    } else if (firebaseError.code === 'auth/invalid-email') {
      throw new Error("Invalid email format");
    } else if (firebaseError.code === 'auth/weak-password') {
      throw new Error("Password is too weak");
    }
    
    throw new Error("Failed to register: " + (firebaseError.message || "Unknown error"));
  }
} 