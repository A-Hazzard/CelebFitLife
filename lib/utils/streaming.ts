import { Streamer, StreamData } from "@/lib/types/streaming";
import {
  LocalVideoTrack,
  RemoteTrack,
  LocalAudioTrack,
  Room,
} from "twilio-video";
import { createLocalVideoTrack, createLocalAudioTrack } from "twilio-video";
import { updateStreamDeviceStatus } from "@/lib/helpers/streaming";

/**
 * Filters an array of streamers based on selected categories and tags.
 * @param streamers - The array of Streamer objects to filter.
 * @param selectedCategories - An array of category names to filter by.
 * @param selectedTags - An array of tag names to filter by.
 * @returns A new array containing only the streamers that match the criteria.
 */
export const filterStreamers = (
  streamers: Streamer[],
  selectedCategories: string[],
  selectedTags: string[]
): Streamer[] => {
  return streamers
    .filter((streamer) => {
      // If no categories are selected, show all streamers
      if (selectedCategories.length === 0) return true;

      // Check if the streamer's specialty matches any selected category
      return selectedCategories.includes(streamer.specialty);
    })
    .filter((streamer) => {
      // If no tags are selected, show all streamers
      if (selectedTags.length === 0) return true;

      // Check if any of the streamer's tags are in the selected tags
      return streamer.tags.some((tag) => selectedTags.includes(tag));
    });
};

/**
 * Generates a URL-friendly slug from a given title string.
 * Converts to lowercase, replaces spaces with hyphens, and removes invalid characters.
 * @param title - The input string (e.g., stream title).
 * @returns The generated slug string.
 */
export const generateSlug = (title: string): string => {
  return title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "");
};

/**
 * Calculates a default Date object set a specified number of minutes into the future.
 * Useful for setting default schedule times.
 * @param [minutesFromNow=10] - The number of minutes from now to set the date.
 * @returns A Date object set to the future time.
 */
export const getDefaultScheduleTime = (minutesFromNow: number = 10): Date => {
  const date = new Date();
  date.setMinutes(date.getMinutes() + minutesFromNow);
  return date;
};

/**
 * Safely clears all child elements (typically video elements) from a container.
 * It attempts to detach Twilio tracks if a track object is provided,
 * but primarily focuses on removing DOM elements.
 * @param container - The HTMLDivElement to clear.
 * @param [track] - Optional Twilio LocalVideoTrack to detach from elements before removal.
 */
export const clearVideoContainer = (container: HTMLDivElement | null) => {
  if (!container) return;

  console.log("Clearing video container");
  try {
    // Use innerHTML to clear all contents - safer than removing individual elements
    container.innerHTML = "";
    console.log("Video container cleared");
  } catch (error) {
    console.error("Error clearing video container:", error);
  }
};

/**
 * Enumerates available media input devices (cameras and microphones).
 * @returns A promise resolving to an object containing arrays of camera and mic devices,
 *          or an error message if enumeration fails.
 */
export const setupDevices = async (): Promise<{
  cameras: MediaDeviceInfo[];
  mics: MediaDeviceInfo[];
  error?: string;
}> => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter((d) => d.kind === "videoinput");
    const mics = devices.filter((d) => d.kind === "audioinput");
    return { cameras, mics };
  } catch (error) {
    console.error("Error setting up devices:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return { cameras: [], mics: [], error: message };
  }
};

/**
 * Updates the UI state (e.g., muting audio elements) based on a Twilio track's enabled status.
 * @param track - The Twilio RemoteTrack whose status changed.
 * @param isGloballyMuted - A boolean indicating if the user has manually muted the audio output.
 */
export const updateTrackEnabledState = (
  track: RemoteTrack,
  isGloballyMuted: boolean // e.g., user-controlled mute state
) => {
  try {
    if (!track) return;

    console.log(
      `Updating track enabled state for ${track.kind} track: ${track.isEnabled}`
    );

    if (track.kind === "audio") {
      const audioElements = document.querySelectorAll(
        `audio[data-track-sid="${track.sid}"]`
      );
      audioElements.forEach((el) => {
        const audioEl = el as HTMLAudioElement;
        // Mute if track is disabled OR if the user has globally muted
        audioEl.muted = !track.isEnabled || isGloballyMuted;
      });
    } else if (track.kind === "video") {
      // Logic for video state updates can be handled in the component
      // based on track.isEnabled, but this util can focus on DOM manipulation if needed.
      // Example: Add/remove a class, show/hide overlay, etc.
      console.log(
        `Video track ${track.sid} is ${
          track.isEnabled ? "enabled" : "disabled"
        }`
      );
    }
  } catch (error) {
    console.error("Error in updateTrackEnabledState:", error);
  }
};

