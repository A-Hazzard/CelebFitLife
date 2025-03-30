// Client-side only TwilioService that uses the API
export class ClientTwilioService {
  private tokenCache: Record<string, { token: string; expiresAt: number }> = {};
  private cacheTtl: number;
  private sessionId: string;
  private isConnecting: boolean = false;
  private connectionAttempts: Record<string, number> = {};
  private maxConnectionAttempts: number = 3;

  constructor(cacheTtl = 5 * 60 * 1000) {
    // 5 minutes cache by default
    this.cacheTtl = cacheTtl;
    // Generate a unique session ID to prevent duplicate identity errors
    this.sessionId = this.generateSessionId();
    console.log(
      `ClientTwilioService initialized with session ID: ${this.sessionId}`
    );
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
    if (this.isConnecting) {
      console.warn(
        "[ClientTwilioService] Token request already in progress, please wait..."
      );
      throw new Error("Token request already in progress, please wait...");
    }

    try {
      this.isConnecting = true;

      // Track connection attempts for this room
      const connectionKey = `${roomName}:${userName}`;
      this.connectionAttempts[connectionKey] =
        (this.connectionAttempts[connectionKey] || 0) + 1;
      const currentAttempt = this.connectionAttempts[connectionKey];

      if (currentAttempt > this.maxConnectionAttempts) {
        console.error(
          `[ClientTwilioService] Too many connection attempts (${currentAttempt}) for room: ${roomName}`
        );
        throw new Error(
          `Too many connection attempts. Please try again later or refresh the page.`
        );
      }

      console.log(
        `[ClientTwilioService] Connection attempt ${currentAttempt} of ${this.maxConnectionAttempts} for room: ${roomName}`
      );

      if (!roomName) {
        console.error("[ClientTwilioService] Room name is required");
        throw new Error("Room name is required for Twilio token");
      }

      if (!userName) {
        console.error("[ClientTwilioService] User name is required");
        throw new Error("User name is required for Twilio token");
      }

      // Sanitize inputs to avoid common issues
      const sanitizedRoomName = roomName.trim();
      const sanitizedUserName = userName.trim();

      // Log if sanitization changed the values
      if (sanitizedRoomName !== roomName) {
        console.warn(
          `[ClientTwilioService] Room name was trimmed from "${roomName}" to "${sanitizedRoomName}"`
        );
      }

      if (sanitizedUserName !== userName) {
        console.warn(
          `[ClientTwilioService] User name was trimmed from "${userName}" to "${sanitizedUserName}"`
        );
      }

      // Create a unique identity using userName and the session ID
      const uniqueIdentity = `${sanitizedUserName}_${this.sessionId}`;

      // Check cache first
      const cacheKey = `${sanitizedRoomName}:${uniqueIdentity}`;
      const now = Date.now();
      const cachedEntry = this.tokenCache[cacheKey];

      if (cachedEntry && cachedEntry.expiresAt > now) {
        console.log(
          `[ClientTwilioService] Using cached client token for room: ${sanitizedRoomName}, user: ${uniqueIdentity}`
        );
        return cachedEntry.token;
      }

      console.log(
        `[ClientTwilioService] Requesting new token for room: ${sanitizedRoomName}, user: ${uniqueIdentity}`
      );

      const requestStartTime = Date.now();
      try {
        // Add a timeout to the fetch request to handle slow international connections
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

        // Call the API to get a token
        const response = await fetch("/api/twilio/connect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomName: sanitizedRoomName,
            userName: uniqueIdentity,
          }),
          signal: controller.signal,
        }).finally(() => {
          clearTimeout(timeoutId);
        });

        const requestTime = Date.now() - requestStartTime;
        console.log(
          `[ClientTwilioService] API request completed in ${requestTime}ms`
        );

        if (requestTime > 5000) {
          console.warn(
            `[ClientTwilioService] Slow API response (${requestTime}ms). This may indicate network latency.`
          );
        }

        if (!response.ok) {
          const errorText = await response
            .text()
            .catch(() => response.statusText);

          // Try to parse the error as JSON if possible
          let errorDetails = "Unknown error";
          try {
            const errorJson = JSON.parse(errorText);
            errorDetails = errorJson.error || errorJson.details || errorText;
          } catch {
            errorDetails = errorText;
          }

          console.error(
            `[ClientTwilioService] Failed to get token: ${response.status} ${response.statusText}`,
            errorDetails
          );

          if (response.status === 0 || response.status >= 500) {
            throw new Error(
              `Server error or network issue. This may be due to international connection latency. Please try again.`
            );
          } else if (response.status === 401 || response.status === 403) {
            throw new Error(
              `Authentication failed: ${errorDetails}. Check if your Twilio credentials are correct.`
            );
          } else {
            throw new Error(
              `Failed to get Twilio token: ${errorDetails} (${response.status})`
            );
          }
        }

        const data = await response.json();

        if (!data.token) {
          console.error(
            "[ClientTwilioService] No token received from API",
            data
          );

          if (data.error) {
            throw new Error(`Token request failed: ${data.error}`);
          } else {
            throw new Error("No token received from API");
          }
        }

        console.log(
          `[ClientTwilioService] Successfully received token for room: ${sanitizedRoomName}`
        );

        // Reset connection attempts on success
        this.connectionAttempts[connectionKey] = 0;

        // Cache the token
        this.tokenCache[cacheKey] = {
          token: data.token,
          expiresAt: now + this.cacheTtl,
        };

        return data.token;
      } catch (error) {
        console.error(
          "[ClientTwilioService] Error getting Twilio token:",
          error
        );

        // Handle specific error types
        if (
          error instanceof TypeError &&
          error.message.includes("NetworkError")
        ) {
          throw new Error(
            "Network connection error. Please check your internet connection."
          );
        } else if (error instanceof Error && error.name === "AbortError") {
          throw new Error(
            "Request timed out. This may be due to slow network conditions or server issues."
          );
        }

        // Rethrow with a clear message
        throw error instanceof Error
          ? error
          : new Error(`Failed to get Twilio token: ${error}`);
      }
    } finally {
      this.isConnecting = false;
    }
  }

  /**
   * Clear the token cache
   */
  clearCache(): void {
    this.tokenCache = {};
    this.connectionAttempts = {};
    console.log("[ClientTwilioService] Client Twilio token cache cleared");
  }

  /**
   * Get connection status (for debugging)
   */
  getDebugInfo(): {
    sessionId: string;
    cacheSize: number;
    connectionAttempts: Record<string, number>;
  } {
    return {
      sessionId: this.sessionId,
      cacheSize: Object.keys(this.tokenCache).length,
      connectionAttempts: { ...this.connectionAttempts },
    };
  }
}
