import { useSignupStore } from '@/lib/store/useSignupStore';
import StripeForm from '@/components/payment/StripeForm';
import { Button } from '@/components/ui/button';

export default function Payment() {
  const { nextStep, prevStep } = useSignupStore();
  return (
    <div>
      <h2 className="text-xl text-brandWhite mb-4">Enter Payment Info</h2>
      <StripeForm onSuccess={nextStep} />
      <Button onClick={prevStep} className="bg-brandGray mt-4">Back</Button>
    </div>
  );
}
