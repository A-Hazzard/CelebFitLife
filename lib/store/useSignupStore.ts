import { create } from "zustand";
import { User } from "@/lib/types/user";

type SignupState = {
  step: number;
  userData: User;
  nextStep: (data: Partial<User>) => void;
  prevStep: () => void;
  completeSignup: (data: Partial<User>) => void;
};

export const useSignupStore = create<SignupState>((set) => ({
  step: 0,
  userData: {
    username: "",
    email: "",
    password: "",
    phone: "",
    country: "",
    city: "",
    age: 0,
    acceptedTnC: false,
    role: {
      viewer: true,
      streamer: false,
      admin: false,
    },
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
    myStreamers: [],
  },
  nextStep: (data: Partial<User>) =>
    set((state) => ({
      step: state.step + 1,
      userData: { ...state.userData, ...data },
    })),
  prevStep: () =>
    set((state) => ({
      step: Math.max(state.step - 1, 0),
    })),
  completeSignup: (data: Partial<User>) =>
    set((state) => ({
      userData: { ...state.userData, ...data },
    })),
}));
