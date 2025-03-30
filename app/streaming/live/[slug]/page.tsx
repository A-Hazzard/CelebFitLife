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

export default function LiveViewPage() {
  const pathname = usePathname();
  const slug = pathname?.split("/").pop() || "";
  const { currentUser } = useAuthStore();

  // Using isStreamStarted to track if the stream is active
  const [hasStarted, setHasStarted] = useState(false);
  const [hasEnded] = useState(false);
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

  // This state is used to detect browser autoplay restrictions
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const [offlineTimerId, setOfflineTimerId] = useState<NodeJS.Timeout | null>(
    null
  );
  const [streamTitle, setStreamTitle] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");

  // Enhanced error states for better error handling
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const maxConnectionAttempts = 5;
  const [twilioConnectionStatus, setTwilioConnectionStatus] = useState<
    "disconnected" | "connecting" | "connected"
  >("disconnected");

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
  const handleTrackPublication = useCallback(
    (publication: RemoteTrackPublication) => {
      try {
        if (!publication) {
          console.warn(
            "handleTrackPublication called with undefined publication"
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
        console.error("Error in handleTrackPublication:", error);
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
        participant.tracks.forEach(handleTrackPublication);
        participant.on("trackPublished", handleTrackPublication);

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
    [handleTrackPublication]
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

  // Replace the initiateConnection function with a useCallback version
  const initiateConnection = useCallback(async () => {
    if (isConnectingRef.current) return;

    isConnectingRef.current = true;
    setVideoStatus("connecting");
    setTwilioConnectionStatus("connecting");

    // Track connection attempts
    const newAttemptCount = connectionAttempts + 1;
    setConnectionAttempts(newAttemptCount);
    console.log(
      `[LiveView] Connection attempt ${newAttemptCount} of ${maxConnectionAttempts}`
    );

    if (newAttemptCount > maxConnectionAttempts) {
      console.error(
        `[LiveView] Too many connection attempts (${newAttemptCount})`
      );
      setConnectionError(
        `Too many connection attempts. Please try again later or refresh the page.`
      );
      setVideoStatus("error");
      isConnectingRef.current = false;
      return;
    }

    try {
      // Create identity for the viewer
      const identity =
        currentUser?.username || currentUser?.email || `viewer-${Date.now()}`;

      console.log(
        `[LiveView] Getting Twilio token for viewer: ${identity}, room: ${slug}`
      );

      // Get connection token
      const token = await clientTwilioService.getToken(
        slug, // Room name (correct order)
        identity // User identity (correct order)
      );

      console.log(
        `[LiveView] Successfully received Twilio token, connecting to room...`
      );

      // Connect to room
      const twilioRoom = await connect(token, {
        name: slug,
        audio: false,
        video: false,
        networkQuality: { local: 1, remote: 1 },
        dominantSpeaker: true,
      });

      console.log(`[LiveView] Connected to room: ${twilioRoom.sid}`);
      setRoom(twilioRoom);
      setConnectionError(null);
      setVideoStatus("active");
      setTwilioConnectionStatus("connected");

      // Set up participants
      if (twilioRoom.participants.size > 0) {
        const firstParticipant = Array.from(
          twilioRoom.participants.values()
        )[0];
        setRemoteParticipant(firstParticipant);

        // Set up tracks
        firstParticipant.tracks.forEach((publication) => {
          // Handle existing tracks
          if (publication.isSubscribed && publication.track) {
            const track = publication.track;

            if (track.kind === "video") {
              setRemoteVideoTrack(track as RemoteVideoTrack);

              if (videoContainerRef.current) {
                const videoElement = track.attach();
                videoElement.style.width = "100%";
                videoElement.style.height = "100%";
                videoElement.style.objectFit = "cover";
                videoContainerRef.current.appendChild(videoElement);
              }
            } else if (track.kind === "audio") {
              setRemoteAudioTrack(track as RemoteAudioTrack);
            }
          }
        });
      }

      // Set up room event handlers
      twilioRoom.on("participantConnected", handleParticipantConnected);
      twilioRoom.on("participantDisconnected", handleParticipantDisconnected);

      twilioRoom.on("disconnected", (_room, error) => {
        console.log(
          `[LiveView] Disconnected from room: ${
            error ? error.message : "No error"
          }`
        );
        setVideoStatus("offline");
        setRoom(null);
        setTwilioConnectionStatus("disconnected");

        if (error) {
          setConnectionError(`Disconnected: ${error.message}`);
        }
      });

      twilioRoom.on("reconnecting", (error) => {
        console.log(
          `[LiveView] Reconnecting to room: ${
            error ? error.message : "Unknown error"
          }`
        );
        setTwilioConnectionStatus("connecting");
      });

      twilioRoom.on("reconnected", () => {
        console.log(`[LiveView] Reconnected to room successfully`);
        setTwilioConnectionStatus("connected");
      });
    } catch (error) {
      console.error("[LiveView] Error connecting to room:", error);
      setTwilioConnectionStatus("disconnected");

      // Provide more specific error messages based on error type
      if (error instanceof TwilioError) {
        switch (error.code) {
          case 20101:
            setConnectionError(
              "Invalid Access Token. The stream may have ended or restarted."
            );
            break;
          case 20103:
            setConnectionError(
              "Invalid Access Token issuer/subject. Please try refreshing the page."
            );
            break;
          case 20104:
            setConnectionError(
              "Access Token expired. Please refresh the page to get a new token."
            );
            break;
          case 53000:
            setConnectionError(
              "Room not found or has ended. The streamer may have stopped streaming."
            );
            break;
          case 53205:
            setConnectionError("Room is full. Please try again later.");
            break;
          default:
            setConnectionError(
              `Twilio error: ${error.message} (Code: ${error.code})`
            );
        }
      } else if (error instanceof Error) {
        if (error.message.includes("token")) {
          setConnectionError(
            "Failed to get a valid connection token. Please refresh the page."
          );
        } else if (
          error.message.includes("network") ||
          error.message.includes("timeout")
        ) {
          setConnectionError(
            "Network error. Please check your internet connection and try again."
          );
        } else {
          setConnectionError(`Connection failed: ${error.message}`);
        }
      } else {
        setConnectionError(
          "Unknown error occurred. Please try refreshing the page."
        );
      }

      setVideoStatus("error");
    } finally {
      isConnectingRef.current = false;
    }
  }, [
    connectionAttempts,
    maxConnectionAttempts,
    currentUser,
    slug,
    videoContainerRef,
    handleParticipantConnected,
    handleParticipantDisconnected,
  ]);

  // Replace the useEffect at lines ~1065-1100 with the corrected version
  useEffect(() => {
    // Only attempt connection if we have the necessary conditions
    if (
      !slug ||
      !currentUser ||
      hasEnded ||
      room ||
      isConnectingRef.current ||
      loadingAuth ||
      !hasHydrated
    ) {
      return;
    }

    // Check if stream has started
    const checkStreamStatus = async () => {
      try {
        const streamDoc = await getDoc(doc(db, "streams", slug));

        if (!streamDoc.exists()) {
          setVideoStatus("offline");
          return;
        }

        const streamData = streamDoc.data();
        if (streamData.hasEnded) {
          setVideoStatus("ended");
          return;
        }

        if (!streamData.hasStarted) {
          setVideoStatus("waiting");
          return;
        }

        // If stream has started, attempt initial connection
        await initiateConnection();
      } catch (error) {
        console.error("Error checking stream status:", error);
        setConnectionError("Error checking stream status");
        setVideoStatus("error");
      }
    };

    // Check stream status and connect if appropriate
    checkStreamStatus();

    // Cleanup function
    return () => {
      // No need to call room.disconnect() here, as it causes TypeScript errors
      setRoom(null);
      isConnectingRef.current = false;
    };
  }, [
    slug,
    currentUser,
    hasEnded,
    room,
    loadingAuth,
    hasHydrated,
    hasStarted,
    initiateConnection,
  ]);

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
                <div className="mb-4 text-center">
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
                      <div className="mb-6">
                        <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
                          <div className="animate-pulse">
                            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                          </div>
                        </div>
                        <h2 className="text-xl font-bold">
                          Waiting for Stream to Start
                        </h2>
                        <p className="text-sm text-gray-400 mt-2">
                          The streamer hasn&apos;t started yet. Please wait or
                          check back later.
                        </p>
                      </div>
                      <button
                        onClick={() => window.location.reload()}
                        className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-full mt-4"
                      >
                        Refresh
                      </button>
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
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-80 text-white rounded-lg">
                <div className="text-center p-8 max-w-md">
                  <div className="mb-4 text-gray-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-12 w-12 mx-auto"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold mb-2">Stream is Offline</h3>
                  <p className="mb-4 text-gray-300">
                    {connectionError ||
                      "The stream is currently offline. Please check back later."}
                  </p>
                  <button
                    onClick={() => window.location.reload()}
                    className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-full"
                  >
                    Refresh Page
                  </button>
                </div>
              </div>
            )}

            {/* Enhanced ended overlay with better visuals */}
            {videoStatus === "ended" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-80 text-white rounded-lg">
                <div className="text-center p-8 max-w-md">
                  <div className="mb-4 text-brandOrange">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-12 w-12 mx-auto"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold mb-2">Stream Has Ended</h3>
                  <p className="mb-4 text-gray-300">
                    Thanks for watching! The streamer has ended this live
                    session.
                  </p>
                  <button
                    onClick={() => {
                      window.location.href = "/streaming";
                    }}
                    className="bg-brandOrange hover:bg-brandOrange/80 text-white font-bold py-2 px-4 rounded-full"
                  >
                    Explore More Streams
                  </button>
                </div>
              </div>
            )}

            {/* Connection Error Overlay */}
            {videoStatus === "error" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-80 text-white rounded-lg">
                <div className="text-center p-8 max-w-md">
                  <div className="mb-4 text-red-500">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-12 w-12 mx-auto"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold mb-2">Connection Error</h3>
                  <p className="mb-4 text-gray-300">
                    {connectionError || "Failed to connect to the stream."}
                  </p>
                  <div className="flex justify-center">
                    <button
                      onClick={() => {
                        // Reset connection
                        setIsRetrying(true);
                        setConnectionError(null);

                        // Clear existing video elements
                        if (videoContainerRef.current) {
                          clearVideoContainer(videoContainerRef.current);
                        }

                        // Reset all state
                        setRoom(null);
                        setRemoteParticipant(null);
                        setRemoteVideoTrack(null);
                        setRemoteAudioTrack(null);

                        // Retry connection after a short delay
                        setTimeout(() => {
                          const checkStreamAndRetry = async () => {
                            try {
                              // Check if stream exists and is active
                              const streamDoc = await getDoc(
                                doc(db, "streams", slug)
                              );
                              if (!streamDoc.exists()) {
                                setVideoStatus("offline");
                                setConnectionError("Stream not found");
                                return;
                              }

                              const streamData = streamDoc.data();
                              if (streamData.hasEnded) {
                                setVideoStatus("ended");
                                setConnectionError("Stream has ended");
                                return;
                              }

                              if (!streamData.hasStarted) {
                                setVideoStatus("waiting");
                                setConnectionError(null);
                                return;
                              }

                              // Initiate connection if stream is active
                              await initiateConnection();
                            } catch (error) {
                              console.error(
                                "[LiveView] Error in retry:",
                                error
                              );
                              setConnectionError(
                                `Failed to reconnect: ${
                                  (error as Error).message
                                }`
                              );
                              setVideoStatus("error");
                            } finally {
                              setIsRetrying(false);
                            }
                          };

                          checkStreamAndRetry();
                        }, 1000);
                      }}
                      disabled={isRetrying}
                      className="bg-brandOrange hover:bg-brandOrange/80 text-white font-bold py-2 px-4 rounded-full inline-flex items-center"
                    >
                      {isRetrying ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Reconnecting...
                        </>
                      ) : (
                        "Try Again"
                      )}
                    </button>
                    <button
                      onClick={() => window.location.reload()}
                      className="ml-2 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-full"
                      disabled={isRetrying}
                    >
                      Refresh Page
                    </button>
                  </div>
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
                <div
                  className={`flex items-center gap-1 bg-black bg-opacity-70 px-3 py-1 rounded-full text-sm ${
                    twilioConnectionStatus === "connected"
                      ? "text-green-500"
                      : twilioConnectionStatus === "connecting"
                      ? "text-yellow-500"
                      : "text-red-500"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      twilioConnectionStatus === "connected"
                        ? "bg-green-500"
                        : twilioConnectionStatus === "connecting"
                        ? "bg-yellow-500 animate-pulse"
                        : "bg-red-500"
                    }`}
                  ></span>
                  <span>
                    {twilioConnectionStatus === "connected"
                      ? "Twilio Connected"
                      : twilioConnectionStatus === "connecting"
                      ? "Reconnecting..."
                      : "Twilio Disconnected"}
                  </span>
                </div>

                {streamerStatus.audioMuted && (
                  <div className="flex items-center gap-1 bg-black bg-opacity-70 px-3 py-1 rounded-full text-white text-sm">
                    <MicOff size={16} />
                    <span>Muted</span>
                  </div>
                )}
                {streamerStatus.cameraOff && (
                  <div className="flex items-center gap-1 bg-black bg-opacity-70 px-3 py-1 rounded-full text-white text-sm">
                    <VideoOff size={16} />
                    <span>Camera Off</span>
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
