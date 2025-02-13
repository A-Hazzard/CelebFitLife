// lib/session.ts
import jwt, {SignOptions} from "jsonwebtoken";

export interface SessionData {
  email: string;
  isStreamer: boolean;
  isAdmin: boolean;
}

export class SessionManager {
  private secret: jwt.Secret;

  constructor() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_SECRET is not set in environment variables");
    }
    this.secret = secret;
  }

  /**
   * Creates a JWT token for the given session data.
   * @param data - The session data to encode.
   * @param expiresIn - Token expiry (default: "7d").
   * @returns A signed JWT token string.
   */
  createSession(data: SessionData, expiresIn: string | number = "7d"): string {
    const options: SignOptions = { 
      expiresIn: typeof expiresIn === 'string' ? expiresIn as jwt.SignOptions["expiresIn"] : expiresIn 
    };
    return jwt.sign(data, this.secret, options);
  }

  /**
   * Verifies the given JWT token.
   * @param token - The JWT token to verify.
   * @returns The decoded session data.
   */
  verifySession(token: string): SessionData {
    return jwt.verify(token, this.secret) as SessionData;
  }
}
