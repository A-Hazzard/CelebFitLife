import { UserService } from "./UserService";
import { UserCreateDTO, UserLoginDTO, UserResponseDTO } from "../models/User";
import { ApiError, ErrorTypes } from "../utils/errorHandler";
import { comparePasswords, createUserResponse } from "../utils/authUtils";
import { RegistrationData } from "@/lib/types/auth";

/**
 * Service for handling authentication operations
 */
export class AuthService {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  async register(userData: UserCreateDTO): Promise<UserResponseDTO> {
    try {
      // Create user using UserService
      const user = await this.userService.create(userData);

      // Return user with token
      return createUserResponse(user, true);
    } catch (error) {
      console.error("Error registering user:", error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError("Failed to register user", 500);
    }
  }

  async login(credentials: UserLoginDTO): Promise<UserResponseDTO> {
    try {
      console.log("Attempting to log in with:", credentials);
      const user = await this.userService.findByEmail(credentials.email);
      
      if (!user) {
        console.error("User not found");
        throw ErrorTypes.UNAUTHORIZED("Invalid email or password");
      }
      
      const isPasswordValid = await comparePasswords(
        credentials.password,
        user.password!
      );

      if (!isPasswordValid) {
        console.error("Invalid password");
        throw ErrorTypes.UNAUTHORIZED("Invalid email or password");
      }
      
      return createUserResponse(user, true);
    } catch (error) {
      console.error("Error logging in user:", error);
      if (error instanceof ApiError) throw error;
      
      throw new ApiError("Failed to log in", 500);
    }
  }

 
  async getProfile(userId: string): Promise<UserResponseDTO> {
    try {
      const user = await this.userService.findById(userId);
      if (!user) {
        throw ErrorTypes.NOT_FOUND("User");
      }

      return createUserResponse(user, false);
    } catch (error) {
      console.error("Error getting user profile:", error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError("Failed to get user profile", 500);
    }
  }

  async registerUser(data: RegistrationData): Promise<void> {
    try {
      // API call to register user
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  async loginUser(email: string, password: string): Promise<UserResponseDTO> {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      return await response.json(); // Assuming the response is of type UserResponseDTO
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }
}
