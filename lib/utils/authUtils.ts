import bcrypt from "bcryptjs";
import jwt, { Secret } from "jsonwebtoken";
import { User, UserResponseDTO } from "../models/User";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

interface JwtPayload {
  id?: string;
  email: string;
  username: string;
  role: {
    admin: boolean;
    streamer: boolean;
    viewer: boolean;
  };
  isAdmin: boolean;
  iat?: number;
  exp?: number;
}

/**
 * Hashes a password using bcrypt
 * @param password Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Compares a password with a hashed password
 * @param password Plain text password
 * @param hashedPassword Hashed password
 * @returns Boolean indicating if passwords match
 */
export async function comparePasswords(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * Generates a JWT token for a user
 * @param user User object
 * @returns JWT token
 */
export function generateToken(user: User): string {
  const payload: JwtPayload = {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    isAdmin: user.isAdmin,
  };

  // Cast JWT_SECRET to Secret type
  const secretKey: Secret = JWT_SECRET as Secret;
  // Use a string literal for expiresIn
  return jwt.sign(payload, secretKey, { expiresIn: "7d" });
}

/**
 * Verifies a JWT token
 * @param token JWT token
 * @returns Decoded token payload or null if invalid
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    // Cast JWT_SECRET to Secret type
    const secretKey: Secret = JWT_SECRET as Secret;
    return jwt.verify(token, secretKey) as JwtPayload;
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}

/**
 * Creates a response DTO for a user with token
 * @param user User object
 * @param includeToken Whether to include a JWT token
 * @returns UserResponseDTO object
 */
export function createUserResponse(
  user: User,
  includeToken = false
): UserResponseDTO {
  const response: UserResponseDTO = {
    id: user.id!,
    email: user.email,
    username: user.username,
    createdAt: user.createdAt,
    age: user.age,
    city: user.city,
    country: user.country,
    phone: user.phone,
    role: user.role,
    isAdmin: user.isAdmin,
  };

  if (includeToken) response.token = generateToken(user);

  return response;
}
