/**
 * Payment Types for the application
 */

export type PaymentDetails = {
  paymentMethodId?: string;
  paymentIntentId?: string;
  amount?: number;
  currency?: string;
  status?:
    | "succeeded"
    | "processing"
    | "requires_payment_method"
    | "requires_confirmation"
    | "canceled";
  metadata?: Record<string, string>;
  customerId?: string;
};

// Import service payment details type
import { PaymentDetails as ServicePaymentDetails } from "@/lib/services/paymentService";

/**
 * Maps payment details from UI to service format
 */
export function mapToServicePaymentDetails(
  details: PaymentDetails
): ServicePaymentDetails {
  return {
    cardNumber: details.metadata?.cardNumber || "4242424242424242",
    expiryDate: details.metadata?.expiryDate || "12/25",
    cvv: details.metadata?.cvv || "123",
    name: details.metadata?.name || "Test User",
  };
}
