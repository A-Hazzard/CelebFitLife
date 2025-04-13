import { User } from "@/lib/types/user";
import { UserData } from "@/app/api/models/userData";

/**
 * Utility functions for user data handling
 */

/**
 * Converts a User type to a UserData type
 * This resolves type incompatibilities between the two systems
 */
export function convertUserToUserData(user: User): UserData {
  return {
    id: user.id,
    uid: user.id, // Duplicate ID in uid field for compatibility
    email: user.email,
    username: user.username,
    phone: user.phone,
    country: user.country,
    city: user.city,
    age: user.age,
    isAdmin: user.isAdmin,
    isStreamer: user.role?.streamer,
    name: user.name || user.displayName,
    profileImage: user.profileImage,
    bio: user.bio,
    tags: user.tags,
    socialLinks: user.socialLinks,
    role: user.role,
    // Convert string dates to Date objects when needed
    createdAt: user.createdAt,
    updatedAt: user.updatedAt ? new Date(user.updatedAt) : undefined,
    // Include other fields with defaults
    password: user.password,
  };
}

/**
 * Safely gets role information from a user object
 * Provides fallbacks for missing fields
 */
export function getUserRoles(user: User | UserData | null | undefined) {
  if (!user) return { isAdmin: false, isStreamer: false, isViewer: true };

  // For User type with role object
  if ("role" in user && user.role) {
    return {
      isAdmin: user.role.admin || false,
      isStreamer: user.role.streamer || false,
      isViewer: user.role.viewer || true,
    };
  }

  // For UserData type with isAdmin/isStreamer properties
  if ("isAdmin" in user) {
    return {
      isAdmin: user.isAdmin || false,
      isStreamer:
        "isStreamer" in user ? (user as UserData).isStreamer || false : false,
      isViewer: true,
    };
  }

  // Default fallback
  return { isAdmin: false, isStreamer: false, isViewer: true };
}
