import twilio from "twilio";
import { ApiError } from "../utils/errorHandler";

/**
 * Interface for token cache entry
 */
interface CacheEntry {
  token: string;
  expiresAt: number; // timestamp
}

/**
 * Type for token cache
 */
type TokenCache = {
  [key: string]: CacheEntry;
};

/**
 * Service for handling Twilio operations
 */
export class TwilioService {
  private accountSid: string;
  private apiKey: string;
  private apiSecret: string;
  private tokenCache: TokenCache = {};
  private cacheTtl: number;

  constructor(
    accountSid = process.env.TWILIO_ACCOUNT_SID,
    apiKey = process.env.TWILIO_API_KEY_SID,
    apiSecret = process.env.TWILIO_API_KEY_SECRET,
    cacheTtl = 5 * 60 * 1000 // 5 minutes in milliseconds
  ) {
    this.accountSid = accountSid || "";
    this.apiKey = apiKey || "";
    this.apiSecret = apiSecret || "";
    this.cacheTtl = cacheTtl;
    this.validateCredentials();
  }

  /**
   * Validate Twilio credentials
   */
  private validateCredentials(): void {
    if (!this.accountSid || !this.apiKey || !this.apiSecret) {
      throw new ApiError("Missing required Twilio credentials", 500);
    }

    // Validate SID format
    const sidPattern = /^[A-Z]{2}[a-f0-9]{32}$/i;
    if (!sidPattern.test(this.accountSid) || !sidPattern.test(this.apiKey)) {
      throw new ApiError("Invalid Twilio Account SID or API Key format", 500);
    }
  }

  /**
   * Generate a token for video access
   */
  async generateToken(
    roomName: string,
    identity: string,
    ttl = 14400
  ): Promise<string> {
    try {
      // Check if we have a valid cached token
      const cacheKey = `${roomName}:${identity}`;
      const now = Date.now();
      const cachedEntry = this.tokenCache[cacheKey];

      if (cachedEntry && cachedEntry.expiresAt > now) {
        console.log(`Using cached token for user: ${identity}`);
        return cachedEntry.token;
      }

      // Create an Access Token
      const token = new twilio.jwt.AccessToken(
        this.accountSid,
        this.apiKey,
        this.apiSecret,
        {
          identity: identity,
          ttl: ttl, // Token expires in 4 hours by default
        }
      );

      // Create a Video grant and add it to the token
      const videoGrant = new twilio.jwt.AccessToken.VideoGrant({
        room: roomName,
      });
      token.addGrant(videoGrant);

      // Generate the token
      const jwt = token.toJwt();

      // Cache the token
      this.tokenCache[cacheKey] = {
        token: jwt,
        expiresAt: now + this.cacheTtl,
      };

      console.log(`Generated token for user: ${identity}`);
      return jwt;
    } catch (error) {
      console.error("Error generating Twilio token:", error);
      throw new ApiError("Failed to generate Twilio access token", 500);
    }
  }

  /**
   * Clear the token cache
   */
  clearCache(): void {
    this.tokenCache = {};
  }
}
