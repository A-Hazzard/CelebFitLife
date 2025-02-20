// lib/models/User.ts
import { UserData } from './userData';

/**
 * A class that wraps user data and provides methods like getProfile(), updateProfile(), etc.
 * If you store this class directly in Zustand with persist,
 * you must re-instantiate on rehydration or store a plain object in the store.
 */
export class User {
  private profile: UserData;

  constructor(profile: UserData) {
    this.profile = profile;
  }

  /**
   * Return the user's in-memory data
   */
  public getProfile(): UserData {
    return this.profile;
  }

  /**
   * Example method to update local fields
   */
  public async updateProfile(updates: Partial<UserData>) {
    this.profile = { ...this.profile, ...updates };
    // Persist changes to Firestore or an API, e.g.:
    // await updateUserInFirestore(this.profile.uid, updates);
  }

  /**
   * Example method to delete an account
   */
  public async deleteAccount() {
    // e.g. await deleteUserInFirestore(this.profile.uid);
    // e.g. await firebaseAuth.deleteUser(this.profile.uid);
  }
}
