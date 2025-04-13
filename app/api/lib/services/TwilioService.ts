import twilio from "twilio";
import { ValidationError } from "../errors/apiErrors";
import { CacheEntry } from "@/lib/types/streaming.types";

/**
 * Typed token cache to avoid using any
 */
type TokenCache = Record<string, CacheEntry>;

/**
 * Service for generating Twilio tokens
 */
export class TwilioService {
  private accountSid: string;
  private apiKey: string;
  private apiSecret: string;
  private tokenTTL: number = 3600; // Default: 1 hour in seconds
  private tokenCache: TokenCache = {};

  constructor() {
    // Load and validate environment variables
    this.accountSid = process.env.TWILIO_ACCOUNT_SID || "";
    this.apiKey = process.env.TWILIO_API_KEY_SID || "";
    this.apiSecret = process.env.TWILIO_API_KEY_SECRET || "";

    // Allow overriding default token TTL via environment
    const configTTL = process.env.TWILIO_TOKEN_TTL;
    if (configTTL) {
      const parsedTTL = parseInt(configTTL, 10);
      if (!isNaN(parsedTTL) && parsedTTL > 0) {
        this.tokenTTL = parsedTTL;
      }
    }

    // Validate required configuration
    if (!this.accountSid || !this.apiKey || !this.apiSecret) {
      const missing = [];
      if (!this.accountSid) missing.push("TWILIO_ACCOUNT_SID");
      if (!this.apiKey) missing.push("TWILIO_API_KEY_SID");
      if (!this.apiSecret) missing.push("TWILIO_API_KEY_SECRET");

      throw new ValidationError(
        `Missing required Twilio configuration: ${missing.join(", ")}`
      );
    }
  }

  /**
   * Generate a token for accessing Twilio Video
   * @param roomName The Twilio room name (typically stream ID)
   * @param identity User identity for the token
   * @returns Promise resolving to the Twilio JWT token
   */
  async generateToken(roomName: string, identity: string): Promise<string> {
    // Validate input
    if (!roomName || !identity) {
      throw new ValidationError("Room name and identity are required");
    }

    // Create a cache key
    const cacheKey = `${roomName}:${identity}`;

    // Check cache first
    const cachedToken = this.tokenCache[cacheKey];
    if (cachedToken && cachedToken.expiresAt > Date.now()) {
      console.log(`[TwilioService] Using cached token for ${cacheKey}`);
      return cachedToken.token;
    }

    // Create new token
    try {
      // Create a Video grant for this token
      const videoGrant = new twilio.jwt.AccessToken.VideoGrant({
        room: roomName,
      });

      // Create an access token with our API key
      const token = new twilio.jwt.AccessToken(
        this.accountSid,
        this.apiKey,
        this.apiSecret,
        { identity, ttl: this.tokenTTL }
      );

      // Add the video grant to the token
      token.addGrant(videoGrant);

      // Generate token
      const tokenString = token.toJwt();

      // Cache the token with expiration time
      const expiresAt = Date.now() + this.tokenTTL * 1000;
      this.tokenCache[cacheKey] = {
        token: tokenString,
        expiresAt,
      };

      return tokenString;
    } catch (error) {
      console.error("[TwilioService] Error generating token:", error);
      throw new Error("Failed to generate Twilio token");
    }
  }

  /**
   * Get the token expiration time in seconds
   * @returns Token expiration time in seconds
   */
  getTokenExpiration(): number {
    return this.tokenTTL;
  }

  /**
   * Clear the token cache
   */
  clearCache(): void {
    this.tokenCache = {};
  }

  /**
   * Get debug information about the Twilio service
   * @returns Object with debug information
   */
  getDebugInfo() {
    return {
      accountSid: this.accountSid
        ? `${this.accountSid.slice(0, 5)}...`
        : "not-set",
      apiKeySet: !!this.apiKey,
      apiSecretSet: !!this.apiSecret,
      tokenTTL: this.tokenTTL,
      cacheSize: Object.keys(this.tokenCache).length,
      sessionId: `twilio-${Date.now().toString(36)}-${Math.random()
        .toString(36)
        .substring(2, 7)}`,
    };
  }
}
