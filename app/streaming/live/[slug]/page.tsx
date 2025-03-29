"use client";
import React, { useState, useCallback, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { db } from "@/lib/config/firebase";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
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
  const [scheduledTime, setScheduledTime] = useState("");
  const [streamStartTime, setStreamStartTime] = useState<string | null>(null);
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

  // All useEffect hooks must be defined at the top level
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

  // Listen for stream status from Firestore
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

        setStreamerStatus({
          audioMuted: data.audioMuted || false,
          cameraOff: data.cameraOff || false,
        });

        // Store stream start time
        if (data.startedAt) {
          setStreamStartTime(data.startedAt);

          // Calculate duration since stream started
          const startTime = new Date(data.startedAt).getTime();
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

  // Connection effect
  useEffect(() => {
    // Don't attempt to connect if any of these conditions are true
    if (
      !slug ||
      !currentUser ||
      isConnecting ||
      room ||
      authError ||
      loadingAuth
    )
      return;

    console.log("Starting Twilio room connection process...");
    let isSubscribed = true;
    let roomCleanup: (() => void) | null = null;
    let connectAttempts = 0;
    const maxAttempts = 3;
    let debounceTimer: NodeJS.Timeout | null = null;

    const checkStreamExists = async () => {
      try {
        const streamDocRef = doc(db, "streams", slug);
        const streamDoc = await getDoc(streamDocRef);

        if (!streamDoc.exists()) {
          console.log("[Connection] Stream does not exist in Firestore:", slug);
          setConnectionError(
            "Stream not found. It may have been deleted or never existed."
          );
          setVideoStatus("error");
          return false;
        }

        const streamData = streamDoc.data();
        if (streamData.hasEnded) {
          console.log("[Connection] Stream has ended:", slug);
          setConnectionError("This stream has ended.");
          setVideoStatus("ended");
          return false;
        }

        if (!streamData.hasStarted) {
          console.log("[Connection] Stream has not started yet:", slug);
          // Don't set error, just let the waiting UI show
          return false;
        }

        return true;
      } catch (error) {
        console.error("[Connection] Error checking if stream exists:", error);
        setConnectionError(
          "Error checking stream status. Please try again later."
        );
        setVideoStatus("error");
        return false;
      }
    };

    const connectToRoom = async () => {
      try {
        // Reset any previous errors
        setConnectionError(null);

        // First check if the stream exists and is active
        const streamExists = await checkStreamExists();
        if (!streamExists) {
          setIsConnecting(false);
          return;
        }

        // Prevent multiple connection attempts
        setIsConnecting(true);

        connectAttempts++;
        if (connectAttempts > maxAttempts) {
          console.error(`Failed to connect after ${maxAttempts} attempts`);
          setVideoStatus("offline");
          setIsConnecting(false);
          setConnectionError(
            "Failed to connect after multiple attempts. Please try refreshing the page."
          );
          return;
        }

        console.log(
          `[Connection] Connecting to room (attempt ${connectAttempts}):`,
          slug
        );

        // Use the client Twilio service instead of direct API call
        let token;
        try {
          token = await clientTwilioService.getToken(
            slug,
            currentUser?.username || currentUser?.email || `user-${Date.now()}`
          );
          console.log("[Connection] Got token, connecting to Twilio room...");
        } catch (error) {
          console.error("[Connection] Error getting token:", error);
          setVideoStatus("offline");
          setIsConnecting(false);
          setConnectionError(
            "Unable to get access token. The stream may not be available."
          );
          return;
        }

        if (!isSubscribed) {
          console.log(
            "[Connection] Component unmounted during connection, aborting"
          );
          setIsConnecting(false);
          return;
        }

        // Connect to room using the token
        const room = await connect(token, {
          name: slug,
          tracks: [],
          networkQuality: {
            local: 1,
            remote: 1,
          },
          dominantSpeaker: true,
        });

        if (!isSubscribed) {
          console.log(
            "[Connection] Component unmounted after connection, disconnecting"
          );
          room.disconnect();
          setIsConnecting(false);
          return;
        }

        console.log("[Connection] Successfully connected to room:", slug);
        setRoom(room);
        setIsConnecting(false);

        // Handle existing participants
        room.participants.forEach(handleParticipantConnected);

        // Set up room handlers
        room.on("participantConnected", handleParticipantConnected);
        room.on("participantDisconnected", handleParticipantDisconnected);
        room.on("disconnected", (_room, error) => {
          console.log("[Connection] Room disconnected", error);
          setIsConnecting(false);

          // Handle room disconnect errors
          if (error) {
            console.error(
              "[Connection] Room disconnect error:",
              error.code,
              error.message
            );

            // Set appropriate error message based on the error code
            if (error.code === 53001) {
              setConnectionError("Room not found. The stream may have ended.");
              setVideoStatus("error");
            } else if (error.code === 53205) {
              setConnectionError(
                "You're already connected to this stream in another window."
              );
              setVideoStatus("error");
            } else {
              setConnectionError(`Connection error: ${error.message}`);
              setVideoStatus("error");
            }
          }
        });
        room.on("reconnecting", (error) => {
          console.log("[Connection] Room reconnecting", error);
          if (error) {
            console.error(
              "[Connection] Reconnection error:",
              error.code,
              error.message
            );
          }
        });
        room.on("reconnected", () => {
          console.log("[Connection] Room reconnected");
          setConnectionError(null);
        });

        roomCleanup = () => {
          console.log("[Connection] Cleaning up room connection");
          room.off("participantConnected", handleParticipantConnected);
          room.off("participantDisconnected", handleParticipantDisconnected);
          room.removeAllListeners();
          room.disconnect();
          setRoom(null);
        };
      } catch (error: unknown) {
        console.error("[Connection] Error connecting to room:", error);
        setIsConnecting(false);

        // Handle specific Twilio errors with user-friendly messages
        const twilioError = error as TwilioErrorType;
        if (twilioError.name === "TwilioError") {
          console.error(
            "[Twilio Error]",
            twilioError.code,
            twilioError.message
          );

          switch (twilioError.code) {
            case 53000:
              setConnectionError(
                "Unable to connect to the stream. The room is full."
              );
              break;
            case 53001:
              setConnectionError(
                "Stream not found. It may have ended or never started."
              );
              break;
            case 53205:
              setConnectionError(
                "You're already watching this stream in another window."
              );
              break;
            default:
              setConnectionError(`Unable to connect: ${twilioError.message}`);
          }

          setVideoStatus("error");
        } else {
          setConnectionError(
            "Failed to connect to the stream. Please try again later."
          );
          setVideoStatus("error");
        }
      }
    };

    // Debounce the connection request to prevent multiple calls
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(connectToRoom, 300);

    return () => {
      console.log("[Connection] Cleaning up connection effect");
      isSubscribed = false;
      setIsConnecting(false);
      if (roomCleanup) roomCleanup();
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [
    slug,
    currentUser,
    handleParticipantConnected,
    handleParticipantDisconnected,
    isConnecting,
    room,
    hasStarted,
    authError,
    loadingAuth,
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
        setStreamerStatus({
          // Check both field names for compatibility
          cameraOff: data.isCameraOff ?? data.cameraOff ?? false,
          audioMuted: data.isMuted ?? data.audioMuted ?? false,
        });

        // If camera is not off but we're not seeing video, try to resubscribe to tracks
        if (
          !(data.isCameraOff ?? data.cameraOff) &&
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

  // Add timer effect to update stream duration
  useEffect(() => {
    if (!streamStartTime || videoStatus !== "active") return;

    // Update duration every second
    const timer = setInterval(() => {
      const startTime = new Date(streamStartTime).getTime();
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - startTime) / 1000);
      setStreamDuration(elapsedSeconds > 0 ? elapsedSeconds : 0);
    }, 1000);

    return () => clearInterval(timer);
  }, [streamStartTime, videoStatus]);

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
                      <Countdown scheduledTime={scheduledTime} />
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
