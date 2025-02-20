// lib/helpers/auth.ts
import { LoginResult, RegistrationData } from "@/lib/types/auth";
import axios from "axios";
import { validateRegistrationInput } from "../utils/auth";

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
      password
    });
    if (!data.success) {
      return { success: false, error: data.error || "Login failed" };
    }
    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "An unknown error occurred",
    };
  }
}


/**
 * Registers a new user by sending a POST request to the /api/auth/register route.
 * Validates input before sending.
 *
 * @param data - RegistrationData to send to the API.
 * @throws an Error if validation fails or the API returns an error.
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

  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const resData = await response.json();
  if (!response.ok) {
    throw new Error(resData.error || "Registration failed");
  }
}
