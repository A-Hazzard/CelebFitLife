import { adminDb } from "@/lib/firebase/admin";
import bcrypt from "bcryptjs";
import { SessionManager } from "@/lib/session";
import { z } from "zod";
import { UserData } from "../models/userData"; // Updated path
import {
  ValidationError,
  AuthenticationError,
  NotFoundError,
  InvalidDataError,
} from "../errors/apiErrors"; // Updated path
import { UserSessionData } from "@/lib/types/auth"; // Import type from shared types

// Zod Schema for login request validation
const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Type for validated login data
type LoginInput = z.infer<typeof loginSchema>;

// LoginService class to encapsulate login logic
export class LoginService {
  // Validate input data using Zod schema
  validateInput(body: unknown): LoginInput {
    const parsedBody = loginSchema.safeParse(body);
    if (!parsedBody.success) {
      throw new ValidationError(parsedBody.error.errors[0].message);
    }
    return parsedBody.data;
  }

  // Fetch user document and data from Firestore
  async findUser(email: string) {
    const userDoc = await adminDb.collection("users").doc(email).get();
    if (!userDoc.exists) {
      throw new NotFoundError("User not found");
    }
    const userData = userDoc.data();
    if (!userData || !userData.password) {
      console.error(
        `Invalid data for user: ${email}. Missing essential fields.`
      );
      throw new InvalidDataError("Invalid user data structure");
    }
    return { userDoc, userData };
  }

  // Verify the provided password against the stored hash
  async verifyPassword(
    password: string,
    hashedPassword: string
  ): Promise<void> {
    const isValidPassword = await bcrypt.compare(password, hashedPassword);
    if (!isValidPassword) {
      throw new AuthenticationError("Invalid credentials");
    }
  }

  // Create a session token for the authenticated user
  async createSessionToken(
    email: string,
    userData: FirebaseFirestore.DocumentData
  ): Promise<string> {
    // Convert the Firestore data to UserSessionData format
    const sessionData: UserSessionData = {
      email,
      userId: userData.uid || userData.id || email,
      isStreamer: userData.role?.streamer || false,
      isAdmin: userData.role?.admin || false,
    };

    const sessionManager = new SessionManager();
    return sessionManager.createSession({
      email,
      isStreamer: sessionData.isStreamer,
      isAdmin: sessionData.isAdmin,
    });
  }

  // Prepare user data for the response payload
  prepareUserData(
    userDoc: FirebaseFirestore.DocumentSnapshot,
    userData: FirebaseFirestore.DocumentData
  ): UserData {
    const userId = typeof userDoc.id === "string" ? userDoc.id : "";
    if (!userId) {
      console.error("Firestore document ID is missing or not a string.");
      throw new InvalidDataError("User ID is missing or invalid.");
    }

    // Construct the response user object matching the API's UserData type
    return {
      uid: userId, // Keep uid as expected by the API's UserData type
      email: userData.email || "",
      username: userData.username || "",
      phone: userData.phone || "",
      country: userData.country || "",
      city: userData.city || "",
      age: userData.age || 0,
      // Include isStreamer and isAdmin based on the role object
      isStreamer: userData.role?.streamer || false,
      isAdmin: userData.role?.admin || false,
      createdAt: userData.createdAt || new Date().toISOString(),
      // Removed the nested 'role' object and other fields not in the API's UserData type
    };
  }
}
