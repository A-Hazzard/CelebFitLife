/**
 * CLIENT-SIDE AUTH SERVICE
 * This service makes API calls to the authentication endpoints.
 * It does not directly interact with the database.
 */

import {
  UserResponseDTO,
  UserLoginForm,
  UserRegistrationData,
} from "../types/user";
import { z } from "zod";

// Define login validation schema
const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

/**
 * Service for handling authentication operations (client-side)
 */
export class AuthService {
  /**
   * Register a user by making an API call
   */
  async register(userData: UserRegistrationData): Promise<UserResponseDTO> {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      return data.user;
    } catch (error) {
      console.error("Error registering user:", error);
      throw error;
    }
  }

  /**
   * Login a user by making an API call
   */
  async login(credentials: UserLoginForm): Promise<UserResponseDTO> {
    try {
      // Validate inputs with Zod
      const validatedCredentials = loginSchema.parse(credentials);

      console.log("[CLIENT] Attempting to log in:", {
        email: validatedCredentials.email.substring(0, 3) + "...",
        passwordProvided: !!validatedCredentials.password,
      });

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validatedCredentials),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        console.error("[CLIENT] Login failed:", data.error);
        throw new Error(data.error || "Login failed");
      }

      if (!data.user) {
        console.error("[CLIENT] Login response missing user object");
        throw new Error("Invalid response from server");
      }

      console.log(
        `[CLIENT] Login successful for user: ${validatedCredentials.email.substring(
          0,
          3
        )}...`
      );

      return data.user;
    } catch (error) {
      console.error("[CLIENT] Login error:", error);
      throw error;
    }
  }

  /**
   * Get user profile by making an API call
   */
  async getProfile(userId: string): Promise<UserResponseDTO> {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get profile");
      }

      return data.user;
    } catch (error) {
      console.error("Error getting user profile:", error);
      throw error;
    }
  }

  /**
   * Register a new user through the registration flow
   */
  async registerUser(data: UserRegistrationData): Promise<void> {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.error || "Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  }

  /**
   * Login a user with email and password
   */
  async loginUser(email: string, password: string): Promise<UserResponseDTO> {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      return data.user;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  }
}
