"use client";
import React, { useState, useCallback, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { db } from "@/lib/config/firebase";
import { doc, getDoc, onSnapshot, Timestamp } from "firebase/firestore";
import StreamChat from "@/components/streaming/StreamChat";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { clearVideoContainer } from "@/lib/utils/streaming";
import {
  Room,
  RemoteAudioTrack,
  RemoteVideoTrack,
  RemoteParticipant,
  RemoteTrack,
  RemoteTrackPublication,
  connect,
  TwilioError,
} from "twilio-video";
import { MicOff, Mic, VideoOff } from "lucide-react";
import { Countdown } from "@/components/streaming/Countdown";
import { ClientTwilioService } from "@/lib/services/ClientTwilioService";

// Create a static instance of ClientTwilioService for the client side
const clientTwilioService = new ClientTwilioService();

// Move error type definition out of connectToRoom
type TwilioErrorType = {
  name?: string;
  code?: number;
  message?: string;
};

export default function LiveViewPage() {
  const pathname = usePathname();
  const slug = pathname?.split("/").pop() || "";
  const { currentUser } = useAuthStore();

  // Using isStreamStarted to track if the stream is active
  const [hasStarted, setHasStarted] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);
  const [room, setRoom] = useState<Room | null>(null);
  const [remoteParticipant, setRemoteParticipant] =
    useState<RemoteParticipant | null>(null);
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
  const [authError, setAuthError] = useState(false);

  // This state is used to detect browser autoplay restrictions
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const [offlineTimerId, setOfflineTimerId] = useState<NodeJS.Timeout | null>(
    null
  );
  const [streamTitle, setStreamTitle] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");

  // State to track whether we're currently attempting to connect
  const [isConnecting, setIsConnecting] = useState(false);
  // Add error state
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const isMountedRef = useRef(false);
  const isConnectingRef = useRef(false);

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
      setAuthError(true);
      // Don't redirect here, we'll show a UI message instead
    }
  }, [currentUser, hasHydrated, loadingAuth]);

  // Update streamer status in Firestore and store stream start time
  useEffect(() => {
    if (!slug) return;

    console.log("[Status] Setting up stream status listener for:", slug);
    const streamDocRef = doc(db, "streams", slug);
    const unsubscribe = onSnapshot(streamDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        console.log("[Status] Stream status update:", {
          hasStarted: data.hasStarted,
          hasEnded: data.hasEnded,
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

        // Update video status based on stream state
        if (data.hasEnded) {
          console.log("[Status] Stream has ended, disconnecting from room");
          setVideoStatus("ended");
          if (room) {
            room.disconnect();
          }
        } else if (data.hasStarted) {
          console.log("[Status] Stream has started");
          setVideoStatus("active");
          setHasStarted(true);
        } else {
          console.log("[Status] Stream is waiting to start");
          setVideoStatus("waiting");
          setHasStarted(false);
        }
      }
    });

    return () => {
      console.log("[Status] Cleaning up stream status listener");
      unsubscribe();
    };
  }, [slug, room]);

  // Audio muting handler - moved outside of render for React Hook rules
  const toggleAudioMute = useCallback(() => {
    setIsAudioMuted((prev) => !prev);

    // Update elements for the remote audio track
    if (remoteAudioTrack) {
      const audioElements = document.querySelectorAll(
        `audio[data-track-sid="${remoteAudioTrack.sid}"]`
      );
      audioElements.forEach((el) => {
        (el as HTMLAudioElement).muted = !isAudioMuted;
      });
    }
  }, [remoteAudioTrack, isAudioMuted]);

  // Fix remote track handling for proper video display
  const handleTrackSubscribed = useCallback((track: RemoteTrack) => {
    console.log(`Track subscribed: ${track.kind} - ${track.name}`);

    if (track.kind === "video") {
      console.log("Adding video track to container");
      const videoTrack = track as RemoteVideoTrack;
      setRemoteVideoTrack(videoTrack);

      if (videoContainerRef.current) {
        // Clear existing elements first
        clearVideoContainer(videoContainerRef.current);

        // Create and attach a new video element
        const videoElement = document.createElement("video");
        videoElement.style.width = "100%";
        videoElement.style.height = "100%";
        videoElement.style.objectFit = "cover";
        videoElement.setAttribute("autoplay", "true");
        videoElement.setAttribute("playsinline", "true");

        // Attach track to the video element
        videoTrack.attach(videoElement);

        // Add to container
        videoContainerRef.current.appendChild(videoElement);
        setVideoStatus("active");
      } else {
        console.error("Video container ref is null, can't attach track");
      }
    } else if (track.kind === "audio") {
      console.log("Setting up audio track");
      setRemoteAudioTrack(track as RemoteAudioTrack);
      track.attach(); // This creates an audio element and adds it to the DOM
    }
  }, []);

  // Handler for track published
  const handleTrackPublished = useCallback(
    (publication: RemoteTrackPublication) => {
      try {
        if (!publication) {
          console.warn(
            "handleTrackPublished called with undefined publication"
          );
          return;
        }

        const trackName = publication.trackName || "unknown";
        console.log(
          "Track published:",
          trackName,
          "kind:",
          publication.kind,
          "isSubscribed:",
          publication.isSubscribed,
          "track exists:",
          !!publication.track,
          "track enabled:",
          publication.track?.isEnabled
        );

        // If this is a video track, clear the container to prepare for the new track
        if (publication.kind === "video") {
          console.log(
            "Video track published, clearing container to prepare for new track"
          );
          clearVideoContainer(videoContainerRef.current);

          // Force the track to be subscribed if it's not already
          if (!publication.isSubscribed) {
            console.log(
              `Attempting to subscribe to track: ${publication.trackName}`
            );
            publication.on("subscribed", handleTrackSubscribed);

            // We can't force subscription directly, but we can monitor for subscription
            console.log(
              `Waiting for track ${publication.trackName} to be subscribed automatically`
            );
          } else if (publication.track) {
            console.log(
              `Track already subscribed, handling: ${publication.trackName}`
            );
            handleTrackSubscribed(publication.track);
          }
        }

        if (publication.isSubscribed && publication.track) {
          console.log("Track is already subscribed, handling directly");
          handleTrackSubscribed(publication.track);
        } else {
          console.log(
            "Track is not yet subscribed, setting up subscription handler"
          );

          // Set up a one-time handler for when the track is subscribed
          const onSubscribed = (track: RemoteTrack) => {
            try {
              console.log(
                "Track was subscribed after publication:",
                trackName,
                "kind:",
                track.kind
              );
              handleTrackSubscribed(track);
            } catch (error) {
              console.error("Error in onSubscribed handler:", error);
            } finally {
              // Always clean up the event listener
              publication.off("subscribed", onSubscribed);
            }
          };

          publication.on("subscribed", onSubscribed);

          // Set a timeout to check if the track was subscribed
          setTimeout(() => {
            if (publication.isSubscribed && publication.track) {
              console.log(
                "Track was subscribed after timeout, handling now:",
                trackName
              );
              handleTrackSubscribed(publication.track);
            } else {
              console.warn(
                "Track still not subscribed after timeout:",
                trackName
              );
            }
          }, 2000);
        }
      } catch (error) {
        console.error("Error in handleTrackPublished:", error);
      }
    },
    [handleTrackSubscribed, videoContainerRef]
  );

  // Handler for participant connected
  const handleParticipantConnected = useCallback(
    (participant: RemoteParticipant) => {
      try {
        console.log(
          `Participant connected: ${participant.identity}, sid: ${participant.sid}`
        );
        setRemoteParticipant(participant);

        // Handle participant tracks
        participant.tracks.forEach(handleTrackPublished);
        participant.on("trackPublished", handleTrackPublished);

        // Disconnect logic
        participant.on("disconnected", () => {
          console.log(
            `Participant disconnected: ${participant.identity}, sid: ${participant.sid}`
          );
          setRemoteParticipant(null);
        });
      } catch (error) {
        console.error("Error in handleParticipantConnected:", error);
      }
    },
    [handleTrackPublished]
  );

  // Handler for participant disconnected
  const handleParticipantDisconnected = useCallback(
    (participant: RemoteParticipant) => {
      try {
        console.log(
          `Participant disconnected: ${participant.identity}, sid: ${participant.sid}`
        );
        setRemoteParticipant(null);
        setRemoteVideoTrack(null);
        setRemoteAudioTrack(null);

        // Clear the video container
        if (videoContainerRef.current) {
          clearVideoContainer(videoContainerRef.current);
        }

        // Set a timeout to mark the stream as offline
        if (offlineTimerId) clearTimeout(offlineTimerId);
        setOfflineTimerId(
          setTimeout(() => {
            setVideoStatus("offline");
            setOfflineTimerId(null);
          }, 10000) // Wait 10 seconds
        );

        // Clean up participant listeners
        participant.removeAllListeners();
      } catch (error) {
        console.error("Error in handleParticipantDisconnected:", error);
      }
    },
    [offlineTimerId]
  );

  // Connection Effect to Twilio Room
  useEffect(() => {
    // Only run if essential conditions are met and not already connected/connecting
    if (
      !slug ||
      !currentUser ||
      hasEnded || // Don't connect if stream has definitively ended
      room || // Already connected
      isConnectingRef.current || // Already attempting connection
      loadingAuth || // Wait for auth to finish loading
      !hasHydrated // Wait for zustand hydration
    ) {
      return;
    }

    // Check if stream has started or is scheduled appropriately before attempting connection
    if (!hasStarted && !isScheduled) {
      console.log("[Connection] Stream has not started, waiting...");
      if (isMountedRef.current) setVideoStatus("waiting");
      return;
    }
    if (isScheduled && scheduledTime && scheduledTime.toDate() > new Date()) {
      console.log("[Connection] Stream is scheduled for later, waiting...");
      if (isMountedRef.current) setVideoStatus("waiting");
      return;
    }

    console.log("[Connection] Conditions met, starting connection attempt...");
    isConnectingRef.current = true; // Mark as connecting
    if (isMountedRef.current) {
      setConnectionError(null);
      setVideoStatus("connecting");
    }

    let localRoom: Room | null = null;
    let cancelled = false; // Flag to prevent actions after cleanup
    let connectAttempts = 0;
    const maxAttempts = 3;

    // Define the connection function inside the effect
    const connectToRoom = async () => {
      if (cancelled) return; // Check cancellation flag

      // Nested helper to check Firestore before connecting
      const checkStreamExists = async (): Promise<boolean> => {
        if (cancelled || !isMountedRef.current) return false;
        try {
          const streamDocRef = doc(db, "streams", slug);
          const streamDoc = await getDoc(streamDocRef);
          if (!isMountedRef.current || cancelled) return false;

          if (!streamDoc.exists()) {
            console.log(
              "[Connection] Stream does not exist in Firestore:",
              slug
            );
            if (isMountedRef.current) {
              setConnectionError(
                "Stream not found. It may have been deleted or never existed."
              );
              setVideoStatus("error");
            }
            return false;
          }

          const streamData = streamDoc.data();
          if (streamData.hasEnded) {
            console.log("[Connection] Stream has ended:", slug);
            if (isMountedRef.current) {
              setConnectionError("This stream has ended.");
              setVideoStatus("ended");
            }
            return false;
          }

          if (!streamData.hasStarted) {
            console.log("[Connection] Stream has not started yet:", slug);
            if (isMountedRef.current) setVideoStatus("waiting"); // Set waiting, not error
            return false;
          }

          return true; // Stream exists and is active
        } catch (error) {
          console.error("[Connection] Error checking if stream exists:", error);
          if (isMountedRef.current && !cancelled) {
            setConnectionError(
              "Error checking stream status. Please try again later."
            );
            setVideoStatus("error");
          }
          return false;
        }
      };

      // First check if the stream exists and is active
      const streamExistsAndActive = await checkStreamExists();
      if (!streamExistsAndActive) {
        isConnectingRef.current = false; // Reset connecting flag
        return;
      }

      if (cancelled || !isMountedRef.current) return;

      // Increment attempt count
      connectAttempts++;
      console.log(
        `[Connection] Attempt ${connectAttempts} to connect to room: ${slug}`
      );

      if (connectAttempts > maxAttempts) {
        console.error(
          `[Connection] Failed to connect after ${maxAttempts} attempts`
        );
        if (isMountedRef.current) {
          setConnectionError(
            "Failed to connect after multiple attempts. Please try refreshing."
          );
          setVideoStatus("error");
        }
        isConnectingRef.current = false;
        return;
      }

      // Get token and connect
      try {
        const identity =
          currentUser?.username || currentUser?.email || `user-${Date.now()}`;
        const token = await clientTwilioService.getToken(identity, slug);

        if (cancelled || !isMountedRef.current) {
          console.log("[Connection] Cancelled or unmounted before connecting.");
          return;
        }

        console.log("[Connection] Got token, connecting to Twilio...");
        localRoom = await connect(token, {
          name: slug,
          automaticSubscription: true,
        });

        if (cancelled || !isMountedRef.current) {
          console.log("[Connection] Cancelled or unmounted after connecting.");
          localRoom?.disconnect();
          return;
        }

        console.log(
          `[Connection] Successfully connected to room: ${localRoom.name}`
        );
        if (isMountedRef.current) {
          setRoom(localRoom);
          setVideoStatus("active");
        }
        isConnectingRef.current = false; // Connection successful

        // Handle existing participants
        localRoom.participants.forEach(handleParticipantConnected);

        // Set up room listeners
        localRoom.on("participantConnected", handleParticipantConnected);
        localRoom.on("participantDisconnected", handleParticipantDisconnected);
        localRoom.on("disconnected", (_room, error) => {
          // Check mount status inside listener callback
          if (!isMountedRef.current || cancelled) return;

          console.log("[Connection] Room disconnected", error);
          setRoom(null);
          setRemoteParticipant(null);
          setRemoteVideoTrack(null);
          setRemoteAudioTrack(null);
          isConnectingRef.current = false; // Reset connecting flag on disconnect

          if (error) {
            console.error(
              "[Connection] Room disconnect error:",
              error.code,
              error.message
            );
            let errorMsg = `Connection error: ${error.message}`;
            if (error.code === 53001)
              errorMsg = "Room not found. The stream may have ended.";
            if (error.code === 53205)
              errorMsg =
                "You're already connected to this stream in another window.";
            setConnectionError(errorMsg);
            setVideoStatus("error");
          } else if (hasEnded) {
            setVideoStatus("ended");
          } else {
            setVideoStatus("offline");
          }
        });
      } catch (error) {
        console.error(
          `[Connection] Error connecting on attempt ${connectAttempts}:`,
          error
        );
        if (isMountedRef.current && !cancelled) {
          const twilioError = error as TwilioError;
          let errorMsg = `Connection error: ${twilioError.message}`;
          if (twilioError.code === 20101)
            errorMsg = "Invalid Twilio token. Please refresh.";
          if (twilioError.code === 53118)
            errorMsg =
              "Could not connect. The room may be full or unavailable.";
          setConnectionError(errorMsg);
          setVideoStatus("error");
        }
        isConnectingRef.current = false; // Reset on error
        // Optionally retry after a delay if connectAttempts < maxAttempts
        if (connectAttempts < maxAttempts && !cancelled) {
          console.log(`[Connection] Retrying connection in 3 seconds...`);
          setTimeout(() => {
            if (!cancelled && isMountedRef.current) {
              connectToRoom();
            }
          }, 3000);
        }
      }
    };

    // Initial call to start the connection process
    connectToRoom();

    // Cleanup function for the useEffect
    return () => {
      console.log("[Connection] Cleaning up connection effect");
      cancelled = true; // Set cancellation flag
      if (localRoom) {
        console.log("[Connection] Disconnecting from room in cleanup");
        localRoom.disconnect();
        // Check mount status before setting state in cleanup
        if (isMountedRef.current) setRoom(null);
      }
      // Always reset the connecting flag on cleanup to allow future attempts
      isConnectingRef.current = false;
    };
  }, [
    // Core identifiers & states that MUST trigger a re-evaluation
    slug,
    currentUser,
    hasStarted,
    hasEnded,
    isScheduled,
    scheduledTime,
    room, // If room changes (e.g., disconnects and becomes null), re-evaluate
    loadingAuth, // Need to wait for auth
    hasHydrated, // Need to wait for hydration
    // Callbacks (MUST be stable - ensure they are wrapped in useCallback with correct deps)
    handleParticipantConnected,
    handleParticipantDisconnected,
  ]);

  // Add track status monitoring
  useEffect(() => {
    if (!remoteParticipant) return;

    const handleTrackStatus = (publication: RemoteTrackPublication) => {
      // Safely handle the case where publication might be undefined
      if (!publication) {
        console.warn("handleTrackStatus called with undefined publication");
        return;
      }

      // Safely access trackName with fallback
      const trackName = publication.trackName || "unknown";

      // Safely handle the case where track might be null
      const track = publication.track;
      if (!track) {
        console.warn(`Track is null for publication: ${trackName}`);
        return;
      }

      console.log(
        "Track status change:",
        trackName,
        "video enabled:",
        track.kind === "video" ? track.isEnabled : "n/a",
        "audio enabled:",
        track.kind === "audio" ? track.isEnabled : "n/a"
      );

      // Update UI based on track kind and enabled status
      if (track.kind === "video") {
        setStreamerStatus((prev) => ({
          ...prev,
          cameraOff: !track.isEnabled,
        }));
      } else if (track.kind === "audio") {
        setStreamerStatus((prev) => ({
          ...prev,
          audioMuted: !track.isEnabled,
        }));
      }
    };

    const handleSubscribed = (
      track: RemoteTrack,
      publication: RemoteTrackPublication
    ) => {
      if (!track || !publication) {
        console.warn(
          "[🔇] handleSubscribed called with undefined track or publication:",
          {
            track,
            publication,
          }
        );
        return;
      }

      console.log(
        "Track subscribed event:",
        publication.trackName || "unknown"
      );
      handleTrackStatus(publication);
    };

    // Handle existing tracks
    remoteParticipant.tracks.forEach((publication) => {
      if (publication.isSubscribed) {
        handleTrackStatus(publication);
      }
      publication.on("subscribed", handleSubscribed);
      publication.on("unsubscribed", handleTrackStatus);
    });

    // Monitor for new track publications
    remoteParticipant.on("trackSubscribed", handleSubscribed);
    remoteParticipant.on("trackUnsubscribed", handleTrackStatus);

    // Monitor track enabled/disabled status changes
    remoteParticipant.on("trackEnabled", handleTrackStatus);
    remoteParticipant.on("trackDisabled", handleTrackStatus);

    // Cleanup function
    return () => {
      remoteParticipant.tracks.forEach((publication) => {
        publication.off("subscribed", handleSubscribed);
        publication.off("unsubscribed", handleTrackStatus);
      });
      remoteParticipant.off("trackSubscribed", handleSubscribed);
      remoteParticipant.off("trackUnsubscribed", handleTrackStatus);
      remoteParticipant.off("trackEnabled", handleTrackStatus);
      remoteParticipant.off("trackDisabled", handleTrackStatus);
    };
  }, [remoteParticipant]);

  // Add periodic check for video tracks when camera is supposedly on
  useEffect(() => {
    if (!hasStarted || !remoteParticipant || streamerStatus.cameraOff) return;

    const checkInterval = setInterval(() => {
      const hasVideoElement =
        videoContainerRef.current &&
        !!videoContainerRef.current.querySelector("video");
      if (!hasVideoElement) {
        console.log(
          "[Periodic Check] No video element found, attempting to resubscribe to tracks"
        );
        remoteParticipant.tracks.forEach((publication) => {
          if (
            publication.kind === "video" &&
            publication.isSubscribed &&
            publication.track
          ) {
            console.log(
              `[Periodic Check] Resubscribing to video track: ${publication.trackName}`
            );
            handleTrackSubscribed(publication.track);
          }
        });
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(checkInterval);
  }, [
    hasStarted,
    remoteParticipant,
    streamerStatus.cameraOff,
    handleTrackSubscribed,
  ]);

  // Add connection status monitoring
  useEffect(() => {
    if (!room) return;

    const handleReconnected = () => {
      console.log("Reconnected to room");
      setVideoStatus("active");
    };

    const handleReconnecting = () => {
      console.log("Reconnecting to room...");
    };

    room.on("reconnected", handleReconnected);
    room.on("reconnecting", handleReconnecting);

    return () => {
      room.off("reconnected", handleReconnected);
      room.off("reconnecting", handleReconnecting);
    };
  }, [room]);

  // Update streamer status in UI
  useEffect(() => {
    if (!slug) return;

    const streamerStatusRef = doc(db, "streams", slug);
    const unsubscribe = onSnapshot(streamerStatusRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        console.log("Stream data from Firestore:", data);

        // Handle both possible field names for compatibility
        setStreamerStatus({
          // Check both field names for compatibility
          audioMuted:
            data.audioMuted !== undefined
              ? data.audioMuted
              : data.isMuted || false,
          cameraOff:
            data.cameraOff !== undefined
              ? data.cameraOff
              : data.isCameraOff || false,
        });

        // If camera is not off but we're not seeing video, try to resubscribe to tracks
        const isCameraOff =
          data.cameraOff !== undefined
            ? data.cameraOff
            : data.isCameraOff || false;
        if (
          !isCameraOff &&
          remoteParticipant &&
          videoContainerRef.current &&
          !videoContainerRef.current.querySelector("video")
        ) {
          console.log(
            "Camera is on but no video element found, attempting to resubscribe to tracks"
          );
          remoteParticipant.tracks.forEach((publication) => {
            if (
              publication.track &&
              publication.isSubscribed &&
              publication.kind === "video"
            ) {
              console.log(
                `Resubscribing to video track: ${publication.trackName}`
              );
              handleTrackSubscribed(publication.track);
            }
          });
        }
      }
    });

    return () => unsubscribe();
  }, [slug, remoteParticipant, handleTrackSubscribed]);

  // Define forceCheckAndResubscribe function before it's used in useEffect
  const forceCheckAndResubscribe = useCallback(() => {
    if (!remoteParticipant || !videoContainerRef.current) return;

    console.log("Force checking for video tracks to resubscribe");

    // Check if we have a video element
    const hasVideoElement = !!videoContainerRef.current.querySelector("video");

    // If we don't have a video element but the camera is on, try to resubscribe
    if (!hasVideoElement && !streamerStatus.cameraOff) {
      console.log(
        "No video element found but camera is on, attempting to resubscribe to all tracks"
      );

      // First clear the container
      clearVideoContainer(videoContainerRef.current);

      // Then try to resubscribe to all video tracks
      let foundVideoTrack = false;
      remoteParticipant.tracks.forEach((publication) => {
        if (
          publication.kind === "video" &&
          publication.isSubscribed &&
          publication.track
        ) {
          console.log(`Resubscribing to video track: ${publication.trackName}`);
          handleTrackSubscribed(publication.track);
          foundVideoTrack = true;
        }
      });

      if (!foundVideoTrack) {
        console.log(
          "No subscribed video tracks found, attempting to subscribe to any available tracks"
        );
        remoteParticipant.tracks.forEach((publication) => {
          if (publication.kind === "video") {
            console.log(
              `Setting up subscription for track: ${publication.trackName}`
            );
            publication.on("subscribed", handleTrackSubscribed);
          }
        });
      }
    }
  }, [
    remoteParticipant,
    videoContainerRef,
    streamerStatus.cameraOff,
    handleTrackSubscribed,
  ]);

  // Add an effect to periodically check for video tracks when camera is on
  useEffect(() => {
    if (!hasStarted || !remoteParticipant || streamerStatus.cameraOff) return;

    // Initial check
    forceCheckAndResubscribe();

    // Set up periodic checks
    const checkInterval = setInterval(() => {
      const hasVideoElement =
        videoContainerRef.current &&
        !!videoContainerRef.current.querySelector("video");
      if (!hasVideoElement && !streamerStatus.cameraOff) {
        console.log("Periodic check: No video element found but camera is on");
        forceCheckAndResubscribe();
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(checkInterval);
  }, [
    hasStarted,
    remoteParticipant,
    streamerStatus.cameraOff,
    forceCheckAndResubscribe,
  ]);

  // Add a useEffect hook to load the stream title and thumbnail
  useEffect(() => {
    if (!slug) return;

    const fetchStreamInfo = async () => {
      try {
        const streamDoc = await getDoc(doc(db, "streams", slug));
        if (streamDoc.exists()) {
          const data = streamDoc.data();
          setStreamTitle(data.title || "Untitled Stream");
          setThumbnailUrl(
            data.thumbnail ||
              "https://1.bp.blogspot.com/-Rsu_fHvj-IA/YH0ohFqGK_I/AAAAAAAAm7o/dOKXFVif7hYDymAsCNZRe4MK3p7ihTGmgCLcBGAsYHQ/s2362/Stream.jpg"
          );
        }
      } catch (error) {
        console.error("Error fetching stream info:", error);
      }
    };

    fetchStreamInfo();
  }, [slug]);

  // Updated function to check for scheduled time
  useEffect(() => {
    if (!slug) return;

    const checkScheduledTime = async () => {
      try {
        const streamDoc = await getDoc(doc(db, "streams", slug));
        if (streamDoc.exists()) {
          const data = streamDoc.data();
          console.log("Stream data for scheduling:", data);

          if (data.scheduledAt) {
            console.log("Stream scheduled for:", data.scheduledAt);

            // Parse and validate the date
            const scheduledDate = new Date(data.scheduledAt);
            if (!isNaN(scheduledDate.getTime())) {
              console.log(
                "Valid scheduled date found:",
                scheduledDate.toString()
              );
              console.log(
                "Time until stream:",
                scheduledDate.getTime() - new Date().getTime(),
                "ms"
              );

              setIsScheduled(true);
              setScheduledTime(data.scheduledAt);
            } else {
              console.error(
                "Invalid date format in scheduledAt:",
                data.scheduledAt
              );
              setIsScheduled(false);
            }
          } else {
            console.log("No schedule time found in stream data");
            setIsScheduled(false);
          }
        }
      } catch (error) {
        console.error("Error checking scheduled time:", error);
      }
    };

    checkScheduledTime();
  }, [slug]);

  // Timer Effect for Stream Duration
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (hasStarted && streamStartTime) {
      // Define the function to be called by setInterval inside the effect
      const updateDuration = () => {
        // Access the ref's current value INSIDE the callback
        if (isMountedRef.current) {
          const now = Date.now();

          // Check if streamStartTime is a Firestore Timestamp or a date string
          const start =
            streamStartTime instanceof Timestamp
              ? streamStartTime.toDate().getTime()
              : new Date(streamStartTime).getTime();

          const elapsedSeconds = Math.floor((now - start) / 1000);
          setStreamDuration(elapsedSeconds > 0 ? elapsedSeconds : 0);
        }
      };

      // Call immediately once
      updateDuration();
      // Set the interval
      timer = setInterval(updateDuration, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [hasStarted, streamStartTime]); // Dependencies are correct

  // Format time as HH:MM:SS
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (!hasHydrated || !currentUser) return null;

  return (
    <div className="h-screen w-screen flex flex-col bg-brandBlack text-brandWhite overflow-hidden">
      <div className="flex items-center justify-between py-2 px-4 border-b border-gray-800">
        <div className="flex items-center space-x-4">
          <div className="h-8 w-8 rounded overflow-hidden flex-shrink-0 bg-brandGray">
            <Image
              src={thumbnailUrl}
              alt="Stream thumbnail"
              className="h-full w-full object-cover"
              width={32}
              height={32}
              onError={() => {
                setThumbnailUrl(
                  "https://1.bp.blogspot.com/-Rsu_fHvj-IA/YH0ohFqGK_I/AAAAAAAAm7o/dOKXFVif7hYDymAsCNZRe4MK3p7ihTGmgCLcBGAsYHQ/s2362/Stream.jpg"
                );
              }}
            />
          </div>
          <h1 className="text-lg font-bold text-brandWhite">{streamTitle}</h1>
        </div>

        {hasStarted && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-red-600 px-2 py-0.5 rounded-full text-white text-xs">
              <span className="h-2 w-2 rounded-full bg-white animate-pulse"></span>
              LIVE
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col md:flex-row h-[calc(100vh-2.5rem)]">
        {/* Video Section */}
        <div className="flex-1 p-2 md:p-4 h-full">
          <div className="w-full h-full relative">
            <div
              ref={videoContainerRef}
              className="w-full aspect-video bg-gray-900 relative overflow-hidden rounded-lg shadow-lg"
            ></div>

            {/* Status Overlays */}
            {videoStatus === "waiting" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-80 text-white rounded-lg">
                <div className="mb-4">
                  {isScheduled ? (
                    <>
                      <h2 className="text-xl font-bold mb-4 text-center">
                        Stream Scheduled
                      </h2>
                      <Countdown
                        scheduledTime={
                          scheduledTime
                            ? scheduledTime.toDate().toISOString()
                            : null
                        }
                      />
                    </>
                  ) : (
                    <>
                      <div className="animate-pulse flex flex-col items-center">
                        <div className="w-4 h-4 bg-yellow-500 rounded-full mb-2"></div>
                        <h2 className="text-xl font-bold">
                          Waiting for Streamer
                        </h2>
                      </div>
                      <p className="text-sm text-gray-400 mt-2">
                        Stream will begin shortly
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}

            {videoStatus === "connecting" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80 text-white rounded-lg">
                <div className="animate-pulse flex flex-col items-center">
                  <div className="w-4 h-4 bg-blue-500 rounded-full mb-2"></div>
                  <h2 className="text-xl font-bold">Connecting to Stream</h2>
                  <p className="text-sm text-gray-400 mt-2">Please wait...</p>
                </div>
              </div>
            )}

            {videoStatus === "offline" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80 text-white rounded-lg">
                <div className="flex flex-col items-center">
                  <div className="w-4 h-4 bg-red-500 rounded-full mb-2"></div>
                  <h2 className="text-xl font-bold">Stream is Offline</h2>
                  {connectionError ? (
                    <p className="text-sm text-gray-400 mt-2 text-center max-w-md px-4">
                      {connectionError}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-400 mt-2">
                      Please try again later
                    </p>
                  )}
                </div>
              </div>
            )}

            {videoStatus === "error" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80 text-white rounded-lg">
                <div className="flex flex-col items-center">
                  <div className="w-4 h-4 bg-red-500 rounded-full mb-2"></div>
                  <h2 className="text-xl font-bold">Connection Error</h2>
                  {connectionError ? (
                    <p className="text-sm text-gray-400 mt-2 text-center max-w-md px-4">
                      {connectionError}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-400 mt-2">
                      There was a problem connecting to the stream.
                    </p>
                  )}
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-4 px-4 py-2 bg-brandOrange text-brandBlack rounded hover:bg-brandOrange/80 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}

            {videoStatus === "ended" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80 text-white rounded-lg">
                <div className="flex flex-col items-center">
                  <div className="w-4 h-4 bg-red-500 rounded-full mb-2"></div>
                  <h2 className="text-xl font-bold">Stream Has Ended</h2>
                  <p className="text-sm text-gray-400 mt-2">
                    Thank you for watching!
                  </p>
                </div>
              </div>
            )}

            {/* Live Indicator */}
            {videoStatus === "active" && (
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <div className="flex items-center gap-2 bg-red-600 px-3 py-1 rounded-full text-white text-sm">
                  <span className="h-2 w-2 rounded-full bg-white animate-pulse"></span>
                  LIVE
                </div>
                {streamStartTime && (
                  <div className="bg-black bg-opacity-60 px-3 py-1 rounded-full text-white text-sm">
                    {formatDuration(streamDuration)}
                  </div>
                )}
              </div>
            )}

            {/* Audio/Video Status Indicators - Show even when video is active */}
            {videoStatus === "active" && (
              <div className="absolute top-4 right-4 flex items-center gap-2">
                {streamerStatus.audioMuted && (
                  <div className="flex items-center gap-1 bg-black bg-opacity-70 px-3 py-1 rounded-full text-white text-sm">
                    <MicOff size={16} />
                    <span>Muted</span>
                  </div>
                )}
                {streamerStatus.cameraOff && (
                  <div className="flex items-center gap-1 bg-black bg-opacity-70 px-3 py-1 rounded-full text-white text-sm">
                    <VideoOff size={16} />
                    <span>No Video</span>
                  </div>
                )}
              </div>
            )}

            {/* Large Overlay Icons for Muted/Camera Off */}
            {videoStatus === "active" && (
              <>
                {/* Center Camera Off Icon */}
                {streamerStatus.cameraOff && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-black bg-opacity-60 p-5 rounded-full">
                      <VideoOff size={60} className="text-white" />
                    </div>
                  </div>
                )}

                {/* Bottom-right Audio Muted Icon */}
                {streamerStatus.audioMuted && (
                  <div className="absolute bottom-4 right-4">
                    <div className="bg-black bg-opacity-60 p-2 rounded-full">
                      <MicOff size={24} className="text-white" />
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Audio control for viewer */}
            {videoStatus === "active" && remoteAudioTrack && (
              <div className="absolute bottom-4 left-4">
                <button
                  onClick={toggleAudioMute}
                  className="flex items-center gap-2 bg-black bg-opacity-70 px-3 py-2 rounded-full text-white"
                >
                  {isAudioMuted ? (
                    <>
                      <MicOff size={18} />
                      <span className="text-sm">Unmute</span>
                    </>
                  ) : (
                    <>
                      <Mic size={18} />
                      <span className="text-sm">Mute</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Chat Section */}
        <div className="w-full md:w-96 h-full p-2 md:p-4">
          <StreamChat streamId={slug} className="h-full" />
        </div>
      </div>
    </div>
  );
}
