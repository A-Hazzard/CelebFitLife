"use client";
import React, { useState, useCallback, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { db } from "@/lib/firebase/client";
import { doc, getDoc, onSnapshot, Timestamp } from "firebase/firestore";
import StreamChat from "@/components/streaming/StreamChat";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { clearVideoContainer } from "@/lib/utils/twilio";
import {
  Room,
  RemoteAudioTrack,
  RemoteVideoTrack,
  RemoteParticipant,
  RemoteTrack,
  TwilioError,
  connect,
} from "twilio-video";
import { MicOff, Mic } from "lucide-react";
import { Countdown } from "@/components/streaming/Countdown";
import { Button } from "@/components/ui/button";
import VideoContainer from "@/components/streaming/VideoContainer";
import StreamStatusOverlay from "@/components/streaming/StreamStatusOverlay";
import { ClientTwilioService } from "@/lib/services/ClientTwilioService";

// Create a static instance of ClientTwilioService for the client side
const clientTwilioService = new ClientTwilioService();

// Generate a unique identity for viewers that includes a timestamp and random value
const generateUniqueIdentity = (prefix: string, userId: string): string => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `${prefix}_${userId}_${timestamp}_${random}`;
};

export default function LiveViewPage() {
  const pathname = usePathname();
  const slug = pathname?.split("/").pop() || "";
  const { currentUser } = useAuthStore();

  // Using isStreamStarted to track if the stream is active
  const [hasStarted, setHasStarted] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);

  // Remove unused remoteParticipant state
  const [remoteVideoTrack, setRemoteVideoTrack] =
    useState<RemoteVideoTrack | null>(null);
  const [remoteAudioTrack, setRemoteAudioTrack] =
    useState<RemoteAudioTrack | null>(null);
  const [videoStatus, setVideoStatus] = useState<
    "waiting" | "connecting" | "active" | "offline" | "ended" | "error"
  >("waiting");
  const [hasHydrated, setHasHydrated] = useState(false);
  const [streamerStatus, setStreamerStatus] = useState({
    audioMuted: false,
    cameraOff: false,
  });
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledTime, setScheduledTime] = useState<Timestamp | null>(null);
  const [streamStartTime, setStreamStartTime] = useState<Timestamp | null>(
    null
  );
  const [streamDuration, setStreamDuration] = useState(0);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // This state is used to detect browser autoplay restrictions
  const videoContainerRef = useRef<HTMLDivElement>(null);
  // Remove unused state variables
  const [streamTitle, setStreamTitle] = useState("");
  const [thumbnail, setThumbnail] = useState("");

  // Enhanced error states for better error handling
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const maxConnectionAttempts = 5;

  const isMountedRef = useRef(false);
  const isConnectingRef = useRef(false);

  // Define references used throughout the component
  const twilioRoom = useRef<Room | null>(null);
  const streamHealthChecked = useRef<boolean>(false);
  const streamHealthTimeout = useRef<NodeJS.Timeout | null>(null);

  // Function to handle auto-retry attempts
  const manualRetryRef = useRef<(() => Promise<void>) | null>(null);

  // Ensure component mount status is tracked
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Dynamic page title effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (videoStatus === "active" && hasStarted) {
      // Create blinking title effect for live streams
      const baseTitle = streamTitle || "Live Stream";
      const titles = [`🔴 LIVE: ${baseTitle}`, `⚪ LIVE: ${baseTitle}`];
      let index = 0;

      document.title = titles[0];
      interval = setInterval(() => {
        index = (index + 1) % 2;
        document.title = titles[index];
      }, 1000);
    } else if (videoStatus === "ended") {
      document.title = "Stream Ended";
    } else if (videoStatus === "waiting") {
      document.title = isScheduled
        ? `Scheduled: ${streamTitle || "Upcoming Stream"}`
        : `Waiting: ${streamTitle || "Stream"}`;
    } else {
      document.title = streamTitle || "CelebFitLife | Live Stream";
    }

    return () => {
      if (interval) clearInterval(interval);
      document.title = "CelebFitLife | Live Fitness Streaming";
    };
  }, [videoStatus, hasStarted, streamTitle, isScheduled]);

  // Log video track details when available
  useEffect(() => {
    if (remoteVideoTrack) {
      console.debug("Video track details:", {
        sid: remoteVideoTrack.sid,
        name: remoteVideoTrack.name,
        enabled: remoteVideoTrack.isEnabled,
      });
    }
  }, [remoteVideoTrack]);

  // Hydration effect
  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      setHasHydrated(true);
      setLoadingAuth(false);
    });

    const timeout = setTimeout(() => {
      setHasHydrated(true);
      setLoadingAuth(false);
    }, 2000);

    return () => {
      unsub();
      clearTimeout(timeout);
    };
  }, []);

  // Authentication check effect
  useEffect(() => {
    if (hasHydrated && !currentUser && !loadingAuth) {
      // Don't redirect here, we'll show a UI message instead
    }
  }, [currentUser, hasHydrated, loadingAuth]);

  // Format time as HH:MM:SS
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Fix the handleTrackSubscribed function to properly handle video and audio tracks
  const handleTrackSubscribed = useCallback(
    (newTrack: RemoteTrack) => {
      try {
        if (!newTrack) {
          console.warn("handleTrackSubscribed called with undefined track");
          return;
        }

        console.log(
          `Track subscribed: ${newTrack.name || "unnamed"}, kind: ${
            newTrack.kind
          }, enabled: ${newTrack.isEnabled}`
        );

        if (newTrack.kind === "video") {
          console.log(
            `Handling video track: ${newTrack.name}, enabled: ${newTrack.isEnabled}`
          );

          // Connect the video to the DOM element
          if (videoContainerRef.current) {
            // Clear any existing video elements first
            clearVideoContainer(videoContainerRef.current);

            // If the track is a VideoTrack, attach it to our ref
            if (newTrack.attach) {
              try {
                console.log("Attaching video track to container");
                const videoElement = newTrack.attach();
                videoElement.style.width = "100%";
                videoElement.style.height = "100%";
                videoContainerRef.current.appendChild(videoElement);

                // Update remote track state
                setRemoteVideoTrack(newTrack as RemoteVideoTrack);
                setStreamerStatus((prev) => ({
                  ...prev,
                  cameraOff: !newTrack.isEnabled,
                }));

                console.log(
                  `Video track attached successfully, enabled: ${newTrack.isEnabled}`
                );
              } catch (attachError) {
                console.error("Error attaching video:", attachError);
              }
            }
          } else {
            console.error("Video container ref is not available");
          }
        } else if (newTrack.kind === "audio") {
          console.log(`Handling audio track: ${newTrack.name}`);

          // Connect audio track
          if (newTrack.attach) {
            try {
              console.log("Attaching audio track");
              const audioElement = newTrack.attach();
              // Try to start audio playback
              audioElement
                .play()
                .then(() => {
                  console.log("[Track] Audio playback started successfully");
                })
                .catch((error) => {
                  console.error("[Track] Audio playback failed:", error);
                  // If autoplay fails, we need user interaction, show a button to the user
                  setIsAudioMuted(true);
                });
            } catch (attachError) {
              console.error("Error attaching audio track:", attachError);
            }

            // Update state to reflect we have an audio track
            setRemoteAudioTrack(newTrack as RemoteAudioTrack);
          }
        }
      } catch (error) {
        console.error("Error in handleTrackSubscribed:", error);
      }
    },
    [] // Remove isAudioMuted as it's not needed in this function
  );

  // Define checkStreamStatus with useCallback
  const checkStreamStatus = useCallback(async (): Promise<boolean> => {
    // Don't retry if we've hit the max attempts
    if (connectionAttempts >= maxConnectionAttempts) {
      console.log(
        `[LiveView] Maximum connection attempts (${maxConnectionAttempts}) reached. Not retrying.`
      );
      setConnectionError(
        `Unable to connect after ${maxConnectionAttempts} attempts. The stream may be offline or unavailable.`
      );
      return false;
    }

    try {
      setIsRetrying(true);

      // Check stream status from Firebase first to avoid unnecessary connection attempts
      const streamRef = doc(db, "streams", slug);
      const streamDoc = await getDoc(streamRef);

      if (!streamDoc.exists()) {
        console.log(`[LiveView] Stream document for slug "${slug}" not found`);
        setVideoStatus("offline");
        setConnectionError("Stream not found");
        setIsRetrying(false);
        return false;
      }

      const streamData = streamDoc.data();
      console.log(
        `[LiveView] Stream status check: hasStarted=${streamData.hasStarted}, hasEnded=${streamData.hasEnded}, status=${streamData.status}`
      );

      // CRITICAL FIX: Handle different stream states with explicit boolean checks
      if (streamData.hasEnded === true) {
        console.log(`[LiveView] Stream has ended (hasEnded=true)`);
        setVideoStatus("ended");
        setHasEnded(true);
        setIsRetrying(false);
        return false;
      } else if (streamData.hasStarted === true) {
        // Stream is active! Even if status isn't explicitly "live", hasStarted=true is enough
        console.log(`[LiveView] Stream is active (hasStarted=true)`);
        setHasStarted(true);
        setHasEnded(false);
        return true;
      } else if (streamData.status === "live") {
        // Fallback for older streams that might use status="live" without hasStarted=true
        console.log(
          `[LiveView] Stream has status="live" but hasStarted is not true`
        );
        setHasStarted(true);
        setHasEnded(false);
        return true;
      } else {
        // Likely in waiting state
        console.log(`[LiveView] Stream is in waiting state (not started yet)`);
        setVideoStatus("waiting");
        setIsRetrying(false);
        return false;
      }
    } catch (error) {
      console.error("[LiveView] Error checking stream status:", error);
      setConnectionError("Unable to check stream status. Please try again.");
      setIsRetrying(false);
      return false;
    }
  }, [connectionAttempts, maxConnectionAttempts, slug]);

  // Define setupRoomEventListeners
  const setupRoomEventListeners = useCallback(
    (room: Room): void => {
      const handleParticipantConnectedInternal = (
        participant: RemoteParticipant
      ): void => {
        console.log(`Participant connected: ${participant.identity}`);

        // Set up handling for this participant's tracks
        participant.tracks.forEach((publication) => {
          if (publication.isSubscribed && publication.track) {
            handleTrackSubscribed(publication.track);
          }

          publication.on("subscribed", handleTrackSubscribed);
        });

        // Watch for new publications
        participant.on("trackPublished", (publication) => {
          try {
            const trackName = publication.trackName || "unknown";
            console.log(
              `Track published: ${trackName}, kind: ${publication.kind}, isSubscribed: ${publication.isSubscribed}`
            );

            // React to track unsubscribed events
            publication.on("unsubscribed", () => {
              console.log(
                `Track ${trackName} was unsubscribed, attempting to resubscribe`
              );
              // Try to resubscribe
              publication.once("subscribed", handleTrackSubscribed);
            });

            // Add track disabled/enabled handlers
            publication.on("disabled", () => {
              console.log(`Track ${trackName} was disabled by publisher`);
              if (publication.kind === "video") {
                setStreamerStatus((prev) => ({ ...prev, cameraOff: true }));
              } else if (publication.kind === "audio") {
                setStreamerStatus((prev) => ({ ...prev, audioMuted: true }));
              }
            });

            publication.on("enabled", () => {
              console.log(`Track ${trackName} was enabled by publisher`);
              if (publication.kind === "video") {
                setStreamerStatus((prev) => ({ ...prev, cameraOff: false }));
                if (publication.track) {
                  handleTrackSubscribed(publication.track);
                }
              } else if (publication.kind === "audio") {
                setStreamerStatus((prev) => ({ ...prev, audioMuted: false }));
              }
            });

            // Handle subscription
            publication.on("subscribed", handleTrackSubscribed);

            // If already subscribed, handle it immediately
            if (publication.isSubscribed && publication.track) {
              handleTrackSubscribed(publication.track);
            }
          } catch (error) {
            console.error("Error handling track publication:", error);
          }
        });
      };

      const handleParticipantDisconnectedInternal = (
        participant: RemoteParticipant
      ): void => {
        console.log(`Participant disconnected: ${participant.identity}`);

        // Clear video tracks if needed
        if (videoContainerRef.current) {
          clearVideoContainer(videoContainerRef.current);
        }

        // Set offline status after a delay
        const offlineTimer = setTimeout(() => {
          setVideoStatus("offline");
        }, 10000);

        // Store the timer so it can be cleared if needed
        streamHealthTimeout.current = offlineTimer;
      };

      room.on("participantConnected", handleParticipantConnectedInternal);
      room.on("participantDisconnected", handleParticipantDisconnectedInternal);

      room.on("disconnected", (disconnectedRoom, error) => {
        console.log(
          `Disconnected from room ${disconnectedRoom.name}: ${
            error?.message || "No error"
          }`
        );
        setVideoStatus("offline");
        setConnectionError(error?.message || "Disconnected from stream");
      });

      room.on("reconnecting", (error) => {
        console.log(`Reconnecting to room: ${error?.message}`);
        setVideoStatus("connecting");
      });

      room.on("reconnected", () => {
        console.log("Reconnected to room");
        setVideoStatus("active");
      });

      // Also handle any existing participants already in the room
      room.participants.forEach(handleParticipantConnectedInternal);
    },
    [handleTrackSubscribed]
  );

  // Define connectToStream with useCallback
  const connectToStream = useCallback(async (): Promise<boolean> => {
    try {
      setVideoStatus("connecting");
      setConnectionError(null);
      setConnectionAttempts((prev) => prev + 1);
      setIsRetrying(true);

      // Generate a unique identity for the viewer
      const identity = generateUniqueIdentity(
        "viewer",
        currentUser?.id || "anonymous"
      );

      // Get the token from our backend
      const token = await clientTwilioService.getToken(slug, identity);

      // Connect to the Twilio room
      const room = await connect(token, {
        name: slug,
        audio: false, // We don't need audio publishing as a viewer
        video: false, // We don't need video publishing as a viewer
        networkQuality: {
          local: 1,
          remote: 1,
        },
        logLevel: "error",
      });

      twilioRoom.current = room;

      // Set up event listeners for the room
      setupRoomEventListeners(room);

      setVideoStatus("active");
      setConnectionError(null);
      setIsRetrying(false);

      // Reset stream health status
      streamHealthChecked.current = false;
      if (streamHealthTimeout.current) {
        clearTimeout(streamHealthTimeout.current);
        streamHealthTimeout.current = null;
      }

      // Return success
      return true;
    } catch (error: unknown) {
      console.error("Error connecting to room:", error);

      // Clear the room reference to prevent stale state
      twilioRoom.current = null;

      let errorMessage = "Failed to connect to stream. Please try again.";

      // Handle specific Twilio errors
      if (error instanceof TwilioError) {
        // Check for token errors
        if (error.code === 20101) {
          errorMessage = "Invalid access token. Please refresh the page.";
        } else if (error.code === 20103) {
          errorMessage =
            "Invalid token issuer/subject. Please refresh the page.";
        } else if (error.code === 20104) {
          errorMessage = "Token expired. Please refresh the page to continue.";
        }
        // Check for room availability errors
        else if (error.code === 53000) {
          errorMessage = "Stream not found or has ended.";
          setVideoStatus("ended");
        } else if (error.code === 53205) {
          errorMessage = "Stream is full. Please try again later.";
        } else {
          // Generic Twilio error with code
          errorMessage = `Connection error (${error.code}): ${error.message}`;
        }
      }
      // Handle network errors
      else if (
        error instanceof Error &&
        (error.message.includes("network") ||
          error.message.includes("connection") ||
          error.message.includes("timeout"))
      ) {
        errorMessage =
          "Network connection lost. Please check your internet and try again.";
      }

      // Set the error state
      setConnectionError(errorMessage);
      setVideoStatus("error");
      setIsRetrying(false);

      // Implement progressive backoff for retries
      if (connectionAttempts < maxConnectionAttempts) {
        const backoffTime = Math.min(
          2000 * Math.pow(2, connectionAttempts - 1),
          10000
        );
        console.log(
          `Will retry connection in ${backoffTime}ms (attempt ${connectionAttempts}/${maxConnectionAttempts})`
        );

        // Set timeout for auto retry with backoff
        setTimeout(() => {
          if (videoStatus === "error" && manualRetryRef.current) {
            manualRetryRef.current();
          }
        }, backoffTime);
      }

      // Return failure
      return false;
    }
  }, [
    slug,
    currentUser,
    connectionAttempts,
    maxConnectionAttempts,
    videoStatus,
    setupRoomEventListeners,
  ]);

  // Define handleRetryAttempt with useCallback
  const handleRetryAttempt = useCallback(async (): Promise<void> => {
    try {
      const shouldConnect = await checkStreamStatus();
      if (shouldConnect) {
        await connectToStream();
      }
    } catch (error: unknown) {
      console.error("Error during retry attempt:", error);
    }
  }, [checkStreamStatus, connectToStream]);

  // Store the retry function in the ref to break circular dependencies
  useEffect(() => {
    manualRetryRef.current = handleRetryAttempt;
  }, [handleRetryAttempt]);

  // Use the new properly defined functions in useCallback
  const checkStreamAndRetry = useCallback(() => {
    return checkStreamStatus();
  }, [checkStreamStatus]);

  const initiateConnection = useCallback(() => {
    return connectToStream();
  }, [connectToStream]);

  // Fix the stream status update in the Firestore listener to properly handle hasStarted
  useEffect(() => {
    // Only attempt connection if we have the necessary conditions
    if (
      !slug ||
      !currentUser ||
      hasEnded || // Use hasEnded to prevent connection attempts on ended streams
      twilioRoom.current || // Check twilioRoom.current instead of room
      isConnectingRef.current ||
      loadingAuth ||
      !hasHydrated
    ) {
      return undefined;
    }

    console.log("[LiveView] Setting up stream status listener for:", slug);
    const streamDocRef = doc(db, "streams", slug);
    const unsubscribe = onSnapshot(streamDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        console.log("[LiveView] Stream status update:", {
          hasStarted: data.hasStarted,
          hasEnded: data.hasEnded,
          status: data.status,
          audioMuted: data.audioMuted || false,
          cameraOff: data.cameraOff || false,
          startedAt: data.startedAt || null,
        });

        // Handle both naming conventions for compatibility
        setStreamerStatus({
          audioMuted:
            data.audioMuted !== undefined
              ? data.audioMuted
              : data.isMuted || false,
          cameraOff:
            data.cameraOff !== undefined
              ? data.cameraOff
              : data.isCameraOff || false,
        });

        // Store stream information
        setStreamTitle(data.title || "Live Stream");
        setThumbnail(data.thumbnail || "/favicon.ico");

        // Store stream start time - handle both Timestamp and string/date formats
        if (data.startedAt) {
          setStreamStartTime(data.startedAt);

          // Calculate duration since stream started
          // Check if startedAt is a Firestore Timestamp or a string
          const startTime =
            data.startedAt instanceof Timestamp
              ? data.startedAt.toDate().getTime()
              : new Date(data.startedAt).getTime();

          const now = Date.now();
          const elapsedSeconds = Math.floor((now - startTime) / 1000);
          setStreamDuration(elapsedSeconds > 0 ? elapsedSeconds : 0);
        }

        // Check if stream is scheduled
        if (data.scheduledAt && !data.hasStarted) {
          setIsScheduled(true);
          setScheduledTime(data.scheduledAt);
        }

        // CRITICAL FIX: Update video status based on stream state with explicit boolean checks
        // Only show as ended when hasEnded is explicitly true
        if (data.hasEnded === true) {
          console.log("[LiveView] Stream has ended, disconnecting from room");
          setVideoStatus("ended");
          setHasEnded(true);
          if (twilioRoom.current) {
            twilioRoom.current.disconnect();
            twilioRoom.current = null;
          }
        }
        // Explicitly check for hasStarted === true to fix incorrect status display
        else if (data.hasStarted === true) {
          console.log(
            "[LiveView] Stream hasStarted=true, setting state and connecting if needed"
          );

          // Set hasStarted first so the useEffect will trigger connection
          setHasStarted(true);
          setHasEnded(false); // Explicitly set hasEnded to false for clarity

          // If we're showing offline or waiting but the stream is actually active,
          // we should attempt to connect
          if (
            videoStatus === "offline" ||
            videoStatus === "waiting" ||
            videoStatus === "error"
          ) {
            console.log(
              "[LiveView] Stream is active but we're showing offline/waiting/error. Attempting to connect..."
            );

            // CRITICAL FIX: Directly initiate connection here instead of just setting status
            if (!twilioRoom.current && !isConnectingRef.current) {
              console.log("[LiveView] Initiating connection to Twilio room");
              isConnectingRef.current = true; // Prevent multiple connection attempts

              initiateConnection()
                .then((success) => {
                  console.log(
                    `[LiveView] Connection attempt result: ${
                      success ? "connected" : "failed"
                    }`
                  );
                  isConnectingRef.current = false;
                })
                .catch((err: Error) => {
                  console.error(
                    "[LiveView] Failed to connect to Twilio room:",
                    err
                  );
                  setVideoStatus("error");
                  setConnectionError(
                    "Failed to connect to stream. Please try refreshing the page."
                  );
                  isConnectingRef.current = false;
                });
            } else {
              // If we can't connect yet, at least update the status
              setVideoStatus("connecting");
            }
          }
          // If we're not showing the offline status, just make sure the status is "active"
          else if (videoStatus !== "connecting") {
            setVideoStatus("active");
          }
        } else if (data.status === "live") {
          // Fallback for streams that might have status="live" without hasStarted=true
          console.log(
            "[LiveView] Stream has status='live' but hasStarted is not true"
          );
          setHasStarted(true);
          setHasEnded(false);

          if (
            videoStatus !== "active" &&
            videoStatus !== "connecting" &&
            !twilioRoom.current
          ) {
            setVideoStatus("connecting");
            initiateConnection().catch((err) => {
              console.error(
                "[LiveView] Failed to connect to stream with status='live':",
                err
              );
            });
          }
        } else {
          console.log(
            "[LiveView] Stream is waiting to start (hasStarted is not true)"
          );
          setVideoStatus("waiting");
          setHasStarted(false);
        }
      } else {
        // Stream doesn't exist, set to offline
        console.log(
          "[LiveView] Stream document doesn't exist, setting to offline"
        );
        setVideoStatus("offline");
      }
    });

    return () => {
      console.log("[LiveView] Cleaning up stream status listener");
      unsubscribe();
    };
  }, [
    slug,
    twilioRoom, // Use twilioRoom instead of room in dependencies
    videoStatus,
    isConnectingRef,
    initiateConnection,
    setVideoStatus,
    setHasStarted,
    setConnectionError,
    currentUser,
    hasEnded,
    hasHydrated,
    loadingAuth,
    setHasEnded,
  ]);

  // Add an effect to automatically recover from error states
  useEffect(() => {
    if (videoStatus === "error" && !isRetrying) {
      // After 30 seconds in error state, automatically try to recover
      const recoveryTimer = setTimeout(() => {
        console.log(
          "[Recovery] Automatically attempting to recover from error state"
        );

        // Reset state
        setConnectionError(null);

        // Check if the stream is actually live and try to reconnect
        const attemptRecovery = async () => {
          try {
            setIsRetrying(true);

            // Get latest stream state from Firestore
            const streamDoc = await getDoc(doc(db, "streams", slug));
            if (streamDoc.exists()) {
              const data = streamDoc.data();

              // If the stream is actually active, try to reconnect
              if (data.hasStarted === true && !data.hasEnded) {
                console.log(
                  "[Recovery] Stream is active, attempting to reconnect"
                );
                setVideoStatus("connecting");
                await checkStreamAndRetry();
                return true; // Return a value to satisfy TypeScript
              } else {
                // If stream isn't active, update UI accordingly
                setVideoStatus(data.hasEnded ? "ended" : "waiting");
                return false; // Return a value to satisfy TypeScript
              }
            }
            return false; // Return a value if streamDoc doesn't exist
          } catch (error) {
            console.error("[Recovery] Auto-recovery attempt failed:", error);
            // Don't update error state, we'll try again later
            return false; // Return a value on error
          } finally {
            setIsRetrying(false);
          }
        };

        attemptRecovery().catch((err) => {
          console.error("[Recovery] Unhandled error in recovery:", err);
        });
      }, 30000); // 30 seconds

      return () => clearTimeout(recoveryTimer);
    }

    return undefined; // Add this line to ensure all code paths return a value
  }, [
    videoStatus,
    isRetrying,
    slug,
    checkStreamAndRetry,
    setConnectionError,
    setVideoStatus,
    setIsRetrying,
  ]);

  // Add a periodic check for the room's health
  useEffect(() => {
    // Only check if we have a room but no video tracks
    if (
      twilioRoom.current &&
      videoStatus === "active" &&
      !streamerStatus.cameraOff &&
      (!remoteVideoTrack ||
        (videoContainerRef.current &&
          !videoContainerRef.current.querySelector("video")))
    ) {
      console.log(
        "[Health] Room exists but video track is missing, checking room health"
      );

      const healthCheck = setInterval(() => {
        // Make sure the room reference is still valid
        if (!twilioRoom.current) {
          console.log(
            "[Health] Room reference no longer valid, clearing interval"
          );
          clearInterval(healthCheck);
          return;
        }

        // Check if we really have a room participant
        if (twilioRoom.current.participants.size > 0) {
          console.log(
            `[Health] Room has ${twilioRoom.current.participants.size} participants`
          );

          // Check each participant for video tracks
          twilioRoom.current.participants.forEach((participant, sid) => {
            console.log(
              `[Health] Checking participant ${participant.identity} (${sid}) for tracks`
            );

            // Check if this participant has tracks we're not seeing
            participant.tracks.forEach((publication, trackSid) => {
              console.log(
                `[Health] Found track ${trackSid}: ${publication.kind}, isSubscribed: ${publication.isSubscribed}`
              );

              // If there's a video track that isn't properly showing up, try to resubscribe
              if (
                publication.kind === "video" &&
                (!remoteVideoTrack ||
                  !videoContainerRef.current?.querySelector("video"))
              ) {
                console.log(
                  `[Health] Found video track that's not showing, attempting to resubscribe`
                );

                if (publication.isSubscribed && publication.track) {
                  console.log(
                    `[Health] Track is already subscribed, trying to attach again`
                  );
                  handleTrackSubscribed(publication.track);
                } else {
                  console.log(
                    `[Health] Track is not subscribed, setting up subscription handler`
                  );
                  publication.on("subscribed", handleTrackSubscribed);
                }
              }
            });
          });
        } else {
          console.log("[Health] Room has no participants");
        }
      }, 5000); // Check every 5 seconds

      return () => clearInterval(healthCheck);
    }

    // Return undefined for the case where we don't set up the interval
    return undefined;
  }, [
    twilioRoom,
    videoStatus,
    streamerStatus.cameraOff,
    remoteVideoTrack,
    videoContainerRef,
    handleTrackSubscribed,
  ]);

  // Add the toggleAudioMute function that was referenced but missing
  const toggleAudioMute = useCallback(() => {
    const newMuteState = !isAudioMuted;
    setIsAudioMuted(newMuteState);
    console.log(
      `[LiveView] ${newMuteState ? "Muting" : "Unmuting"} audio tracks`
    );

    // Find all audio elements and update their muted state
    const audioElements = document.querySelectorAll(
      'audio[data-debug="viewer-audio-track"]'
    );

    if (audioElements.length === 0) {
      console.log("[LiveView] No audio elements found to toggle mute state");
    }

    audioElements.forEach((el) => {
      const audioEl = el as HTMLAudioElement;
      audioEl.muted = newMuteState;

      // If unmuting, try to play the audio
      if (!newMuteState) {
        const playPromise = audioEl.play();
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            console.error(
              "[LiveView] Failed to play audio after unmuting:",
              error
            );
          });
        }
      }

      console.log(
        `[LiveView] Set muted=${newMuteState} on audio track ${audioEl.getAttribute(
          "data-track-sid"
        )}`
      );
    });
  }, [isAudioMuted]);

  // Add debug logs for remote participant and audio track
  useEffect(() => {
    // Log track information when it changes
    if (remoteVideoTrack) {
      console.log(
        `Video track updated: ${remoteVideoTrack.name}, enabled: ${remoteVideoTrack.isEnabled}`
      );
    }

    if (remoteAudioTrack) {
      console.log(
        `Audio track attached: ${remoteAudioTrack.name}, enabled: ${remoteAudioTrack.isEnabled}`
      );

      // Set up mute state based on audio track
      setIsAudioMuted(!remoteAudioTrack.isEnabled);

      // Add listeners for track enable/disable events
      const handleEnabled = () => {
        console.log("Audio track enabled");
        setIsAudioMuted(false);
      };

      const handleDisabled = () => {
        console.log("Audio track disabled");
        setIsAudioMuted(true);
      };

      remoteAudioTrack.on("enabled", handleEnabled);
      remoteAudioTrack.on("disabled", handleDisabled);

      return () => {
        remoteAudioTrack.off("enabled", handleEnabled);
        remoteAudioTrack.off("disabled", handleDisabled);
      };
    }

    return undefined;
  }, [remoteVideoTrack, remoteAudioTrack]);

  // Add a polling mechanism to periodically check stream status
  useEffect(() => {
    // Skip if we already have a connection or are in a final state
    if (
      videoStatus === "active" ||
      videoStatus === "ended" ||
      twilioRoom.current ||
      hasEnded
    ) {
      return;
    }

    console.log("[LiveView] Setting up periodic stream status check");

    // Check every 5 seconds for stream status updates
    const checkInterval = setInterval(async () => {
      try {
        // Only proceed if we're not already connected or in a final state
        if (
          (videoStatus === "waiting" ||
            videoStatus === "connecting" ||
            videoStatus === "offline" ||
            videoStatus === "error") &&
          !twilioRoom.current &&
          !hasEnded
        ) {
          console.log("[LiveView] Performing periodic stream status check");

          // Check Firestore for latest status
          const streamRef = doc(db, "streams", slug);
          const streamDoc = await getDoc(streamRef);

          if (streamDoc.exists()) {
            const data = streamDoc.data();
            console.log("[LiveView] Periodic check found stream data:", {
              hasStarted: data.hasStarted,
              hasEnded: data.hasEnded,
              status: data.status,
            });

            // If stream is active but we're not connected, attempt connection
            if (data.hasStarted === true && data.hasEnded !== true) {
              console.log(
                "[LiveView] Stream is active but we're not connected - attempting connection"
              );

              // Only attempt connection if not already connecting
              if (!isConnectingRef.current) {
                handleRetryAttempt();
              }
            }
          }
        }
      } catch (error) {
        console.error("[LiveView] Error in periodic status check:", error);
      }
    }, 5000); // Check every 5 seconds

    return () => {
      console.log("[LiveView] Clearing periodic stream status check");
      clearInterval(checkInterval);
    };
  }, [slug, videoStatus, twilioRoom, hasEnded, handleRetryAttempt]);

  if (!hasHydrated || !currentUser) return null;

  return (
    <div className="flex h-screen bg-brandBlack text-brandWhite overflow-hidden">
      {/* Left sidebar for navigation/avatar placeholders */}
      <div className="w-16 bg-gray-900 flex flex-col items-center py-4 border-r border-gray-800">
        {/* Avatar placeholders */}
        {[1, 2, 3, 4, 5, 6, 7].map((index) => (
          <div
            key={index}
            className="w-10 h-10 rounded-full bg-gray-800 mb-4 flex items-center justify-center overflow-hidden"
          >
            {index === 1 && (
              <div className="w-2 h-2 rounded-full bg-green-500 absolute top-0 right-0"></div>
            )}
          </div>
        ))}
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col md:flex-row h-full">
        {/* Main video stream area */}
        <div className="flex-1 relative">
          {/* Video container */}
          <VideoContainer
            containerRef={videoContainerRef}
            room={twilioRoom.current}
            isActive={videoStatus === "active"}
          />

          {/* Stream status indicators */}
          <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
            {hasStarted && videoStatus === "active" ? (
              <div className="flex items-center gap-2 bg-red-600 px-3 py-1 rounded-full text-white text-sm">
                <span className="h-2 w-2 rounded-full bg-white animate-pulse"></span>
                LIVE
              </div>
            ) : null}

            {streamStartTime && hasStarted && (
              <div className="bg-black bg-opacity-60 text-brandWhite px-3 py-1 rounded-full text-sm">
                {formatDuration(streamDuration)}
              </div>
            )}
          </div>

          {/* Streamer name and viewer count */}
          <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
            <div className="bg-black bg-opacity-60 px-3 py-1 rounded-full text-brandWhite text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              <span>@Streamer</span>
            </div>
            <div className="bg-black bg-opacity-60 px-3 py-1 rounded-full text-brandWhite text-sm">
              1.2K viewers
            </div>
          </div>

          {/* Stream Status Overlay */}
          <StreamStatusOverlay
            status={videoStatus}
            error={connectionError || undefined}
            isRetrying={isRetrying}
            onRetry={checkStreamAndRetry}
            connectionAttempts={connectionAttempts}
            maxConnectionAttempts={maxConnectionAttempts}
            thumbnail={thumbnail}
            streamTitle={streamTitle}
          />

          {/* Scheduled stream countdown */}
          {isScheduled && videoStatus === "waiting" && scheduledTime && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 bg-opacity-90 z-10">
              <div className="text-center max-w-md">
                <h2 className="text-2xl font-bold mb-2">Stream Scheduled</h2>
                <p className="text-gray-400 mb-4">
                  This stream is scheduled to begin soon.
                </p>

                <div className="mb-6">
                  <Countdown scheduledTime={scheduledTime.toString()} />
                </div>

                {thumbnail && (
                  <div className="relative w-full h-48 rounded-lg overflow-hidden">
                    <Image
                      src={thumbnail}
                      alt={streamTitle || "Stream thumbnail"}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Audio muted indicator */}
          {hasStarted &&
            videoStatus === "active" &&
            streamerStatus.audioMuted && (
              <div className="absolute bottom-4 left-4 bg-black bg-opacity-60 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                <MicOff size={16} className="text-brandOrange" />
                <span>Streamer is muted</span>
              </div>
            )}

          {/* Interactive controls */}
          <div className="absolute bottom-4 right-4 flex gap-2 z-10">
            <Button
              onClick={toggleAudioMute}
              variant="outline"
              size="icon"
              className="bg-black bg-opacity-60 border-0 hover:bg-black hover:bg-opacity-80"
              title={isAudioMuted ? "Unmute" : "Mute"}
            >
              {isAudioMuted ? <MicOff size={18} /> : <Mic size={18} />}
            </Button>
          </div>
        </div>

        {/* Right sidebar: Chat and stream info */}
        <div className="w-full md:w-96 bg-gray-900 border-l border-gray-800 flex flex-col h-full">
          {/* Stream info */}
          <div className="p-4 border-b border-gray-800">
            <h1 className="text-xl font-bold mb-1 truncate">
              {streamTitle || "Live Stream"}
            </h1>
            <div className="flex items-center text-sm text-gray-400">
              <span>@Streamer</span>
              <span className="mx-2">•</span>
              <span>
                {streamDuration > 0 ? formatDuration(streamDuration) : "Live"}
              </span>
            </div>
          </div>

          {/* Stream Tags */}
          <div className="px-4 py-2 border-b border-gray-800 flex flex-wrap gap-2">
            <span className="bg-brandOrange/20 text-brandOrange text-xs px-2 py-1 rounded-full">
              Top Charts
            </span>
            <span className="bg-gray-800 text-gray-200 text-xs px-2 py-1 rounded-full">
              Tags
            </span>
            <span className="bg-gray-800 text-gray-200 text-xs px-2 py-1 rounded-full">
              Question 1
            </span>
            <span className="bg-gray-800 text-gray-200 text-xs px-2 py-1 rounded-full">
              Question 2
            </span>
            <span className="bg-gray-800 text-gray-200 text-xs px-2 py-1 rounded-full">
              Question 3
            </span>
          </div>

          {/* Chat panel */}
          <div className="flex-1 overflow-hidden">
            <StreamChat streamId={slug} className="h-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
