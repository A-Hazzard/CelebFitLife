/**
 * User type definitions
 */

export type Role = {
  admin: boolean;
  streamer: boolean;
  viewer: boolean;
};

/**
 * Core User interface used across the application
 */
export type User = {
  id?: string;
  email: string;
  username: string;
  password?: string;
  createdAt: string;
  age?: number;
  city?: string;
  country?: string;
  phone?: string;
  role: Role;
  isAdmin: boolean;
  profileImage?: string;
  name?: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  socialLinks?: {
    twitter?: string;
    instagram?: string;
    tiktok?: string;
    youtube?: string;
    website?: string;
  };
  categories?: string[];
  tags?: string[];
  updatedAt?: string;
};

export type UserLoginForm = {
  email: string;
  password: string;
};

export type UserRegistrationForm = {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  displayName?: string;
};

/**
 * Data transfer objects for user operations
 */
export type UserCreateDTO = {
  email: string;
  username: string;
  password: string;
  age?: number;
  city?: string;
  country?: string;
  phone?: string;
  role?: Partial<Role>;
};

export type UserLoginDTO = {
  email: string;
  password: string;
};

export type UserResponseDTO = {
  id: string;
  email: string;
  username: string;
  createdAt: string;
  age?: number;
  city?: string;
  country?: string;
  phone?: string;
  role: Role;
  isAdmin: boolean;
  token?: string;
};

// For API services
export type UserRole = {
  viewer?: boolean;
  streamer?: boolean;
  admin?: boolean;
};

export type UserUpdateData = {
  username?: string;
  email?: string;
  password?: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  age?: number;
  city?: string;
  country?: string;
  phone?: string;
  role?: UserRole;
  isAdmin?: boolean;
  updatedAt?: string;
  profileImage?: string;
  [key: string]: string | number | boolean | UserRole | undefined;
};

/**
 * User data for the client application
 */
export type UserData = {
  id?: string;
  name?: string;
  email?: string;
  specialty?: string;
  tags?: string[];
  bio?: string;
  profileImage?: string; // URL to the user's profile image
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
};
