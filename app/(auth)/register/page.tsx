'use client';

import { useSignupStore } from '@/lib/store/useSignupStore';
import BasicInfo from './steps/BasicInfo';
import SelectPlan from './steps/SelectPlan';
import Payment from './steps/Payment';
import SelectStreamers from './steps/SelectStreamers';
import Stepper from '@/components/ui/Stepper';

export default function RegisterPage() {
  const { step } = useSignupStore();

  // Render different step components based on current step
  const renderStepComponent = () => {
    switch (step) {
      case 1:
        return <BasicInfo />;
      case 2:
        return <SelectPlan />;
      case 3:
        return <Payment />;
      case 4:
        return <SelectStreamers />;
      default:
        return <BasicInfo />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-brandBlack text-brandWhite">
      <div className="w-full max-w-md px-6 py-8">
        <Stepper currentStep={step} />
        {renderStepComponent()}
      </div>
    </div>
  );
}