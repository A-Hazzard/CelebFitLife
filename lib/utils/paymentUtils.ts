import { PaymentDetails } from "@/lib/types/payment";
import { PaymentDetails as ServicePaymentDetails } from "@/lib/types/services";

/**
 * Maps payment details from UI to service format
 * Takes a UI-format payment details object and converts it to the format expected by services
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
