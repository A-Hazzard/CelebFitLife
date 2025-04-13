import { useState, useEffect, useRef } from "react";
import { cleanupMediaTracks } from "@/lib/utils/twilio";
import { createLogger } from "@/lib/utils/logger";
import {
  TwilioAudioTrack,
  AudioTracksHookResult,
  AudioElement,
  // Remove these unused types
  // AudioTrackOptions,
  // AudioDeviceInfo,
} from "@/lib/types/audio";

// Create logger for this hook
const logger = createLogger("useAudioTracks");

// Type guard to check if a track has sid
function hasTrackSid(
  track: TwilioAudioTrack
): track is TwilioAudioTrack & { sid: string } {
  return "sid" in track;
}

// Type guard to check if a track has id
function hasTrackId(track: unknown): track is { id: string } {
  return typeof track === "object" && track !== null && "id" in track;
}

/**
 * A React hook to manage audio tracks using React state
 * instead of direct DOM manipulation.
 *
 * @returns An object containing functions to manage audio tracks
 */
export const useAudioTracks = (): AudioTracksHookResult => {
  // State to track audio elements
  const [audioElements, setAudioElements] = useState<AudioElement[]>([]);

  // Global mute state
  const [isGloballyMuted, setIsGloballyMuted] = useState(false);

  // Ref to active audio tracks for cleanup
  const activeTracksRef = useRef<TwilioAudioTrack[]>([]);

  /**
   * Add an audio track
   */
  const addAudio = (
    track: TwilioAudioTrack,
    options: { muted?: boolean } = {}
  ) => {
    logger.info(`Adding ${track.kind} track (${track.name || "unnamed"})`);

    // Generate a unique ID for this track
    const trackId = `audio-${
      track.name || (hasTrackSid(track) ? track.sid : "") || Date.now()
    }`;

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
        (hasTrackSid(e.track) && e.track.sid === trackIdOrSid) ||
        (hasTrackId(e.track) && e.track.id === trackIdOrSid)
    );

    if (trackToRemove) {
      // Remove from active tracks
      activeTracksRef.current = activeTracksRef.current.filter(
        (t) =>
          !(
            hasTrackId(t) &&
            trackToRemove.track &&
            hasTrackId(trackToRemove.track) &&
            t.id === trackToRemove.track.id
          ) &&
          (!hasTrackSid(t) ||
            !hasTrackSid(trackToRemove.track) ||
            t.sid !== trackToRemove.track.sid)
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
          (hasTrackSid(audio.track) && audio.track.sid === trackIdOrSid) ||
          (hasTrackId(audio.track) && audio.track.id === trackIdOrSid)
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
  track: TwilioAudioTrack;
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

    // Capture audioRef.current in a variable inside the effect
    const audioElement = audioRef.current;

    // Cleanup function
    return () => {
      if (audioElement) {
        try {
          track.detach(audioElement);
        } catch (err) {
          logger.error("Error detaching audio track:", err as Error);
        }
      }
    };
  }, [track, muted]);

  return <audio ref={audioRef} autoPlay />;
};
