export interface PaymentDetails {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  name: string;
}

export async function processPayment(paymentDetails: PaymentDetails, planId: string): Promise<boolean> {
  try {
    // API call to process payment
    const response = await fetch('/api/payments/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentDetails,
        planId
      }),
    });

    if (!response.ok) {
      throw new Error('Payment processing failed');
    }

    return true;
  } catch (error) {
    console.error('Payment error:', error);
    throw error;
  }
} 