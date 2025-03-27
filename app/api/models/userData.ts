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
  plan?: {
    maxStreamers: number;
  }
  selectedPlan?: string;
}
