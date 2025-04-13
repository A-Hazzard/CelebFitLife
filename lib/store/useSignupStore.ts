import { create } from "zustand";
import { UserData } from "@/app/api/models/userData";

type SignupState = {
  step: number;
  userData: UserData;
  nextStep: (data: Partial<UserData>) => void;
  prevStep: () => void;
  completeSignup: (data: Partial<UserData>) => void;
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
  nextStep: (data: Partial<UserData>) =>
    set((state) => ({
      step: state.step + 1,
      userData: { ...state.userData, ...data },
    })),
  prevStep: () =>
    set((state) => ({
      step: Math.max(state.step - 1, 0),
    })),
  completeSignup: (data: Partial<UserData>) =>
    set((state) => ({
      userData: { ...state.userData, ...data },
    })),
}));
