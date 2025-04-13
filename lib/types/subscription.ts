// Types related to subscription plans

export type Plan = {
  id: string;
  name: string;
  maxStreamers: number | string;
  price: number;
  features: string[];
  popular?: boolean;
};

export type SelectedPlanDetails = {
  price: number;
  maxStreamers: number | string;
};
