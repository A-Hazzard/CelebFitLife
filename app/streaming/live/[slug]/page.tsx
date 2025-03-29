"use client";
import { db } from "@/lib/config/firebase";
import { listenToMessages, sendChatMessage } from "@/lib/services/ChatService";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { ChatMessage } from "@/lib/types/stream";
import { WithListeners } from "@/lib/types/streaming";
import {
  clearVideoContainer,
  updateTrackEnabledState,
} from "@/lib/utils/streaming";
import { doc, onSnapshot, getDoc } from "firebase/firestore";
import { MicOff, VideoOff, Volume2, VolumeX } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  connect,
  RemoteAudioTrack,
  RemoteParticipant,
  RemoteTrack,
  RemoteTrackPublication,
  RemoteVideoTrack,
  Room,
} from "twilio-video";
import { Countdown } from "@/components/streaming/Countdown";
import StreamChat from "@/components/streaming/StreamChat";

export default function LiveViewPage() {
  const pathname = usePathname();
  const router = useRouter();
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
    "waiting" | "connecting" | "active" | "offline" | "ended"
  >("waiting");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [hasHydrated, setHasHydrated] = useState(false);
  const [streamerStatus, setStreamerStatus] = useState({
    audioMuted: false,
    cameraOff: false,
  });
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledTime, setScheduledTime] = useState("");

  // This state is used to detect browser autoplay restrictions
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const [offlineTimerId, setOfflineTimerId] = useState<NodeJS.Timeout | null>(
    null
  );
  const [streamTitle, setStreamTitle] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");

  // State to track whether we're currently attempting to connect
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() =>
      setHasHydrated(true)
    );
    const timeout = setTimeout(() => setHasHydrated(true), 2000);
    return () => {
      unsub();
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    if (hasHydrated && !currentUser) router.push("/login");
  }, [currentUser, hasHydrated, router]);

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
        });

        setStreamerStatus({
          audioMuted: data.audioMuted || false,
          cameraOff: data.cameraOff || false,
        });

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

  const handleTrackSubscribed = useCallback(
    (track: RemoteTrack) => {
      try {
        console.log(
          "Track subscribed:",
          track.kind,
          track.name,
          "isEnabled:",
          track.isEnabled
        );

        // If we have an offline timer running, clear it since we got a new track
        if (offlineTimerId) {
          console.log("Clearing offline timer since we received a new track");
          clearTimeout(offlineTimerId);
          setOfflineTimerId(null);
        }

        if (track.kind === "video") {
          const videoTrack = track as RemoteVideoTrack;

          // Store the new track reference
          setRemoteVideoTrack(videoTrack);
          setVideoStatus("active");

          console.log("Creating video element for track");

          // Create and configure video element
          if (videoContainerRef.current) {
            clearVideoContainer(videoContainerRef.current);

            // Create a new video element
            const element = document.createElement("video");
            element.style.width = "100%";
            element.style.height = "100%";
            element.style.objectFit = "cover";
            element.setAttribute("data-track-sid", track.sid);
            element.setAttribute("autoplay", "true");
            element.setAttribute("playsinline", "true");
            element.muted = true; // 👈🏽 Add this bad boy here

            // Attach the track to the element
            videoTrack.attach(element);

            // Add the element to the container
            videoContainerRef.current.appendChild(element);
            console.log("Video element created and attached to container");

            // Force play if needed
            try {
              if (element.muted) {
                // Safe to auto-play if muted
                element.play().catch((err) => {
                  console.warn("Autoplay blocked even while muted:", err);
                });
              } else {
                // Wait for user gesture (e.g., on click)
                console.warn(
                  "Not auto-playing video with audio. Waiting for interaction."
                );
              }
            } catch (playError) {
              console.warn("Error calling play():", playError);
            }
          }

          // Set up track event listeners
          videoTrack.on("disabled", () => {
            console.log("Video track disabled");
            // Don't set to offline, just update UI state
            // This prevents showing "Stream is Offline" when camera is just disabled
          });

          videoTrack.on("enabled", () => {
            console.log("Video track enabled");
            setVideoStatus("active");
          });
        } else if (track.kind === "audio") {
          const audioTrack = track as RemoteAudioTrack;

          // Store the new track reference
          setRemoteAudioTrack(audioTrack);

          console.log("Creating audio element for track");

          // Create and configure audio element
          const element = document.createElement("audio");
          element.setAttribute("autoplay", "true");
          element.setAttribute("data-track-sid", track.sid);
          element.muted = isAudioMuted;

          // Attach the track to the element
          audioTrack.attach(element);

          // Add the element to the document
          document.body.appendChild(element);
          console.log("Audio element created and attached to document body");

          // Set up track event listeners
          audioTrack.on("disabled", () => {
            console.log("Audio track disabled");
            updateTrackEnabledState(track, isAudioMuted);
          });

          audioTrack.on("enabled", () => {
            console.log("Audio track enabled");
            updateTrackEnabledState(track, isAudioMuted);
          });
        }
      } catch (error) {
        console.error("Error in handleTrackSubscribed:", error);
      }
    },
    [offlineTimerId, isAudioMuted, videoContainerRef]
  );

  const handleTrackUnsubscribed = useCallback(
    (track: RemoteTrack) => {
      try {
        console.log("Track unsubscribed:", track.kind, track.name);

        if (track.kind === "video") {
          // Video track cleanup
          if (videoContainerRef.current) {
            const videos = Array.from(
              videoContainerRef.current.querySelectorAll<HTMLVideoElement>(
                `video[data-track-sid="${track.sid}"]`
              )
            );

            videos.forEach((video) => {
              try {
                console.log("Removing video element for unsubscribed track");

                if (video?.isConnected) {
                  // Clean up media resources
                  if (video.srcObject instanceof MediaStream) {
                    video.srcObject
                      .getTracks()
                      .forEach((track) => track.stop());
                  }
                  video.srcObject = null;
                  video.pause();

                  // Modern removal method
                  video.remove();
                }
              } catch (videoErr) {
                console.error("Error removing video element:", videoErr);
              }
            });
          }

          // Clean up track event listeners
          if ("removeAllListeners" in track) {
            try {
              (track as WithListeners).removeAllListeners();
            } catch (listenerErr) {
              console.error("Error removing track listeners:", listenerErr);
            }
          }

          // Set timer logic remains the same...
          const offlineTimer = setTimeout(() => {
            if (!remoteVideoTrack && videoStatus !== "offline") {
              console.log(
                "No new video track received after timeout, but not setting to offline"
              );
              setVideoStatus("active");
              clearVideoContainer(videoContainerRef.current);
            }
          }, 5000);

          setOfflineTimerId(offlineTimer);
        } else if (track.kind === "audio") {
          // Audio track cleanup
          const audioElements = Array.from(
            document.querySelectorAll<HTMLAudioElement>(
              `audio[data-track-sid="${track.sid}"]`
            )
          );

          audioElements.forEach((audio) => {
            try {
              console.log("Removing audio element for unsubscribed track");

              if (audio?.isConnected) {
                // Clean up media resources
                if (audio.srcObject instanceof MediaStream) {
                  audio.srcObject.getTracks().forEach((track) => track.stop());
                }
                audio.srcObject = null;

                // Modern removal method
                audio.remove();
              }
            } catch (audioErr) {
              console.error("Error removing audio element:", audioErr);
            }
          });

          // Clean up event listeners
          if ("removeAllListeners" in track) {
            try {
              (track as WithListeners).removeAllListeners();
            } catch (listenerErr) {
              console.error(
                "Error removing audio track listeners:",
                listenerErr
              );
            }
          }

          if (remoteAudioTrack?.sid === track.sid) {
            setRemoteAudioTrack(null);
          }
        }
      } catch (error) {
        console.error("Error in handleTrackUnsubscribed:", error);
      }
    },
    [remoteVideoTrack, remoteAudioTrack, videoStatus, videoContainerRef]
  );

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
    [handleTrackUnsubscribed, offlineTimerId]
  );

  useEffect(() => {
    // Don't attempt to connect if any of these conditions are true
    if (!slug || !currentUser || isConnecting || room) return;

    console.log("Starting Twilio room connection process...");
    let isSubscribed = true;
    let roomCleanup: (() => void) | null = null;
    let connectAttempts = 0;
    const maxAttempts = 3;

    const connectToRoom = async () => {
      try {
        // Prevent multiple connection attempts
        setIsConnecting(true);

        connectAttempts++;
        if (connectAttempts > maxAttempts) {
          console.error(`Failed to connect after ${maxAttempts} attempts`);
          setVideoStatus("offline");
          setIsConnecting(false);
          return;
        }

        console.log(
          `[Connection] Connecting to room (attempt ${connectAttempts}):`,
          slug
        );
        const response = await fetch("/api/twilio/connect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomName: slug,
            userName: currentUser.username || currentUser.email,
          }),
        });

        if (!isSubscribed) {
          console.log(
            "[Connection] Component unmounted during connection, aborting"
          );
          setIsConnecting(false);
          return;
        }

        if (!response.ok) {
          const errorData = await response.json();
          console.error("[Connection] Error getting token:", errorData);
          setVideoStatus("offline");
          setIsConnecting(false);
          return;
        }

        const { token } = await response.json();
        console.log("[Connection] Got token, connecting to Twilio room...");

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
        room.on("disconnected", () => {
          console.log("[Connection] Room disconnected");
          setIsConnecting(false);
        });
        room.on("reconnecting", () => {
          console.log("[Connection] Room reconnecting");
        });
        room.on("reconnected", () => {
          console.log("[Connection] Room reconnected");
        });

        roomCleanup = () => {
          console.log("[Connection] Cleaning up room connection");
          room.off("participantConnected", handleParticipantConnected);
          room.off("participantDisconnected", handleParticipantDisconnected);
          room.removeAllListeners();
          room.disconnect();
          setRoom(null);
        };
      } catch (error) {
        console.error("[Connection] Error connecting to room:", error);
        setIsConnecting(false);
      }
    };

    connectToRoom();

    return () => {
      console.log("[Connection] Cleaning up connection effect");
      isSubscribed = false;
      setIsConnecting(false);
      if (roomCleanup) roomCleanup();
    };
  }, [
    slug,
    currentUser,
    handleParticipantConnected,
    handleParticipantDisconnected,
    isConnecting,
    room,
    hasStarted,
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

  // Add a function to force check and resubscribe to tracks
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

  // Handle audio muting
  const toggleAudioMute = useCallback(() => {
    if (remoteAudioTrack) {
      const audioElement = document.querySelector("audio");
      if (audioElement) {
        audioElement.muted = !isAudioMuted;
        setIsAudioMuted(!isAudioMuted);
      }
    }
  }, [remoteAudioTrack, isAudioMuted]);

  // Update streamer status in UI
  useEffect(() => {
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

  useEffect(() => {
    if (!slug || !currentUser) return;

    console.log("[Chat] Setting up chat message listener for:", slug);
    return listenToMessages(slug, (msgs) => {
      // Use functional update pattern to avoid dependencies on previous messages
      setMessages(msgs.filter((msg) => msg.userName !== "System"));
    });
  }, [slug, currentUser]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      await sendChatMessage(
        slug,
        currentUser?.username || "User",
        newMessage.trim()
      );
      setNewMessage("");
    }
  };

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
    const checkScheduledTime = async () => {
      if (slug) {
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
      }
    };

    checkScheduledTime();
  }, [slug]);

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
          <div className="relative w-full h-full rounded-lg overflow-hidden bg-gray-900">
            <div ref={videoContainerRef} className="w-full h-full" />

            {/* Status Overlays */}
            {videoStatus === "waiting" && !hasStarted && (
              <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center">
                <p className="text-brandOrange text-2xl font-semibold mb-2">
                  Stream Starting Soon
                </p>
                <p className="text-gray-400 text-center max-w-md px-4">
                  The host will start the stream shortly. You'll be
                  automatically connected when it begins.
                </p>
              </div>
            )}

            {videoStatus === "connecting" && (
              <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-t-brandOrange border-gray-600"></div>
                  <p className="text-brandOrange">Connecting to stream...</p>
                </div>
              </div>
            )}

            {/* Only show offline message if hasStarted is false */}
            {!hasStarted && !isScheduled && (
              <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center">
                <p className="text-brandOrange text-xl font-semibold mb-2">
                  Stream is Offline
                </p>
                <p className="text-gray-400 text-center max-w-md px-4">
                  This stream is currently offline. Please check back later.
                </p>
              </div>
            )}

            {videoStatus === "ended" && (
              <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center">
                <p className="text-brandOrange text-xl font-semibold mb-2">
                  Stream has Ended
                </p>
                <p className="text-gray-400 text-center max-w-md px-4">
                  Thank you for watching! This stream has ended.
                </p>
              </div>
            )}

            {/* Show camera/mic status - only when hasStarted is true */}
            {hasStarted && streamerStatus.cameraOff && (
              <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center">
                <VideoOff className="w-16 h-16 text-brandOrange mb-4" />
                <p className="text-brandOrange text-xl font-semibold">
                  Camera is Off
                </p>
              </div>
            )}

            {hasStarted && streamerStatus.audioMuted && (
              <div className="absolute top-4 left-4 bg-black/70 px-3 py-1 rounded-full flex items-center gap-2">
                <MicOff className="w-4 h-4 text-brandOrange" />
                <span className="text-sm text-brandOrange">Audio Muted</span>
              </div>
            )}

            {/* Audio Controls */}
            <div className="absolute bottom-4 right-4 flex items-center gap-2">
              <button
                onClick={toggleAudioMute}
                className="p-3 rounded-full bg-black/70 hover:bg-black/90 transition-colors"
              >
                {isAudioMuted ? (
                  <VolumeX className="w-5 h-5 text-brandOrange" />
                ) : (
                  <Volume2 className="w-5 h-5 text-brandOrange" />
                )}
              </button>
            </div>

            {isScheduled && !hasStarted && scheduledTime && (
              <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/90">
                <Countdown scheduledTime={scheduledTime} />
              </div>
            )}
          </div>
        </div>

        {/* Chat Section */}
        <div className="w-full md:w-96 h-full p-2 md:p-4">
          <StreamChat slug={slug} className="h-full" />
        </div>
      </div>
    </div>
  );
}
