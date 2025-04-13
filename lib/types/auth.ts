import { User } from "./user";

/**
 * Authentication related types
 */

/**
 * Result of a login operation
 */
export type LoginResult = {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
};

/**
 * Registration data for creating a new user
 */
export type RegistrationData = {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  country?: string;
  city?: string;
  age?: number;
  role?: {
    viewer?: boolean;
    streamer?: boolean;
    admin?: boolean;
  };
};

/**
 * User session data for token payloads and session management
 */
export type UserSessionData = {
  isStreamer: boolean;
  isAdmin: boolean;
  userId: string;
  email: string;
};
