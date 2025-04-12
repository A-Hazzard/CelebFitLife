import { 
  createUserWithEmailAndPassword,
  updateProfile 
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { db, auth } from "@/lib/config/firebase";
import bcrypt from 'bcryptjs';

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

    // Save to Firestore using email as document ID
    await setDoc(doc(db, "users", userData.email), userDataForFirestore);

    return {
      success: true,
      user: {
        id: userCredential.user.uid,
        username: userData.username,
        email: userData.email,
        uid: userCredential.user.uid,
        age: userData.age,
        phone: userData.phone,
        country: userData.country,
        city: userData.city,
        role: {
          viewer: true,
          streamer: false,
          admin: false
        },
        myStreamers: userData.myStreamers || [],
        createdAt: userData.createdAt || new Date().toISOString()
      },
    };
  } catch (error: Error | unknown) {
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