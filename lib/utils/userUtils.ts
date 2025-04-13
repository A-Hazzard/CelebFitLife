import { User } from "@/lib/types/user";
// Import UserData from the store, not the API models
import { UserData } from "@/lib/store/useAuthStore";

/**
 * Utility functions for user data handling
 */

/**
 * Converts a User type to a UserData type
 * This resolves type incompatibilities between the two systems
 */
export function convertUserToUserData(user: User): UserData {
  // Ensure role object exists with defaults
  const role = user.role || { admin: false, streamer: false, viewer: true };

  return {
    id: user.id,
    uid: user.id, // Duplicate ID in uid field for compatibility
    email: user.email,
    username: user.username,
    phone: user.phone,
    country: user.country,
    city: user.city,
    age: user.age,
    name: user.name || user.displayName,
    profileImage: user.profileImage,
    bio: user.bio,
    tags: user.tags,
    socialLinks: user.socialLinks,
    role: {
      admin: role.admin || false,
      streamer: role.streamer || false,
      viewer: role.viewer !== undefined ? role.viewer : true, // Default viewer to true if not specified
    },
    createdAt: user.createdAt,
    updatedAt: user.updatedAt ? new Date(user.updatedAt) : undefined,
    password: user.password,
    // Removed isAdmin and isStreamer fields as they are in the role object now
  };
}

/**
 * Safely gets role information from a user object
 * Provides fallbacks for missing fields
 */
export function getUserRoles(user: User | UserData | null | undefined) {
  if (!user) return { isAdmin: false, isStreamer: false, isViewer: true };

  // Now both User and UserData have the same nested role structure
  if ("role" in user && user.role) {
    return {
      isAdmin: user.role.admin || false,
      isStreamer: user.role.streamer || false,
      isViewer: user.role.viewer !== undefined ? user.role.viewer : true,
    };
  }

  // Fallback for older structures (should not be needed ideally)
  if ("isAdmin" in user) {
    console.warn("Using deprecated role structure in getUserRoles");
    // Check if isStreamer also exists before accessing it
    const isStreamer =
      "isStreamer" in user && typeof user.isStreamer === "boolean"
        ? user.isStreamer
        : false;
    return {
      isAdmin: user.isAdmin || false,
      isStreamer: isStreamer,
      isViewer: true, // Assume viewer if no specific role
    };
  }

  // Default fallback
  return { isAdmin: false, isStreamer: false, isViewer: true };
}
