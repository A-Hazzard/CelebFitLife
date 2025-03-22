import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { UserData } from "@/app/api/models/userData";

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
