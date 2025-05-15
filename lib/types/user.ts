/**
 * User type definitions - Consolidated to match Firestore schema
 */

/**
 * Core User type used across the application
 * Matches the Firestore schema as shown in the screenshot
 */
export type User = {
  id?: string;
  uid?: string;
  email: string;
  username: string;
  password?: string;
  phone?: string;
  country?: string;
  city?: string;
  age?: number;
  createdAt?: string | Date;
  role: {
    admin: boolean;
    streamer: boolean;
    viewer: boolean;
  };
  // Additional fields used in signup flow
  acceptedTnC?: boolean;
  plan?: string;
  selectedPlan?: string;
  planDetails?: {
    price: number;
    maxStreamers: number | string;
  };
  paymentInfo?: {
    paymentMethodId: string;
    amount: number;
    status: string;
  };
  myStreamers?: string[];
  /**
   * List of streamer IDs the user has already previewed (1-minute preview)
   */
  previewedStreamers?: string[];
  /**
   * Number of streamer changes this month
   */
  streamerChangeCount?: number;
  /**
   * Max allowed streamer changes per month
   */
  streamerChangeLimit?: number;
  /**
   * Timestamp for next reset of streamer change count
   */
  streamerChangeReset?: string | Date;
};

/**
 * Data for user login
 */
export type UserLoginForm = {
  email: string;
  password: string;
};

/**
 * Data for user registration
 */
export type UserRegistrationData = {
  email: string;
  username: string;
  password: string;
  confirmPassword?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  country?: string;
  city?: string;
  age?: number;
  role?: Partial<{
    admin: boolean;
    streamer: boolean;
    viewer: boolean;
  }>;
  myStreamers?: string[];
  acceptedTnC?: boolean;
  plan?: string;
  selectedPlan?: string;
  planDetails?: {
    price: number;
    maxStreamers: number | string;
  };
  paymentInfo?: {
    paymentMethodId: string;
    amount: number;
    status: string;
  };
  previewedStreamers?: string[];
  streamerChangeCount?: number;
  streamerChangeLimit?: number;
  streamerChangeReset?: string | Date;
};

/**
 * User data returned from the API with optional token
 */
export type UserResponseDTO = User & {
  token?: string;
};

/**
 * Login operation result
 */
export type LoginResult = {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
};

/**
 * User session data for token payloads and session management
 */
export type UserSessionData = {
  userId: string;
  email: string;
  isStreamer: boolean;
  isAdmin: boolean;
};
