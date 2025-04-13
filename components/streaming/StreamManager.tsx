import React, {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Video, VideoOff, Share2, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  doc,
  updateDoc,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { StreamDuration } from "@/components/streaming/StreamDuration";
import { ClientTwilioService } from "@/lib/services/ClientTwilioService";
import { connect, Room } from "twilio-video";
import Loader from "@/components/ui/Loader";
import { StreamManagerProps } from "@/lib/types/streaming";

// Create an instance of the ClientTwilioService
const clientTwilioService = new ClientTwilioService();

// Generate a unique identity for the streamer that includes a timestamp and random value
const generateUniqueIdentity = (prefix: string, streamId: string): string => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `${prefix}_${streamId}_${timestamp}_${random}`;
};

// Define types with proper error handling
type StartStreamFunction = () => Promise<void>;
type StreamError = Error | unknown;

// Declare function references first to break circular dependencies
let startStream: StartStreamFunction;

// Convert to forwardRef
const StreamManager = forwardRef<
  { startStream: () => Promise<void> },
  StreamManagerProps
>(({ stream, className = "" }, ref) => {
  const [isStreaming, setIsStreaming] = useState(stream.hasStarted === true);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [title, setTitle] = useState(stream.title);
  const [shareUrl, setShareUrl] = useState("");
  const [showEndConfirmation, setShowEndConfirmation] = useState(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "disconnected" | "connecting" | "connected"
  >("disconnected");
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  const videoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const twilioRoomRef = useRef<Room | null>(null);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    startStream,
  }));

  // Set share URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      setShareUrl(`${window.location.origin}/streaming/live/${stream.slug}`);
    }
  }, [stream.slug]);

  // Subscribe to stream status changes from Firestore
  useEffect(() => {
    if (!stream.id) return;

    const unsubscribe = onSnapshot(
      doc(db, "streams", stream.id),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const streamActive = data.hasStarted === true;
          console.log(
            `[StreamManager] Stream status from Firestore: hasStarted=${streamActive}`
          );
          setIsStreaming(streamActive);

          // Update local state to match remote state
          setIsMicEnabled(!data.audioMuted);
          setIsVideoEnabled(!data.cameraOff);

          // Apply to local media if needed
          if (localStreamRef.current) {
            const audioTracks = localStreamRef.current.getAudioTracks();
            const videoTracks = localStreamRef.current.getVideoTracks();

            if (audioTracks.length > 0) {
              audioTracks.forEach((track) => {
                track.enabled = !data.audioMuted;
              });
            }

            if (videoTracks.length > 0) {
              videoTracks.forEach((track) => {
                track.enabled = !data.cameraOff;
              });
            }
          }
        }
      }
    );

    return () => unsubscribe();
  }, [stream.id]);

  // Update the useEffect that was using streamingTimer
  useEffect(() => {
    if (isStreaming && !timerIntervalRef.current) {
      timerIntervalRef.current = setInterval(() => {
        // We're not setting streamingTimer anymore
        // Just keep the interval for backward compatibility
      }, 1000);
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [isStreaming]);

  // Update state when stream prop changes
  useEffect(() => {
    console.log(
      `[StreamManager] Stream prop changed, hasStarted=${stream.hasStarted}`
    );
    setIsStreaming(stream.hasStarted === true);
    setTitle(stream.title || "");

    // If hasStarted changed to true and we're not connected to Twilio, try to connect
    if (stream.hasStarted && !isConnecting) {
      console.log(
        "[StreamManager] Stream hasStarted changed to true, attempting to connect to Twilio"
      );
      startStream().catch((err: StreamError) => {
        console.error(
          "[StreamManager] Failed to auto-connect after hasStarted changed:",
          err
        );
      });
    }
  }, [stream.hasStarted, stream.title, isConnecting]);

  // Define the retry handler with proper usage
  const handleRetry = async (retry: number) => {
    if (retry <= maxRetries && connectionStatus !== "connected") {
      console.log(`[StreamManager] Executing retry ${retry}/${maxRetries}`);
      try {
        await startStream();
      } catch (error) {
        console.error("[StreamManager] Retry failed:", error);
      }
    }
  };

  // Define the start stream function with proper type
  startStream = async () => {
    // Guard against multiple simultaneous connection attempts
    if (isConnecting) {
      console.log(
        "[StreamManager] Connection already in progress, skipping startStream"
      );
      return;
    }

    // Also check if we're already connected
    if (connectionStatus === "connected" && twilioRoomRef.current) {
      console.log(
        "[StreamManager] Already connected to streaming service, ignoring connection request"
      );
      return;
    }

    try {
      setConnectionError(null);
      setIsConnecting(true);
      setConnectionStatus("connecting");

      // Set up connection timeout
      const connectionTimeout = setTimeout(() => {
        if (connectionStatus !== "connected") {
          console.error("[StreamManager] Connection attempt timed out");
          setConnectionError("Connection timed out. Please try again.");
          setIsConnecting(false);
          setConnectionStatus("disconnected");
        }
      }, 15000); // 15 second timeout

      // If we already have a stream, use it instead of creating a new one
      if (!localStreamRef.current) {
        // Get the selected camera and mic from localStorage if available
        const savedSettings = localStorage.getItem("deviceSettings");
        const videoConstraints: MediaTrackConstraints = {
          width: { ideal: 1280 },
          height: { ideal: 720 },
        };
        const audioConstraints: MediaTrackConstraints = {
          echoCancellation: true,
          noiseSuppression: true,
        };

        if (savedSettings) {
          try {
          const settings = JSON.parse(savedSettings);
          if (settings.selectedCamera) {
            videoConstraints.deviceId = { exact: settings.selectedCamera };
          }
          if (settings.selectedMic) {
            audioConstraints.deviceId = { exact: settings.selectedMic };
            }
          } catch (parseError) {
            console.error(
              "[StreamManager] Error parsing device settings:",
              parseError
            );
            // Continue with default constraints
          }
        }

        console.log(
          "[StreamManager] Requesting media with camera and mic access"
        );
        try {
          const mediaStream = await navigator.mediaDevices.getUserMedia({
            audio: audioConstraints,
            video: videoConstraints,
          });

          // Set the stream to the video element
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
            videoRef.current.muted = true; // Important: Muted videos can autoplay
            videoRef.current.setAttribute("playsinline", ""); // For iOS

            try {
              // Try to play the video with error handling
              const playPromise = videoRef.current.play();
              if (playPromise !== undefined) {
                playPromise.catch((error) => {
                  // Handle AbortError properly - may happen during navigation or when interrupted
                  if (error.name === "AbortError") {
                    console.log(
                      "[StreamManager] Video play was interrupted, will retry when possible"
                    );
                    // Set up to retry play when the user interacts with the page
                    const retryPlay = () => {
                      if (videoRef.current) {
                        videoRef.current
                          .play()
                          .then(() => {
                            document.removeEventListener("click", retryPlay);
                          })
                          .catch((e) =>
                            console.error(
                              "[StreamManager] Retry play failed:",
                              e
                            )
                          );
                      }
                    };
                    document.addEventListener("click", retryPlay, {
                      once: true,
                    });
                  } else {
                    console.error(
                      "[StreamManager] Error playing video:",
                    error
                  );
                  }
                });
              }
            } catch (error) {
              console.error(
                "[StreamManager] Error with video playback:",
                error
              );
            }
          }

          localStreamRef.current = mediaStream;
        } catch (mediaError) {
          console.error(
            "[StreamManager] Error getting user media:",
            mediaError
          );
          clearTimeout(connectionTimeout);
          setConnectionError(
            `Could not access camera or microphone: ${
              (mediaError as Error).message
            }`
          );
          setIsConnecting(false);
          setConnectionStatus("disconnected");
          return;
        }
      }

      if (!localStreamRef.current) {
        clearTimeout(connectionTimeout);
        setConnectionError("Failed to initialize media stream");
        setIsConnecting(false);
        setConnectionStatus("disconnected");
        return;
      }

      // Get tracks from the media stream
      const videoTracks = localStreamRef.current.getVideoTracks();
      const audioTracks = localStreamRef.current.getAudioTracks();

      if (videoTracks.length === 0) {
        console.warn("[StreamManager] No video tracks found");
      }

      if (audioTracks.length === 0) {
        console.warn("[StreamManager] No audio tracks found");
      }

      // Connect to Twilio
      try {
        // Generate a unique identity for this streamer
        const identity = generateUniqueIdentity(
          "streamer",
          stream.id || "unknown"
        );

        // Get token and connect
        const token = await clientTwilioService.getToken(stream.slug, identity);

        // Connect to Twilio room with robust error handling
        const room = await connect(token, {
          name: stream.slug,
          tracks: [...videoTracks, ...audioTracks],
          networkQuality: true,
          dominantSpeaker: true,
          maxAudioBitrate: 16000,
          preferredVideoCodecs: [{ codec: "VP8", simulcast: true }],
        });

        // Store reference and update status
        twilioRoomRef.current = room;
          setConnectionStatus("connected");
        setIsConnecting(false);

        // Set up disconnection and reconnection handlers
        room.on("disconnected", (_room, error) => {
            console.log(
            "[StreamManager] Disconnected from Twilio room:",
            error || "No error"
            );
            setConnectionStatus("disconnected");
          twilioRoomRef.current = null;

          // Attempt to reconnect if the disconnect wasn't intentional
          if (error && isStreaming) {
              console.log(
              "[StreamManager] Attempting to reconnect after disconnect..."
            );
            setTimeout(() => {
              if (isStreaming) {
                startStream().catch((err) => {
                  console.error(
                    "[StreamManager] Failed to reconnect after disconnect:",
                    err
                  );
                });
              }
            }, 3000);
          }
        });

        room.on("reconnecting", (error) => {
          console.log("[StreamManager] Reconnecting to Twilio room:", error);
          setConnectionStatus("connecting");
        });

        room.on("reconnected", () => {
            console.log(
            "[StreamManager] Successfully reconnected to Twilio room"
          );
          setConnectionStatus("connected");
        });

        // Clear the timeout since we're connected
        clearTimeout(connectionTimeout);

        // Update stream status in Firebase
        if (stream.id && !stream.hasStarted) {
          try {
            const streamRef = doc(db, "streams", stream.id);
            await updateDoc(streamRef, {
              hasStarted: true,
              startedAt: serverTimestamp(),
              status: "live",
            });
            console.log("[StreamManager] Updated stream status to live");
          } catch (dbError) {
          console.error(
              "[StreamManager] Error updating stream status:",
              dbError
            );
            // Don't fail the whole connect process for a DB error
          }
        }

        setIsStreaming(true);
      } catch (twilioError) {
        console.error(
          "[StreamManager] Error connecting to Twilio:",
          twilioError
        );
        clearTimeout(connectionTimeout);
        setConnectionError(
          `Connection error: ${(twilioError as Error).message}`
        );
        setIsConnecting(false);
        setConnectionStatus("disconnected");
      }

      // Add retry logic if a connection error occurs
      if (connectionStatus !== "connected" && retryCount < maxRetries) {
        const newRetryCount = retryCount + 1;
        setRetryCount(newRetryCount);
        console.log(
          `[StreamManager] Connection failed, retry ${newRetryCount}/${maxRetries}`
        );

        // Implement retry with exponential backoff
        const delay = Math.min(2000 * Math.pow(2, newRetryCount - 1), 10000);
        setTimeout(() => {
          if (isStreaming) {
          handleRetry(newRetryCount);
          }
        }, delay);
      }
    } catch (error) {
      console.error("[StreamManager] Unexpected error in startStream:", error);
      setConnectionError(`Unexpected error: ${(error as Error).message}`);
      setIsConnecting(false);
      setConnectionStatus("disconnected");
    }
  };

  // Fix the auto-connect mechanism to prevent infinite loops
  useEffect(() => {
    // If stream has already started, we should automatically connect to Twilio
    const autoConnect = async () => {
      if (
        stream.hasStarted &&
        !isConnecting &&
        !connectionError &&
        connectionStatus !== "connected"
      ) {
        console.log(
          "[StreamManager] Auto-connecting to stream since it's already active"
        );
        try {
          setIsConnecting(true);
          await startStream();
        } catch (error: unknown) {
          console.error("[StreamManager] Auto-connect failed:", error);
          setIsConnecting(false);
        }
      }
    };

    const timer = setTimeout(() => {
      autoConnect();
    }, 1500);

    return () => clearTimeout(timer);
  }, [stream.hasStarted, isConnecting, connectionError, connectionStatus]);

  // Fix re-connection logic to be cleaner
  const reconnect = async () => {
    // Don't try to reconnect if we're already connecting
    if (isConnecting) {
      console.log(
        "[StreamManager] Already attempting to connect, ignoring duplicate reconnect request"
      );
      return;
    }

    // Disconnect existing room if any
    if (twilioRoomRef.current) {
      toast.info("Disconnecting from current session before reconnecting...");
      twilioRoomRef.current.disconnect();
      twilioRoomRef.current = null;
    }

    // Clear any cached tokens to force getting a new one
    clientTwilioService.clearCache();

    // Retry the connection
    try {
      // Clear error state
      setConnectionError(null);

      // Reset retry count to give a fresh start
      setRetryCount(0);

      // Show only one toast at the beginning
      toast.info("Reconnecting to stream...");

      // Start the stream
      await startStream();

      // Only show success toast if we actually succeeded
      if (connectionStatus === "connected") {
        toast.success("Successfully reconnected to stream!");
      }
    } catch (error) {
      console.error("[StreamManager] Reconnection failed:", error);
      toast.error("Failed to reconnect. Please try again.");
    }
  };

  // Set up camera feed on component mount
  useEffect(() => {
    const setupLocalPreview = async () => {
      try {
        // Get the selected camera and mic from localStorage if available
        const savedSettings = localStorage.getItem("deviceSettings");
        const videoConstraints: MediaTrackConstraints = {
          width: { ideal: 1280 },
          height: { ideal: 720 },
        };
        const audioConstraints: MediaTrackConstraints = {
          echoCancellation: true,
          noiseSuppression: true,
        };

        if (savedSettings) {
          const settings = JSON.parse(savedSettings);
          if (settings.selectedCamera) {
            videoConstraints.deviceId = { exact: settings.selectedCamera };
          }
          if (settings.selectedMic) {
            audioConstraints.deviceId = { exact: settings.selectedMic };
          }
        }

        // Request both video and audio for preview to enable mic control
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: audioConstraints,
        });

        // Set the stream to the video element
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch((error) => {
            console.error("Error playing preview video:", error);
          });
        }

        localStreamRef.current = mediaStream;

        // Initialize video track with current state
        const videoTracks = mediaStream.getVideoTracks();
        if (videoTracks.length > 0) {
          videoTracks[0].enabled = isVideoEnabled;
        }

        // Initialize audio track with current state
        const audioTracks = mediaStream.getAudioTracks();
        if (audioTracks.length > 0) {
          audioTracks[0].enabled = isMicEnabled;
        }

        console.log("Local preview set up with tracks:", {
          video: videoTracks.length > 0,
          audio: audioTracks.length > 0,
          videoEnabled: isVideoEnabled,
          audioEnabled: isMicEnabled,
        });
      } catch (error) {
        console.error("Error setting up local preview:", error);
        toast.error(
          "Could not access camera or microphone. Please check your device permissions."
        );
      }
    };

    // Always set up the preview, regardless of streaming state
    setupLocalPreview();

    return () => {
      // Clean up Twilio room on unmount
      if (twilioRoomRef.current) {
        twilioRoomRef.current.disconnect();
        twilioRoomRef.current = null;
      }

      // Clean up stream on unmount
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }
    };
  }, [isVideoEnabled, isMicEnabled]); // Add isMicEnabled as dependency to reinitialize when it changes

  // End streaming
  const endStream = () => {
    // Disconnect from Twilio room if connected
    if (twilioRoomRef.current) {
      console.log(
        `[StreamManager] Disconnecting from Twilio room: ${twilioRoomRef.current.name}`
      );
      twilioRoomRef.current.disconnect();
      twilioRoomRef.current = null;
    }

    // Clean up local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsStreaming(false);
    setShowEndConfirmation(false);
    setConnectionStatus("disconnected");

    // Stop the timer
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    // Update hasEnded in Firestore
    try {
      // Ensure stream.id exists before using it
      if (!stream.id) {
        throw new Error("Stream ID is undefined");
      }

      const streamDocRef = doc(db, "streams", stream.id);
      updateDoc(streamDocRef, {
        hasEnded: true,
        hasStarted: false, // Make sure to set hasStarted to false
        endedAt: serverTimestamp(),
        lastUpdated: serverTimestamp(),
      })
        .then(() => {
          toast.info("Stream ended");
          console.log("[StreamManager] Stream ended and Firestore updated");
        })
        .catch((dbError) => {
          console.error(
            "[StreamManager] Error updating stream status:",
            dbError
          );
          toast.error(
            "Stream ended locally but failed to update status in database."
          );
        });
    } catch (error) {
      console.error("[StreamManager] Error ending stream:", error);
      toast.error("Failed to end stream properly.");
    }
  };

  // Toggle microphone
  const toggleMic = () => {
    try {
      if (!localStreamRef.current) return;

      const tracks = localStreamRef.current.getAudioTracks();
      if (tracks.length === 0) {
        console.warn("No audio tracks found to toggle");
        return;
      }

      // Update local state
      const newMicState = !isMicEnabled;
      setIsMicEnabled(newMicState);

      // Apply to all audio tracks
      tracks.forEach((track) => {
        track.enabled = newMicState;
      });

      console.log(`Audio ${newMicState ? "unmuted" : "muted"}`);

      // Update Firestore with the status
      if (stream.id) {
        const streamDocRef = doc(db, "streams", stream.id);
        updateDoc(streamDocRef, {
          audioMuted: !newMicState, // Use audioMuted for consistency
          lastUpdated: serverTimestamp(),
        }).catch((error) => {
          console.error("Error updating audio status:", error);
          toast.error("Failed to update audio status");
        });
      }
    } catch (error) {
      console.error("Error toggling microphone:", error);
      toast.error("Failed to toggle microphone. Please try again.");
    }
  };

  // Toggle camera
  const toggleVideo = () => {
    try {
      if (!localStreamRef.current) return;

      const tracks = localStreamRef.current.getVideoTracks();
      if (tracks.length === 0) {
        console.warn("No video tracks found to toggle");
        return;
      }

      // Update local state
      const newVideoState = !isVideoEnabled;
      setIsVideoEnabled(newVideoState);

      // Apply to all video tracks
      tracks.forEach((track) => {
        track.enabled = newVideoState;
      });

      console.log(`Video ${newVideoState ? "enabled" : "disabled"}`);

      // Update Firestore with the status
      if (stream.id) {
        const streamDocRef = doc(db, "streams", stream.id);
        updateDoc(streamDocRef, {
          cameraOff: !newVideoState, // Use cameraOff for consistency
          lastUpdated: serverTimestamp(),
        }).catch((error) => {
          console.error("Error updating video status:", error);
          toast.error("Failed to update video status");
        });
      }
    } catch (error) {
      console.error("Error toggling video:", error);
      toast.error("Failed to toggle video. Please try again.");
    }
  };

  // Update stream info
  const updateStreamInfo = () => {
    // In a real implementation, this would update the stream info in the database
    console.log("Updated stream info:", { title });
    toast.success("Stream info updated!");
  };

  // Share stream
  const shareStream = () => {
    if (navigator.share) {
      navigator
        .share({
          title: title,
          text: "Check out my live stream!",
          url: shareUrl,
        })
        .catch((error) => console.log("Error sharing:", error));
    } else {
      // Fallback
      navigator.clipboard
        .writeText(shareUrl)
        .then(() => toast.success("Stream URL copied to clipboard!"))
        .catch((err) => console.error("Failed to copy:", err));
    }
  };

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Debug Panel - Remove this in production */}
      {process.env.NODE_ENV !== "production" && (
        <div className="bg-gray-800 p-2 mb-2 text-xs text-white rounded">
          <div>
            <strong>Debug Info:</strong>
          </div>
          <div>isStreaming: {isStreaming ? "true" : "false"}</div>
          <div>connectionStatus: {connectionStatus}</div>
          <div>
            hasStarted (from prop): {stream.hasStarted ? "true" : "false"}
          </div>
          <div>connectionError: {connectionError || "none"}</div>
        </div>
      )}

      {/* Video Preview */}
      <div className="aspect-video bg-gray-900 rounded-lg relative overflow-hidden mb-4">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />

        {!isStreaming && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
            <div className="text-brandWhite text-center">
              <VideoOff size={48} className="mx-auto mb-2" />
              <p>Stream Offline</p>
            </div>
          </div>
        )}

        {isStreaming && !isVideoEnabled && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
            <div className="text-brandWhite text-center">
              <VideoOff size={48} className="mx-auto mb-2" />
              <p>Camera Off</p>
            </div>
          </div>
        )}

        {connectionStatus === "connecting" && !connectionError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
            <div className="text-brandWhite text-center">
              <Loader className="mb-4" />
              <p>Connecting to Stream...</p>
            </div>
          </div>
        )}

        {/* Connection Error Display */}
        {connectionError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-80 p-4">
            <div className="text-red-500 text-center max-w-md">
              <p className="text-lg font-bold mb-2">Connection Error</p>
              <p className="mb-4">{connectionError}</p>
              <Button
                variant="outline"
                onClick={reconnect}
                disabled={isConnecting}
                className="border-red-500 text-red-500 hover:bg-red-500/10"
              >
                {isConnecting ? (
                  <>
                    <Loader className="mr-2" />
                    Reconnecting...
                  </>
                ) : (
                  <>
                    <RefreshCw size={16} className="mr-2" />
                    Try Again
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Stream Status Indicators */}
        {isStreaming && (
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <div className="flex items-center gap-2 bg-red-600 px-3 py-1 rounded-full text-white text-sm">
              <span className="h-2 w-2 rounded-full bg-white animate-pulse"></span>
              LIVE
            </div>
            {stream.startedAt && (
              <StreamDuration
                startTime={
                  typeof stream.startedAt === "string"
                    ? new Date(stream.startedAt)
                    : stream.startedAt
                }
              />
            )}
          </div>
        )}

        {/* Twilio Connection Status */}
        {isStreaming && (
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <div
              className={`flex items-center gap-1 bg-black bg-opacity-70 px-3 py-1 rounded-full text-sm ${
                connectionStatus === "connected"
                  ? "text-green-500"
                  : connectionStatus === "connecting"
                  ? "text-yellow-500"
                  : "text-red-500"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  connectionStatus === "connected"
                    ? "bg-green-500"
                    : connectionStatus === "connecting"
                    ? "bg-yellow-500 animate-pulse"
                    : "bg-red-500"
                }`}
              ></span>
              <span>
                {connectionStatus === "connected"
                  ? "Stream Connected"
                  : connectionStatus === "connecting"
                  ? "Connecting..."
                  : "Disconnected"}
              </span>
            </div>

            {/* Only show Audio/Video Status Indicators when connected */}
            {connectionStatus === "connected" && (
              <>
                {!isMicEnabled && (
                  <div className="flex items-center gap-1 bg-black bg-opacity-70 px-3 py-1 rounded-full text-white text-sm">
                    <MicOff size={16} />
                    <span>Muted</span>
                  </div>
                )}
                {!isVideoEnabled && (
                  <div className="flex items-center gap-1 bg-black bg-opacity-70 px-3 py-1 rounded-full text-white text-sm">
                    <VideoOff size={16} />
                    <span>Camera Off</span>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Add Twilio Warning Overlay when stream is active but Twilio is disconnected */}
        {isStreaming &&
          connectionStatus === "disconnected" &&
          !connectionError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-80 p-4">
              <div className="text-amber-500 text-center max-w-md">
                <p className="text-lg font-bold mb-2">Connection Issue</p>
                <p className="mb-4">
                  Your stream is active but viewers cannot connect because the
                  streaming service is disconnected.
                </p>
                <Button
                  variant="outline"
                  onClick={reconnect}
                  disabled={isConnecting}
                  className="border-amber-500 text-amber-500 hover:bg-amber-500/10"
                >
                  {isConnecting ? (
                    <>
                      <Loader className="mr-2" />
                      Reconnecting...
                    </>
                  ) : (
                    <>
                      <RefreshCw size={16} className="mr-2" />
                      Reconnect Now
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
      </div>

      {/* Stream Controls */}
      <div className="bg-gray-900 p-4 rounded-lg shadow-md mb-4 border border-gray-800">
        <div className="flex justify-between mb-6">
          <h2 className="text-lg font-semibold text-brandWhite">
            Stream Controls
          </h2>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={shareStream}
              title="Share stream"
              className="border-gray-700 text-brandBlack bg-brandGray hover:bg-gray-300"
            >
              <Share2 size={18} />
            </Button>

            {isStreaming ? (
              <Button
                variant="destructive"
                onClick={() => setShowEndConfirmation(true)}
              >
                End Stream
              </Button>
            ) : (
              <Button
                className="bg-brandOrange hover:bg-brandOrange/90 text-brandBlack"
                onClick={startStream}
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <>
                    <Loader className="mr-2" />
                    <RefreshCw size={18} className="mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  "Start Streaming"
                )}
              </Button>
            )}
          </div>
        </div>

        {isStreaming && (
          <div className="flex gap-4 mb-6 justify-center">
            <Button
              variant="outline"
              size="lg"
              onClick={toggleMic}
              className={`flex flex-col items-center gap-2 p-6 ${
                isMicEnabled
                  ? "bg-gray-800 text-brandWhite border-gray-700"
                  : "bg-gray-800 text-brandOrange border-brandOrange/30"
              }`}
            >
              {isMicEnabled ? <Mic size={24} /> : <MicOff size={24} />}
              <span className="text-xs">
                {isMicEnabled ? "Mic On" : "Mic Off"}
              </span>
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={toggleVideo}
              className={`flex flex-col items-center gap-2 p-6 ${
                isVideoEnabled
                  ? "bg-gray-800 text-brandWhite border-gray-700"
                  : "bg-gray-800 text-brandOrange border-brandOrange/30"
              }`}
            >
              {isVideoEnabled ? <Video size={24} /> : <VideoOff size={24} />}
              <span className="text-xs">
                {isVideoEnabled ? "Camera On" : "Camera Off"}
              </span>
            </Button>
          </div>
        )}

        {/* Stream Info Form */}
        <div className="space-y-3">
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Stream Title
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter stream title"
              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
            />
          </div>

          <Button
            variant="outline"
            onClick={updateStreamInfo}
            className="w-full bg-gray-800 border-gray-700 text-brandWhite hover:bg-gray-700"
          >
            Update Stream Info
          </Button>
        </div>
      </div>

      {/* End Stream Confirmation Modal */}
      <Dialog open={showEndConfirmation} onOpenChange={setShowEndConfirmation}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-brandOrange">End Stream?</DialogTitle>
          </DialogHeader>
          <p className="mb-6">
            Are you sure you want to end this stream? This action cannot be
            undone.
          </p>
          <DialogFooter className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setShowEndConfirmation(false)}
              className="border-gray-600 text-white hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={endStream}>
              End Stream
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});

// Add display name
StreamManager.displayName = "StreamManager";

export default StreamManager;
