/**
 * Types for service-related functionality
 */

// --- Payment Service Types ---
export type PaymentDetails = {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  name: string;
};

// --- Authentication Types ---
export type JwtPayload = {
  id?: string;
  email: string;
  username: string;
  role: {
    admin: boolean;
    streamer: boolean;
    viewer: boolean;
  };
  iat?: number;
  exp?: number;
};
