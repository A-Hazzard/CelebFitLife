import { useState, useEffect, useCallback } from "react";
import {
  connect,
  Room,
  RemoteParticipant,
  RemoteTrack,
  RemoteVideoTrack,
  RemoteAudioTrack,
} from "twilio-video";
import {
  clearVideoContainer,
  updateTrackEnabledState,
} from "@/lib/utils/streaming";
import { WithListeners, WithDetach } from "@/lib/types/streaming";
import { createLogger } from "@/lib/utils/logger";

// Create logger
const logger = createLogger("useTwilioViewerConnection");

/**
 * Custom hook to manage Twilio video connection for viewers.
 * Handles connection to a room, tracks subscribing/unsubscribing, and reconnection logic.
 *
 * @param slug - The stream slug (used as the room name)
 * @param videoContainerRef - Reference to the video container DOM element
 * @returns Object containing room state, track references, and connection status
 */
export const useTwilioViewerConnection = (
  slug: string,
  videoContainerRef: React.RefObject<HTMLDivElement>
) => {
  const [remoteParticipant, setRemoteParticipant] =
    useState<RemoteParticipant | null>(null);
  const [videoStatus, setVideoStatus] = useState<
    | "idle"
    | "loading"
    | "connecting"
    | "waiting"
    | "active"
    | "offline"
    | "error"
  >("idle");
  const [room, setRoom] = useState<Room | null>(null);
  const [remoteVideoTrack, setRemoteVideoTrack] =
    useState<RemoteVideoTrack | null>(null);
  const [remoteAudioTrack, setRemoteAudioTrack] =
    useState<RemoteAudioTrack | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [offlineTimerId, setOfflineTimerId] = useState<NodeJS.Timeout | null>(
    null
  );

  // Cleanup function for room disconnection
  const cleanupRoom = useCallback(() => {
    if (room) {
      room.disconnect();
      room.removeAllListeners();
    }

    if (remoteParticipant) {
      remoteParticipant.removeAllListeners();
    }

    if (remoteVideoTrack) {
      try {
        if ("detach" in remoteVideoTrack) {
          (remoteVideoTrack as WithDetach).detach();
        }
      } catch (error) {
        logger.error("Error detaching video track:", error);
      }
    }

    if (remoteAudioTrack) {
      try {
        if ("detach" in remoteAudioTrack) {
          (remoteAudioTrack as WithDetach).detach();
        }
      } catch (error) {
        logger.error("Error detaching audio track:", error);
      }
    }

    // Clear video container
    if (videoContainerRef.current) {
      clearVideoContainer(videoContainerRef.current);
    }

    // Clear any audio elements
    document
      .querySelectorAll("audio[data-track-id]")
      .forEach((el) => el.remove());

    // Clear timer if exists
    if (offlineTimerId) {
      clearTimeout(offlineTimerId);
      setOfflineTimerId(null);
    }

    // Reset state
    setRoom(null);
    setRemoteParticipant(null);
    setRemoteVideoTrack(null);
    setRemoteAudioTrack(null);
  }, [
    room,
    remoteParticipant,
    remoteVideoTrack,
    remoteAudioTrack,
    offlineTimerId,
    videoContainerRef,
  ]);

  // Handler for when a remote track is subscribed
  const handleTrackSubscribed = useCallback(
    (track: RemoteTrack) => {
      try {
        logger.info(
          "Track subscribed:",
          track.kind,
          track.name,
          "isEnabled:",
          track.isEnabled
        );

        // Clear offline timer if running
        if (offlineTimerId) {
          logger.info("Clearing offline timer since we received a new track");
          clearTimeout(offlineTimerId);
          setOfflineTimerId(null);
        }

        if (track.kind === "video") {
          const videoTrack = track as RemoteVideoTrack;
          setRemoteVideoTrack(videoTrack);
          setVideoStatus("active");

          logger.info("Creating video element for track");

          // Create and attach video element to container
          if (videoContainerRef.current) {
            clearVideoContainer(videoContainerRef.current);

            const element = document.createElement("video");
            element.style.width = "100%";
            element.style.height = "100%";
            element.style.objectFit = "cover";
            element.setAttribute("data-track-id", track.sid);
            element.setAttribute("autoplay", "true");
            element.setAttribute("playsinline", "true");
            element.muted = true; // For autoplay compliance

            videoTrack.attach(element);
            videoContainerRef.current.appendChild(element);
            logger.info("Video element created and attached to container");

            // Force play for autoplay
            try {
              element.play().catch((err) => {
                logger.warn("Autoplay blocked even while muted:", err);
              });
            } catch (playError) {
              logger.warn("Error calling play():", playError);
            }
          }

          // Set up track event listeners
          videoTrack.on("disabled", () => {
            logger.info("Video track disabled");
          });

          videoTrack.on("enabled", () => {
            logger.info("Video track enabled");
            setVideoStatus("active");
          });
        } else if (track.kind === "audio") {
          const audioTrack = track as RemoteAudioTrack;
          setRemoteAudioTrack(audioTrack);

          logger.info("Creating audio element for track");

          // Create and attach audio element
          const element = document.createElement("audio");
          element.setAttribute("autoplay", "true");
          element.setAttribute("data-track-id", track.sid);
          element.muted = isAudioMuted;

          audioTrack.attach(element);
          document.body.appendChild(element);
          logger.info("Audio element created and attached to document body");

          // Set up track event listeners
          audioTrack.on("disabled", () => {
            logger.info("Audio track disabled");
            updateTrackEnabledState(track, isAudioMuted);
          });

          audioTrack.on("enabled", () => {
            logger.info("Audio track enabled");
            updateTrackEnabledState(track, isAudioMuted);
          });
        }
      } catch (error) {
        logger.error("Error in handleTrackSubscribed:", error);
      }
    },
    [offlineTimerId, isAudioMuted, videoContainerRef]
  );

  // Handler for when a remote track is unsubscribed
  const handleTrackUnsubscribed = useCallback(
    (track: RemoteTrack) => {
      try {
        logger.info("Track unsubscribed:", track.kind, track.name);

        if (track.kind === "video") {
          // Set a timer to mark as offline if no new track arrives soon
          logger.info(
            "Video track unsubscribed, waiting for potential new track"
          );

          // Clean up track's video elements
          if (videoContainerRef.current) {
            const videos = videoContainerRef.current.querySelectorAll(
              `video[data-track-id="${track.sid}"]`
            );
            videos.forEach((video) => {
              logger.info("Removing video element for unsubscribed track");
              video.remove();
            });
          }

          // Clean up track event listeners
          if ("removeAllListeners" in track) {
            (track as WithListeners).removeAllListeners();
          }

          // Set remote video track to null
          if (remoteVideoTrack?.sid === track.sid) {
            setRemoteVideoTrack(null);
          }

          // Set timer to switch to offline if no new track arrives
          const timerId = setTimeout(() => {
            logger.info(
              "No new video track received, setting status to offline"
            );
            setVideoStatus("offline");
            setOfflineTimerId(null);
          }, 10000); // 10 seconds to wait for a new track

          setOfflineTimerId(timerId);
        } else if (track.kind === "audio") {
          // Clean up track's audio elements
          const audioElements = document.querySelectorAll(
            `audio[data-track-id="${track.sid}"]`
          );
          audioElements.forEach((element) => {
            logger.info("Removing audio element for unsubscribed track");
            element.remove();
          });

          // Clean up track event listeners
          if ("removeAllListeners" in track) {
            (track as WithListeners).removeAllListeners();
          }

          // Set remote audio track to null
          if (remoteAudioTrack?.sid === track.sid) {
            setRemoteAudioTrack(null);
          }
        }
      } catch (error) {
        logger.error("Error in handleTrackUnsubscribed:", error);
      }
    },
    [remoteVideoTrack, remoteAudioTrack, videoContainerRef]
  );

  // Handle participant connected
  const handleParticipantConnected = useCallback(
    (participant: RemoteParticipant) => {
      logger.info(`Participant connected: ${participant.identity}`);
      setRemoteParticipant(participant);

      // Set up participant's existing tracks
      participant.tracks.forEach((publication) => {
        if (publication.isSubscribed && publication.track) {
          handleTrackSubscribed(publication.track);
        }
      });

      // Set up event listeners for this participant
      participant.on("trackSubscribed", handleTrackSubscribed);
      participant.on("trackUnsubscribed", handleTrackUnsubscribed);
    },
    [handleTrackSubscribed, handleTrackUnsubscribed]
  );

  // Handle participant disconnected
  const handleParticipantDisconnected = useCallback(
    (participant: RemoteParticipant) => {
      logger.info(`Participant disconnected: ${participant.identity}`);

      // Clean up participant event listeners
      participant.removeAllListeners();

      if (remoteParticipant?.identity === participant.identity) {
        setRemoteParticipant(null);
      }

      // Set video status to offline
      setVideoStatus("offline");
    },
    [remoteParticipant]
  );

  // Connect to the Twilio room
  const connectToRoom = useCallback(async () => {
    if (!slug) {
      logger.error("Cannot connect: missing room name (slug)");
      return;
    }

    try {
      setVideoStatus("connecting");
      logger.info(`Connecting to room: ${slug}`);

      // Fetch token from server
      const response = await fetch("/api/twilio/viewer-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomName: slug }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch token: ${response.statusText}`);
      }

      const { token } = await response.json();

      if (!token) {
        throw new Error("No token received from server");
      }

      // Connect to room
      const newRoom = await connect(token, {
        name: slug,
        tracks: [],
        dominantSpeaker: true,
      });

      logger.info(`Connected to room: ${newRoom.name}`);
      setRoom(newRoom);

      // Set up room event listeners
      newRoom.on("participantConnected", handleParticipantConnected);
      newRoom.on("participantDisconnected", handleParticipantDisconnected);
      newRoom.on("disconnected", () => {
        logger.info("Disconnected from room");
        setVideoStatus("offline");
        cleanupRoom();
      });
      newRoom.on("reconnecting", () => {
        logger.info("Reconnecting to room...");
        setVideoStatus("connecting");
      });
      newRoom.on("reconnected", () => {
        logger.info("Reconnected to room");
        setVideoStatus("active");
      });

      // Handle existing participants
      if (newRoom.participants.size > 0) {
        newRoom.participants.forEach(handleParticipantConnected);
      } else {
        logger.info("No participants in room yet");
        setVideoStatus("waiting");
      }
    } catch (error) {
      logger.error("Error connecting to room:", error);
      setVideoStatus("offline");
    }
  }, [
    slug,
    handleParticipantConnected,
    handleParticipantDisconnected,
    cleanupRoom,
  ]);

  // Toggle audio mute
  const toggleAudio = useCallback(() => {
    const newMutedState = !isAudioMuted;
    setIsAudioMuted(newMutedState);

    // Update all audio elements
    document.querySelectorAll("audio[data-track-id]").forEach((el) => {
      (el as HTMLAudioElement).muted = newMutedState;
    });

    logger.info(`Audio ${newMutedState ? "muted" : "unmuted"}`);
  }, [isAudioMuted]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupRoom();
    };
  }, [cleanupRoom]);

  return {
    room,
    remoteParticipant,
    remoteVideoTrack,
    remoteAudioTrack,
    videoStatus,
    isAudioMuted,
    connectToRoom,
    cleanupRoom,
    toggleAudio,
  };
};
