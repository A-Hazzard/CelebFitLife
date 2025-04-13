/**
 * TWILIO VIDEO UTILITIES
 *
 * This file contains utilities for working with Twilio Video in both client and server contexts.
 * It handles token generation, track management, room connection, and media element handling.
 */

import {
  LocalAudioTrack,
  LocalVideoTrack,
  RemoteAudioTrack,
  RemoteVideoTrack,
  Room,
  connect,
  createLocalAudioTrack,
  createLocalVideoTrack,
  RemoteTrack,
} from "twilio-video";
import { createLogger } from "@/lib/utils/logger";
import { toStreamingError } from "@/lib/utils/errorHandler";
import {
  VideoTrackOptions,
  AudioTrackOptions,
} from "@/lib/types/streaming.types";

// Create context-specific loggers
const twilioLogger = createLogger("Twilio");
const trackLogger = twilioLogger.withContext("Track");
const roomLogger = twilioLogger.withContext("Room");

// SERVER-SIDE FUNCTIONS

/**
 * Generates a Twilio Video Access Token (Server-side only).
 * @param roomName - The name (or slug) of the Twilio room
 * @param userName - Unique identity for the user
 */
export async function generateTwilioToken(roomName: string, userName: string) {
  // Note: This function should only be used on the server side
  // Import these modules dynamically to prevent client-side errors
  const { randomUUID } = await import("crypto");
  const { jwt } = await import("twilio");
  const { AccessToken } = jwt;
  const { VideoGrant } = AccessToken;

  const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioApiKey = process.env.TWILIO_API_KEY_SID;
  const twilioApiSecret = process.env.TWILIO_API_KEY_SECRET;

  if (!twilioAccountSid || !twilioApiKey || !twilioApiSecret) {
    throw new Error("Missing Twilio credentials in environment variables");
  }

  // If no userName is provided, generate one
  const identity = userName || `user-${randomUUID()}`;

  // Create the token
  const token = new AccessToken(
    twilioAccountSid,
    twilioApiKey,
    twilioApiSecret,
    {
      identity,
    }
  );

  // Grant the token Twilio Video capabilities
  const videoGrant = new VideoGrant({
    room: roomName,
  });
  token.addGrant(videoGrant);

  return token.toJwt(); // Return the JWT string
}

// CLIENT-SIDE FUNCTIONS

/**
 * Attaches a video track to a container element.
 */
export function attachVideoTrack(
  track: LocalVideoTrack | RemoteVideoTrack,
  container: HTMLDivElement
) {
  const el = track.attach(); // returns <video> element
  container.appendChild(el);
  return el;
}

/**
 * Attaches an audio track (mostly used for remote participants).
 */
export function attachAudioTrack(
  track: LocalAudioTrack | RemoteAudioTrack,
  container: HTMLDivElement
) {
  const el = track.attach(); // returns <audio> element
  container.appendChild(el);
  return el;
}

/**
 * Safely stops and detaches a track, cleaning up resources.
 */
export function stopAndDetachTrack(
  track: LocalVideoTrack | RemoteVideoTrack | LocalAudioTrack | RemoteAudioTrack
) {
  if (!track) return;

  try {
    if (track.kind === "video") {
      const videoTrack = track as LocalVideoTrack | RemoteVideoTrack;
      if ("stop" in videoTrack) {
        videoTrack.stop();
      }
      videoTrack.detach().forEach((el) => el.remove());
    } else if (track.kind === "audio") {
      const audioTrack = track as LocalAudioTrack | RemoteAudioTrack;
      if ("stop" in audioTrack) {
        audioTrack.stop();
      }
      audioTrack.detach().forEach((el) => el.remove());
    }
  } catch (error) {
    trackLogger.error(
      "Error stopping/detaching track:",
      toStreamingError(error)
    );
  }
}

/**
 * Safely cleans up all media tracks.
 */
export function cleanupMediaTracks(
  tracks: (LocalVideoTrack | LocalAudioTrack | RemoteTrack)[] | null
): void {
  if (!tracks || tracks.length === 0) {
    trackLogger.warn("No tracks provided for cleanup");
    return;
  }

  trackLogger.info(`Cleaning up ${tracks.length} media tracks`);

  tracks.forEach((track) => {
    try {
      // Stop the track to release device access
      if ("stop" in track) {
        track.stop();
      }

      // Detach from DOM elements for remote tracks
      if ("detach" in track) {
        track.detach().forEach((el) => el.remove());
      }
    } catch (trackErr) {
      const error = toStreamingError(trackErr);
      trackLogger.error(`Error cleaning up ${track.kind} track:`, error);
    }
  });
}

/**
 * Clears video elements from a container.
 */
export function clearVideoContainer(container: HTMLDivElement | null): void {
  if (!container) return;

  // First clean up video srcObject to release MediaStream resources
  const videoElements = container.querySelectorAll("video");
  videoElements.forEach((video) => {
    if (video.srcObject instanceof MediaStream) {
      video.srcObject.getTracks().forEach((track) => track.stop());
    }
    video.srcObject = null;
    video.remove();
  });

  // Also clean up audio elements
  const audioElements = container.querySelectorAll("audio");
  audioElements.forEach((audio) => {
    if (audio.srcObject instanceof MediaStream) {
      audio.srcObject.getTracks().forEach((track) => track.stop());
    }
    audio.srcObject = null;
    audio.remove();
  });
}

