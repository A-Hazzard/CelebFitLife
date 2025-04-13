import { User } from "@/lib/types/user";
// Remove import of UserData from the store
// import { UserData } from "@/lib/store/useAuthStore";

/**
 * Utility functions for user data handling
 */

/**
 * Normalizes a User object, ensuring the role structure is present.
 * Returns the same User type, potentially with default roles added.
 */
export function normalizeUser(user: User): User {
  // Ensure role object exists with defaults
  const role = user.role || { admin: false, streamer: false, viewer: true };

  // Return the user object, ensuring the role field is populated
  return {
    ...user, // Spread existing user properties
    role: {
      admin: role.admin || false,
      streamer: role.streamer || false,
      viewer: role.viewer !== undefined ? role.viewer : true,
    },
    // Remove deprecated fields explicitly if they somehow exist
    // isAdmin: undefined, // We expect these aren't present anymore
    // isStreamer: undefined,
  };
}

/**
 * Safely gets role information from a user object
 * Provides fallbacks for missing fields
 */
export function getUserRoles(user: User | null | undefined) {
  if (!user) return { isAdmin: false, isStreamer: false, isViewer: true };

  // Access the nested role structure directly
  // No need to check "role" in user, the type requires it
  return {
    isAdmin: user.role?.admin || false,
    isStreamer: user.role?.streamer || false,
    isViewer: user.role?.viewer !== undefined ? user.role.viewer : true,
  };

  // Removed fallback logic for deprecated isAdmin/isStreamer fields
}
