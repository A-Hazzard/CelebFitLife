import { useRef, useState, useEffect } from "react";
import {
  LocalVideoTrack,
  RemoteVideoTrack,
  LocalAudioTrack,
  RemoteAudioTrack,
} from "twilio-video";
import { cleanupMediaTracks } from "@/lib/utils/streaming";
import { createLogger } from "@/lib/utils/logger";

// Create logger for this hook
const logger = createLogger("useVideoContainer");

type VideoTrack = LocalVideoTrack | RemoteVideoTrack;
type AudioTrack = LocalAudioTrack | RemoteAudioTrack;

// Extended interface for Twilio tracks
interface TrackWithSid {
  sid?: string;
  id?: string;
}

// Type guard to check if a track has sid
function hasTrackSid(
  track: VideoTrack | AudioTrack
): track is VideoTrack & TrackWithSid {
  return "sid" in track;
}

interface TrackWithId {
  id: string;
}

// Type guard to check if a track has id
function hasTrackId(track: unknown): track is TrackWithId {
  return typeof track === "object" && track !== null && "id" in track;
}

interface VideoElement {
  id: string;
  track: VideoTrack;
  style?: React.CSSProperties;
}

/**
 * A React hook to manage video elements in a container using React state
 * instead of direct DOM manipulation.
 *
 * @returns An object containing:
 *   - videoElements: Array of video elements to render
 *   - addVideo: Function to add a video track
 *   - removeVideo: Function to remove a video track
 *   - clearVideos: Function to clear all videos
 *   - videoContainerRef: Ref to attach to the video container
 */
export const useVideoContainer = () => {
  // State to track video elements
  const [videoElements, setVideoElements] = useState<VideoElement[]>([]);

  // Ref to all active tracks for proper cleanup
  const activeTracksRef = useRef<(VideoTrack | AudioTrack)[]>([]);

  // Ref to the container div
  const videoContainerRef = useRef<HTMLDivElement>(null);

  /**
   * Add a video track to the container
   */
  const addVideo = (
    track: VideoTrack,
    options: {
      style?: React.CSSProperties;
      replaceExisting?: boolean;
    } = {}
  ) => {
    logger.info(
      `Adding ${track.kind} track to container (id: ${track.name || "unnamed"})`
    );

    // Generate a unique ID for this track
    const trackId = `video-${
      track.name || (hasTrackSid(track) ? track.sid : "") || Date.now()
    }`;

    // Add to active tracks for cleanup
    activeTracksRef.current = [...activeTracksRef.current, track];

    // Create the video element state
    const videoElement: VideoElement = {
      id: trackId,
      track,
      style: options.style || {
        width: "100%",
        height: "100%",
        objectFit: "cover",
      },
    };

    setVideoElements((prev) => {
      // If replacing existing tracks, return just the new one
      if (options.replaceExisting) {
        return [videoElement];
      }

      // Otherwise add to existing
      return [...prev, videoElement];
    });
  };

  /**
   * Remove a video track from the container
   */
  const removeVideo = (trackIdOrSid: string) => {
    logger.info(`Removing track with ID/SID: ${trackIdOrSid}`);

    // Find the track to remove
    const trackToRemove = videoElements.find(
      (e) =>
        e.id === trackIdOrSid ||
        (hasTrackSid(e.track) && e.track.sid === trackIdOrSid) ||
        (hasTrackId(e.track) && e.track.id === trackIdOrSid)
    );

    if (trackToRemove) {
      // Remove from active tracks
      activeTracksRef.current = activeTracksRef.current.filter((t) => {
        const trackId = hasTrackId(t) ? t.id : "";
        const removeTrackId = hasTrackId(trackToRemove.track)
          ? trackToRemove.track.id
          : "";
        return (
          trackId !== removeTrackId &&
          (!hasTrackSid(t) ||
            t.sid !==
              (hasTrackSid(trackToRemove.track) ? trackToRemove.track.sid : ""))
        );
      });

      // Remove from state
      setVideoElements((prev) => prev.filter((e) => e.id !== trackToRemove.id));
    } else {
      logger.warn(`No track found with ID/SID: ${trackIdOrSid}`);
    }
  };

  /**
   * Clear all videos from the container
   */
  const clearVideos = () => {
    logger.info("Clearing all videos from container");
    setVideoElements([]);
  };

  // Cleanup all tracks when component unmounts
  useEffect(() => {
    return () => {
      logger.info("Cleaning up all tracks on unmount");
      cleanupMediaTracks(activeTracksRef.current);
      activeTracksRef.current = [];
    };
  }, []);

  return {
    videoElements,
    addVideo,
    removeVideo,
    clearVideos,
    videoContainerRef,
  };
};

/**
 * React component to render a Twilio video track
 */
export const VideoTrackRenderer = ({
  track,
  style = { width: "100%", height: "100%", objectFit: "cover" as const },
}: {
  track: VideoTrack;
  style?: React.CSSProperties;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!videoRef.current || !track) return;

    // Attach the track to the video element
    track.attach(videoRef.current);

    // Capture videoRef.current in a variable inside the effect
    const videoElement = videoRef.current;

    // Cleanup function
    return () => {
      if (videoElement) {
        // Detach the track if the component unmounts
        try {
          track.detach(videoElement);
        } catch (err) {
          logger.error("Error detaching track:", err);
        }
      }
    };
  }, [track]);

  return <video ref={videoRef} autoPlay playsInline style={style} />;
};
