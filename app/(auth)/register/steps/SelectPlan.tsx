"use client";

import { useState } from "react";
import { useSignupStore } from "@/lib/store/useSignupStore";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { Plan } from "@/lib/types/subscription";

// Define subscription plans directly in the component to ensure they're always available
const SUBSCRIPTION_PLANS = [
  {
    id: "basic",
    name: "Basic",
    maxStreamers: 1,
    price: 9.99,
    features: [
      "Access to 1 streamer",
      "Live workouts & replays",
      "1-minute free previews",
      "Basic chat access",
    ],
  },
  {
    id: "plus",
    name: "Plus",
    maxStreamers: 3,
    price: 19.99,
    features: [
      "Access to 3 streamers",
      "Live workouts & replays",
      "Exclusive Q&A sessions",
      "Priority chat access",
    ],
    popular: true,
  },
  {
    id: "unlimited",
    name: "Unlimited",
    maxStreamers: "∞",
    price: 29.99,
    features: [
      "Unlimited streamers",
      "Exclusive fitness challenges",
      "One-on-one coaching sessions",
      "VIP chat access & badges",
    ],
  },
];

export default function SelectPlan() {
  const { nextStep, prevStep } = useSignupStore();
  const [selectedPlan, setSelectedPlan] = useState<Plan>(SUBSCRIPTION_PLANS[1]); // Default to Plus plan

  const handlePlanSelect = (plan: Plan) => {
    setSelectedPlan(plan);
  };

  const handleNextStep = () => {
    nextStep({
      selectedPlan: selectedPlan.name,
      plan: selectedPlan.id,
      planDetails: {
        price: selectedPlan.price,
        maxStreamers: selectedPlan.maxStreamers,
      },
    });
  };

  return (
    <div className="max-w-full">
      <h2 className="text-2xl text-white mb-2 font-semibold">
        Choose Your Plan
      </h2>
      <p className="text-gray-400 mb-8">
        Select a subscription plan that works for you
      </p>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 w-full">
        {SUBSCRIPTION_PLANS.map((plan) => (
          <motion.div
            key={plan.id}
            onClick={() => handlePlanSelect(plan)}
            className={`cursor-pointer bg-gray-800 p-5 rounded-xl border-2 transition-all relative ${
              selectedPlan.id === plan.id
                ? "border-orange-500"
                : "border-gray-700"
            }`}
            initial={{ opacity: 1, y: 0 }} // Removed animation for testing
            animate={{ opacity: 1, y: 0 }} // Ensure it's visible
          >
            {plan.popular && (
              <div className="absolute -top-3 right-4 bg-orange-500 text-white text-xs font-bold py-1 px-3 rounded-full flex items-center">
                <Sparkles className="w-3 h-3 mr-1" /> Popular
              </div>
            )}

            <div className="flex flex-col mb-4">
              <h3 className="text-xl text-white font-bold">{plan.name}</h3>
              <div className="mt-2 flex flex-col items-start">
                <span className="text-3xl text-orange-500 font-bold">
                  ${plan.price}
                </span>
                <span className="text-sm text-gray-400">/month</span>
              </div>
            </div>

            <div className="h-[1px] bg-gray-700 w-full mb-4"></div>

            <ul className="space-y-3 mb-5">
              {plan.features.map((feature, idx) => (
                <li
                  key={idx}
                  className="flex items-start text-gray-300 text-sm"
                >
                  <span className="text-orange-500 mr-2 mt-0.5 flex-shrink-0">
                    <Check className="h-4 w-4" />
                  </span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Button
              className={`w-full rounded-lg ${
                selectedPlan.id === plan.id
                  ? "bg-orange-500 hover:bg-orange-600"
                  : "bg-gray-700 hover:bg-gray-600"
              }`}
              variant={selectedPlan.id === plan.id ? "default" : "outline"}
            >
              {selectedPlan.id === plan.id ? "Selected" : "Select Plan"}
            </Button>
          </motion.div>
        ))}
      </div>

      {/* Buttons */}
      <div className="flex gap-4 pt-4">
        <Button
          onClick={() => prevStep()}
          className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-full text-sm"
        >
          Back
        </Button>
        <Button
          onClick={handleNextStep}
          className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-full text-sm flex-1"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