/**
 * Creates a video track with the specified device ID.
 */
export async function createVideoTrack(
  deviceId?: string
): Promise<LocalVideoTrack> {
  const options: VideoTrackOptions = {};
  if (deviceId) options.deviceId = deviceId;

  try {
    return await createLocalVideoTrack(options);
  } catch (error) {
    trackLogger.error("Failed to create video track:", toStreamingError(error));
    throw error;
  }
}

/**
 * Creates an audio track with the specified device ID.
 */
export async function createAudioTrack(
  deviceId?: string
): Promise<LocalAudioTrack> {
  const options: AudioTrackOptions = {
    echoCancellation: true,
    noiseSuppression: true,
  };
  if (deviceId) options.deviceId = deviceId;

  try {
    return await createLocalAudioTrack(options);
  } catch (error) {
    trackLogger.error("Failed to create audio track:", toStreamingError(error));
    throw error;
  }
}

/**
 * Connects to a Twilio room using the provided token.
 */
export async function connectToRoom(
  token: string,
  options: {
    videoTrack?: LocalVideoTrack;
    audioTrack?: LocalAudioTrack;
    roomName: string;
  }
): Promise<Room> {
  const { videoTrack, audioTrack, roomName } = options;
  const tracks: (LocalVideoTrack | LocalAudioTrack)[] = [];

  if (videoTrack) tracks.push(videoTrack);
  if (audioTrack) tracks.push(audioTrack);

  roomLogger.info(`Connecting to room: ${roomName}`);

  try {
    return await connect(token, {
      name: roomName,
      tracks,
      dominantSpeaker: true,
      networkQuality: {
        local: 1,
        remote: 1,
      },
    });
  } catch (error) {
    roomLogger.error(
      `Failed to connect to room ${roomName}:`,
      toStreamingError(error)
    );
    throw error;
  }
}

/**
 * Sets up reconnection handlers for a Twilio Room
 */
export function setupReconnectionHandlers(
  room: Room,
  onReconnecting?: () => void,
  onReconnected?: () => void,
  onFailed?: (error: Error) => void
): () => void {
  if (!room) return () => {};

  const handleReconnecting = (error?: Error) => {
    roomLogger.warn(
      `Room ${room.name} is reconnecting`,
      error ? toStreamingError(error) : undefined
    );
    if (onReconnecting) onReconnecting();
  };

  const handleReconnected = () => {
    roomLogger.info(`Room ${room.name} reconnected successfully`);
    if (onReconnected) onReconnected();
  };

  const handleDisconnected = (disconnectedRoom: Room, error?: Error) => {
    if (error) {
      roomLogger.error(
        `Room ${disconnectedRoom.name} disconnected with error:`,
        toStreamingError(error)
      );
      if (onFailed) onFailed(error);
    } else {
      roomLogger.info(`Room ${disconnectedRoom.name} disconnected normally`);
    }
  };

  room.on("reconnecting", handleReconnecting);
  room.on("reconnected", handleReconnected);
  room.on("disconnected", handleDisconnected);

  // Return cleanup function
  return () => {
    room.off("reconnecting", handleReconnecting);
    room.off("reconnected", handleReconnected);
    room.off("disconnected", handleDisconnected);
  };
}

/**
 * Updates the enabled state of a Twilio track based on mute status
 */
export function updateTrackEnabledState(
  track: RemoteTrack,
  isMuted: boolean
): void {
  if (!track) return;

  // Get all elements attached to the track
  const elements = document.querySelectorAll(`[data-track-id="${track.sid}"]`);

  // For audio tracks, update the muted attribute
  if (track.kind === "audio") {
    elements.forEach((el) => {
      if (el instanceof HTMLAudioElement) {
        el.muted = isMuted;
      }
    });
  }

  // For video tracks, we might want to add other behaviors here
  // such as showing a placeholder when disabled
}

/**
 * Sets up media devices by requesting permissions and getting available devices
 * @returns Object containing camera and mic lists, and any error that occurred
 */
export async function setupDevices(): Promise<{
  cameras: MediaDeviceInfo[];
  mics: MediaDeviceInfo[];
  error: string | null;
}> {
  const logger = twilioLogger.withContext("Devices");
  logger.debug("Setting up media devices...");

  const result = {
    cameras: [] as MediaDeviceInfo[],
    mics: [] as MediaDeviceInfo[],
    error: null as string | null,
  };

  try {
    // First request permission to access media devices
    await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    logger.debug("Media permissions granted");

    // Get list of available devices
    const devices = await navigator.mediaDevices.enumerateDevices();
    logger.debug(`Found ${devices.length} media devices`);

    // Filter devices by type
    result.cameras = devices.filter((device) => device.kind === "videoinput");
    result.mics = devices.filter((device) => device.kind === "audioinput");

    logger.info(
      `Found ${result.cameras.length} cameras and ${result.mics.length} microphones`
    );
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    logger.error(`Error setting up media devices: ${error}`);
    result.error = error;
  }

  return result;
}
