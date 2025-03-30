import { UserService } from "./UserService";
import { UserCreateDTO, UserLoginDTO, UserResponseDTO } from "../models/User";
import { ApiError, ErrorTypes } from "../utils/errorHandler";
import { comparePasswords, createUserResponse } from "../utils/authUtils";

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
      const user = await this.userService.findByEmail(credentials.email);
      
      if (!user) throw ErrorTypes.UNAUTHORIZED("Invalid email or password");
      
      const isPasswordValid = await comparePasswords(
        credentials.password,
        user.password!
      );

      if (!isPasswordValid) throw ErrorTypes.UNAUTHORIZED("Invalid email or password");
      
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

}