/**
 * Switches to a different camera device.
 * Creates a new video track with the specified device ID, publishes it to the Twilio room,
 * and unpublishes the old track after a short delay to ensure smooth transition.
 *
 * @param deviceId - The ID of the camera device to switch to.
 * @param room - The Twilio Room object.
 * @param currentVideoTrack - The current local video track that will be replaced.
 * @param slug - The stream slug to update device status in Firestore.
 * @returns A promise resolving to an object containing the new track and success/error status.
 */
export const switchCamera = async (
  deviceId: string,
  room: Room | null,
  currentVideoTrack: LocalVideoTrack | null,
  slug: string
): Promise<{
  success: boolean;
  track: LocalVideoTrack | null;
  error?: string;
}> => {
  try {
    console.log("Switching camera to device:", deviceId);

    const newVideoTrack = await createLocalVideoTrack({
      deviceId,
      width: 1280,
      height: 720,
      name: `camera-${deviceId.substring(0, 8)}-${Date.now()}`,
    });

    if (room?.localParticipant) {
      await room.localParticipant.publishTrack(newVideoTrack);

      if (currentVideoTrack) {
        // Small delay to ensure smooth transition
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await room.localParticipant.unpublishTrack(currentVideoTrack);
        currentVideoTrack.stop();
      }
    }

    // Update Firestore with the new device ID
    if (slug) {
      await updateStreamDeviceStatus(slug, { currentCameraId: deviceId });
    }

    return { success: true, track: newVideoTrack };
  } catch (error) {
    console.error("Error switching camera:", error);
    return {
      success: false,
      track: null,
      error:
        error instanceof Error
          ? error.message
          : "Unknown error switching camera",
    };
  }
};

/**
 * Switches to a different microphone device.
 * Creates a new audio track with the specified device ID, publishes it to the Twilio room,
 * and unpublishes the old track.
 *
 * @param deviceId - The ID of the microphone device to switch to.
 * @param room - The Twilio Room object.
 * @param currentAudioTrack - The current local audio track that will be replaced.
 * @param slug - The stream slug to update device status in Firestore.
 * @returns A promise resolving to an object containing the new track and success/error status.
 */
export const switchMic = async (
  deviceId: string,
  room: Room | null,
  currentAudioTrack: LocalAudioTrack | null,
  slug: string
): Promise<{
  success: boolean;
  track: LocalAudioTrack | null;
  error?: string;
}> => {
  try {
    const newAudioTrack = await createLocalAudioTrack({
      deviceId,
      name: "microphone",
    });

    if (room?.localParticipant) {
      await room.localParticipant.publishTrack(newAudioTrack);

      if (currentAudioTrack) {
        await room.localParticipant.unpublishTrack(currentAudioTrack);
        currentAudioTrack.stop();
      }
    }

    // Update Firestore with the new device ID
    if (slug) {
      await updateStreamDeviceStatus(slug, { currentMicId: deviceId });
    }

    return { success: true, track: newAudioTrack };
  } catch (error) {
    console.error("Error switching microphone:", error);
    return {
      success: false,
      track: null,
      error:
        error instanceof Error
          ? error.message
          : "Unknown error switching microphone",
    };
  }
};

/**
 * Switches the quality of the video stream by creating a new track with different constraints.
 * Useful for adapting to different network conditions.
 *
 * @param quality - The quality level to switch to ("low", "medium", or "high").
 * @param room - The Twilio Room object.
 * @param currentVideoTrack - The current local video track that will be replaced.
 * @param deviceId - The ID of the camera device to use for the new track.
 * @returns A promise resolving to an object containing the new track and success/error status.
 */
