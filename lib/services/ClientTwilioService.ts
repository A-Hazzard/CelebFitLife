// Client-side only TwilioService that uses the API
export class ClientTwilioService {
  private tokenCache: Record<string, { token: string; expiresAt: number }> = {};
  private cacheTtl: number;

  constructor(cacheTtl = 5 * 60 * 1000) {
    // 5 minutes cache by default
    this.cacheTtl = cacheTtl;
  }

  /**
   * Get a token for a room by calling the API
   */
  async getToken(roomName: string, userName: string): Promise<string> {
    // Check cache first
    const cacheKey = `${roomName}:${userName}`;
    const now = Date.now();
    const cachedEntry = this.tokenCache[cacheKey];

    if (cachedEntry && cachedEntry.expiresAt > now) {
      console.log(`Using cached client token for user: ${userName}`);
      return cachedEntry.token;
    }

    try {
      // Call the API to get a token
      const response = await fetch("/api/twilio/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomName, userName }),
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
