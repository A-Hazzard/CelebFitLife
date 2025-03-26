
/**
 * A plain TS type for storing user info.
 * This is easier to persist in Zustand without losing methods.
 */
export type UserData = {
    uid?: string;
    email?: string;
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
    role: {
        streamer: boolean;
        admin: boolean;
        viewer: boolean;
    }
};
