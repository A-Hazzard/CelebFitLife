/**
 * A plain TS type for storing user info.
 * This is easier to persist in Zustand without losing methods.
 */
export interface UserData {
  id?: string;
  name?: string;
  email?: string;
  specialty?: string;
  tags?: string[];
  bio?: string;
  socialLinks?: {
    instagram?: string;
    youtube?: string;
    twitter?: string;
  };
  role?: {
    streamer: boolean;
    admin: boolean;
    viewer: boolean;
  };
  streams?: {
    total: number;
    totalViewers: number;
    totalEarnings: number;
    monthlyStats: Array<{
      month: string;
      streams: number;
      viewers: number;
      earnings: number;
    }>;
  };
  createdAt?: Date;
  updatedAt?: Date;
  uid?: string;
  username?: string;
  password?: string;
  phone?: string;
  country?: string;
  city?: string;
  age?: number;
  plan?:
    | {
        maxStreamers: number;
      }
    | string;
  selectedPlan?: string;
  planDetails?: {
    price: number;
    maxStreamers: number | string;
  };
  userId?: string;
  planId?: string;
  paymentInfo?: {
    paymentMethodId?: string;
    amount?: number;
    status?: string;
  };
  acceptedTnC?: boolean;
  selectedStreamers?: Array<{
    streamerId: string;
    streamerName: string;
  }>;
  myStreamers?: string[]; // Array of streamer IDs the user follows
}
