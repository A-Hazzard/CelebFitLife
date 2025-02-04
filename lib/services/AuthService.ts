import { auth, db } from '@/config/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  updateProfile,
  sendEmailVerification,
  signOut,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

import { useAuthStore } from '@/store/useAuthStore';
import { User } from '@/lib/models/User';

/**
 * Create a new user, store additional fields, and send email verification link.
 */
export async function signUpUser({
  email,
  password,
  username,
  phone,
  country,
  city,
  age,
  acceptedTnC,
}: {
  email: string;
  password: string;
  username: string;
  phone: string;
  country: string;
  city: string;
  age: number;
  acceptedTnC: boolean;
}) {
  // 1. Create user in Firebase Auth
  const userCred = await createUserWithEmailAndPassword(auth, email, password);

  // 2. Update user displayName
  if (userCred.user) {
    await updateProfile(userCred.user, {
      displayName: username,
    });
  }

  // 3. Store additional details in Firestore
  await setDoc(doc(db, 'users', userCred.user.uid), {
    uid: userCred.user.uid,
    email,
    username,
    phone,
    country,
    city,
    age,
    acceptedTnC,
    createdAt: serverTimestamp(),
  });

  // 4. Send email verification
  if (userCred.user && !userCred.user.emailVerified) {
    await sendEmailVerification(userCred.user);
  }

  // 5. Sign out to force verification
  await signOut(auth);

  return userCred;
}

/**
 * Login with email + password, but only allow if email is verified.
 * Once verified, fetch user doc from Firestore, create a User instance, and store in Zustand.
 */
export async function loginWithEmailPassword(email: string, password: string) {
  const userCred = await signInWithEmailAndPassword(auth, email, password);
  console.log('logging in');
  if (!userCred.user.emailVerified) {
    await signOut(auth);
    throw new Error('Your email is not verified. Please check your inbox.');
  }
  console.log('verified')

  // Fetch user doc from Firestore for additional profile info
  const docRef = doc(db, 'users', userCred.user.uid);
  const userDoc = await getDoc(docRef);
  if (!userDoc.exists()) {
    throw new Error('User profile not found in Firestore.');
  }
  console.log('found user doc', userDoc)

  const userData = userDoc.data();

  // Create a User instance from the data
  const user = new User({
    uid: userData.uid,
    email: userData.email,
    displayName: userData.username, // or userData.displayName if used
    phone: userData.phone,
    country: userData.country,
    city: userData.city,
    age: userData.age,
    // add more fields if needed
  });

  // Store in Zustand
  useAuthStore.getState().setUser(user.getProfile());
  console.log('user in zustand')
  return userCred; // or return user if you prefer
}

/**
 * Send password reset email.
 */
export async function sendPasswordReset(email: string) {
  await sendPasswordResetEmail(auth, email);
}

/**
 * Send sign-in link ("magic link") to email for passwordless login.
 */
export async function sendSignInLink(email: string) {
  const actionCodeSettings = {
    url: 'http://localhost:3000/login', // Must match your domain/port
    handleCodeInApp: true,
  };
  await sendSignInLinkToEmail(auth, email, actionCodeSettings);
  window.localStorage.setItem('emailForSignIn', email);
}

/**
 * Complete sign-in with email link if valid.
 * If successful, also store user in Zustand.
 */
export async function completeSignInWithEmailLink() {
  const storedEmail = window.localStorage.getItem('emailForSignIn') || '';
  if (isSignInWithEmailLink(auth, window.location.href)) {
    const result = await signInWithEmailLink(auth, storedEmail, window.location.href);
    window.localStorage.removeItem('emailForSignIn');

    // Optionally verify if needed
    if (!result.user.emailVerified) {
      await sendEmailVerification(result.user);
    }

    // Fetch user doc from Firestore
    const docRef = doc(db, 'users', result.user.uid);
    const userDoc = await getDoc(docRef);
    if (!userDoc.exists()) {
      throw new Error('User profile not found in Firestore.');
    }
    const userData = userDoc.data();

    // Create a User instance
    const user = new User({
      uid: userData.uid,
      email: userData.email,
      displayName: userData.username,
      phone: userData.phone,
      country: userData.country,
      city: userData.city,
      age: userData.age,
      // add more fields if needed
    });

    // Store in Zustand
    useAuthStore.getState().setUser(user.getProfile());

    return result;
  }
  return null;
}
