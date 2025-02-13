'use client';

import { useState } from 'react';
import { useSignupStore } from '@/store/useSignupStore';
import { Button } from '@/components/ui/button';
import { dummyStreamers } from '@/lib/data/streamer'; // shared data

const totalStreamers = dummyStreamers.length;

const plans = [
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
    // 🔸 Use totalStreamers for effectively unlimited
    maxStreamers: totalStreamers,
    price: 29.99,
    features: [
      "All streamers in the list",
      "Exclusive fitness challenges",
      "One-on-one coaching sessions",
      "VIP chat access & badges"
    ]
  },
];

export default function SelectPlan() {
  const { nextStep, prevStep } = useSignupStore();
  const [selectedPlan, setSelectedPlan] = useState(plans[0]);

  return (
    <div>
      <h2 className="text-3xl font-edo text-brandOrange mb-6 text-center">Choose a Plan</h2>

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

      <div className="flex justify-between mt-6">
        <Button onClick={prevStep} className="bg-brandGray">Back</Button>
        <Button onClick={() => nextStep({ selectedPlan })} className="bg-brandOrange text-brandBlack">Next</Button>
      </div>
    </div>
  );
}
