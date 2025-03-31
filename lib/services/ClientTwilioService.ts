/**
 * CLIENT-SIDE TWILIO SERVICE
 * This service handles Twilio video functionality in the client by making API calls to the backend.
 * It manages tokens, connections, and caching for Twilio video sessions.
 */

import {
  LocalVideoTrack,
  LocalAudioTrack,
  Room,
  LocalParticipant,
} from "twilio-video";
import {
  createVideoTrack,
  createAudioTrack,
  connectToRoom,
  setupReconnectionHandlers,
} from "@/lib/utils/twilio";
import { createLogger } from "@/lib/utils/logger";

// Cache for storing tokens and room connections
interface TokenCache {
  [key: string]: {
    token: string;
    expiresAt: number; // Timestamp in milliseconds
  };
}

const TOKEN_EXPIRY_BUFFER_MS = 5 * 60 * 1000; // 5 minutes buffer before token expiry

export class ClientTwilioService {
  private tokenCache: TokenCache = {};
  private logger = createLogger("ClientTwilioService");

  /**
   * Gets a Twilio token from the server
   */
  async getToken(streamId: string, userId: string): Promise<string> {
    const cacheKey = `${streamId}:${userId}`;
    const now = Date.now();

    // Check if we have a valid cached token
    if (
      this.tokenCache[cacheKey] &&
      this.tokenCache[cacheKey].expiresAt > now + TOKEN_EXPIRY_BUFFER_MS
    ) {
      this.logger.debug(`Using cached token for stream ${streamId}`);
      return this.tokenCache[cacheKey].token;
    }

    try {
      this.logger.info(`Fetching new token for stream ${streamId}`);
      const response = await fetch(`/api/twilio/token?streamId=${streamId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to get Twilio token");
      }

      const data = await response.json();

      // Cache the token with an expiry (default: 24h minus buffer)
      this.tokenCache[cacheKey] = {
        token: data.token,
        expiresAt: now + 24 * 60 * 60 * 1000 - TOKEN_EXPIRY_BUFFER_MS,
      };

      return data.token;
    } catch (error) {
      this.logger.error(`Error getting Twilio token:`, error as Error);
      throw error;
    }
  }

  /**
   * Creates local tracks for camera and microphone
   */
  async createLocalTracks(
    cameraDeviceId?: string,
    micDeviceId?: string
  ): Promise<{
    videoTrack: LocalVideoTrack | null;
    audioTrack: LocalAudioTrack | null;
    errors: { video?: Error; audio?: Error };
  }> {
    const errors: { video?: Error; audio?: Error } = {};
    let videoTrack: LocalVideoTrack | null = null;
    let audioTrack: LocalAudioTrack | null = null;

    // Create video track
    try {
      videoTrack = await createVideoTrack(cameraDeviceId);
      this.logger.debug("Created local video track");
    } catch (error) {
      this.logger.error("Failed to create video track:", error as Error);
      errors.video = error instanceof Error ? error : new Error(String(error));
    }

    // Create audio track
    try {
      audioTrack = await createAudioTrack(micDeviceId);
      this.logger.debug("Created local audio track");
    } catch (error) {
      this.logger.error("Failed to create audio track:", error as Error);
      errors.audio = error instanceof Error ? error : new Error(String(error));
    }

    return { videoTrack, audioTrack, errors };
  }

  /**
   * Connects to a Twilio room
   */
  async connectToRoom(
    streamId: string,
    userId: string,
    tracks: { videoTrack?: LocalVideoTrack; audioTrack?: LocalAudioTrack },
    callbacks?: {
      onReconnecting?: () => void;
      onReconnected?: () => void;
      onFailed?: (error: Error) => void;
    }
  ): Promise<Room> {
    try {
      const token = await this.getToken(streamId, userId);

      this.logger.info(`Connecting to room for stream ${streamId}`);
      const room = await connectToRoom(token, {
        roomName: streamId,
        videoTrack: tracks.videoTrack,
        audioTrack: tracks.audioTrack,
      });

      // Set up reconnection handlers
      if (callbacks) {
        setupReconnectionHandlers(
          room,
          callbacks.onReconnecting,
          callbacks.onReconnected,
          callbacks.onFailed
        );
      }

      return room;
    } catch (error) {
      this.logger.error(`Error connecting to room:`, error as Error);
      throw error;
    }
  }

  /**
   * Updates a participant's track enabled status
   */
  updateTrackEnabled(
    localParticipant: LocalParticipant | null,
    trackKind: "audio" | "video",
    enabled: boolean
  ): boolean {
    if (!localParticipant) {
      this.logger.warn(
        `Cannot update ${trackKind} track: No local participant`
      );
      return false;
    }

    try {
      const publications =
        trackKind === "audio"
          ? localParticipant.audioTracks
          : localParticipant.videoTracks;

      publications.forEach((publication) => {
        if (publication.track) {
          this.logger.debug(`Setting ${trackKind} track enabled:`, enabled);
          publication.track.enable(enabled);
        }
      });

      return true;
    } catch (error) {
      this.logger.error(
        `Error updating ${trackKind} track enabled status:`,
        error as Error
      );
      return false;
    }
  }

  /**
   * Disconnects from a room and cleans up resources
   */
  disconnectFromRoom(room: Room | null): void {
    if (!room) {
      this.logger.warn("No room to disconnect from");
      return;
    }

    try {
      this.logger.info(`Disconnecting from room ${room.name}`);
      room.disconnect();
      this.logger.debug("Room disconnected successfully");
    } catch (error) {
      this.logger.error("Error disconnecting from room:", error as Error);
    }
  }

  /**
   * Clears token cache
   */
  clearCache(): void {
    this.tokenCache = {};
    this.logger.debug("Token cache cleared");
  }

  /**
   * Gets debug information for Twilio connections
   * Used for logging and troubleshooting
   */
  getDebugInfo(): { sessionId: string } {
    // Generate a session ID based on timestamp for debugging
    const sessionId = `twilio-debug-${Date.now()}`;
    return { sessionId };
  }
}
