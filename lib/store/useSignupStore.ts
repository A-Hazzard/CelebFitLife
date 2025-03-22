import { create } from "zustand";
import { UserData } from "@/app/api/models/userData";

interface SignupState {
    step: number;
    userData: UserData;
    nextStep: (data?: UserData) => void; // now accepts an optional parameter
    prevStep: () => void;
}

export const useSignupStore = create<SignupState>((set) => ({
    step: 1,
    userData: {} as UserData,
    nextStep: (data) =>
        set((state) => ({
            userData: { ...state.userData, ...(data || {}) },
            step: state.step + 1,
        })),
    prevStep: () => set((state) => ({ step: state.step - 1 })),
}));
