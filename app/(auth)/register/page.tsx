'use client';

import { useEffect } from 'react';
import { useSignupStore } from '@/store/useSignupStore';
import BasicInfo from './steps/BasicInfo';
import SelectPlan from './steps/SelectPlan';
import Payment from './steps/Payment';
import SelectStreamers from './steps/SelectStreamers';
import Stepper from '@/components/ui/Stepper';

export default function RegisterPage() {
  const { step, setStep } = useSignupStore();

  useEffect(() => {
    // Automatically skip Payment step if it's not functional
    if (step === 3) {
      setStep(4);
    }
  }, [step, setStep]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-brandBlack text-brandWhite">
      <div className="w-full max-w-4xl px-12 py-16 bg-brandBlack/80 rounded-2xl shadow-2xl ">
        <div className="mb-8">
          <Stepper currentStep={step} />
        </div>

        <div className="w-full">
          {step === 1 && <BasicInfo />}
          {step === 2 && <SelectPlan />}
          {step === 3 && <Payment />}
          {step === 4 && <SelectStreamers />}
        </div>
      </div>
    </div>
  );
}