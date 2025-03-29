import { useState, useCallback, useEffect, useRef } from "react";
import {
  connect,
  Room,
  RemoteParticipant,
  RemoteTrack,
  RemoteTrackPublication,
  RemoteAudioTrack,
  RemoteVideoTrack,
} from "twilio-video";
import {
  clearVideoContainer,
  updateTrackEnabledState,
} from "@/lib/utils/streaming";
import { WithListeners, WithDetach } from "@/lib/types/streaming";

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
  const [room, setRoom] = useState<Room | null>(null);
  const [remoteParticipant, setRemoteParticipant] =
    useState<RemoteParticipant | null>(null);
  const [remoteVideoTrack, setRemoteVideoTrack] =
    useState<RemoteVideoTrack | null>(null);
  const [remoteAudioTrack, setRemoteAudioTrack] =
    useState<RemoteAudioTrack | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [videoStatus, setVideoStatus] = useState<
    "waiting" | "connecting" | "active" | "offline" | "ended"
  >("waiting");
  const [offlineTimerId, setOfflineTimerId] = useState<NodeJS.Timeout | null>(
    null
  );

  // Keep handlers in a ref to avoid recreating them on each render
  const handlersRef = useRef({
    trackSubscribed: null as ((track: RemoteTrack) => void) | null,
    trackUnsubscribed: null as ((track: RemoteTrack) => void) | null,
    participantConnected: null as
      | ((participant: RemoteParticipant) => void)
      | null,
    participantDisconnected: null as
      | ((participant: RemoteParticipant) => void)
      | null,
  });

  // Handler for when a remote track is subscribed
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

        // Clear offline timer if running
        if (offlineTimerId) {
          console.log("Clearing offline timer since we received a new track");
          clearTimeout(offlineTimerId);
          setOfflineTimerId(null);
        }

        if (track.kind === "video") {
          const videoTrack = track as RemoteVideoTrack;
          setRemoteVideoTrack(videoTrack);
          setVideoStatus("active");

          console.log("Creating video element for track");

          // Create and attach video element to container
          if (videoContainerRef.current) {
            clearVideoContainer(videoContainerRef.current);

            const element = document.createElement("video");
            element.style.width = "100%";
            element.style.height = "100%";
            element.style.objectFit = "cover";
            element.setAttribute("data-track-sid", track.sid);
            element.setAttribute("autoplay", "true");
            element.setAttribute("playsinline", "true");
            element.muted = true; // For autoplay compliance

            videoTrack.attach(element);
            videoContainerRef.current.appendChild(element);
            console.log("Video element created and attached to container");

            // Force play for autoplay
            try {
              element.play().catch((err) => {
                console.warn("Autoplay blocked even while muted:", err);
              });
            } catch (playError) {
              console.warn("Error calling play():", playError);
            }
          }

          // Set up track event listeners
          videoTrack.on("disabled", () => {
            console.log("Video track disabled");
          });

          videoTrack.on("enabled", () => {
            console.log("Video track enabled");
            setVideoStatus("active");
          });
        } else if (track.kind === "audio") {
          const audioTrack = track as RemoteAudioTrack;
          setRemoteAudioTrack(audioTrack);

          console.log("Creating audio element for track");

          // Create and attach audio element
          const element = document.createElement("audio");
          element.setAttribute("autoplay", "true");
          element.setAttribute("data-track-sid", track.sid);
          element.muted = isAudioMuted;

          audioTrack.attach(element);
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

  // Handler for when a remote track is unsubscribed
  const handleTrackUnsubscribed = useCallback(
    (track: RemoteTrack) => {
      try {
        console.log("Track unsubscribed:", track.kind, track.name);

        if (track.kind === "video") {
          // Set a timer to mark as offline if no new track arrives soon
          console.log(
            "Video track unsubscribed, waiting for potential new track"
          );

          // Clean up track's video elements
          if (videoContainerRef.current) {
            const videos = videoContainerRef.current.querySelectorAll(
              `video[data-track-sid="${track.sid}"]`
            );
            videos.forEach((video) => {
              console.log("Removing video element for unsubscribed track");
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
            console.log(
              "No new video track received, setting status to offline"
            );
            setVideoStatus("offline");
            setOfflineTimerId(null);
          }, 10000); // 10 seconds to wait for a new track

          setOfflineTimerId(timerId);
        } else if (track.kind === "audio") {
          // Clean up track's audio elements
          const audioElements = document.querySelectorAll(
            `audio[data-track-sid="${track.sid}"]`
          );
          audioElements.forEach((element) => {
            console.log("Removing audio element for unsubscribed track");
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
        console.error("Error in handleTrackUnsubscribed:", error);
      }
    },
    [remoteVideoTrack, remoteAudioTrack, videoContainerRef]
  );

  // Handle participant connected
  const handleParticipantConnected = useCallback(
    (participant: RemoteParticipant) => {
      console.log(`Participant connected: ${participant.identity}`);
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
      console.log(`Participant disconnected: ${participant.identity}`);

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
      console.error("Cannot connect: missing room name (slug)");
      return;
    }

    try {
      setVideoStatus("connecting");
      console.log(`Connecting to room: ${slug}`);

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

      console.log(`Connected to room: ${newRoom.name}`);
      setRoom(newRoom);

      // Set up room event listeners
      newRoom.on("participantConnected", handleParticipantConnected);
      newRoom.on("participantDisconnected", handleParticipantDisconnected);
      newRoom.on("disconnected", () => {
        console.log("Disconnected from room");
        setVideoStatus("offline");
        cleanupRoom();
      });
      newRoom.on("reconnecting", () => {
        console.log("Reconnecting to room...");
        setVideoStatus("connecting");
      });
      newRoom.on("reconnected", () => {
        console.log("Reconnected to room");
        setVideoStatus("active");
      });

      // Handle existing participants
      if (newRoom.participants.size > 0) {
        newRoom.participants.forEach(handleParticipantConnected);
      } else {
        console.log("No participants in room yet");
        setVideoStatus("waiting");
      }
    } catch (error) {
      console.error("Error connecting to room:", error);
      setVideoStatus("offline");
    }
  }, [slug, handleParticipantConnected, handleParticipantDisconnected]);

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
        console.error("Error detaching video track:", error);
      }
    }

    if (remoteAudioTrack) {
      try {
        if ("detach" in remoteAudioTrack) {
          (remoteAudioTrack as WithDetach).detach();
        }
      } catch (error) {
        console.error("Error detaching audio track:", error);
      }
    }

    // Clear video container
    if (videoContainerRef.current) {
      clearVideoContainer(videoContainerRef.current);
    }

    // Clear any audio elements
    document
      .querySelectorAll("audio[data-track-sid]")
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

  // Toggle audio mute
  const toggleAudio = useCallback(() => {
    const newMutedState = !isAudioMuted;
    setIsAudioMuted(newMutedState);

    // Update all audio elements
    document.querySelectorAll("audio[data-track-sid]").forEach((el) => {
      (el as HTMLAudioElement).muted = newMutedState;
    });

    console.log(`Audio ${newMutedState ? "muted" : "unmuted"}`);
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
