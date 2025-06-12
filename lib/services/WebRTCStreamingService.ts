/**
 * WebRTC Streaming Service
 *
 * This service handles direct browser streaming by using MediaRecorder
 * to capture the stream and send it to our RTMP bridge endpoint.
 *
 * Since Mux doesn't support direct WebRTC ingest, we need to convert
 * the browser stream to RTMP format on the server side.
 */

export interface StreamingConnection {
  id: string;
  streamKey: string;
  mediaRecorder: MediaRecorder | null;
  isActive: boolean;
}

export class WebRTCStreamingService {
  private connections: Map<string, StreamingConnection> = new Map();

  /**
   * Start streaming from a MediaStream to Mux via RTMP bridge
   */
  async startStreaming(
    stream: MediaStream,
    streamKey: string
  ): Promise<string> {
    const connectionId = this.generateConnectionId();

    try {
      // Create MediaRecorder to capture the stream
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: this.getSupportedMimeType(),
        videoBitsPerSecond: 2500000, // 2.5 Mbps
        audioBitsPerSecond: 128000, // 128 kbps
      });

      const connection: StreamingConnection = {
        id: connectionId,
        streamKey,
        mediaRecorder,
        isActive: false,
      };

      // Handle data available from MediaRecorder
      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          await this.sendChunkToRTMPBridge(event.data, streamKey);
        }
      };

      mediaRecorder.onstart = () => {
        console.log(`[WebRTC] Started recording for stream: ${streamKey}`);
        connection.isActive = true;
      };

      mediaRecorder.onstop = () => {
        console.log(`[WebRTC] Stopped recording for stream: ${streamKey}`);
        connection.isActive = false;
        this.connections.delete(connectionId);
      };

      mediaRecorder.onerror = (event) => {
        console.error(`[WebRTC] MediaRecorder error:`, event);
        connection.isActive = false;
        this.connections.delete(connectionId);
      };

      // Store connection
      this.connections.set(connectionId, connection);

      // Start recording in chunks of 1 second
      mediaRecorder.start(1000);

      return connectionId;
    } catch (error) {
      console.error("[WebRTC] Error starting stream:", error);
      throw new Error("Failed to start WebRTC streaming");
    }
  }

  /**
   * Stop streaming for a connection
   */
  async stopStreaming(connectionId: string): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      throw new Error("Connection not found");
    }

    try {
      if (connection.mediaRecorder && connection.isActive) {
        connection.mediaRecorder.stop();
      }
      this.connections.delete(connectionId);
    } catch (error) {
      console.error("[WebRTC] Error stopping stream:", error);
      throw new Error("Failed to stop WebRTC streaming");
    }
  }

  /**
   * Send video chunk to RTMP bridge endpoint
   */
  private async sendChunkToRTMPBridge(
    chunk: Blob,
    streamKey: string
  ): Promise<void> {
    try {
      const formData = new FormData();
      formData.append("chunk", chunk);
      formData.append("streamKey", streamKey);
      formData.append("timestamp", Date.now().toString());

      const response = await fetch("/api/streaming/rtmp-bridge", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        console.error(
          `[WebRTC] Failed to send chunk to RTMP bridge: ${response.status}`
        );
      }
    } catch (error) {
      console.error("[WebRTC] Error sending chunk to RTMP bridge:", error);
    }
  }

  /**
   * Get supported MIME type for MediaRecorder
   */
  private getSupportedMimeType(): string {
    const types = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm;codecs=h264,opus",
      "video/webm",
      "video/mp4",
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    throw new Error("No supported MediaRecorder MIME type found");
  }

  /**
   * Generate unique connection ID
   */
  private generateConnectionId(): string {
    return `webrtc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Get connection status
   */
  getConnectionStatus(connectionId: string): StreamingConnection | null {
    return this.connections.get(connectionId) || null;
  }

  /**
   * Get all active connections
   */
  getActiveConnections(): StreamingConnection[] {
    return Array.from(this.connections.values()).filter(
      (conn) => conn.isActive
    );
  }
}
