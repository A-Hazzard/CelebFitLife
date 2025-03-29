import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/config/firebase";
import { v4 as uuidv4 } from "uuid";
import {
  StreamData,
  StreamingProfileData,
  toStreamingError,
} from "@/lib/types/streaming";
import {
  Room,
  connect,
  createLocalAudioTrack,
  createLocalVideoTrack,
  LocalAudioTrack,
  LocalVideoTrack,
} from "twilio-video";
import { clearVideoContainer } from "@/lib/utils/streaming";
import { createLogger } from "@/lib/utils/logger";

// Create context-specific loggers
const streamLogger = createLogger("Streaming");
const trackLogger = streamLogger.withContext("Track");
const roomLogger = streamLogger.withContext("Room");

/**
 * Creates a new stream document in Firestore.
 * @param userId - The UID of the user creating the stream.
 * @param title - The title of the stream.
 * @param description - The description of the stream.
 * @param [thumbnailUrl=""] - Optional URL for the stream thumbnail.
 * @param [scheduledAt=null] - Optional date object for scheduling the stream.
 * @returns A promise resolving to an object indicating success or failure,
 *          including the generated slug on success or an error message on failure.
 */
export const createStream = async (
  userId: string,
  title: string,
  description: string,
  thumbnailUrl: string = "",
  scheduledAt: Date | null = null
): Promise<{ success: boolean; slug?: string; error?: string }> => {
  try {
    if (!userId || !title) {
      return { success: false, error: "Missing required fields" };
    }

    const slug = `${title
      .trim()
      .replace(/\s+/g, "-")
      .toLowerCase()}-${uuidv4()}`;

    const streamData: StreamData = {
      title,
      description,
      thumbnail:
        thumbnailUrl ||
        "https://1.bp.blogspot.com/-Rsu_fHvj-IA/YH0ohFqGK_I/AAAAAAAAm7o/dOKXFVif7hYDymAsCNZRe4MK3p7ihTGmgCLcBGAsYHQ/s2362/Stream.jpg",
      slug,
      createdAt: new Date().toISOString(),
      createdBy: userId,
      hasStarted: false,
      hasEnded: false,
      scheduledAt: scheduledAt ? scheduledAt.toISOString() : null,
      audioMuted: false,
      cameraOff: false,
    };

    await setDoc(doc(db, "streams", slug), streamData);
    return { success: true, slug };
  } catch (err) {
    const error = toStreamingError(err);
    streamLogger.error("Error creating stream:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Handles the submission of a stream profile (placeholder).
 * In a real application, this would save the profile data to Firestore or another backend.
 * @param streamProfile - The stream profile data.
 * @returns A promise resolving to an object indicating success or failure.
 */
export const createStreamProfile = async (
  streamProfile: StreamingProfileData
): Promise<{ success: boolean; error?: string }> => {
  try {
    // This is a placeholder for future implementation
    // In a real application, this would save the profile to Firestore
    streamLogger.info("Stream Profile Submitted:", streamProfile);
    return { success: true };
  } catch (err) {
    const error = toStreamingError(err);
    streamLogger.error("Error creating stream profile:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Fetches stream information from a Firestore document based on its slug.
 * @param slug - The unique slug identifier of the stream.
 * @returns A promise resolving to an object containing the stream data on success,
 *          or an error message on failure.
 */
export const fetchStreamInfo = async (
  slug: string
): Promise<{
  success: boolean;
  data?: Partial<StreamData>;
  error?: string;
}> => {
  if (!slug) return { success: false, error: "Slug is required" };
  try {
    const streamDocRef = doc(db, "streams", slug);
    const streamSnapshot = await getDoc(streamDocRef);

    if (streamSnapshot.exists()) {
      return {
        success: true,
        data: streamSnapshot.data() as Partial<StreamData>,
      };
    } else {
      return { success: false, error: "Stream not found" };
    }
  } catch (err) {
    const error = toStreamingError(err);
    streamLogger.error("Error fetching stream info:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Updates the title and thumbnail URL of a stream document in Firestore.
 * @param slug - The unique slug identifier of the stream.
 * @param title - The new title for the stream.
 * @param thumbnailUrl - The new thumbnail URL for the stream.
 * @returns A promise resolving to an object indicating success or failure.
 */
export const updateStreamInfo = async (
  slug: string,
  title: string,
  thumbnailUrl: string
): Promise<{ success: boolean; error?: string }> => {
  if (!slug) return { success: false, error: "Slug is required" };
  try {
    const streamDocRef = doc(db, "streams", slug);
    await updateDoc(streamDocRef, {
      title,
      thumbnail: thumbnailUrl,
    });
    return { success: true };
  } catch (err) {
    const error = toStreamingError(err);
    streamLogger.error("Error updating stream info:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Prepares the stream to start by updating its status in Firestore
 * and fetching a connection token from the Twilio API.
 * @param slug - The unique slug identifier of the stream.
 * @param userId - The UID of the user starting the stream.
 * @param userName - The display name of the user for the Twilio room.
 * @returns A promise resolving to an object containing the Twilio token on success,
 *          or an error message on failure.
 */
export const prepareStreamStart = async (
  slug: string,
  userId: string,
  userName: string
): Promise<{ success: boolean; token?: string; error?: string }> => {
  if (!slug || !userId || !userName) {
    return {
      success: false,
      error: "Slug, User ID, and User Name are required",
    };
  }
  try {
    // Update Firestore
    const streamDocRef = doc(db, "streams", slug);
    await updateDoc(streamDocRef, {
      hasStarted: true,
      hasEnded: false,
      startedAt: new Date().toISOString(),
    });

    // Fetch Twilio Token
    const res = await fetch("/api/twilio/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomName: slug,
        userName: userName,
      }),
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch Twilio token: ${res.statusText}`);
    }

    const data = await res.json();
    if (!data.token) {
      throw new Error("No Twilio token returned from API");
    }

    return { success: true, token: data.token };
  } catch (error) {
    console.error("Error preparing stream start:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

/**
 * Safely detaches a track from all elements it's attached to.
 * Includes thorough error handling especially for NotFoundError that can happen
 * during DOM manipulation.
 *
 * @param track - The track to detach
 */
export const safelyDetachTrack = (
  track: LocalAudioTrack | LocalVideoTrack | null
): void => {
  const logger = trackLogger.withContext("Detach");

  try {
    logger.info(`Starting track detachment process`);

    if (!track) {
      logger.warn("No track provided to safelyDetachTrack, skipping");
      return;
    }

    logger.debug(`Detaching ${track.kind} track (ID: ${track.id})`);

    // Check if track is stopped before attempting to detach
    if (
      track.mediaStreamTrack &&
      track.mediaStreamTrack.readyState === "ended"
    ) {
      logger.info(
        `Track ${track.kind} (ID: ${track.id}) is already stopped, skipping detachment`
      );
      return;
    }

    // NEW: Capture and log the track state before detachment
    logger.debug(`Track state before detachment:`, {
      kind: track.kind,
      id: track.id,
      enabled: track.isEnabled,
      readyState: track.mediaStreamTrack?.readyState,
    });

    // NEW: Check if the track has any attached elements before trying to detach
    // Use a safer approach to find elements - both by data-track-id and by searching video/audio elements
    try {
      const elementsBySid = Array.from(
        document.querySelectorAll(`[data-track-id="${track.id}"]`)
      );

      // Also search all media elements and check if they might be associated with this track
      const mediaElements = Array.from(
        document.querySelectorAll("video, audio")
      );

      logger.debug(
        `Found ${elementsBySid.length} DOM elements with track ID ${track.id}`
      );
      logger.debug(`Found ${mediaElements.length} total media elements in DOM`);

      // Store a count of attached elements for logging
      let detachedElementsCount = 0;

      // For each element we found in the DOM with the track SID, try to remove it
      if (elementsBySid.length > 0) {
        elementsBySid.forEach((element, index) => {
          try {
            logger.debug(
              `Removing track element ${index + 1}/${
                elementsBySid.length
              } from DOM`
            );
            if (element.parentNode) {
              element.parentNode.removeChild(element);
              detachedElementsCount++;
              logger.debug(`Successfully removed element ${index + 1}`);
            } else {
              logger.warn(`Element ${index + 1} has no parent node`);
            }
          } catch (removeError: unknown) {
            logger.error(
              `Error removing element ${index + 1} from DOM:`,
              removeError
            );
            logger.debug(`Element that failed removal:`, {
              tagName: (element as Element).tagName,
              id: (element as Element).id,
              className: (element as Element).className,
            });
          }
        });

        logger.info(
          `Manually removed ${detachedElementsCount}/${elementsBySid.length} elements from DOM`
        );
      }

      // Now try to detach using Twilio's API - this may throw NotFoundError if elements
      // were already removed, which is fine
      try {
        logger.debug(`Attempting Twilio track.detach() method`);
        const twilioDetachedElements = track.detach();
        logger.info(
          `Twilio detached ${twilioDetachedElements.length} additional elements`
        );

        // Remove these elements too, in case Twilio didn't clean them up
        twilioDetachedElements.forEach((element, index) => {
          try {
            logger.debug(
              `Removing Twilio-detached element ${index + 1}/${
                twilioDetachedElements.length
              }`
            );
            if (element && element.parentNode) {
              element.parentNode.removeChild(element);
              logger.debug(
                `Successfully removed Twilio-detached element ${index + 1}`
              );
            } else {
              logger.warn(
                `Twilio-detached element ${index + 1} has no parent node`
              );
            }
          } catch (detachError: unknown) {
            const error = toStreamingError(detachError);
            logger.error(
              `Error removing Twilio-detached element ${index + 1}:`,
              error
            );
          }
        });
      } catch (detachError: unknown) {
        // Handle specific NotFoundError which can occur if the element was already detached
        const error = toStreamingError(detachError);
        if (error.name === "NotFoundError") {
          logger.warn(
            `NotFoundError when detaching ${track.kind} track (ID: ${track.id}) - this is normal if elements were already removed`
          );
          logger.debug(`NotFoundError details:`, error);
        } else {
          logger.error(
            `Error in Twilio detach for ${track.kind} track (ID: ${track.id}):`,
            error
          );
        }
      }
    } catch (domError: unknown) {
      logger.error(`DOM operation error during track detachment:`, domError);
    }

    // Finally, ensure the track is stopped to release resources
    try {
      logger.debug(`Stopping track to release hardware resources`);
      if (
        track.mediaStreamTrack &&
        track.mediaStreamTrack.readyState !== "ended"
      ) {
        track.stop();
        logger.info(
          `Successfully stopped ${track.kind} track (ID: ${track.id})`
        );
      } else {
        logger.debug(`Track was already stopped, no need to stop again`);
      }
    } catch (stopError: unknown) {
      const error = toStreamingError(stopError);
      logger.error(`Error stopping track after detachment:`, error);
    }

    logger.info(`Track detachment process completed`);
  } catch (error: unknown) {
    const err = toStreamingError(error);
    logger.error(`Critical error in safelyDetachTrack:`, err);
    logger.trace(`Stack trace for critical error`);
  }
};

/**
 * Handles cleanup when a component using Twilio is unmounting.
 * Performs safely detaching tracks and disconnecting the room if needed.
 * @param room - The Twilio Room object to clean up
 * @param videoTrack - Optional local video track to clean up
 * @param audioTrack - Optional local audio track to clean up
 */
export const handleStreamCleanup = async (
  room: Room | null,
  videoTrack: LocalVideoTrack | null,
  audioTrack: LocalAudioTrack | null
): Promise<void> => {
  const logger = streamLogger.withContext("Cleanup");
  logger.info(`Performing stream cleanup`);

  try {
    // First, safely handle local tracks
    if (videoTrack) {
      logger.debug(`Cleaning up local video track (ID: ${videoTrack.id})`);
      try {
        safelyDetachTrack(videoTrack);
        videoTrack.stop();
        logger.debug(`Successfully cleaned up video track`);
      } catch (cleanupError: unknown) {
        const error = toStreamingError(cleanupError);
        logger.error(`Error cleaning up video track:`, error);
        // Continue with other cleanup
      }
    }

    if (audioTrack) {
      logger.debug(`Cleaning up local audio track`);
      try {
        safelyDetachTrack(audioTrack);
        audioTrack.stop();
        logger.debug(`Successfully cleaned up audio track`);
      } catch (cleanupError: unknown) {
        const error = toStreamingError(cleanupError);
        logger.error(`Error cleaning up audio track:`, error);
        // Continue with other cleanup
      }
    }

    // Then handle the room
    if (room) {
      logger.debug(`Disconnecting from Twilio room: ${room.sid}`);
      room.disconnect();
      logger.info(`Successfully disconnected from Twilio room`);
    } else {
      logger.debug(`No active Twilio room to disconnect`);
    }
  } catch (error: unknown) {
    const streamingError = toStreamingError(error);
    logger.error(`Unexpected error during cleanup:`, streamingError);
    logger.trace(`Cleanup error stack trace`);
  }
};

/**
 * Handles stopping a track safely with error handling and logging.
 * @param track - The track to stop.
 */
export const safelyStopTrack = (
  track: LocalVideoTrack | LocalAudioTrack | null
): void => {
  if (!track) return;

  const logger = trackLogger.withContext("Stop");
  logger.debug(`Stopping ${track.kind} track (ID: ${track.id})`);

  try {
    // Detach first, then stop
    safelyDetachTrack(track);
    track.stop();
    logger.debug(`Successfully stopped ${track.kind} track`);
  } catch (stopError: unknown) {
    const error = toStreamingError(stopError);
    logger.error(`Error stopping ${track.kind} track:`, error);
  }
};

// Final catch block:
export const stopAllTracks = (
  tracks: (LocalVideoTrack | LocalAudioTrack)[]
): void => {
  if (!tracks || !tracks.length) return;

  const logger = trackLogger.withContext("StopAll");
  logger.debug(`Stopping ${tracks.length} tracks`);

  tracks.forEach((track, i) => {
    try {
      safelyStopTrack(track);
    } catch (error: unknown) {
      const stopError = toStreamingError(error);
      logger.error(
        `Error stopping track ${i + 1}/${tracks.length}:`,
        stopError
      );
    }
  });
};

/**
 * Ends the stream by updating its status in Firestore and disconnecting the Twilio room.
 * @param slug - The unique slug identifier of the stream.
 * @param room - The Twilio Room object to disconnect (can be null).
 * @returns Promise resolving to a success/error status object.
 */
export const endStream = async (
  slug: string,
  room: Room | null
): Promise<{ success: boolean; error?: string }> => {
  const logger = streamLogger.withContext("EndStream");
  logger.info(`Ending stream: ${slug}`);

  try {
    // 1. Update Firestore first
    logger.debug(`Updating Firestore stream status to ended`);
    const streamDocRef = doc(db, "streams", slug);
    await updateDoc(streamDocRef, {
      hasEnded: true,
      hasStarted: false,
      endedAt: new Date().toISOString(),
    });
    logger.info(`Stream marked as ended in Firestore`);

    // 2. Disconnect from Twilio room if connected
    if (room) {
      logger.debug(`Disconnecting from Twilio room: ${room.sid}`);
      room.disconnect();
      logger.info(`Successfully disconnected from Twilio room`);
    } else {
      logger.debug(`No active Twilio room to disconnect`);
    }

    return { success: true };
  } catch (error: unknown) {
    const streamingError = toStreamingError(error);
    logger.error(`Failed to end stream properly:`, streamingError);
    logger.trace(`End stream error stack trace`);
    return {
      success: false,
      error: streamingError.message,
    };
  }
};

/**
 * Updates the audio/video status or device IDs of the stream document in Firestore.
 * @param slug - The unique slug identifier of the stream.
 * @param status - An object containing the fields to update (e.g., { audioMuted: true }).
 * @returns A promise resolving to an object indicating success or failure.
 */
export const updateStreamDeviceStatus = async (
  slug: string,
  status: {
    audioMuted?: boolean;
    cameraOff?: boolean;
    currentCameraId?: string;
    currentMicId?: string;
  }
): Promise<{ success: boolean; error?: string }> => {
  const logger = streamLogger.withContext("DeviceStatus");
  logger.debug(`Updating stream device status for ${slug}:`, status);

  try {
    if (!slug) {
      throw new Error("Slug is required to update device status");
    }

    const streamDocRef = doc(db, "streams", slug);
    await updateDoc(streamDocRef, status);
    logger.debug(`Successfully updated device status in Firestore`);
    return { success: true };
  } catch (domError: unknown) {
    const error = toStreamingError(domError);
    logger.error(`Failed to update device status:`, error);
    logger.trace(`Device status update error stack trace`);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Sets up a Twilio room connection with audio and video tracks.
 * This function handles creating tracks, connecting to the Twilio room,
 * attaching video to the DOM, and setting up event listeners.
 *
 * @param slug - The stream slug, used as the room name.
 * @param userName - User's display name for the Twilio room.
 * @param currentCameraId - The ID of the camera device to use.
 * @param currentMicId - The ID of the microphone device to use.
 * @param videoContainerRef - Reference to the video container DOM element.
 * @param initialState - Optional object with initial audioMuted and cameraOff values.
 * @returns A promise resolving to an object with the room and tracks.
 */
export const setupTwilioRoom = async (
  slug: string,
  userName: string,
  currentCameraId: string,
  currentMicId: string,
  videoContainerRef: React.RefObject<HTMLDivElement>,
  initialState?: { audioMuted?: boolean; cameraOff?: boolean }
): Promise<{
  success: boolean;
  room: Room | null;
  videoTrack: LocalVideoTrack | null;
  audioTrack: LocalAudioTrack | null;
  error?: string;
}> => {
  const logger = roomLogger.withContext("Setup");

  let videoTrack: LocalVideoTrack | null = null;
  let audioTrack: LocalAudioTrack | null = null;
  let room: Room | null = null;

  try {
    logger.info(`Setting up Twilio room for stream: ${slug}`);
    logger.debug(`Setup parameters:`, {
      slug,
      userName,
      currentCameraId: currentCameraId
        ? currentCameraId.substring(0, 8) + "..."
        : "none",
      currentMicId: currentMicId
        ? currentMicId.substring(0, 8) + "..."
        : "none",
      hasVideoContainer: !!videoContainerRef.current,
      initialAudioMuted: initialState?.audioMuted,
      initialCameraOff: initialState?.cameraOff,
    });

    // 1. Fetch Twilio token
    let token: string;
    try {
      logger.debug(`Fetching Twilio token from API...`);
      const res = await fetch("/api/twilio/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomName: slug,
          userName: userName,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => res.statusText);
        logger.error(
          `Failed to fetch Twilio token: ${res.status} ${res.statusText}`
        );
        logger.debug(`Error response: ${errorText}`);
        throw new Error(`Failed to fetch Twilio token: ${res.statusText}`);
      }

      const data = await res.json();
      if (!data.token) {
        logger.error(`No Twilio token returned from API`);
        throw new Error("No Twilio token returned from API");
      }

      token = data.token;
      logger.info(`Successfully obtained Twilio token`);
    } catch (tokenError: unknown) {
      const error = toStreamingError(tokenError);
      logger.error(`Token acquisition failed:`, error);
      logger.trace(`Token error stack trace`);
      return {
        success: false,
        room: null,
        videoTrack: null,
        audioTrack: null,
        error: error.message,
      };
    }

    // 2. Create media tracks with proper error handling
    try {
      // Create video track
      logger.debug(
        `Creating local video track with camera ID: ${currentCameraId.substring(
          0,
          8
        )}...`
      );
      videoTrack = await createLocalVideoTrack({
        width: 1280,
        height: 720,
        deviceId: currentCameraId,
        name: `camera-${
          currentCameraId?.substring(0, 8) || "default"
        }-${Date.now()}`,
      });
      logger.debug(`Video track created successfully (ID: ${videoTrack.id})`);

      // Create audio track
      logger.debug(
        `Creating local audio track with mic ID: ${currentMicId.substring(
          0,
          8
        )}...`
      );
      audioTrack = await createLocalAudioTrack({
        deviceId: currentMicId,
        name: "microphone",
      });
      logger.debug(`Audio track created successfully (ID: ${audioTrack.id})`);

      logger.info(`Successfully created local audio and video tracks`);
    } catch (trackError: unknown) {
      // Clean up any tracks that were created before failure
      const error = toStreamingError(trackError);
      logger.error(`Failed to create media tracks:`, error);
      logger.debug(`Cleanup after track creation failure`);

      if (videoTrack) {
        logger.debug(`Stopping video track after error`);
        videoTrack.stop();
      }

      if (audioTrack) {
        logger.debug(`Stopping audio track after error`);
        audioTrack.stop();
      }

      logger.trace(`Track creation error stack trace`);
      return {
        success: false,
        room: null,
        videoTrack: null,
        audioTrack: null,
        error: error.message,
      };
    }

    // 3. Connect to room
    try {
      logger.debug(`Connecting to Twilio room: ${slug}`);
      room = await connect(token, {
        name: slug,
        tracks: [videoTrack, audioTrack],
        bandwidthProfile: {
          video: {
            mode: "collaboration",
            maxTracks: 2,
            dominantSpeakerPriority: "high",
            maxSubscriptionBitrate: 1500000, // 1.5 Mbps
          },
        },
        dominantSpeaker: true,
      });

      logger.info(`Successfully connected to Twilio room: ${slug}`);
      logger.debug(
        `Room SID: ${room.sid}, Local participant SID: ${room.localParticipant.sid}`
      );
    } catch (connectError: unknown) {
      // Clean up tracks if room connection fails
      const error = toStreamingError(connectError);
      logger.error(`Failed to connect to Twilio room:`, error);
      logger.debug(`Cleanup after connection failure`);

      if (videoTrack) {
        logger.debug(`Stopping video track after connection error`);
        videoTrack.stop();
      }

      if (audioTrack) {
        logger.debug(`Stopping audio track after connection error`);
        audioTrack.stop();
      }

      logger.trace(`Room connection error stack trace`);
      return {
        success: false,
        room: null,
        videoTrack: null,
        audioTrack: null,
        error: error.message,
      };
    }

    // 4. Attach local video to video container (with robust error handling)
    if (videoContainerRef.current && videoTrack) {
      try {
        logger.debug(`Attaching local video to container`);

        // Safely clear any existing video elements first
        logger.debug(`Clearing video container before attaching new video`);
        clearVideoContainer(videoContainerRef.current);

        // Create and attach the video element
        logger.debug(`Creating video element for local track`);
        const videoEl = videoTrack.attach();
        videoEl.style.width = "100%";
        videoEl.style.height = "100%";
        videoEl.style.objectFit = "cover";
        videoEl.setAttribute("data-track-id", videoTrack.id);

        // Add to container and verify
        logger.debug(`Appending video element to container`);
        videoContainerRef.current.appendChild(videoEl);
        logger.info(`Successfully attached video to container`);

        // Verify the attachment worked
        const attachedElements =
          videoContainerRef.current.querySelectorAll("video");
        logger.debug(
          `Container now has ${attachedElements.length} video elements`
        );
      } catch (attachError: unknown) {
        const error = toStreamingError(attachError);
        logger.error(`Error attaching video to container:`, error);
        if (error.name === "NotFoundError") {
          logger.warn(
            `NotFoundError occurred during video element attachment - this might be a DOM manipulation timing issue`
          );
        }
        logger.trace(`Video attachment error stack trace`);
      }
    } else {
      if (!videoContainerRef.current) {
        logger.warn(`Video container ref is null, cannot attach video`);
      }
      if (!videoTrack) {
        logger.warn(`Video track is null, cannot attach to container`);
      }
    }

    // 5. Apply initial state if provided
    if (initialState && room) {
      try {
        logger.debug(`Applying initial track states:`, initialState);

        if (initialState.audioMuted && audioTrack) {
          logger.debug(`Setting initial audio track state to muted`);
          await audioTrack.disable();
        }

        if (initialState.cameraOff && videoTrack) {
          logger.debug(`Setting initial video track state to disabled`);
          await videoTrack.disable();
        }

        logger.debug(`Successfully applied initial track states`);
      } catch (stateError: unknown) {
        const error = toStreamingError(stateError);
        logger.error(`Failed to apply initial track states:`, error);
        logger.trace(`State error stack trace`);
        // Continue despite state error - not critical
      }
    }

    // 6. Update stream device IDs in Firestore (non-critical operation)
    try {
      logger.debug(`Updating device IDs in Firestore`);
      await updateStreamDeviceStatus(slug, {
        currentCameraId: currentCameraId,
        currentMicId: currentMicId,
      });
      logger.debug(`Successfully updated device IDs in Firestore`);
    } catch (firestoreError: unknown) {
      const error = toStreamingError(firestoreError);
      logger.error(`Failed to update device IDs in Firestore:`, error);
      logger.debug(
        `Continuing despite Firestore error - room connection is valid`
      );
      // Continue despite Firestore error - not critical
    }

    // Setup room event listeners for monitoring
    if (room) {
      room.on("disconnected", (_disconnectedRoom, error) => {
        logger.info(`Room disconnected event triggered`);
        if (error) {
          logger.error(`Room disconnected due to error:`, error);
        }
      });

      room.on("participantConnected", (participant) => {
        logger.info(`Participant connected: ${participant.identity}`);
      });

      room.on("participantDisconnected", (participant) => {
        logger.info(`Participant disconnected: ${participant.identity}`);
      });

      room.on("reconnecting", (error) => {
        logger.warn(`Room reconnecting due to error:`, error);
      });

      room.on("reconnected", () => {
        logger.info(`Room successfully reconnected`);
      });
    }

    logger.info(`Twilio room setup completed successfully`);
    return {
      success: true,
      room,
      videoTrack,
      audioTrack,
    };
  } catch (error: unknown) {
    logger.error(`Error setting up Twilio room:`, error);
    logger.trace(`General setup error stack trace`);

    // Clean up resources in case of general failure
    try {
      logger.debug(`Cleaning up resources after general failure`);

      if (room) {
        logger.debug(`Disconnecting room after failure`);
        (room as Room).disconnect();
      }

      if (videoTrack) {
        logger.debug(`Stopping video track after failure`);
        (videoTrack as LocalVideoTrack).stop();
      }

      if (audioTrack) {
        logger.debug(`Stopping audio track after failure`);
        (audioTrack as LocalAudioTrack).stop();
      }

      logger.debug(`Cleanup after general failure completed`);
    } catch (cleanupError: unknown) {
      logger.error(`Error during cleanup after failure:`, cleanupError);
    }

    const streamingError = toStreamingError(error);
    return {
      success: false,
      room: null,
      videoTrack: null,
      audioTrack: null,
      error: streamingError.message,
    };
  }
};
