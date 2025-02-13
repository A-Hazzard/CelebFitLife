'use client';

import { useSignupStore } from '@/store/useSignupStore';
import BasicInfo from './steps/BasicInfo';
import SelectPlan from './steps/SelectPlan';
import Payment from './steps/Payment';
import SelectStreamers from './steps/SelectStreamers';
import Stepper from '@/components/ui/Stepper';

export default function RegisterPage() {
  const { step } = useSignupStore();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-brandBlack text-brandWhite">
      <div className="w-full max-w-md px-6 py-8">
        <Stepper currentStep={step} />

        {step ===  4&& <BasicInfo />}
        {step === 1 && <SelectPlan />}
        {step === 3 && <Payment />}
        {step === 2 && <SelectStreamers />}
      </div>
    </div>
  );
}