
/**
 * A plain TS type for storing user info.
 * This is easier to persist in Zustand without losing methods.
 */
export type UserData = {
    uid: string;
    email: string;
    displayName: string;
    phone?: string;
    country?: string;
    city?: string;
    age?: number;
    // Add any extra fields you want for the user's profile
  };
  