import { useState, useEffect, useRef } from "react";
import { LocalAudioTrack, RemoteAudioTrack } from "twilio-video";
import { cleanupMediaTracks } from "@/lib/utils/streaming";
import { createLogger } from "@/lib/utils/logger";

// Create logger for this hook
const logger = createLogger("useAudioTracks");

type AudioTrack = LocalAudioTrack | RemoteAudioTrack;

interface AudioElement {
  id: string;
  track: AudioTrack;
  muted: boolean;
}

/**
 * A React hook to manage audio tracks using React state
 * instead of direct DOM manipulation.
 *
 * @returns An object containing functions to manage audio tracks
 */
export const useAudioTracks = () => {
  // State to track audio elements
  const [audioElements, setAudioElements] = useState<AudioElement[]>([]);

  // Global mute state
  const [isGloballyMuted, setIsGloballyMuted] = useState(false);

  // Ref to active audio tracks for cleanup
  const activeTracksRef = useRef<AudioTrack[]>([]);

  /**
   * Add an audio track
   */
  const addAudio = (track: AudioTrack, options: { muted?: boolean } = {}) => {
    logger.info(`Adding ${track.kind} track (${track.name || "unnamed"})`);

    // Generate a unique ID for this track
    const trackId = `audio-${track.name || track.sid || Date.now()}`;

    // Add to active tracks for cleanup
    activeTracksRef.current = [...activeTracksRef.current, track];

    // Apply initial mute state - either from options or global state
    const initialMuted =
      options.muted !== undefined ? options.muted : isGloballyMuted;

    // Create audio element state
    const audioElement: AudioElement = {
      id: trackId,
      track,
      muted: initialMuted,
    };

    // Add to state
    setAudioElements((prev) => [...prev, audioElement]);

    return trackId;
  };

  /**
   * Remove an audio track
   */
  const removeAudio = (trackIdOrSid: string) => {
    logger.info(`Removing audio track: ${trackIdOrSid}`);

    // Find the track to remove
    const trackToRemove = audioElements.find(
      (e) =>
        e.id === trackIdOrSid ||
        e.track.sid === trackIdOrSid ||
        (e.track as any).id === trackIdOrSid
    );

    if (trackToRemove) {
      // Remove from active tracks
      activeTracksRef.current = activeTracksRef.current.filter(
        (t) =>
          (t as any).id !== (trackToRemove.track as any).id &&
          (t as any).sid !== trackToRemove.track.sid
      );

      // Remove from state
      setAudioElements((prev) => prev.filter((e) => e.id !== trackToRemove.id));
    } else {
      logger.warn(`No track found with ID/SID: ${trackIdOrSid}`);
    }
  };

  /**
   * Toggle mute state for a specific track
   */
  const toggleTrackMute = (trackIdOrSid: string) => {
    setAudioElements((prev) =>
      prev.map((audio) => {
        if (
          audio.id === trackIdOrSid ||
          audio.track.sid === trackIdOrSid ||
          (audio.track as any).id === trackIdOrSid
        ) {
          return { ...audio, muted: !audio.muted };
        }
        return audio;
      })
    );
  };

  /**
   * Toggle global mute state for all tracks
   */
  const toggleGlobalMute = () => {
    const newMuteState = !isGloballyMuted;
    setIsGloballyMuted(newMuteState);

    // Apply to all tracks
    setAudioElements((prev) =>
      prev.map((audio) => ({ ...audio, muted: newMuteState }))
    );
  };

  /**
   * Clear all audio tracks
   */
  const clearAudios = () => {
    logger.info("Clearing all audio tracks");
    setAudioElements([]);
  };

  // Cleanup tracks on unmount
  useEffect(() => {
    return () => {
      logger.info("Cleaning up all audio tracks on unmount");
      cleanupMediaTracks(activeTracksRef.current);
      activeTracksRef.current = [];
    };
  }, []);

  return {
    audioElements,
    isGloballyMuted,
    addAudio,
    removeAudio,
    toggleTrackMute,
    toggleGlobalMute,
    clearAudios,
  };
};

/**
 * React component to render a Twilio audio track
 */
export const AudioTrackRenderer = ({
  track,
  muted = false,
}: {
  track: AudioTrack;
  muted?: boolean;
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);

  // Update muted state when props change
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = muted;
    }
  }, [muted]);

  // Attach the track to the audio element
  useEffect(() => {
    if (!audioRef.current || !track) return;

    // Attach the track
    track.attach(audioRef.current);

    // Set initial muted state
    audioRef.current.muted = muted;

    // Cleanup function
    return () => {
      if (audioRef.current) {
        try {
          track.detach(audioRef.current);
        } catch (err) {
          logger.error("Error detaching audio track:", err);
        }
      }
    };
  }, [track, muted]);

  return <audio ref={audioRef} autoPlay />;
};
