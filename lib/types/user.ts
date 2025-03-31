/**
 * User type definitions
 */

export interface Role {
  admin: boolean;
  streamer: boolean;
  viewer: boolean;
}

/**
 * Core User interface used across the application
 */
export interface User {
  id: string;
  email: string;
  username?: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  profileImage?: string;
  isStreamer: boolean;
  isAdmin: boolean;
  bio?: string;
  role?: Role;
  age?: number;
  city?: string;
  country?: string;
  phone?: string;
  socialLinks?: {
    twitter?: string;
    instagram?: string;
    tiktok?: string;
    youtube?: string;
    website?: string;
  };
  categories?: string[];
  tags?: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface UserLoginForm {
  email: string;
  password: string;
}

export interface UserRegistrationForm {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  displayName?: string;
}

/**
 * Data transfer objects for user operations
 */
export interface UserCreateDTO {
  email: string;
  username: string;
  password: string;
  age?: number;
  city?: string;
  country?: string;
  phone?: string;
  role?: Partial<Role>;
}

export interface UserLoginDTO {
  email: string;
  password: string;
}

export interface UserResponseDTO {
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
}
