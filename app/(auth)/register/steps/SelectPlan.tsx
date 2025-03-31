import { useState } from "react";
import { useSignupStore } from "@/lib/store/useSignupStore";
import { Button } from "@/components/ui/button";
import { SUBSCRIPTION_PLANS, Plan } from "@/lib/utils/planUtils";

export default function SelectPlan() {
  const { nextStep, prevStep } = useSignupStore();
  const [selectedPlan, setSelectedPlan] = useState<Plan>(SUBSCRIPTION_PLANS[0]);

  const handlePlanSelect = (plan: Plan) => {
    setSelectedPlan(plan);
  };

  const handleNextStep = () => {
    nextStep({
      selectedPlan: selectedPlan.name,
      planId: selectedPlan.id,
      plan: selectedPlan.id,
      planDetails: {
        price: selectedPlan.price,
        maxStreamers: selectedPlan.maxStreamers,
      },
    });
  };

  return (
    <div>
      <h2 className="text-3xl font-edo text-brandOrange mb-6 text-center">
        Choose a Plan
      </h2>

      {/* Plan Cards */}
      <div className="flex flex-row gap-6 justify-center">
        {SUBSCRIPTION_PLANS.map((plan) => (
          <div
            key={plan.id}
            onClick={() => handlePlanSelect(plan)}
            className={`cursor-pointer p-6 rounded-lg transition border-2 ${
              selectedPlan.id === plan.id
                ? "border-brandOrange bg-brandGray"
                : "border-brandGray bg-brandBlack"
            }`}
          >
            <h3 className="text-2xl text-brandWhite font-semibold mb-2">
              {plan.name}
            </h3>
            <p className="text-lg text-brandOrange font-semibold">
              ${plan.price}/month
            </p>
            <ul className="mt-3 space-y-2 text-brandWhite text-sm">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-center">
                  ✅ {feature}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Buttons */}
      <div className="flex justify-between mt-6">
        <Button onClick={prevStep} className="bg-brandGray mt-4">
          Back
        </Button>
        <Button
          onClick={handleNextStep}
          className="bg-brandOrange text-brandBlack"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
