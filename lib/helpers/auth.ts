import { LoginResult, RegistrationData } from "@/lib/types/auth";
import axios, { AxiosError } from "axios";
import { validateRegistrationInput } from "../utils/auth";

/**
 * Handles user login by sending credentials to the API.
 * Provides proper error messages for different failure cases.
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
  try {
    const { data } = await axios.post<LoginResult>("/api/auth/login", {
      email,
      password,
    });

    if (!data.success) {
      return {
        success: false,
        error: data.error || "Invalid login credentials.",
      };
    }

    return { success: true, user: data.user };
  } catch (error: unknown) {
    // Check if it's an AxiosError
    if (axios.isAxiosError(error)) {
      const err = error as AxiosError<{ error: string }>;
      if (err.response) {
        return {
          success: false,
          error:
              err.response.data?.error ||
              `Login failed: ${err.response.statusText}`,
        };
      } else if (err.request) {
        return {
          success: false,
          error:
              "Network error: Unable to reach the server. Please try again later.",
        };
      }
    }
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

/**
 * Registers a new user by sending a POST request to /api/auth/register.
 * Validates input before sending.
 *
 * @param data - RegistrationData to send to the API.
 * @throws Error if validation fails or the API returns an error.
 */
export async function registerUser(data: RegistrationData): Promise<void> {
  const { username, email, password, phone, country, city, age, acceptedTnC } =
      data;
  const inputs = [username, email, password, phone, country, city, String(age)];

  if (!validateRegistrationInput(inputs, acceptedTnC)) {
    throw new Error(
        "Please fill out all required fields and accept the Terms & Conditions."
    );
  }

  try {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const resData = await response.json();

    if (!response.ok) {
      throw new Error(resData.error || "Registration failed. Please try again.");
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("An error occurred while registering. Please try again.");
  }
}
