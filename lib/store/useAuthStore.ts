import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// Define the structure for the role object
export type Role = {
  admin: boolean;
  streamer: boolean;
  viewer: boolean;
};

// Update UserData type to match the Firestore structure
export type UserData = {
  id?: string; // Can be optional if email is used as ID
  uid?: string; // Add uid for compatibility
  email: string;
  username?: string;
  name?: string; // Add name field
  profileImage?: string; // Add profile image
  role: Role; // Nested role object
  password?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  phone?: string;
  country?: string;
  city?: string;
  age?: number;
  bio?: string;
  tags?: string[];
  socialLinks?: {
    twitter?: string;
    instagram?: string;
    tiktok?: string;
    youtube?: string;
    website?: string;
  };
  // Remove redundant isAdmin and isStreamer
};

type AuthState = {
  currentUser: UserData | null;
  setUser: (userData: UserData) => void;
  clearUser: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      currentUser: null,

      /**
       * Save a plain object in store
       */
      setUser: (userData: UserData) =>
        set(() => ({
          currentUser: userData,
        })),

      /**
       * Clear out the user on sign out or forced logout
       */
      clearUser: () =>
        set(() => ({
          currentUser: null,
        })),
    }),
    {
      name: "auth-storage", // Key in localStorage
      storage: createJSONStorage(() => localStorage),
    }
  )
);
