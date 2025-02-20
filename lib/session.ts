import { SignJWT, jwtVerify, JWTVerifyResult } from "jose";

export interface SessionData {
  email: string;
  isStreamer: boolean;
  isAdmin: boolean;
}

export class SessionManager {
  private secret: Uint8Array;

  constructor() {
    const secretStr = process.env.JWT_SECRET;
    if (!secretStr) {
      throw new Error("JWT_SECRET is not set in environment variables");
    }
    // jose expects a Uint8Array for the secret
    this.secret = new TextEncoder().encode(secretStr);
  }

  async createSession(
    data: SessionData,
    expiresIn: string | number = "7d"
  ): Promise<string> {
    let expires: number;
    if (typeof expiresIn === "number") {
      expires = expiresIn;
    } else {
      // For simplicity, assume the format "Xd" for days (e.g. "7d" => 7*24*60*60 seconds)
      const days = parseInt(expiresIn, 10) || 7;
      expires = days * 24 * 60 * 60;
    }
    const token = await new SignJWT({ ...data } as unknown as Record<string, any>)
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setIssuedAt()
      .setExpirationTime(Math.floor(Date.now() / 1000) + expires)
      .sign(this.secret);
    return token;
  }

  async verifySession(token: string): Promise<SessionData> {
    const { payload } = await jwtVerify(token, this.secret);
    // Verify the payload has the required SessionData properties
    if (
      typeof payload.email !== "string" ||
      typeof payload.isStreamer !== "boolean" ||
      typeof payload.isAdmin !== "boolean"
    ) {
      throw new Error("Invalid session data");
    }
    return {
      email: payload.email,
      isStreamer: payload.isStreamer,
      isAdmin: payload.isAdmin
    };
  }
}
