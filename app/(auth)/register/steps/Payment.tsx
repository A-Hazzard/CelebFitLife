import { useState } from "react";
import { useSignupStore } from "@/lib/store/useSignupStore";
import StripeForm from "@/components/payment/StripeForm";
import { Button } from "@/components/ui/button";
import { processPayment } from "@/lib/services/paymentService";

export default function Payment() {
    const { nextStep, prevStep, userData } = useSignupStore();
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState("");

    const handlePaymentSuccess = async (paymentDetails: any) => {
        setIsProcessing(true);
        setError("");
        try {
            await processPayment(paymentDetails, typeof userData.plan === 'string' ? userData.plan : "");
            nextStep(paymentDetails);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Payment processing failed";
            setError(errorMessage);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div>
            <h2 className="text-xl text-brandWhite mb-4">Enter Payment Info</h2>
            {error && <p className="text-brandOrange mb-2">{error}</p>}
            
            <StripeForm 
                onSuccess={handlePaymentSuccess} 
            />
            
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
