import React, {
  useState,
  useRef,
  useEffect,
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

const StreamManager = forwardRef<StreamManagerHandles, StreamManagerProps>(
  ({ streamData, onStreamStart, onStreamEnd, onError, className }, ref) => {
    // State management
    const [isStreaming, setIsStreaming] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
    // Remove unused localStream state
    // const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [muxLiveStream, setMuxLiveStream] = useState<MuxLiveStream | null>(
      null
    );
    const [streamKey, setStreamKey] = useState<string>("");

    // Refs for video elements
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

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
        setIsStreaming(true);
        setIsConnecting(false);

        // Call onStreamStart callback
        onStreamStart?.(liveStream.id);

        console.log("Stream started successfully:", {
          streamId: liveStream.id,
          playbackId: liveStream.playbackId,
          streamKey: liveStream.streamKey,
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
        setIsStreaming(false);
        setStreamKey("");

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
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
      streamRef.current = null;
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
            </div>

            {/* Broadcasting Instructions */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">
                Broadcasting with OBS/Streaming Software
              </h4>
              <div className="space-y-1 text-blue-800">
                <div>
                  <span className="font-medium">Server URL:</span>{" "}
                  rtmps://global-live.mux.com:443/live
                </div>
                <div>
                  <span className="font-medium">Stream Key:</span>
                  <code className="ml-2 px-2 py-1 bg-blue-100 rounded text-xs">
                    {streamKey}
                  </code>
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
