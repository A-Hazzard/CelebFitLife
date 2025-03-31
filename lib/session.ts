import jwt, { Secret, SignOptions } from "jsonwebtoken";
import { z } from "zod";

// Session schema
const sessionDataSchema = z.object({
  email: z.string().email(),
  isStreamer: z.boolean().optional().default(false),
  isAdmin: z.boolean().optional().default(false),
});

export type SessionData = z.infer<typeof sessionDataSchema>;

/**
 * SessionManager handles creating, verifying, and managing user sessions
 * using JWT tokens for authentication
 */
export class SessionManager {
  private jwtSecret: Secret;
  private tokenExpiry: number;

  constructor() {
    // Cast as Secret type to satisfy TypeScript
    this.jwtSecret = process.env.JWT_SECRET || ("your-secret-key" as Secret);
    // Use seconds (7 days = 604800 seconds)
    this.tokenExpiry = 60 * 60 * 24 * 7; // Token expires in 7 days
  }

  /**
   * Creates a session token for a user
   * @param sessionData - User session data
   * @returns JWT token string
   */
  async createSession(sessionData: SessionData): Promise<string> {
    try {
      // Validate session data
      const validatedData = sessionDataSchema.parse(sessionData);

      // Define options with proper typing
      const options: SignOptions = {
        expiresIn: this.tokenExpiry,
      };

      // Generate and return a JWT token
      return jwt.sign(validatedData as object, this.jwtSecret, options);
    } catch (error) {
      console.error("Error creating session:", error);
      throw new Error("Failed to create session token");
    }
  }

  /**
   * Verifies a session token
   * @param token - JWT token to verify
   * @returns Session data if valid, null otherwise
   */
  verifySession(token: string): SessionData | null {
    try {
      // Verify the token
      const decoded = jwt.verify(token, this.jwtSecret) as object;

      // Validate the decoded data
      return sessionDataSchema.parse(decoded);
    } catch (error) {
      console.error("Error verifying session:", error);
      return null;
    }
  }

  /**
   * Gets session data from a request
   * @param req - Next.js API request
   * @returns Session data if valid token exists
   */
  getSessionFromRequest(req: Request): Promise<SessionData | null> {
    try {
      // Get token from cookies
      const cookieHeader = req.headers.get("cookie");
      if (!cookieHeader) return Promise.resolve(null);

      // Parse cookies
      const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split("=");
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);

      // Get token
      const token = cookies.token;
      if (!token) return Promise.resolve(null);

      // Verify token
      const session = this.verifySession(token);
      return Promise.resolve(session);
    } catch (error) {
      console.error("Error getting session from request:", error);
      return Promise.resolve(null);
    }
  }
}
