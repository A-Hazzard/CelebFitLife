import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/config/firebase";
import { v4 as uuidv4 } from "uuid";
import { StreamData, StreamingProfileData } from "@/lib/types/streaming";
import {
  Room,
  connect,
  createLocalAudioTrack,
  createLocalVideoTrack,
  LocalAudioTrack,
  LocalVideoTrack,
} from "twilio-video";
import { clearVideoContainer } from "@/lib/utils/streaming";

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
  } catch (error) {
    console.error("Error creating stream:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
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
    console.log("Stream Profile Submitted:", streamProfile);
    return { success: true };
  } catch (error) {
    console.error("Error creating stream profile:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
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
  } catch (error) {
    console.error("Error fetching stream info:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
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
  } catch (error) {
    console.error("Error updating stream info:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
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
 * Ends the stream by updating its status in Firestore and disconnecting the Twilio room.
 * @param slug - The unique slug identifier of the stream.
 * @param room - The Twilio Room object to disconnect (can be null).
 * @returns A promise resolving to an object indicating success or failure.
 */
export const endStream = async (
  slug: string,
  room: Room | null
): Promise<{ success: boolean; error?: string }> => {
  if (!slug) return { success: false, error: "Slug is required" };
  try {
    // Update Firestore
    const streamDocRef = doc(db, "streams", slug);
    await updateDoc(streamDocRef, {
      hasEnded: true,
      endedAt: new Date().toISOString(), // Optionally track end time
    });

    // Disconnect Twilio Room
    room?.disconnect();

    return { success: true };
  } catch (error) {
    console.error("Error ending stream:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
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
  if (!slug) return { success: false, error: "Slug is required" };
  if (Object.keys(status).length === 0) {
    return { success: false, error: "No status provided to update" };
  }
  // Ensure we only pass valid keys to Firestore
  const validStatus: Partial<StreamData> = {};
  if (status.audioMuted !== undefined)
    validStatus.audioMuted = status.audioMuted;
  if (status.cameraOff !== undefined) validStatus.cameraOff = status.cameraOff;
  if (status.currentCameraId !== undefined)
    validStatus.currentCameraId = status.currentCameraId;
  if (status.currentMicId !== undefined)
    validStatus.currentMicId = status.currentMicId;

  if (Object.keys(validStatus).length === 0) {
    // This case should ideally not be reached if the input 'status' was not empty,
    // but guards against unknown properties being passed.
    return { success: false, error: "No valid status fields provided" };
  }

  try {
    const streamDocRef = doc(db, "streams", slug);
    await updateDoc(streamDocRef, validStatus); // Update with validated status object
    return { success: true };
  } catch (error) {
    console.error("Error updating stream device status:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
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
  try {
    console.log("Setting up Twilio room...");

    // Fetch Twilio token
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

    // Create video track
    const videoTrack = await createLocalVideoTrack({
      width: 1280,
      height: 720,
      deviceId: currentCameraId,
      name: `camera-${
        currentCameraId?.substring(0, 8) || "default"
      }-${Date.now()}`,
    });

    // Create audio track
    const audioTrack = await createLocalAudioTrack({
      deviceId: currentMicId,
      name: "microphone",
    });

    // Connect to room
    const room = await connect(data.token, {
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

    // Attach local video to video container
    if (videoContainerRef.current) {
      clearVideoContainer(videoContainerRef.current);
      const videoEl = videoTrack.attach();
      videoEl.style.width = "100%";
      videoEl.style.height = "100%";
      videoEl.style.objectFit = "cover";
      videoContainerRef.current.appendChild(videoEl);
    }

    // Apply initial state if provided
    if (initialState?.audioMuted) {
      audioTrack.disable();
    }
    if (initialState?.cameraOff) {
      videoTrack.disable();
    }

    // Update Firestore with device information
    const streamRef = doc(db, "streams", slug);
    await updateDoc(streamRef, {
      currentCameraId,
      currentMicId,
      audioMuted: initialState?.audioMuted || false,
      cameraOff: initialState?.cameraOff || false,
    });

    return {
      success: true,
      room,
      videoTrack,
      audioTrack,
    };
  } catch (error) {
    console.error("Error setting up Twilio room:", error);
    return {
      success: false,
      room: null,
      videoTrack: null,
      audioTrack: null,
      error:
        error instanceof Error
          ? error.message
          : "Unknown error setting up Twilio room",
    };
  }
};
