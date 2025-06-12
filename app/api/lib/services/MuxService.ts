import Mux from "@mux/mux-node";
import { ValidationError } from "../errors/apiErrors";

export interface MuxLiveStream {
  id: string;
  playbackId: string;
  streamKey: string;
  status: "idle" | "active" | "disabled";
  createdAt: string;
}

export interface MuxAsset {
  id: string;
  playbackId: string;
  status: string;
  duration?: number;
}

/**
 * Service for managing Mux Video live streams and assets
 */
export class MuxService {
  private mux: Mux | null = null;

  constructor() {
    // Lazy initialization to avoid build-time errors
  }

  /**
   * Get or initialize the Mux client
   */
  private getMuxClient(): Mux {
    if (!this.mux) {
      // Load and validate environment variables
      const accessTokenId = process.env.MUX_ACCESS_TOKEN_ID;
      const secretKey = process.env.MUX_SECRET_KEY;

      if (!accessTokenId || !secretKey) {
        const missing = [];
        if (!accessTokenId) missing.push("MUX_ACCESS_TOKEN_ID");
        if (!secretKey) missing.push("MUX_SECRET_KEY");

        throw new ValidationError(
          `Missing required Mux configuration: ${missing.join(", ")}`
        );
      }

      this.mux = new Mux({
        tokenId: accessTokenId,
        tokenSecret: secretKey,
      });
    }

    return this.mux;
  }

  /**
   * Create a new live stream
   */
  async createLiveStream(
    options: {
      playbackPolicy?: "public" | "signed";
      newAssetSettings?: {
        playbackPolicy?: "public" | "signed";
      };
    } = {}
  ): Promise<MuxLiveStream> {
    try {
      const mux = this.getMuxClient();
      const liveStream = await mux.video.liveStreams.create({
        playback_policy: [options.playbackPolicy || "public"],
        new_asset_settings: {
          playback_policy: [
            options.newAssetSettings?.playbackPolicy || "public",
          ],
        },
      });

      return {
        id: liveStream.id,
        playbackId: liveStream.playback_ids?.[0]?.id || "",
        streamKey: liveStream.stream_key || "",
        status: liveStream.status as "idle" | "active" | "disabled",
        createdAt: liveStream.created_at || "",
      };
    } catch (error) {
      console.error("[MuxService] Error creating live stream:", error);
      throw new Error("Failed to create live stream");
    }
  }

  /**
   * Get live stream by ID
   */
  async getLiveStream(streamId: string): Promise<MuxLiveStream | null> {
    try {
      const mux = this.getMuxClient();
      const liveStream = await mux.video.liveStreams.retrieve(streamId);

      return {
        id: liveStream.id,
        playbackId: liveStream.playback_ids?.[0]?.id || "",
        streamKey: liveStream.stream_key || "",
        status: liveStream.status as "idle" | "active" | "disabled",
        createdAt: liveStream.created_at || "",
      };
    } catch (error: any) {
      // Only log if not a 404
      if (typeof error === "object" && error !== null && error.status === 404) {
        // Suppress noisy log for not found
        return null;
      }
      console.error("[MuxService] Error retrieving live stream:", error);
      return null;
    }
  }

  /**
   * Delete a live stream
   */
  async deleteLiveStream(streamId: string): Promise<boolean> {
    try {
      const mux = this.getMuxClient();
      await mux.video.liveStreams.delete(streamId);
      return true;
    } catch (error) {
      console.error("[MuxService] Error deleting live stream:", error);
      return false;
    }
  }

  /**
   * Enable a live stream
   */
  async enableLiveStream(streamId: string): Promise<boolean> {
    try {
      const mux = this.getMuxClient();
      await mux.video.liveStreams.enable(streamId);
      return true;
    } catch (error) {
      console.error("[MuxService] Error enabling live stream:", error);
      return false;
    }
  }

  /**
   * Disable a live stream
   */
  async disableLiveStream(streamId: string): Promise<boolean> {
    try {
      const mux = this.getMuxClient();
      await mux.video.liveStreams.disable(streamId);
      return true;
    } catch (error) {
      console.error("[MuxService] Error disabling live stream:", error);
      return false;
    }
  }

  /**
   * Create a signed URL for viewing a private playback ID
   * Note: This is a simplified implementation. For production, implement proper JWT signing.
   */
  async createViewingUrl(
    playbackId: string,
    options: {
      type?: "video" | "thumbnail" | "gif";
      expiresAt?: number;
    } = {}
  ): Promise<string> {
    try {
      // For now, return the public URL. In production, implement JWT signing for private content.
      const baseUrl = `https://stream.mux.com/${playbackId}`;
      const extension = options.type === "thumbnail" ? ".jpg" : ".m3u8";
      return `${baseUrl}${extension}`;
    } catch (error) {
      console.error("[MuxService] Error creating signed URL:", error);
      throw new Error("Failed to create viewing URL");
    }
  }

  /**
   * Get assets (recordings) for a live stream
   */
  async getAssets(limit: number = 25): Promise<MuxAsset[]> {
    try {
      const mux = this.getMuxClient();
      const response = await mux.video.assets.list({ limit });

      return response.data.map((asset) => ({
        id: asset.id,
        playbackId: asset.playback_ids?.[0]?.id || "",
        status: asset.status || "",
        duration: asset.duration,
      }));
    } catch (error) {
      console.error("[MuxService] Error retrieving assets:", error);
      return [];
    }
  }

  /**
   * Get debug information about the Mux service
   */
  getDebugInfo() {
    const accessTokenId = process.env.MUX_ACCESS_TOKEN_ID;
    return {
      accessTokenIdSet: !!accessTokenId,
      accessTokenIdPreview: accessTokenId
        ? `${accessTokenId.slice(0, 8)}...`
        : "not-set",
      secretKeySet: !!process.env.MUX_SECRET_KEY,
      sessionId: `mux-${Date.now().toString(36)}-${Math.random()
        .toString(36)
        .substring(2, 7)}`,
    };
  }
}
