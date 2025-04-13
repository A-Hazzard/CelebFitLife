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

// --- Twilio Service Types ---
export type TokenCache = {
  [key: string]: {
    token: string;
    expiresAt: number; // Timestamp in milliseconds
  };
};

export type ReconnectionHandlers = {
  onReconnecting?: () => void;
  onReconnected?: () => void;
  onFailed?: (error: Error) => void;
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
  isAdmin: boolean;
  iat?: number;
  exp?: number;
};