export const switchVideoQuality = async (
  quality: "low" | "medium" | "high",
  room: Room | null,
  currentVideoTrack: LocalVideoTrack | null,
  deviceId: string
): Promise<{
  success: boolean;
  track: LocalVideoTrack | null;
  error?: string;
}> => {
  try {
    if (!deviceId || !room?.localParticipant) {
      return {
        success: false,
        track: null,
        error: "Missing device ID or room is not connected",
      };
    }

    const constraints = {
      low: { width: 640, height: 480 },
      medium: { width: 960, height: 540 },
      high: { width: 1280, height: 720 },
    };

    const newVideoTrack = await createLocalVideoTrack({
      deviceId,
      ...constraints[quality],
    });

    // Publish new track BEFORE unpublishing old track for smoother transition
    await room.localParticipant.publishTrack(newVideoTrack);

    if (currentVideoTrack) {
      await room.localParticipant.unpublishTrack(currentVideoTrack);
      currentVideoTrack.stop();
    }

    console.log(`Switched to ${quality} quality video track`);
    return { success: true, track: newVideoTrack };
  } catch (error) {
    console.error("Error switching video quality:", error);
    return {
      success: false,
      track: null,
      error:
        error instanceof Error
          ? error.message
          : "Unknown error switching video quality",
    };
  }
};

/**
 * Sets up reconnection event handlers for a Twilio Room.
 * Handles the different states of reconnection attempts and provides callbacks for each state.
 *
 * @param room - The Twilio Room instance to monitor for reconnection events
 * @param onReconnecting - Callback function triggered when reconnection starts
 * @param onReconnected - Callback function triggered after successful reconnection
 * @param onFailed - Callback function triggered when reconnection fails
 * @returns A cleanup function to remove all event listeners
 */
export const setupReconnectionHandlers = (
  room: Room,
  onReconnecting?: () => void,
  onReconnected?: () => void,
  onFailed?: (error: Error) => void
): (() => void) => {
  if (!room) {
    console.warn("No room provided to setupReconnectionHandlers");
    return () => {}; // Return empty cleanup function
  }

  console.log("Setting up Twilio room reconnection handlers");

  // Handler for when the room starts reconnecting
  const handleReconnecting = (error?: Error) => {
    console.log("Room is reconnecting...", error);
    onReconnecting?.();
  };

  // Handler for when the room successfully reconnects
  const handleReconnected = () => {
    console.log("Room has successfully reconnected");
    onReconnected?.();
  };

  // Handler for when reconnection fails and room disconnects
  const handleDisconnected = (room: Room, error?: Error) => {
    if (error) {
      console.error("Room disconnected due to error:", error);
      onFailed?.(error);
    }
  };

  // Attach event listeners
  room.on("reconnecting", handleReconnecting);
  room.on("reconnected", handleReconnected);
  room.on("disconnected", handleDisconnected);

  // Return cleanup function
  return () => {
    room.off("reconnecting", handleReconnecting);
    room.off("reconnected", handleReconnected);
    room.off("disconnected", handleDisconnected);
  };
};

/**
 * Handles automatic reconnection attempts for Twilio video sessions.
 * Useful when network interruptions occur, but you want to maintain the stream.
 *
 * @param roomName - The name of the Twilio room to reconnect to
 * @param connectFn - Function that returns a Promise resolving to a new Room
 * @param maxAttempts - Maximum number of reconnection attempts (default: 5)
 * @param delayMs - Base delay between attempts in milliseconds (default: 2000)
 * @returns A Promise resolving to the reconnected Room or error
 */
export const handleAutoReconnect = async (
  roomName: string,
  connectFn: () => Promise<Room>,
  maxAttempts: number = 5,
  delayMs: number = 2000
): Promise<{ success: boolean; room?: Room; error?: string }> => {
  let attempts = 0;

  // Exponential backoff function
  const getBackoffTime = (attempt: number) => {
    return delayMs * Math.pow(1.5, attempt);
  };

  // Try to reconnect with backoff
  while (attempts < maxAttempts) {
    try {
      console.log(`Reconnection attempt ${attempts + 1}/${maxAttempts}`);

      // Wait with exponential backoff
      if (attempts > 0) {
        const backoffTime = getBackoffTime(attempts);
        console.log(`Waiting ${backoffTime}ms before next attempt...`);
        await new Promise((resolve) => setTimeout(resolve, backoffTime));
      }

      // Try to connect
      const room = await connectFn();
      console.log(`Successfully reconnected to room: ${roomName}`);

      return { success: true, room };
    } catch (error) {
      attempts++;
      console.error(`Reconnection attempt ${attempts} failed:`, error);

      // If we've reached max attempts, give up
      if (attempts >= maxAttempts) {
        return {
          success: false,
          error: `Failed to reconnect after ${maxAttempts} attempts: ${
            error instanceof Error ? error.message : String(error)
          }`,
        };
      }

      // Otherwise, continue to next attempt
    }
  }

  // This should never be reached due to the return inside the loop
  return { success: false, error: "Unknown reconnection failure" };
};
