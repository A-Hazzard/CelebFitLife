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

// The mapToServicePaymentDetails function has been moved to lib/utils/paymentUtils.ts
