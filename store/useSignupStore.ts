import { create } from 'zustand';

interface SignupState {
  step: number;
  userData: Record<string, any>;
  nextStep: (data: any) => void;
  prevStep: () => void;
}

export const useSignupStore = create<SignupState>((set) => ({
  step: 1,
  userData: {},
  nextStep: (data) => set((state) => ({ userData: { ...state.userData, ...data }, step: state.step + 1 })),
  prevStep: () => set((state) => ({ step: state.step - 1 })),
}));
