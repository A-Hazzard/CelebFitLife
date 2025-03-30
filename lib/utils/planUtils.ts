export interface Plan {
  id: string;
  name: string;
  maxStreamers: number | string;
  price: number;
  features: string[];
}

export const SUBSCRIPTION_PLANS: Plan[] = [
  {
    id: "basic",
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
    id: "plus",
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
    id: "unlimited",
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

export function getPlanById(planId: string): Plan | undefined {
  return SUBSCRIPTION_PLANS.find(plan => plan.id === planId);
}

export function getPlanByName(planName: string): Plan | undefined {
  return SUBSCRIPTION_PLANS.find(plan => plan.name === planName);
} 