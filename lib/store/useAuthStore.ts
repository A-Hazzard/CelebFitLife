// store/useAuthStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { UserData } from "@/app/api/models/userData";

type AuthState = {
  currentUser: UserData | null;
  isLoggedIn: boolean;
  setUser: (userData: UserData) => void;
  clearUser: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      currentUser: null,
      isLoggedIn: false,

      /**
       * Save a plain object in store
       */
      setUser: (userData: UserData) =>
        set(() => ({
          currentUser: userData,
          isLoggedIn: true,
        })),

      /**
       * Clear out the user on sign out or forced logout
       */
      clearUser: () =>
        set(() => ({
          currentUser: null,
          isLoggedIn: false,
        })),
    }),
    {
      name: "auth-storage", // Key in localStorage
      storage: createJSONStorage(() => localStorage),
    }
  )
);
