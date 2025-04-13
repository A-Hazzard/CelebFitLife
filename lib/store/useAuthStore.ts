import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
// Import only User, as Role is now inlined
import { User } from "@/lib/types/user";

// Remove the redundant UserData type definition
// export type UserData = { ... };

type AuthState = {
  currentUser: User | null;
  setUser: (userData: User) => void;
  clearUser: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      currentUser: null,

      /**
       * Save a plain object in store
       */
      setUser: (userData: User) =>
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
