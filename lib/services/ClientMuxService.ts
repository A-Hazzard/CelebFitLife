/**
 * CLIENT MUX SERVICE
 *
 * This service handles client-side interactions with Mux live streaming API.
 * It provides methods for creating streams, managing stream state, and handling errors.
 */

import {
  MuxLiveStream,
  CreateStreamRequestBody,
  CreateStreamResponseSuccess,
  CreateStreamResponseError,
} from "@/lib/types/streaming.types";
import { handleStreamingError } from "@/lib/utils/errorHandler";
import { muxConfig } from "@/lib/config/mux.config";

export class ClientMuxService {
  private cache: Map<string, { data: unknown; expiry: number }> = new Map();
  private readonly CACHE_TTL = 300000; // 5 minutes

  /**
   * Create a new live stream
   */
  async createLiveStream(
    streamData: CreateStreamRequestBody
  ): Promise<MuxLiveStream> {
    try {
      // Add Mux-specific options to the request
      const muxStreamData = {
        ...streamData,
        playbackPolicy: "public",
        recordingEnabled: true,
      };

      const response = await fetch(`${muxConfig.serverUrl}/api/streams`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(muxStreamData),
      });

      const result: CreateStreamResponseSuccess | CreateStreamResponseError =
        await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to create live stream");
      }

      return result.liveStream;
    } catch (error) {
      console.error("[ClientMuxService] Error creating live stream:", error);
      throw handleStreamingError(error);
    }
  }

  /**
   * Get live stream by ID
   */
  async getLiveStream(streamId: string): Promise<MuxLiveStream | null> {
    try {
      // Check cache first
      const cacheKey = `stream_${streamId}`;
      const cached = this.getFromCache<MuxLiveStream>(cacheKey);
      if (cached) {
        return cached;
      }

      const response = await fetch(`${muxConfig.serverUrl}/api/streams?streamId=${streamId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (!result.success) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(result.error || "Failed to get live stream");
      }

      // Cache the result
      this.setCache(cacheKey, result.liveStream);
      return result.liveStream;
    } catch (error) {
      console.error("[ClientMuxService] Error getting live stream:", error);
      throw handleStreamingError(error);
    }
  }

  /**
   * Get available assets/recordings
   */
  async getAssets(): Promise<unknown[]> {
    try {
      // Check cache first
      const cacheKey = "assets";
      const cached = this.getFromCache<unknown[]>(cacheKey);
      if (cached) {
        return cached;
      }

      const response = await fetch(`${muxConfig.serverUrl}/api/streams`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to get assets");
      }

      // Cache the result
      this.setCache(cacheKey, result.assets);
      return result.assets;
    } catch (error) {
      console.error("[ClientMuxService] Error getting assets:", error);
      throw handleStreamingError(error);
    }
  }

  /**
   * Enable a live stream
   */
  async enableLiveStream(streamId: string): Promise<boolean> {
    try {
      const response = await fetch(`${muxConfig.serverUrl}/api/streams/${streamId}/enable`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();
      return result.success || false;
    } catch (error) {
      console.error("[ClientMuxService] Error enabling live stream:", error);
      throw handleStreamingError(error);
    }
  }

  /**
   * Disable a live stream
   */
  async disableLiveStream(streamId: string): Promise<boolean> {
    try {
      const response = await fetch(`${muxConfig.serverUrl}/api/streams/${streamId}/disable`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();
      return result.success || false;
    } catch (error) {
      console.error("[ClientMuxService] Error disabling live stream:", error);
      throw handleStreamingError(error);
    }
  }

  /**
   * Delete a live stream
   */
  async deleteLiveStream(streamId: string): Promise<boolean> {
    try {
      const response = await fetch(`${muxConfig.serverUrl}/api/streams/${streamId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();
      return result.success || false;
    } catch (error) {
      console.error("[ClientMuxService] Error deleting live stream:", error);
      throw handleStreamingError(error);
    }
  }

  /**
   * Check if a playback ID is valid and live
   */
  async checkPlaybackStatus(playbackId: string): Promise<{
    isValid: boolean;
    isLive: boolean;
    error?: string;
  }> {
    try {
      // TODO: Implement actual playback status check
      // This would require adding a new endpoint to the Mux server:
      // GET /api/streams/playback-status/:playbackId
      console.log(`Checking playback status for: ${playbackId}`);
      
      // For now, return mock data
      return {
        isValid: true,
        isLive: false,
        error: undefined,
      };
    } catch (error) {
      console.error(
        "[ClientMuxService] Error checking playback status:",
        error
      );
      return {
        isValid: false,
        isLive: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Cache management
   */
  private getFromCache<T = unknown>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() > cached.expiry) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  private setCache(key: string, data: unknown): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + this.CACHE_TTL,
    });
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get debug information
   */
  getDebugInfo() {
    return {
      cacheSize: this.cache.size,
      cacheTTL: this.CACHE_TTL,
      sessionId: `mux-client-${Date.now().toString(36)}-${Math.random()
        .toString(36)
        .substring(2, 7)}`,
    };
  }
}
