import { useState } from 'react';
import { useSignupStore } from '@/lib/store/useSignupStore';
import { Button } from '@/components/ui/button';

type Plan = {
  name: string;
  maxStreamers: number | string;
  price: number;
  features: string[];
};

const plans: Plan[] = [
  {
    name: 'Basic',
    maxStreamers: 1,
    price: 9.99,
    features: [
      "Access to 1 streamer",
      "Live workouts & replays",
      "1-minute free previews",
      "Basic chat access"
    ]
  },
  {
    name: 'Plus',
    maxStreamers: 3,
    price: 19.99,
    features: [
      "Access to 3 streamers",
      "Live workouts & replays",
      "Exclusive Q&A sessions",
      "Priority chat access"
    ]
  },
  {
    name: 'Unlimited',
    maxStreamers: '∞',
    price: 29.99,
    features: [
      "Unlimited streamers",
      "Exclusive fitness challenges",
      "One-on-one coaching sessions",
      "VIP chat access & badges"
    ]
  },
];

export default function SelectPlan() {
  const { nextStep, prevStep } = useSignupStore();
  const [selectedPlan, setSelectedPlan] = useState<Plan>(plans[0]);

  return (
      <div>
        <h2 className="text-3xl font-edo text-brandOrange mb-6 text-center">Choose a Plan</h2>

        {/* Plan Cards */}
        <div className="flex flex-row gap-6 justify-center">
          {plans.map((plan) => (
              <div
                  key={plan.name}
                  onClick={() => setSelectedPlan(plan)}
                  className={`cursor-pointer p-6 rounded-lg transition border-2 ${
                      selectedPlan.name === plan.name ? "border-brandOrange bg-brandGray" : "border-brandGray bg-brandBlack"
                  }`}
              >
                <h3 className="text-2xl text-brandWhite font-semibold mb-2">{plan.name}</h3>
                <p className="text-lg text-brandOrange font-semibold">${plan.price}/month</p>
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
          <Button onClick={prevStep} className="bg-brandGray mt-4">Back</Button>
          <Button
              onClick={() => nextStep({ selectedPlan: selectedPlan.name })}
              className="bg-brandOrange text-brandBlack"
          >
            Next
          </Button>
        </div>
      </div>
  );
}
