import { 
  getAuth, 
  createUserWithEmailAndPassword,
  updateProfile 
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/config/firebase";
import { RegistrationData } from "@/lib/types/auth";

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

/**
 * Registers a user directly with Firebase, bypassing the server API
 */
export async function registerUserWithFirebase(data: RegistrationData): Promise<FirebaseRegisterResult> {
  const { email, password, username, age, phone, country, city, role } = data;
  
  try {
    console.log("[FIREBASE] Attempting to create user:", email);
    
    // Create the user with Firebase Authentication
    const auth = getAuth();
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update the user profile with the username
    await updateProfile(user, {
      displayName: username
    });
    
    // Prepare user data for Firestore
    const userData = {
      username,
      email,
      uid: user.uid,
      age: Number(age),
      phone: phone || "",
      country: country || "",
      city: city || "",
      role: {
        viewer: true,
        streamer: false,
        admin: false,
        ...(role || {})
      },
      myStreamers: [],
      createdAt: new Date().toISOString()
    };
    
    // Save user data to Firestore
    console.log("[FIREBASE] Saving user data to Firestore:", user.uid);
    await setDoc(doc(db, "users", user.uid), userData);
    
    console.log("[FIREBASE] User successfully created:", user.uid);
    return {
      success: true,
      user: {
        ...userData,
        id: user.uid
      }
    };
  } catch (error) {
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