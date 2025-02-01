// lib/services/AuthService.ts
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
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

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
 */
export async function loginWithEmailPassword(email: string, password: string) {
  const userCred = await signInWithEmailAndPassword(auth, email, password);
  if (!userCred.user.emailVerified) {
    await signOut(auth);
    throw new Error('Your email is not verified. Please check your inbox.');
  }
  return userCred;
}

/**
 * Send password reset email.
 */
export async function sendPasswordReset(email: string) {
  await sendPasswordResetEmail(auth, email);
}

/**
 * Send sign-in link (\"magic link\") to email for passwordless login.
 */
export async function sendSignInLink(email: string) {
  const actionCodeSettings = {
    url: 'http://localhost:3000/login',
    handleCodeInApp: true,
  };
  await sendSignInLinkToEmail(auth, email, actionCodeSettings);
  window.localStorage.setItem('emailForSignIn', email);
}

/**
 * Complete sign-in with email link if valid.
 */
export async function completeSignInWithEmailLink() {
  const email = window.localStorage.getItem('emailForSignIn') || '';
  if (isSignInWithEmailLink(auth, window.location.href)) {
    const result = await signInWithEmailLink(auth, email, window.location.href);
    window.localStorage.removeItem('emailForSignIn');
    // Optionally verify if needed
    if (!result.user.emailVerified) {
      await sendEmailVerification(result.user);
    }
    return result;
  }
  return null;
}
