import { create } from "zustand";
import { UserData } from "@/app/api/models/userData";

interface SignupState {
    step: number;
    userData: UserData;
    nextStep: (data: any) => void;
    prevStep: () => void;
    completeSignup: (data: any) => void;
}

export const useSignupStore = create<SignupState>((set) => ({
    step: 1,
    userData: {
        username: '',
        email: '',
        password: '',
        phone: '',
        country: '',
        city: '',
        age: 0,
        acceptedTnC: false,
    },
    nextStep: (data) => set((state) => ({
        step: state.step + 1,
        userData: { ...state.userData, ...data },
    })),
    prevStep: () => set((state) => ({
        step: Math.max(state.step - 1, 1),
    })),
    completeSignup: (data) => set((state) => ({
        userData: { ...state.userData, ...data },
    })),
}));
