import { z } from "zod";
import { UserService } from "./UserService";
import { User } from "../models/User";
import {
  ValidationError,
  UserExistsError,
  InvalidDataError,
} from "../errors/apiErrors";

// Zod Schema for registration validation
const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  age: z.number().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  role: z
    .object({
      admin: z.boolean().optional(),
      streamer: z.boolean().optional(),
      viewer: z.boolean().optional(),
    })
    .optional(),
});

// Type for validated registration data
export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * Service for handling user registration (API-specific)
 */
export class RegisterService {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  /**
   * Validate registration input data using Zod schema
   */
  validateInput(body: unknown): RegisterInput {
    try {
      const parsedBody = registerSchema.safeParse(body);
      if (!parsedBody.success) {
        throw new ValidationError(parsedBody.error.errors[0].message);
      }
      return parsedBody.data;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new ValidationError("Invalid registration data");
    }
  }

  /**
   * Register a new user with validated data
   */
  async registerUser(userData: RegisterInput): Promise<User> {
    try {
      // The UserService.create method already handles:
      // - Checking if email/username exists
      // - Password hashing
      // - Creating the user in Firestore
      return await this.userService.create(userData);
    } catch (error) {
      // Just pass through expected errors from UserService
      if (
        error instanceof UserExistsError ||
        error instanceof InvalidDataError
      ) {
        throw error;
      }

      // Log other unexpected errors
      console.error("Error during user registration:", error);
      throw new Error("Failed to register user due to a server error");
    }
  }
}
