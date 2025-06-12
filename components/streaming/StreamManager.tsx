import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Video, VideoOff, Play, Square } from "lucide-react";
import {
  StreamManagerProps,
  StreamManagerHandles,
  MuxLiveStream,
} from "@/lib/types/streaming.types";
import {
  startStreamFirebase,
  endStreamFirebase,
} from "@/lib/helpers/streaming";

const StreamManager = forwardRef<StreamManagerHandles, StreamManagerProps>(
  ({ streamData, onStreamStart, onStreamEnd, onError, className }, ref) => {
    // State management
    const [isStreaming, setIsStreaming] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [muxLiveStream, setMuxLiveStream] = useState<MuxLiveStream | null>(
      null
    );
    const [streamKey, setStreamKey] = useState<string>("");
    const [connectionId, setConnectionId] = useState<string>("");

    // Refs for video elements and streaming
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const statusMonitorRef = useRef<NodeJS.Timeout | null>(null);

    // Monitor Mux stream status and update Firestore
    const startMuxStatusMonitoring = useCallback(
      (muxStreamId: string) => {
        // Clear any existing monitor
        if (statusMonitorRef.current) {
          clearInterval(statusMonitorRef.current);
        }

        // Check status every 10 seconds
        statusMonitorRef.current = setInterval(async () => {
          try {
            const response = await fetch(
              `/api/mux/streams?streamId=${muxStreamId}`
            );
            const result = await response.json();

            if (result.success && result.liveStream) {
              const currentStatus = result.liveStream.status;
              console.log(`[StreamManager] Mux status check: ${currentStatus}`);

              // Update Firestore if status changed
              try {
                const { doc, updateDoc } = await import("firebase/firestore");
                const { db } = await import("@/lib/firebase/client");
                const streamRef = doc(db, "streams", streamData.id);
                await updateDoc(streamRef, {
                  muxStatus: currentStatus,
                });

                // Update local state
                setMuxLiveStream((prev) =>
                  prev ? { ...prev, status: currentStatus } : null
                );
              } catch (error) {
                console.warn(
                  "Failed to update Mux status in Firestore:",
                  error
                );
              }
            }
          } catch (error) {
            console.warn("Failed to check Mux stream status:", error);
          }
        }, 10000); // Check every 10 seconds
      },
      [streamData.id]
    );

    const stopMuxStatusMonitoring = useCallback(() => {
      if (statusMonitorRef.current) {
        clearInterval(statusMonitorRef.current);
        statusMonitorRef.current = null;
      }
    }, []);

    // Sync internal streaming state with Firebase stream state
    useEffect(() => {
      const isLiveInFirebase = streamData?.isLive || false;

      // If Firebase says stream is live but our internal state says it's not
      if (isLiveInFirebase && !isStreaming) {
        console.log(
          "[StreamManager] Stream is live in Firebase, syncing internal state and auto-connecting..."
        );
        setIsStreaming(true);

        // Auto-connect to existing stream if we have Mux data
        if (
          streamData?.muxStreamId &&
          streamData?.muxPlaybackId &&
          streamData?.muxStreamKey
        ) {
          const existingMuxStream: MuxLiveStream = {
            id: streamData.muxStreamId,
            playbackId: streamData.muxPlaybackId,
            streamKey: streamData.muxStreamKey,
            status: streamData.muxStatus || "active",
            createdAt: streamData.createdAt || new Date().toISOString(),
          };

          setMuxLiveStream(existingMuxStream);
          setStreamKey(streamData.muxStreamKey);

          // Start monitoring the existing stream
          startMuxStatusMonitoring(streamData.muxStreamId);

          console.log(
            "[StreamManager] Auto-connected to existing Mux stream:",
            existingMuxStream
          );
        }
      }
      // If Firebase says stream is not live but our internal state says it is
      else if (!isLiveInFirebase && isStreaming) {
        console.log(
          "[StreamManager] Stream ended in Firebase, syncing internal state..."
        );
        setIsStreaming(false);
        setMuxLiveStream(null);
        setStreamKey("");
        setConnectionId("");
        stopMuxStatusMonitoring();
      }
    }, [
      streamData?.isLive,
      streamData?.muxStreamId,
      streamData?.muxPlaybackId,
      streamData?.muxStreamKey,
      streamData?.muxStatus,
      streamData?.createdAt,
      isStreaming,
      startMuxStatusMonitoring,
      stopMuxStatusMonitoring,
    ]);

    // Initialize local media on mount
    useEffect(() => {
      const initMedia = async () => {
        await initializeLocalMedia();
      };
      initMedia();
      return () => {
        cleanup();
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Initialize local media stream
    const initializeLocalMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 },
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        streamRef.current = stream;

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.muted = true; // Prevent feedback
        }
      } catch (error) {
        console.error("Error accessing media devices:", error);
        onError?.({
          code: "MEDIA_ACCESS_DENIED",
          message:
            "Failed to access camera and microphone. Please check permissions.",
          isRecoverable: true,
          context: { error },
        });
      }
    };

    // Create Mux live stream
    const createMuxLiveStream = async (): Promise<MuxLiveStream | null> => {
      try {
        const response = await fetch("/api/mux/streams", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: streamData.title,
            description: streamData.description,
            playbackPolicy: "public",
            recordingEnabled: true,
          }),
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || "Failed to create live stream");
        }

        return result.liveStream;
      } catch (error) {
        console.error("Error creating Mux live stream:", error);
        onError?.({
          code: "STREAM_CREATION_FAILED",
          message: "Failed to create live stream. Please try again.",
          isRecoverable: true,
          context: { error },
        });
        return null;
      }
    };

    // Get supported MIME type for MediaRecorder (prioritize VP8 for FFmpeg compatibility)
    const getSupportedMimeType = (): string => {
      const types = [
        "video/webm;codecs=vp8,opus", // VP8 is more compatible with FFmpeg
        "video/webm;codecs=vp9,opus",
        "video/webm;codecs=h264,opus",
        "video/webm",
        "video/mp4",
      ];

      for (const type of types) {
        if (MediaRecorder.isTypeSupported(type)) {
          console.log(`[StreamManager] Using MediaRecorder format: ${type}`);
          return type;
        }
      }

      throw new Error("No supported MediaRecorder MIME type found");
    };

    // Setup MediaRecorder streaming
    const setupMediaRecorderStreaming = async (
      streamKey: string
    ): Promise<string> => {
      if (!streamRef.current) {
        throw new Error("No media stream available");
      }

      try {
        // Create MediaRecorder to capture the stream
        const mimeType = getSupportedMimeType();
        const mediaRecorder = new MediaRecorder(streamRef.current, {
          mimeType,
          videoBitsPerSecond: 1500000, // 1.5 Mbps to match FFmpeg output
          audioBitsPerSecond: 128000, // 128 kbps
        });

        console.log(`[StreamManager] MediaRecorder created with:`, {
          mimeType,
          videoBitsPerSecond: 1500000,
          audioBitsPerSecond: 128000,
        });

        mediaRecorderRef.current = mediaRecorder;
        const connId = `stream_${Date.now()}_${Math.random()
          .toString(36)
          .substring(2, 9)}`;

        // Handle data available from MediaRecorder
        mediaRecorder.ondataavailable = async (event) => {
          if (event.data.size > 0) {
            await sendChunkToRTMPBridge(event.data, streamKey);
          }
        };

        mediaRecorder.onstart = () => {
          console.log(
            `[StreamManager] Started recording for stream: ${streamKey}`
          );
        };

        mediaRecorder.onstop = () => {
          console.log(
            `[StreamManager] Stopped recording for stream: ${streamKey}`
          );
        };

        mediaRecorder.onerror = (event) => {
          console.error(`[StreamManager] MediaRecorder error:`, event);
          onError?.({
            code: "STREAM_RECORDING_FAILED",
            message: "Recording failed. Please try again.",
            isRecoverable: true,
            context: { event },
          });
        };

        // Start recording in chunks of 1 second for better real-time streaming
        mediaRecorder.start(1000);

        return connId;
      } catch (error) {
        console.error("[StreamManager] Error setting up MediaRecorder:", error);
        throw new Error("Failed to setup MediaRecorder streaming");
      }
    };

    // Send video chunk to RTMP bridge endpoint
    const sendChunkToRTMPBridge = async (
      chunk: Blob,
      streamKey: string
    ): Promise<void> => {
      try {
        // Convert blob to base64 for better transmission
        const arrayBuffer = await chunk.arrayBuffer();
        const base64Chunk = btoa(
          String.fromCharCode(...new Uint8Array(arrayBuffer))
        );

        const payload = {
          chunk: base64Chunk,
          streamKey: streamKey,
          timestamp: Date.now(),
          mimeType: chunk.type,
          size: chunk.size,
        };

        // Try the RTMP bridge first for actual streaming to Mux
        const formData = new FormData();
        formData.append("chunk", chunk);
        formData.append("streamKey", streamKey);
        formData.append("timestamp", Date.now().toString());

        let response = await fetch("/api/streaming/rtmp-bridge", {
          method: "POST",
          body: formData,
        });

        // If RTMP bridge fails, try simple bridge as fallback
        if (!response.ok) {
          console.log(
            `[StreamManager] RTMP bridge failed (${response.status}), trying simple bridge fallback...`
          );

          response = await fetch("/api/streaming/simple-bridge", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          });
        }

        if (!response.ok) {
          console.error(
            `[StreamManager] Failed to send chunk to streaming bridge: ${response.status}`
          );

          // If both bridges fail, log detailed error
          if (response.status >= 500) {
            console.error(
              `[StreamManager] Server error in streaming bridge, chunk may be lost`
            );
          }
        } else {
          const result = await response.json();
          if (result.message) {
            console.log(`[StreamManager] Bridge response:`, result.message);
          }

          // Log successful RTMP streaming
          if (result.message && result.message.includes("RTMP")) {
            console.log(
              `[StreamManager] Successfully streaming to Mux via RTMP`
            );
          }
        }
      } catch (error) {
        console.error(
          "[StreamManager] Error sending chunk to streaming bridge:",
          error
        );
      }
    };

    // Start streaming
    const startStream = async (): Promise<void> => {
      if (isStreaming || isConnecting) return;

      setIsConnecting(true);

      try {
        // Create Mux live stream
        const liveStream = await createMuxLiveStream();
        if (!liveStream) {
          throw new Error("Failed to create live stream");
        }

        setMuxLiveStream(liveStream);
        setStreamKey(liveStream.streamKey);

        // Enable the Mux live stream to accept RTMP connections
        try {
          const enableResponse = await fetch(
            `/api/mux/streams/enable?streamId=${liveStream.id}`,
            {
              method: "POST",
            }
          );
          if (!enableResponse.ok) {
            console.warn("Failed to enable Mux live stream, but continuing...");
          } else {
            console.log("Successfully enabled Mux live stream");
          }
        } catch (error) {
          console.warn("Error enabling Mux live stream:", error);
        }

        // Setup MediaRecorder streaming to Mux
        const connId = await setupMediaRecorderStreaming(liveStream.streamKey);
        setConnectionId(connId);

        // Update Firestore stream status
        const firebaseSuccess = await startStreamFirebase(streamData.id);
        if (!firebaseSuccess) {
          console.warn(
            "Failed to update Firebase stream status, but continuing with stream"
          );
        }

        // Update Firestore with Mux stream data and live status
        try {
          const { doc, updateDoc } = await import("firebase/firestore");
          const { db } = await import("@/lib/firebase/client");
          const streamRef = doc(db, "streams", streamData.id);
          await updateDoc(streamRef, {
            isLive: true,
            muxStreamId: liveStream.id,
            muxPlaybackId: liveStream.playbackId,
            muxStreamKey: liveStream.streamKey,
            muxStatus: liveStream.status,
          });
          console.log("Successfully updated Firestore with Mux data:", {
            muxStreamId: liveStream.id,
            muxPlaybackId: liveStream.playbackId,
            muxStatus: liveStream.status,
          });
        } catch (error) {
          console.error("Failed to update Firestore with Mux data:", error);
        }

        setIsStreaming(true);
        setIsConnecting(false);

        // Call onStreamStart callback
        onStreamStart?.(liveStream.id);

        // Start monitoring Mux stream status
        startMuxStatusMonitoring(liveStream.id);

        console.log("Stream started successfully:", {
          streamId: liveStream.id,
          playbackId: liveStream.playbackId,
          streamKey: liveStream.streamKey,
          connectionId: connId,
        });
      } catch (error) {
        console.error("Error starting stream:", error);
        setIsConnecting(false);
        onError?.({
          code: "STREAM_START_FAILED",
          message: "Failed to start stream. Please try again.",
          isRecoverable: true,
          context: { error },
        });
      }
    };

    // End streaming
    const endStream = async (): Promise<void> => {
      if (!isStreaming) return;

      try {
        // Stop MediaRecorder
        if (
          mediaRecorderRef.current &&
          mediaRecorderRef.current.state !== "inactive"
        ) {
          mediaRecorderRef.current.stop();
          mediaRecorderRef.current = null;
        }

        // Stop streaming bridge
        if (streamKey) {
          try {
            // Try stopping RTMP bridge first
            const response = await fetch(
              `/api/streaming/rtmp-bridge?streamKey=${encodeURIComponent(
                streamKey
              )}`,
              {
                method: "DELETE",
              }
            );

            // If that fails, try simple bridge
            if (!response.ok) {
              await fetch(
                `/api/streaming/simple-bridge?streamKey=${encodeURIComponent(
                  streamKey
                )}`,
                {
                  method: "DELETE",
                }
              );
            }
          } catch (bridgeError) {
            console.error("Error stopping streaming bridge:", bridgeError);
          }
        }

        // Stop monitoring Mux status
        stopMuxStatusMonitoring();

        // Update Firestore stream status
        const firebaseSuccess = await endStreamFirebase(streamData.id);
        if (!firebaseSuccess) {
          console.warn("Failed to update Firebase stream status");
        }

        // Update Firestore to clear live status and Mux data
        try {
          const { doc, updateDoc } = await import("firebase/firestore");
          const { db } = await import("@/lib/firebase/client");
          const streamRef = doc(db, "streams", streamData.id);
          await updateDoc(streamRef, {
            isLive: false,
            muxStatus: "idle",
          });
          console.log("Successfully updated Firestore stream end status");
        } catch (error) {
          console.error("Failed to update Firestore stream end status:", error);
        }

        setIsStreaming(false);
        setStreamKey("");
        setConnectionId("");

        // Call onStreamEnd callback
        if (muxLiveStream) {
          onStreamEnd?.(muxLiveStream.id);
        }

        setMuxLiveStream(null);
        console.log("Stream ended successfully");
      } catch (error) {
        console.error("Error ending stream:", error);
        onError?.({
          code: "STREAM_END_FAILED",
          message: "Error ending stream",
          isRecoverable: false,
          context: { error },
        });
      }
    };

    // Toggle microphone
    const toggleMic = () => {
      if (streamRef.current) {
        const audioTracks = streamRef.current.getAudioTracks();
        audioTracks.forEach((track) => {
          track.enabled = isMuted;
        });
        setIsMuted(!isMuted);
      }
    };

    // Toggle camera
    const toggleCamera = () => {
      if (streamRef.current) {
        const videoTracks = streamRef.current.getVideoTracks();
        videoTracks.forEach((track) => {
          track.enabled = isCameraOff;
        });
        setIsCameraOff(!isCameraOff);
      }
    };

    // Cleanup function
    const cleanup = () => {
      // Stop status monitoring
      stopMuxStatusMonitoring();

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }
      streamRef.current = null;
      mediaRecorderRef.current = null;
    };

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      startStream,
      endStream,
      toggleMic,
      toggleCamera,
      isStreaming: () => isStreaming,
    }));

    return (
      <div className={`space-y-4 ${className || ""}`}>
        {/* Local Video Preview */}
        <div className="relative w-full aspect-video bg-gray-900 rounded-lg overflow-hidden">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />

          {/* Stream Status Overlay */}
          <div className="absolute top-4 left-4 flex items-center space-x-2">
            {isStreaming && (
              <div className="flex items-center space-x-2 bg-red-600 text-white px-3 py-1 rounded-full text-sm">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span>LIVE</span>
              </div>
            )}
            {isConnecting && (
              <div className="bg-yellow-600 text-white px-3 py-1 rounded-full text-sm">
                Connecting...
              </div>
            )}
          </div>

          {/* Control Overlay */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-4">
            {/* Microphone Toggle */}
            <Button
              variant={isMuted ? "destructive" : "secondary"}
              size="sm"
              onClick={toggleMic}
              className="rounded-full w-10 h-10 p-0"
            >
              {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
            </Button>

            {/* Camera Toggle */}
            <Button
              variant={isCameraOff ? "destructive" : "secondary"}
              size="sm"
              onClick={toggleCamera}
              className="rounded-full w-10 h-10 p-0"
            >
              {isCameraOff ? <VideoOff size={16} /> : <Video size={16} />}
            </Button>

            {/* Start/Stop Stream Button */}
            <Button
              variant={isStreaming ? "destructive" : "default"}
              size="sm"
              onClick={isStreaming ? endStream : startStream}
              disabled={isConnecting}
              className="px-6"
            >
              {isConnecting ? (
                "Connecting..."
              ) : isStreaming ? (
                <>
                  <Square size={16} className="mr-2" />
                  Stop Stream
                </>
              ) : (
                <>
                  <Play size={16} className="mr-2" />
                  Start Stream
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Stream Information */}
        {isStreaming && muxLiveStream && (
          <div className="space-y-2 text-sm text-gray-600">
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <h3 className="font-semibold text-gray-900">
                Stream Information
              </h3>
              <div>
                <span className="font-medium">Stream ID:</span>{" "}
                {muxLiveStream.id}
              </div>
              <div>
                <span className="font-medium">Playback ID:</span>{" "}
                {muxLiveStream.playbackId}
              </div>
              <div>
                <span className="font-medium">Status:</span>{" "}
                {muxLiveStream.status}
              </div>
              {connectionId && (
                <div>
                  <span className="font-medium">Connection ID:</span>{" "}
                  {connectionId}
                </div>
              )}
            </div>

            {/* Browser Streaming Info */}
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold text-green-900 mb-2">
                Browser Streaming Active
              </h4>
              <div className="space-y-1 text-green-800">
                <div>
                  <span className="font-medium">Mode:</span> Direct Browser
                  Streaming
                </div>
                <div>
                  <span className="font-medium">Technology:</span> MediaRecorder
                  → RTMP Bridge
                </div>
                <div className="text-xs text-green-600 mt-2">
                  Your camera and microphone are being streamed directly to Mux
                  via our RTMP bridge. No external software required!
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

StreamManager.displayName = "StreamManager";

export default StreamManager;
