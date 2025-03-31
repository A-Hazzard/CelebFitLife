import React from "react";
import { PaymentDetails } from "@/lib/types/payment";

export default function StripeForm({
  onSuccess,
}: {
  onSuccess: (data: PaymentDetails) => void;
}) {
  // This is a placeholder - in a real app, this would be a Stripe Elements form
  // For now, we'll just pass dummy data that conforms to the expected PaymentDetails type
  const dummyPaymentDetails: PaymentDetails = {
    paymentMethodId: "pm_test_123456789",
    amount: 2000, // $20.00
    currency: "usd",
    status: "succeeded",
    metadata: {
      cardNumber: "4242424242424242",
      expiryDate: "12/25",
      cvv: "123",
      name: "Test User",
    },
  };

  return (
    <div className="bg-brandGray p-4 rounded-lg text-center">
      <h2 className="text-lg text-brandWhite mb-2">Payment Placeholder</h2>
      <p className="text-sm text-brandWhite mb-4">
        Stripe payment will be implemented here.
      </p>
      <button
        onClick={() => onSuccess(dummyPaymentDetails)}
        className="bg-brandOrange text-brandBlack px-4 py-2 rounded-full"
      >
        Continue
      </button>
    </div>
  );
}
