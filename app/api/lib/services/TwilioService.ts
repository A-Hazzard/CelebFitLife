import twilio from "twilio";
import { ValidationError, InvalidDataError } from "../errors/apiErrors"; // Use API specific errors

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
 * Service for handling Twilio operations (API-specific)
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
   * Validate Twilio credentials - Throws standard Error for config issues
   */
  private validateCredentials(): void {
    if (!this.accountSid) {
      throw new Error("Missing TWILIO_ACCOUNT_SID environment variable");
    }
    if (!this.apiKey) {
      throw new Error("Missing TWILIO_API_KEY_SID environment variable");
    }
    if (!this.apiSecret) {
      throw new Error("Missing TWILIO_API_KEY_SECRET environment variable");
    }

    const accountSidPattern = /^AC[a-f0-9]{32}$/i;
    if (!accountSidPattern.test(this.accountSid)) {
      throw new Error(
        "Invalid Twilio Account SID format. Should start with 'AC' followed by 32 hex characters."
      );
    }
    const apiKeySidPattern = /^SK[a-f0-9]{32}$/i;
    if (!apiKeySidPattern.test(this.apiKey)) {
      throw new Error(
        "Invalid Twilio API Key SID format. Should start with 'SK' followed by 32 hex characters."
      );
    }
  }

  /**
   * Generate a token for video access
   */
  async generateToken(
    roomName: string,
    identity: string,
    ttl = 14400 // Default 4 hours
  ): Promise<string> {
    // Validate inputs - Throw ValidationError for bad client input
    if (!roomName) {
      throw new ValidationError("Room name is required");
    }
    if (!identity) {
      throw new ValidationError("User identity is required");
    }

    // Sanitize inputs
    const sanitizedRoomName = roomName.replace(/[^a-zA-Z0-9_-]/g, "");
    const sanitizedIdentity = identity.replace(/[^a-zA-Z0-9_@.-]/g, "");
    // Log if changes were made (optional)
    // if (sanitizedRoomName !== roomName) { console.warn(...) }
    // if (sanitizedIdentity !== identity) { console.warn(...) }

    // Check cache
    const cacheKey = `${sanitizedRoomName}:${sanitizedIdentity}`;
    const now = Date.now();
    const cachedEntry = this.tokenCache[cacheKey];
    if (cachedEntry && cachedEntry.expiresAt > now) {
      console.log(`Using cached Twilio token for ${sanitizedIdentity}`);
      return cachedEntry.token;
    }

    console.log(`Creating new Twilio token for ${sanitizedIdentity}`);
    try {
      const token = new twilio.jwt.AccessToken(
        this.accountSid,
        this.apiKey,
        this.apiSecret,
        {
          identity: sanitizedIdentity,
          ttl: ttl,
        }
      );

      const videoGrant = new twilio.jwt.AccessToken.VideoGrant({
        room: sanitizedRoomName,
      });
      token.addGrant(videoGrant);
      const jwt = token.toJwt();

      // Cache the token
      this.tokenCache[cacheKey] = {
        token: jwt,
        expiresAt: now + this.cacheTtl,
      };

      console.log(
        `Successfully generated Twilio token for ${sanitizedIdentity}`
      );
      return jwt;
    } catch (twilioError) {
      const message =
        twilioError instanceof Error
          ? twilioError.message
          : "Unknown Twilio SDK error";
      console.error("Twilio token generation failed:", message);
      // Throw standard Error for internal/SDK issues
      throw new Error(`Twilio token generation failed: ${message}`);
    }
    // Note: Removed outer try-catch as the inner one handles Twilio errors
    // and input validation happens before the try block.
  }

  /**
   * Clear the token cache
   */
  clearCache(): void {
    this.tokenCache = {};
  }
}
