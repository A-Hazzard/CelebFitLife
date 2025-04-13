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

  // This state is used to detect browser autoplay restrictions
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const [offlineTimerId, setOfflineTimerId] = useState<NodeJS.Timeout | null>(
    null
  );
  const [streamTitle, setStreamTitle] = useState("");
  const [thumbnail, setThumbnail] = useState("");

  // Enhanced error states for better error handling
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const maxConnectionAttempts = 5;

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

  // Handler for track published - enhance to better handle video tracks
  const handleTrackPublication = useCallback(
    (trackPublication: RemoteTrackPublication) => {
      try {
        if (!trackPublication) {
          console.warn(
            "handleTrackPublication called with undefined publication"
          );
          return;
        }

        const trackName = trackPublication.trackName || "unknown";
        console.log(
          `Track published: ${trackName}, kind: ${
            trackPublication.kind
          }, isSubscribed: ${
            trackPublication.isSubscribed
          }, track exists: ${!!trackPublication.track}, track enabled: ${
            trackPublication.track?.isEnabled
          }`
        );

        // React to track unsubscribed events
        trackPublication.on("unsubscribed", () => {
          console.log(
            `Track ${trackName} was unsubscribed, attempting to resubscribe`
          );
          // Try to resubscribe
          trackPublication.once("subscribed", (resubscribedTrack) => {
            console.log(`Successfully resubscribed to ${trackName}`);
            handleTrackSubscribed(resubscribedTrack);
          });
        });

        // CRITICAL: Add track disabled/enabled handlers
        trackPublication.on("disabled", () => {
          console.log(`Track ${trackName} was disabled by publisher`);
          if (trackPublication.kind === "video") {
            setStreamerStatus((prev) => ({ ...prev, cameraOff: true }));
          } else if (trackPublication.kind === "audio") {
            setStreamerStatus((prev) => ({ ...prev, audioMuted: true }));
          }
        });

        trackPublication.on("enabled", () => {
          console.log(`Track ${trackName} was enabled by publisher`);
          if (trackPublication.kind === "video") {
            setStreamerStatus((prev) => ({ ...prev, cameraOff: false }));

            // If the video is enabled, make an extra attempt to attach it
            if (trackPublication.track) {
              handleTrackSubscribed(trackPublication.track);
            }
          } else if (trackPublication.kind === "audio") {
            setStreamerStatus((prev) => ({ ...prev, audioMuted: false }));
          }
        });

        // If this is a video track, prepare the container
        if (trackPublication.kind === "video") {
          console.log(
            "Video track published, clearing container to prepare for new track"
          );

          // Make sure we have a clean container
          if (videoContainerRef.current) {
            clearVideoContainer(videoContainerRef.current);
          }

          // If the track is already subscribed, handle it immediately
          if (trackPublication.isSubscribed && trackPublication.track) {
            console.log(
              `Track already subscribed, handling: ${trackPublication.trackName}`
            );
            handleTrackSubscribed(trackPublication.track);
            return;
          }

          // Set up a listener for when the track gets subscribed
          console.log(`Setting up subscription handlers for: ${trackName}`);

          // One-time handler with setTimeout fallback
          const onSubscribed = (track: RemoteTrack) => {
            console.log(`Track ${trackName} was subscribed, handling now`);
            handleTrackSubscribed(track);

            // Don't remove the handler - keep it for resubscription
            // trackPublication.off("subscribed", onSubscribed);
          };

          trackPublication.on("subscribed", onSubscribed);

          // Set multiple timeouts to check again (more aggressive retry)
          [1000, 3000, 5000, 10000].forEach((timeout) => {
            setTimeout(() => {
              if (trackPublication.isSubscribed && trackPublication.track) {
                console.log(
                  `Track ${trackName} is now subscribed after ${timeout}ms timeout`
                );
                handleTrackSubscribed(trackPublication.track);
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
                    trackPublication.on("subscribed", handleTrackSubscribed);
                  } catch (error) {
                    console.error(`Failed to force subscription: ${error}`);
                  }
                }
              }
            }, timeout);
          });
        }

        // Same process for audio tracks
        if (trackPublication.kind === "audio") {
          if (trackPublication.isSubscribed && trackPublication.track) {
            console.log(
              `Audio track already subscribed, handling: ${trackPublication.trackName}`
            );
            handleTrackSubscribed(trackPublication.track);
            return;
          }

          const onSubscribed = (track: RemoteTrack) => {
            console.log(
              `Audio track ${trackName} was subscribed, handling now`
            );
            handleTrackSubscribed(track);
            // Keep the handler for resubscription events
          };

          trackPublication.on("subscribed", onSubscribed);

          // Multiple timeouts for audio as well
          [1000, 3000, 5000].forEach((timeout) => {
            setTimeout(() => {
              if (trackPublication.isSubscribed && trackPublication.track) {
                console.log(
                  `Audio track ${trackName} is now subscribed after ${timeout}ms timeout`
                );
                handleTrackSubscribed(trackPublication.track);
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
        participant.on("trackSubscribed", (track) => {
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
      });

      twilioRoom.on("reconnected", () => {
        console.log(`[LiveView] Reconnected to room successfully`);
      });
    } catch (error) {
      console.error("[LiveView] Error connecting to room:", error);

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
        return false; // Return a value
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
        return false; // Return a value
      }

      const streamData = streamDoc.data();
      if (streamData.hasEnded) {
        setVideoStatus("ended");
        setConnectionError("Stream has ended");
        setIsRetrying(false);
        return false; // Return a value
      }

      if (!streamData.hasStarted) {
        setVideoStatus("waiting");
        setConnectionError(null);
        setIsRetrying(false);
        return false; // Return a value
      }

      // Initiate connection if stream is active
      await initiateConnection();

      // If we get here, the connection was successful
      setIsRetrying(false);
      return true; // Return success
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
          if (slug && connectionAttempts < maxConnectionAttempts) {
            checkStreamAndRetry().catch((err) => {
              console.error("[LiveView] Error during retry:", err);
            });
          }
        }, 3000);
      } else {
        setVideoStatus("error");
        setIsRetrying(false);
      }
      return false; // Return a value on catch
    }
  }, [
    connectionAttempts,
    maxConnectionAttempts,
    slug,
    initiateConnection,
    setConnectionError,
    setVideoStatus,
    setIsRetrying,
  ]);

  // Fix the stream status update in the Firestore listener to properly handle hasStarted
  useEffect(() => {
    // Only attempt connection if we have the necessary conditions
    if (
      !slug ||
      !currentUser ||
      hasEnded || // Use hasEnded to prevent connection attempts on ended streams
      room ||
      isConnectingRef.current ||
      loadingAuth ||
      !hasHydrated
    ) {
      return undefined;
    }

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

        // CRITICAL FIX: Update video status based on stream state
        // Only show as ended when hasEnded is explicitly true
        if (data.hasEnded === true) {
          console.log("[Status] Stream has ended, disconnecting from room");
          setVideoStatus("ended");
          setHasEnded(true);
          if (room) {
            (room as Room).disconnect();
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
  }, [
    slug,
    room,
    videoStatus,
    isConnectingRef,
    checkStreamAndRetry,
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

    // Return undefined for the case where we don't set up the interval
    return undefined;
  }, [
    room,
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
    // Log participant and track information when they change
    if (remoteParticipant) {
      console.log(`Remote participant updated: ${remoteParticipant.identity}`);

      // Log all tracks available on the participant
      remoteParticipant.tracks.forEach((publication) => {
        console.log(
          `Available track: ${publication.trackName}, kind: ${publication.kind}`
        );
      });
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
  }, [remoteParticipant, remoteAudioTrack]);

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
          <div
            ref={videoContainerRef}
            className="w-full h-full bg-gray-900 relative overflow-hidden"
          >
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

            {/* Status overlays */}
            {videoStatus === "waiting" && !isScheduled && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 bg-opacity-80 z-10">
                <div className="text-center">
                  <Loader className="w-12 h-12 mb-4" />
                  <h2 className="text-2xl font-bold mb-2">
                    Waiting for Stream
                  </h2>
                  <p className="text-gray-400">
                    The stream has not started yet.
                  </p>
                </div>
              </div>
            )}

            {videoStatus === "connecting" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 bg-opacity-80 z-10">
                <div className="text-center">
                  <Loader className="w-12 h-12 mb-4" />
                  <h2 className="text-2xl font-bold mb-2">Connecting</h2>
                  <p className="text-gray-400">
                    Establishing connection to stream...
                  </p>
                  {connectionAttempts > 1 && (
                    <p className="text-sm text-brandOrange mt-2">
                      Attempt {connectionAttempts} of {maxConnectionAttempts}
                    </p>
                  )}
                </div>
              </div>
            )}

            {videoStatus === "offline" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 bg-opacity-90 z-10">
                <div className="text-center max-w-md">
                  <div className="w-16 h-16 rounded-full bg-gray-800 mb-6 mx-auto flex items-center justify-center">
                    <VideoOff size={32} className="text-brandOrange" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Stream Offline</h2>
                  <p className="text-gray-400 mb-6">
                    The stream is currently offline. Please check back later.
                  </p>
                  <Button
                    onClick={checkStreamAndRetry}
                    disabled={isRetrying}
                    className="bg-brandOrange hover:bg-brandOrange/90 text-brandBlack"
                  >
                    {isRetrying ? (
                      <>
                        <Loader className="mr-2 h-4 w-4" />
                        Retrying...
                      </>
                    ) : (
                      "Check Again"
                    )}
                  </Button>
                </div>
              </div>
            )}

            {videoStatus === "ended" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 bg-opacity-90 z-10">
                <div className="text-center max-w-md">
                  <div className="w-16 h-16 rounded-full bg-gray-800 mb-6 mx-auto flex items-center justify-center">
                    <VideoOff size={32} className="text-brandOrange" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Stream Ended</h2>
                  <p className="text-gray-400 mb-4">
                    Thank you for watching! This stream has ended.
                  </p>
                  {thumbnail && (
                    <div className="relative w-full h-40 mb-4 rounded-lg overflow-hidden">
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

            {videoStatus === "error" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 bg-opacity-90 z-10">
                <div className="text-center max-w-md">
                  <div className="w-16 h-16 rounded-full bg-gray-800 mb-6 mx-auto flex items-center justify-center">
                    <AlertCircle size={32} className="text-red-500" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2 text-red-500">
                    Connection Error
                  </h2>
                  <p className="text-gray-400 mb-6">
                    {connectionError ||
                      "Failed to connect to the stream. Please try again."}
                  </p>
                  <Button
                    onClick={checkStreamAndRetry}
                    disabled={
                      isRetrying || connectionAttempts >= maxConnectionAttempts
                    }
                    className="bg-brandOrange hover:bg-brandOrange/90 text-brandBlack"
                  >
                    {isRetrying ? (
                      <>
                        <Loader className="mr-2 h-4 w-4" />
                        Retrying...
                      </>
                    ) : (
                      "Try Again"
                    )}
                  </Button>
                </div>
              </div>
            )}

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
