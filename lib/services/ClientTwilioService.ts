// Minimal client Twilio service for getting a viewer token
export class ClientTwilioService {
  private tokenCache: Record<string, string> = {};

  /**
   * Fetches a Twilio access token for a viewer
   * @param roomName The Twilio room name
   * @param identity The unique viewer identity
   * @returns Promise resolving to the JWT token string
   */
  async getToken(roomName: string, identity: string): Promise<string> {
    // Check cache first
    const cacheKey = `${roomName}:${identity}`;
    if (this.tokenCache[cacheKey]) {
      return this.tokenCache[cacheKey];
    }

    const res = await fetch("/api/twilio/viewer-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomName, identity }),
    });

    if (!res.ok) {
      throw new Error("Failed to fetch Twilio viewer token");
    }

    const data = await res.json();
    if (!data.token) throw new Error("No token returned from API");

    // Cache the token
    this.tokenCache[cacheKey] = data.token;

    return data.token;
  }

  /**
   * Clears the token cache to force getting new tokens
   */
  clearCache(): void {
    this.tokenCache = {};
  }
}
