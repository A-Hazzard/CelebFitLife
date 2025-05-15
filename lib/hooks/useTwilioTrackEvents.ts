import { useEffect } from "react";
import {
  LocalAudioTrack,
  LocalVideoTrack,
  LocalTrack,
  Room,
} from "twilio-video";
import {
  TrackStatusChangeHandler,
  NetworkQualityStats,
  QualityChangeHandler,
} from "@/lib/types/streaming.types";

/**
 * Custom hook to manage Twilio track events.
 * Sets up event listeners for track enabled/disabled events and cleans them up on unmount.
 *
 * @param isConnected - Boolean indicating if the Twilio room is connected.
 * @param videoTrack - The current local video track.
 * @param audioTrack - The current local audio track.
 * @param onTrackStatusChange - Callback function to handle track status changes.
 */
export const useTwilioTrackEvents = (
  isConnected: boolean,
  videoTrack: LocalVideoTrack | null,
  audioTrack: LocalAudioTrack | null,
  onTrackStatusChange: TrackStatusChangeHandler
) => {
  useEffect(() => {
    if (!isConnected) return;

    const handleTrackStatus = (track: LocalTrack) => {
      if (track.kind === "video") {
        onTrackStatusChange("video", track.isEnabled);
      } else if (track.kind === "audio") {
        onTrackStatusChange("audio", track.isEnabled);
      }
    };

    const handleVideoDisabled = () => {
      if (videoTrack) handleTrackStatus(videoTrack);
    };

    const handleAudioDisabled = () => {
      if (audioTrack) handleTrackStatus(audioTrack);
    };

    // Add event listeners
    videoTrack?.on("disabled", handleVideoDisabled);
    videoTrack?.on("enabled", handleVideoDisabled);
    audioTrack?.on("disabled", handleAudioDisabled);
    audioTrack?.on("enabled", handleAudioDisabled);

    // Cleanup function
    return () => {
      videoTrack?.off("disabled", handleVideoDisabled);
      videoTrack?.off("enabled", handleVideoDisabled);
      audioTrack?.off("disabled", handleAudioDisabled);
      audioTrack?.off("enabled", handleAudioDisabled);
    };
  }, [isConnected, videoTrack, audioTrack, onTrackStatusChange]);
};

/**
 * Custom hook to manage network quality monitoring for Twilio rooms.
 * Periodically checks the network quality and adjusts video quality accordingly.
 *
 * @param isConnected - Boolean indicating if the Twilio room is connected.
 * @param room - The current Twilio Room object.
 * @param currentCameraId - The ID of the currently used camera.
 * @param currentVideoTrack - The current local video track.
 * @param onQualityChange - Callback to execute when video quality changes.
 * @param [interval=5000] - Interval in milliseconds for checking network quality.
 */
export const useNetworkQualityMonitor = (
  isConnected: boolean,
  room: Room | null,
  currentCameraId: string,
  currentVideoTrack: LocalVideoTrack | null,
  onQualityChange: QualityChangeHandler,
  interval: number = 5000
) => {
  useEffect(() => {
    if (!room || !isConnected) return;

    const networkQualityInterval = setInterval(async () => {
      const localParticipant = room?.localParticipant;
      if (!localParticipant) return;

      const quality = (localParticipant as NetworkQualityStats)
        .networkQualityLevel;

      if (quality !== undefined && quality !== null) {
        if (quality <= 2) {
          onQualityChange("low", { success: false, track: null });
        } else if (quality === 3) {
          onQualityChange("medium", { success: false, track: null });
        } else {
          onQualityChange("high", { success: false, track: null });
        }
      }
    }, interval);

    return () => clearInterval(networkQualityInterval);
  }, [
    room,
    isConnected,
    currentCameraId,
    currentVideoTrack,
    onQualityChange,
    interval,
  ]);
};
