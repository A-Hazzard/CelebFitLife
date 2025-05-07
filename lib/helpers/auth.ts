/**
 * CLIENT-SIDE AUTH HELPERS
 * These functions are used by the client-side components to interact with the API.
 * They should remain in the root lib/helpers directory.
 */

import {
  LoginResult,
  UserRegistrationData as RegistrationData,
} from "@/lib/types/user";
import axios, { AxiosError } from "axios";
import { User } from "../types/user";
import { createLogger } from "@/lib/utils/logger";

const authLogger = createLogger("AuthHelpers");

/**
 * Handles user login by sending credentials to the API endpoint.
 * This is a client-side function that calls the server API.
 *
 * @param email - User email
 * @param password - User password
 * @returns LoginResult object with success status and possible error message.
 */
export async function handleLogin({
  email,
  password,
}: {
  email: string;
  password: string;
}): Promise<LoginResult> {
  console.log(
    "[CLIENT] Login attempt - preparing request for:",
    email.substring(0, 3) + "..."
  );

  try {
    console.log("[CLIENT] Sending login request with fields:", {
      hasEmail: !!email,
      emailLength: email.length,
      hasPassword: !!password,
      passwordLength: password.length,
    });

    const response = await axios.post("/api/auth/login", {
      email,
      password,
    });

    const data = response.data;
    console.log("[CLIENT] Received login response:", {
      success: data.success,
      hasError: !!data.error,
      hasUser: !!data.user,
      responseStatus: response.status,
    });

    if (!data.success) {
      console.error("[CLIENT] Login failed with error:", data.error);
      return {
        success: false,
        error: data.error || "Invalid login credentials.",
      };
    }

    // Check if user object is valid
    if (!data.user) {
      console.error("[CLIENT] Login response missing user object");
      return {
        success: false,
        error: "Server returned an invalid response. Please try again.",
      };
    }

    // Verify essential user properties exist
    const user = data.user;
    console.log("[CLIENT] User object properties:", {
      hasId: !!user.id,
      hasEmail: !!user.email,
      hasUsername: !!user.username,
      hasRole: !!user.role,
      hasToken: !!user.token,
    });

    // If any critical field is missing, log a warning but continue
    if (!user.id || !user.email || !user.role) {
      console.warn("[CLIENT] User object missing critical fields:", {
        id: !!user.id,
        email: !!user.email,
        role: !!user.role,
      });
    }

    console.log(
      "[CLIENT] Login successful for user:",
      user.email?.substring(0, 3) + "..."
    );

    return {
      success: true,
      user,
    };
  } catch (error: unknown) {
    console.error("[CLIENT] Login exception caught:", error);
    // Check if it's an AxiosError
    if (axios.isAxiosError(error)) {
      const err = error as AxiosError<{ error: string }>;
      if (err.response) {
        console.error("[CLIENT] Axios response error:", {
          status: err.response.status,
          statusText: err.response.statusText,
          data: err.response.data,
        });
        return {
          success: false,
          error:
            err.response.data?.error ||
            `Login failed: ${err.response.statusText}`,
        };
      } else if (err.request) {
        console.error(
          "[CLIENT] Axios request error (no response):",
          err.request
        );
        return {
          success: false,
          error:
            "Network error: Unable to reach the server. Please try again later.",
        };
      }
    }
    console.error("[CLIENT] Unhandled login error");
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

/**
 * Registers a new user by sending registration data to the API endpoint.
 * This is a client-side function that calls the server API.
 *
 * @param data - RegistrationData to send to the API.
 * @throws Error if validation fails or the API returns an error.
 */
export async function registerUser(data: RegistrationData): Promise<void> {
  const { username, email, password, phone, country, city, age, role } = data;

  // Ensure all required fields are present according to server schema
  if (!username || !email || !password) {
    throw new Error("Username, email, and password are required.");
  }

  if (username.length < 3) {
    throw new Error("Username must be at least 3 characters");
  }

  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters");
  }

  // Ensure role is properly set with viewer: true
  const userRole = {
    viewer: true,
    streamer: false,
    admin: false,
    ...(role || {}),
  };

  // Prepare request data - only include fields expected by the server schema
  const requestData = {
    username,
    email,
    password,
    age: Number(age),
    phone: phone || undefined,
    country: country || undefined,
    city: city || undefined,
    role: userRole,
    myStreamers: Array.isArray(data.myStreamers) ? data.myStreamers : [], // Use provided streamer IDs
  };

  console.log("[CLIENT] Sending registration data:", {
    username,
    email: email.substring(0, 3) + "...",
    hasPassword: !!password,
    phone: phone ? phone.substring(0, 3) + "..." : undefined,
    country,
    city,
    age,
    role: userRole,
  });

  try {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestData),
    });

    // Read the response body as text first for debugging
    const responseText = await response.text();
    console.log("[CLIENT] Registration response text:", responseText);

    // Try to parse as JSON if possible
    let resData;
    try {
      resData = responseText ? JSON.parse(responseText) : {};
    } catch (e) {
      console.error("[CLIENT] Failed to parse response as JSON:", e);
      resData = { error: "Invalid response from server" };
    }

    if (!response.ok) {
      throw new Error(
        resData.error || `Registration failed with status ${response.status}`
      );
    }

    console.log("[CLIENT] Registration successful:", resData);
    return resData.user;
  } catch (error: unknown) {
    console.error("[CLIENT] Registration error details:", error);
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("An error occurred while registering. Please try again.");
  }
}

/**
 * Checks if a user is authenticated on the client-side
 */
export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;

  try {
    const token = localStorage.getItem("token");
    if (!token) return false;

    // Check if the token is expired
    const payload = JSON.parse(atob(token.split(".")[1]));
    const expiry = payload.exp * 1000;
    return expiry > Date.now();
  } catch (error) {
    authLogger.error("Error checking authentication:", error as Error);
    return false;
  }
}

/**
 * Gets the current user from local storage
 */
export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null;

  try {
    const userJson = localStorage.getItem("user");
    if (!userJson) return null;

    return JSON.parse(userJson) as User;
  } catch (error) {
    authLogger.error("Error getting current user:", error as Error);
    return null;
  }
}

/**
 * Checks if current user is a streamer
 */
export function isStreamer(): boolean {
  const user = getCurrentUser();
  return !!user?.role?.streamer;
}

/**
 * Checks if current user is an admin
 */
export function isAdmin(): boolean {
  const user = getCurrentUser();
  // Only check the nested role property
  return !!user?.role?.admin;
}

/**
 * Gets the current user's token
 */
export function getToken(): string | null {
  if (typeof window === "undefined") return null;

  try {
    return localStorage.getItem("token");
  } catch (error) {
    authLogger.error("Error getting token:", error as Error);
    return null;
  }
}

/**
 * Logs out the current user by clearing local storage
 */
export function logout(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("expiresAt");

    // Redirect to home page
    window.location.href = "/";
  } catch (error) {
    authLogger.error("Error logging out:", error as Error);
  }
}
