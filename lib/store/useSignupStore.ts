import { create } from "zustand";
import { UserData } from "@/app/api/models/userData";

interface SignupState {
  step: number;
  userData: UserData;
  nextStep: (data: Partial<UserData>) => void;
  prevStep: () => void;
  completeSignup: (data: Partial<UserData>) => void;
}

export const useSignupStore = create<SignupState>((set) => ({
  step: 1,
  userData: {
    username: "",
    email: "",
    password: "",
    phone: "",
    country: "",
    city: "",
    age: 0,
    acceptedTnC: false,
    plan: "",
    planDetails: {
      price: 0,
      maxStreamers: 0,
    },
    paymentInfo: {
      paymentMethodId: "",
      amount: 0,
      status: "",
    },
  },
  nextStep: (data: Partial<UserData>) =>
    set((state) => ({
      step: state.step + 1,
      userData: { ...state.userData, ...data },
    })),
  prevStep: () =>
    set((state) => ({
      step: Math.max(state.step - 1, 1),
    })),
  completeSignup: (data: Partial<UserData>) =>
    set((state) => ({
      userData: { ...state.userData, ...data },
    })),
}));
