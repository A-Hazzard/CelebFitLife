"use client";
import React, { useState, useCallback, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { db } from "@/lib/config/firebase";
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
  RemoteTrackPublication,
  connect,
  TwilioError,
} from "twilio-video";
import { MicOff, Mic, VideoOff } from "lucide-react";
import { Countdown } from "@/components/streaming/Countdown";
import { ClientTwilioService } from "@/lib/services/ClientTwilioService";
import Loader from "@/components/ui/Loader";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

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
    (track: RemoteTrack) => {
      console.log(
        `Track subscribed: ${track.kind} - {${track.name}} - sid: ${track.sid} - enabled: ${track.isEnabled}`
      );

      if (track.kind === "video") {
        console.log("[Track] Adding video track to container");

        // Clear existing videos first to avoid duplicates
        const existingVideos = videoContainerRef.current?.querySelectorAll(
          `video[data-track-sid="${track.sid}"]`
        );
        existingVideos?.forEach((v) => v.remove());

        // Create and attach the new video element
        const videoElement = track.attach();
        videoElement.style.width = "100%";
        videoElement.style.height = "100%";
        videoElement.style.objectFit = "cover";
        videoElement.style.display = "block";
        videoElement.setAttribute("data-track-sid", track.sid);
        videoElement.setAttribute("data-debug", "viewer-video-track");
        videoElement.setAttribute("autoplay", "true");
        videoElement.setAttribute("playsinline", "true");

        if (videoContainerRef.current) {
          videoContainerRef.current.appendChild(videoElement);
          console.log(
            "[Track] Video element attached and added to container",
            videoElement
          );

          // Set a timeout to verify that the video element is in the DOM
          setTimeout(() => {
            const hasVideo =
              !!videoContainerRef.current?.querySelector("video");
            console.log(
              "[Track] After timeout, container has video element:",
              hasVideo
            );
          }, 2000);
        }

        // Update state to reflect we have a video track
        setRemoteVideoTrack(track as RemoteVideoTrack);
      } else if (track.kind === "audio") {
        console.log("[Track] Setting up audio track:", track.sid);

        // Remove any existing audio element with the same track SID
        const existingAudio = document.querySelectorAll(
          `audio[data-track-sid="${track.sid}"]`
        );
        existingAudio.forEach((a) => a.remove());

        // Create and set up the audio element
        const audioElement = track.attach();
        audioElement.setAttribute("data-track-sid", track.sid);
        audioElement.setAttribute("data-debug", "viewer-audio-track");
        audioElement.setAttribute("autoplay", "true");

        // Set volume to full and try to play it
        audioElement.volume = 1.0;

        // Add specific properties to ensure audio playback
        audioElement.muted = false;
        audioElement.setAttribute("playsinline", "true");

        // Make sure it stays attached to the document
        document.body.appendChild(audioElement);
        console.log(
          "[Track] Audio element attached and added to document body"
        );

        // Try to force play the audio element
        const playPromise = audioElement.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log("[Track] Audio playback started successfully");
            })
            .catch((error) => {
              console.error("[Track] Audio playback failed:", error);
              // If autoplay fails, we need user interaction, show a button to the user
              setIsAudioMuted(true);
            });
        }

        // Update state to reflect we have an audio track
        setRemoteAudioTrack(track as RemoteAudioTrack);
      }
    },
    [isAudioMuted]
  );

  // Handler for track published - enhance to better handle video tracks
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
          `Track published: ${trackName}, kind: ${
            publication.kind
          }, isSubscribed: ${
            publication.isSubscribed
          }, track exists: ${!!publication.track}, track enabled: ${
            publication.track?.isEnabled
          }`
        );

        // React to track unsubscribed events
        publication.on("unsubscribed", (track) => {
          console.log(
            `Track ${trackName} was unsubscribed, attempting to resubscribe`
          );
          // Try to resubscribe
          publication.once("subscribed", (newTrack) => {
            console.log(`Successfully resubscribed to ${trackName}`);
            handleTrackSubscribed(newTrack);
          });
        });

        // CRITICAL: Add track disabled/enabled handlers
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

            // If the video is enabled, make an extra attempt to attach it
            if (publication.track) {
              handleTrackSubscribed(publication.track);
            }
          } else if (publication.kind === "audio") {
            setStreamerStatus((prev) => ({ ...prev, audioMuted: false }));
          }
        });

        // If this is a video track, prepare the container
        if (publication.kind === "video") {
          console.log(
            "Video track published, clearing container to prepare for new track"
          );

          // Make sure we have a clean container
          if (videoContainerRef.current) {
            clearVideoContainer(videoContainerRef.current);
          }

          // If the track is already subscribed, handle it immediately
          if (publication.isSubscribed && publication.track) {
            console.log(
              `Track already subscribed, handling: ${publication.trackName}`
            );
            handleTrackSubscribed(publication.track);
            return;
          }

          // Set up a listener for when the track gets subscribed
          console.log(`Setting up subscription handlers for: ${trackName}`);

          // One-time handler with setTimeout fallback
          const onSubscribed = (track: RemoteTrack) => {
            console.log(`Track ${trackName} was subscribed, handling now`);
            handleTrackSubscribed(track);

            // Don't remove the handler - keep it for resubscription
            // publication.off("subscribed", onSubscribed);
          };

          publication.on("subscribed", onSubscribed);

          // Set multiple timeouts to check again (more aggressive retry)
          [1000, 3000, 5000, 10000].forEach((timeout) => {
            setTimeout(() => {
              if (publication.isSubscribed && publication.track) {
                console.log(
                  `Track ${trackName} is now subscribed after ${timeout}ms timeout`
                );
                handleTrackSubscribed(publication.track);
              } else {
                console.log(
                  `Track ${trackName} still not subscribed after ${timeout}ms timeout`
                );

                // Try to manually subscribe if possible
                if (timeout > 5000) {
                  console.log(
                    `Attempting to force subscription to ${trackName}`
                  );
                  try {
                    // This will work if the participant has enabled automatic track subscription
                    publication.on("subscribed", handleTrackSubscribed);
                  } catch (error) {
                    console.error(`Failed to force subscription: ${error}`);
                  }
                }
              }
            }, timeout);
          });
        }

        // Same process for audio tracks
        if (publication.kind === "audio") {
          if (publication.isSubscribed && publication.track) {
            console.log(
              `Audio track already subscribed, handling: ${publication.trackName}`
            );
            handleTrackSubscribed(publication.track);
            return;
          }

          const onSubscribed = (track: RemoteTrack) => {
            console.log(
              `Audio track ${trackName} was subscribed, handling now`
            );
            handleTrackSubscribed(track);
            // Keep the handler for resubscription events
          };

          publication.on("subscribed", onSubscribed);

          // Multiple timeouts for audio as well
          [1000, 3000, 5000].forEach((timeout) => {
            setTimeout(() => {
              if (publication.isSubscribed && publication.track) {
                console.log(
                  `Audio track ${trackName} is now subscribed after ${timeout}ms timeout`
                );
                handleTrackSubscribed(publication.track);
              }
            }, timeout);
          });
        }
      } catch (error) {
        console.error("Error in handleTrackPublication:", error);
      }
    },
    [handleTrackSubscribed, videoContainerRef, setStreamerStatus]
  );

  // Handler for participant connected
  const handleParticipantConnected = useCallback(
    (participant: RemoteParticipant) => {
      try {
        console.log(
          `Participant connected: ${participant.identity}, sid: ${participant.sid}`
        );

        // Check if this is the streamer by their identity pattern
        const isStreamer = participant.identity.startsWith("streamer-");
        console.log(
          `This participant ${isStreamer ? "IS" : "is NOT"} the streamer`
        );

        setRemoteParticipant(participant);

        // Enhanced logging for existing tracks
        console.log(
          `Checking ${participant.tracks.size} existing tracks from participant:`
        );
        if (participant.tracks.size === 0) {
          console.log("No tracks available yet from this participant");
        }

        // Handle participant tracks
        participant.tracks.forEach((publication, trackSid) => {
          console.log(
            `Found track publication ${trackSid}: ${publication.kind}, isSubscribed: ${publication.isSubscribed}`
          );
          handleTrackPublication(publication);
        });

        // Watch for new track publications
        participant.on("trackPublished", (publication) => {
          console.log(
            `New track published by participant: ${publication.kind}, trackName: ${publication.trackName}`
          );
          handleTrackPublication(publication);
        });

        // Set up additional track subscription events for extra robustness
        participant.on("trackSubscribed", (track, publication) => {
          console.log(
            `Track directly subscribed: ${track.kind}, name: ${track.name}`
          );
          handleTrackSubscribed(track);
        });

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
    [handleTrackPublication, handleTrackSubscribed]
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

  // Replace the initiateConnection function with a useCallback version
  const initiateConnection = useCallback(async () => {
    if (isConnectingRef.current) return;

    // Track connection attempts
    const newAttemptCount = connectionAttempts + 1;
    setConnectionAttempts(newAttemptCount);
    console.log(
      `[LiveView] Connection attempt ${newAttemptCount} of ${maxConnectionAttempts}`
    );

    // HARD LIMIT: Exit immediately if too many attempts - make sure this works
    if (newAttemptCount > maxConnectionAttempts) {
      console.error(
        `[LiveView] Too many connection attempts (${newAttemptCount}). Aborting.`
      );
      setConnectionError(
        `Too many connection attempts. Please try again later or refresh the page.`
      );
      setVideoStatus("error");
      isConnectingRef.current = false;
      // Critical fix: return early to prevent more connection attempts
      return;
    }

    isConnectingRef.current = true;
    setVideoStatus("connecting");
    setTwilioConnectionStatus("connecting");

    try {
      // Create identity for the viewer
      const viewerName = currentUser?.username || currentUser?.email || `anon`;
      const viewerId = currentUser?.id || Date.now().toString();
      const identity = generateUniqueIdentity("viewer", viewerId);

      console.log(
        `[LiveView] Getting Twilio token for viewer: ${viewerName}, using identity: ${identity}, room: ${slug}`
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

      // Reset connection attempts on successful connection
      setConnectionAttempts(0);

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

  // Extract the checkStreamAndRetry function so it can be used elsewhere in the component
  const checkStreamAndRetry = useCallback(async () => {
    try {
      // Check if we've already hit the max attempts limit
      if (connectionAttempts >= maxConnectionAttempts) {
        console.error(
          `[LiveView] Not retrying: Already reached max connection attempts (${connectionAttempts}/${maxConnectionAttempts})`
        );
        setConnectionError(
          `Too many connection attempts. Please refresh the page.`
        );
        setVideoStatus("error");
        return;
      }

      setIsRetrying(true);
      console.log(
        `[LiveView] Connection retry attempt ${connectionAttempts + 1}`
      );

      // Check if stream exists and is active
      const streamDoc = await getDoc(doc(db, "streams", slug));
      if (!streamDoc.exists()) {
        setVideoStatus("offline");
        setConnectionError("Stream not found");
        setIsRetrying(false);
        return;
      }

      const streamData = streamDoc.data();
      if (streamData.hasEnded) {
        setVideoStatus("ended");
        setConnectionError("Stream has ended");
        setIsRetrying(false);
        return;
      }

      if (!streamData.hasStarted) {
        setVideoStatus("waiting");
        setConnectionError(null);
        setIsRetrying(false);
        return;
      }

      // Initiate connection if stream is active
      await initiateConnection();

      // If we get here, the connection was successful
      setIsRetrying(false);
    } catch (error) {
      console.error("[LiveView] Error in retry:", error);
      setConnectionError(`Failed to reconnect: ${(error as Error).message}`);

      // Don't set error state immediately - try again after a short delay up to 3 times
      if (connectionAttempts < 3) {
        console.log(
          `[LiveView] Scheduling automatic retry #${
            connectionAttempts + 1
          } in 3 seconds`
        );
        setTimeout(() => {
          checkStreamAndRetry();
        }, 3000);
      } else {
        setVideoStatus("error");
        setIsRetrying(false);
      }
    }
  }, [connectionAttempts, maxConnectionAttempts, slug, initiateConnection]);

  // Fix the stream status update in the Firestore listener to properly handle hasStarted
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

        // CRITICAL FIX: Update video status based on stream state
        // Only show as ended when hasEnded is explicitly true
        if (data.hasEnded === true) {
          console.log("[Status] Stream has ended, disconnecting from room");
          setVideoStatus("ended");
          if (room) {
            room.disconnect();
          }
        }
        // Explicitly check for hasStarted === true to fix incorrect status display
        else if (data.hasStarted === true) {
          console.log(
            "[Status] Stream hasStarted=true, setting state and connecting if needed"
          );

          // Set hasStarted first so the useEffect will trigger connection
          setHasStarted(true);

          // If we're showing offline or waiting but the stream is actually active
          // We should attempt to connect
          if (videoStatus === "offline" || videoStatus === "waiting") {
            console.log(
              "[Status] Stream is active but we're showing offline/waiting. Attempting to connect..."
            );
            setVideoStatus("connecting");

            // Ensure we retry connecting to the room
            if (!room && !isConnectingRef.current) {
              console.log("[Status] Initiating connection to Twilio room");
              checkStreamAndRetry().catch((err: Error) => {
                console.error(
                  "[Status] Failed to connect to Twilio room:",
                  err
                );
                setVideoStatus("error");
                setConnectionError(
                  "Failed to connect to stream. Please try refreshing the page."
                );
              });
            }
          }
          // If we're not showing the offline status, just make sure the status is "active"
          else if (videoStatus !== "connecting" && videoStatus !== "error") {
            setVideoStatus("active");
          }
        } else {
          console.log(
            "[Status] Stream is waiting to start (hasStarted is not true)"
          );
          setVideoStatus("waiting");
          setHasStarted(false);
        }
      }
    });

    return () => {
      console.log("[Status] Cleaning up stream status listener");
      unsubscribe();
    };
  }, [slug, room, videoStatus, isConnectingRef, checkStreamAndRetry]);

  // Add periodic check for stream status when offline is displayed
  useEffect(() => {
    // If we're showing offline but the stream might actually be active
    // Set up a periodic check to verify the stream status from Firestore
    if (videoStatus === "offline") {
      console.log(
        "[Status] Setting up periodic check for stream status due to offline state"
      );

      const checkInterval = setInterval(async () => {
        try {
          // Directly fetch the stream document to verify if hasStarted is true
          const streamDocRef = doc(db, "streams", slug);
          const snapshot = await getDoc(streamDocRef);

          if (snapshot.exists()) {
            const data = snapshot.data();
            console.log("[Status] Periodic check found stream status:", {
              hasStarted: data.hasStarted,
              hasEnded: data.hasEnded,
            });

            // If the stream is actually active but we're showing offline
            if (data.hasStarted === true && !data.hasEnded) {
              console.log(
                "[Status] Stream is active but UI shows offline. Correcting..."
              );
              setHasStarted(true);
              setVideoStatus("connecting");

              // Try to connect to the room
              if (!room && !isConnectingRef.current) {
                checkStreamAndRetry().catch((err: Error) => {
                  console.error(
                    "[Status] Failed to connect on periodic check:",
                    err
                  );
                });
              }
            }
          }
        } catch (error) {
          console.error("[Status] Error in periodic status check:", error);
        }
      }, 10000); // Check every 10 seconds

      return () => clearInterval(checkInterval);
    }
  }, [videoStatus, slug, room, isConnectingRef, checkStreamAndRetry]);

  // Replace the toggleAudioMute function with this improved version:

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

  // Add debug output for track status
  useEffect(() => {
    // Add debug log to show current track status whenever important state changes
    if (hasStarted) {
      console.log("[Debug] Current viewer track status:", {
        hasStarted,
        roomConnected: !!room,
        remoteParticipantId: remoteParticipant?.identity,
        hasVideoTrack: !!remoteVideoTrack,
        hasAudioTrack: !!remoteAudioTrack,
        videoStatus,
        connectionError,
      });

      // Check if we're active but missing video or audio
      if (
        videoStatus === "active" &&
        (!remoteVideoTrack || !remoteAudioTrack) &&
        remoteParticipant
      ) {
        console.log(
          "[Debug] Stream is active but missing tracks, checking participant publications"
        );
        let foundTracks = 0;
        remoteParticipant.tracks.forEach((publication) => {
          console.log(
            `[Debug] Track ${publication.trackName}: subscribed=${publication.isSubscribed}, enabled=${publication.track?.isEnabled}`
          );
          foundTracks++;

          // Try to resubscribe to the track if it's not already subscribed
          if (!publication.isSubscribed) {
            console.log(
              `[Debug] Setting up subscription for track: ${publication.trackName}`
            );
            publication.on("subscribed", handleTrackSubscribed);
          } else if (publication.track) {
            console.log(
              `[Debug] Track already subscribed, rehandling: ${publication.trackName}`
            );
            handleTrackSubscribed(publication.track);
          }
        });

        if (foundTracks === 0) {
          console.log("[Debug] No tracks found on remote participant");
        }
      }
    }
  }, [
    hasStarted,
    room,
    remoteParticipant,
    remoteVideoTrack,
    remoteAudioTrack,
    videoStatus,
    connectionError,
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

  // Update the useEffect that checks stream status to properly handle already-active streams
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

    // Check if we already hit max attempts limit from another reconnection attempt
    if (connectionAttempts >= maxConnectionAttempts) {
      console.error(
        `[LiveView] Effect not initiating connection: max attempts (${maxConnectionAttempts}) already reached`
      );
      setVideoStatus("error");
      setConnectionError(
        `Too many connection attempts. Please refresh the page.`
      );
      return;
    }

    // Check if stream has started
    const checkStreamStatus = async () => {
      try {
        console.log("[LiveView] Checking stream status for:", slug);
        const streamDoc = await getDoc(doc(db, "streams", slug));

        if (!streamDoc.exists()) {
          console.log("[LiveView] Stream document not found");
          setVideoStatus("offline");
          return;
        }

        const streamData = streamDoc.data();
        console.log("[LiveView] Stream data from Firestore:", {
          hasStarted: streamData.hasStarted,
          hasEnded: streamData.hasEnded,
        });

        // IMPORTANT FIX: Check the actual boolean values
        if (streamData.hasEnded === true) {
          console.log("[LiveView] Stream has ended in Firestore");
          setVideoStatus("ended");
          return;
        }

        // IMPORTANT FIX: Explicitly check for hasStarted being true
        if (streamData.hasStarted === true) {
          console.log(
            "[LiveView] Stream is active in Firestore, attempting to connect"
          );
          setHasStarted(true);

          // Only attempt to connect if we're not in an error state
          if (videoStatus !== "error") {
            // Set to connecting state before initiating the connection
            setVideoStatus("connecting");
            await checkStreamAndRetry();
          }
          return;
        }

        console.log("[LiveView] Stream is in waiting state (not started)");
        setVideoStatus("waiting");
        return;
      } catch (error) {
        console.error("[LiveView] Error checking stream status:", error);
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
    connectionAttempts,
    maxConnectionAttempts,
    videoStatus,
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
              } else {
                // If stream isn't active, update UI accordingly
                setVideoStatus(data.hasEnded ? "ended" : "waiting");
              }
            }
          } catch (error) {
            console.error("[Recovery] Auto-recovery attempt failed:", error);
            // Don't update error state, we'll try again later
          } finally {
            setIsRetrying(false);
          }
        };

        attemptRecovery();
      }, 30000); // 30 seconds

      return () => clearTimeout(recoveryTimer);
    }
  }, [videoStatus, isRetrying, slug, checkStreamAndRetry]);

  // Add a periodic check for the room's health
  useEffect(() => {
    // Only check if we have a room but no video tracks
    if (
      room &&
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
        // Check if we really have a room participant
        if (room.participants.size > 0) {
          console.log(
            `[Health] Room has ${room.participants.size} participants`
          );

          // Check each participant for video tracks
          room.participants.forEach((participant, sid) => {
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
  }, [
    room,
    videoStatus,
    streamerStatus.cameraOff,
    remoteVideoTrack,
    videoContainerRef,
    handleTrackSubscribed,
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
                      <Loader className="mb-6" />
                      <h2 className="text-xl font-semibold text-white mb-2">
                        Waiting for Stream to Begin
                      </h2>
                      <p className="text-gray-300">
                        The streamer will be live soon. Please wait...
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}

            {videoStatus === "connecting" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80 text-white rounded-lg">
                <div className="animate-pulse flex flex-col items-center">
                  <Loader className="mb-6" />
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
                      onClick={async () => {
                        if (isRetrying) return;
                        setIsRetrying(true);

                        // Clear any existing Twilio room
                        if (room) {
                          room.disconnect();
                        }

                        // Reset all state
                        setRoom(null);
                        setRemoteParticipant(null);
                        setRemoteVideoTrack(null);
                        setRemoteAudioTrack(null);

                        // Retry connection after a short delay
                        setTimeout(async () => {
                          try {
                            await checkStreamAndRetry();
                          } finally {
                            setIsRetrying(false);
                          }
                        }, 1000);
                      }}
                      disabled={isRetrying}
                      className="bg-brandOrange hover:bg-brandOrange/80 text-white font-bold py-2 px-4 rounded-full inline-flex items-center"
                    >
                      {isRetrying ? (
                        <>
                          <Loader className="mr-2" />
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
                      ? "Connected"
                      : twilioConnectionStatus === "connecting"
                      ? "Reconnecting..."
                      : "Disconnected"}
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
