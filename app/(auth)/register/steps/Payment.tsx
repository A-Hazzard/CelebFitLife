"use client";

import { useSignupStore } from "@/lib/store/useSignupStore";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Shield, CreditCard } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 1) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.4,
      ease: "easeOut",
    },
  }),
};

export default function Payment() {
  const { nextStep, prevStep, userData } = useSignupStore();
  
  // Just go to next step without actual payment processing
  const handleContinue = () => {
    nextStep({
      paymentInfo: {
        status: "pending", // Just a placeholder status
      },
    });
  };

  // Calculate plan details for display
  const planName = userData.selectedPlan || "Plus";
  const planPrice = userData.planDetails?.price || 19.99;

  return (
    <div>
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={1}
        className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-6"
      >
        <div className="mb-6">
          <h3 className="text-xl text-white font-bold mb-2">Payment Summary</h3>
          <div className="h-[1px] bg-gray-700 w-full mb-4"></div>
          
          <div className="flex justify-between items-center mb-3">
            <span className="text-gray-300">Selected Plan</span>
            <span className="text-white font-medium">{planName}</span>
          </div>
          
          <div className="flex justify-between items-center mb-3">
            <span className="text-gray-300">Price</span>
            <span className="text-orange-500 font-bold">${planPrice.toFixed(2)}/month</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Billing Cycle</span>
            <span className="text-white">Monthly</span>
          </div>
          
          <div className="mt-6 flex items-center">
            <Shield className="h-5 w-5 text-green-500 mr-2" />
            <span className="text-sm text-gray-300">
              This is a demo. No actual payment will be processed.
            </span>
          </div>
        </div>
        
        <Button 
          onClick={handleContinue}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl text-base font-medium flex items-center justify-center"
        >
          <CreditCard className="mr-2 h-4 w-4" />
          Continue to Select Streamers
        </Button>
      </motion.div>

      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={2}
        className="flex gap-4 pt-2"
      >
        <Button
          onClick={() => prevStep()}
          className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-full text-sm"
        >
          Back
        </Button>
      </motion.div>
    </div>
  );
}
