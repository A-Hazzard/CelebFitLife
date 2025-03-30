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
    if (!this.accountSid) {
      throw new ApiError(
        "Missing TWILIO_ACCOUNT_SID environment variable",
        500
      );
    }

    if (!this.apiKey) {
      throw new ApiError(
        "Missing TWILIO_API_KEY_SID environment variable",
        500
      );
    }

    if (!this.apiSecret) {
      throw new ApiError(
        "Missing TWILIO_API_KEY_SECRET environment variable",
        500
      );
    }

    // Validate SID format (Twilio SIDs typically start with specific prefixes)
    const accountSidPattern = /^AC[a-f0-9]{32}$/i;
    if (!accountSidPattern.test(this.accountSid)) {
      throw new ApiError(
        "Invalid Twilio Account SID format. Should start with 'AC' followed by 32 hex characters.",
        500
      );
    }

    // API Key SIDs typically start with SK
    const apiKeySidPattern = /^SK[a-f0-9]{32}$/i;
    if (!apiKeySidPattern.test(this.apiKey)) {
      throw new ApiError(
        "Invalid Twilio API Key SID format. Should start with 'SK' followed by 32 hex characters.",
        500
      );
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
      // Validate inputs
      if (!roomName) {
        throw new ApiError("Room name is required", 400);
      }

      if (!identity) {
        throw new ApiError("User identity is required", 400);
      }

      // Sanitize inputs to avoid common issues
      // Remove special characters that could cause issues
      const sanitizedRoomName = roomName.replace(/[^a-zA-Z0-9_-]/g, "");
      const sanitizedIdentity = identity.replace(/[^a-zA-Z0-9_@.-]/g, "");

      if (sanitizedRoomName !== roomName) {
        console.warn(
          `Room name was sanitized from "${roomName}" to "${sanitizedRoomName}"`
        );
      }

      if (sanitizedIdentity !== identity) {
        console.warn(
          `Identity was sanitized from "${identity}" to "${sanitizedIdentity}"`
        );
      }

      // Check if we have a valid cached token
      const cacheKey = `${sanitizedRoomName}:${sanitizedIdentity}`;
      const now = Date.now();
      const cachedEntry = this.tokenCache[cacheKey];

      if (cachedEntry && cachedEntry.expiresAt > now) {
        console.log(
          `Using cached token for user: ${sanitizedIdentity} in room: ${sanitizedRoomName}`
        );
        return cachedEntry.token;
      }

      // Create an Access Token
      console.log(
        `Creating new Twilio token for user: ${sanitizedIdentity} in room: ${sanitizedRoomName}`
      );
      try {
        const token = new twilio.jwt.AccessToken(
          this.accountSid,
          this.apiKey,
          this.apiSecret,
          {
            identity: sanitizedIdentity,
            ttl: ttl, // Token expires in 4 hours by default
          }
        );

        // Create a Video grant and add it to the token
        const videoGrant = new twilio.jwt.AccessToken.VideoGrant({
          room: sanitizedRoomName,
        });
        token.addGrant(videoGrant);

        // Generate the token
        const jwt = token.toJwt();

        // Cache the token
        this.tokenCache[cacheKey] = {
          token: jwt,
          expiresAt: now + this.cacheTtl,
        };

        console.log(
          `Successfully generated token for user: ${sanitizedIdentity} in room: ${sanitizedRoomName}`
        );
        return jwt;
      } catch (twilioError) {
        console.error("Twilio token generation failed:", twilioError);
        throw new ApiError(
          `Twilio token generation failed: ${
            twilioError instanceof Error ? twilioError.message : "Unknown error"
          }`,
          500
        );
      }
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      console.error("Error generating Twilio token:", error);
      throw new ApiError(
        `Failed to generate Twilio access token: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        500
      );
    }
  }

  /**
   * Clear the token cache
   */
  clearCache(): void {
    this.tokenCache = {};
  }
}
