// Client-side only TwilioService that uses the API
export class ClientTwilioService {
  private tokenCache: Record<string, { token: string; expiresAt: number }> = {};
  private cacheTtl: number;
  private sessionId: string;

  constructor(cacheTtl = 5 * 60 * 1000) {
    // 5 minutes cache by default
    this.cacheTtl = cacheTtl;
    // Generate a unique session ID to prevent duplicate identity errors
    this.sessionId = this.generateSessionId();
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
  }

  /**
   * Get a token for a room by calling the API
   */
  async getToken(roomName: string, userName: string): Promise<string> {
    // Create a unique identity using userName and the session ID
    const uniqueIdentity = `${userName}_${this.sessionId}`;

    // Check cache first
    const cacheKey = `${roomName}:${uniqueIdentity}`;
    const now = Date.now();
    const cachedEntry = this.tokenCache[cacheKey];

    if (cachedEntry && cachedEntry.expiresAt > now) {
      console.log(`Using cached client token for user: ${uniqueIdentity}`);
      return cachedEntry.token;
    }

    try {
      // Call the API to get a token
      const response = await fetch("/api/twilio/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomName, userName: uniqueIdentity }),
      });

      if (!response.ok) {
        throw new Error(`Failed to get token: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.token) {
        throw new Error("No token received from API");
      }

      // Cache the token
      this.tokenCache[cacheKey] = {
        token: data.token,
        expiresAt: now + this.cacheTtl,
      };

      return data.token;
    } catch (error) {
      console.error("Error getting Twilio token:", error);
      throw error;
    }
  }

  /**
   * Clear the token cache
   */
  clearCache(): void {
    this.tokenCache = {};
  }
}
