import { useState } from "react";
import { useSignupStore } from "@/lib/store/useSignupStore";
import StripeForm from "@/components/payment/StripeForm";
import { Button } from "@/components/ui/button";
import { processPayment } from "@/lib/services/paymentService";
import {
  PaymentDetails,
  mapToServicePaymentDetails,
} from "@/lib/types/payment";
import { UserData } from "@/app/api/models/userData";

export default function Payment() {
  const { nextStep, prevStep, userData } = useSignupStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  const handlePaymentSuccess = async (paymentDetails: PaymentDetails) => {
    setIsProcessing(true);
    setError("");
    try {
      // Map UI payment details to service format
      const servicePaymentDetails = mapToServicePaymentDetails(paymentDetails);

      await processPayment(
        servicePaymentDetails,
        typeof userData.plan === "string" ? userData.plan : ""
      );

      // Map PaymentDetails to UserData compatible object
      const paymentUserData: Partial<UserData> = {
        paymentInfo: {
          paymentMethodId: paymentDetails.paymentMethodId,
          amount: paymentDetails.amount,
          status: paymentDetails.status,
        },
      };

      nextStep(paymentUserData);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Payment processing failed";
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl text-brandWhite mb-4">Enter Payment Info</h2>
      {error && <p className="text-brandOrange mb-2">{error}</p>}

      <StripeForm onSuccess={handlePaymentSuccess} />

      <Button
        onClick={prevStep}
        className="bg-brandGray mt-4"
        disabled={isProcessing}
      >
        Back
      </Button>
    </div>
  );
}
