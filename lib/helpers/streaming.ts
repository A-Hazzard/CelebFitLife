import { doc, setDoc, getDoc, updateDoc, Timestamp } from "firebase/firestore";
import { db, auth } from "@/lib/firebase/client";
import { v4 as uuidv4 } from "uuid";
import { StreamData } from "@/lib/types/streaming.types";
import { createLogger } from "@/lib/utils/logger";
import { collection, addDoc, deleteDoc, increment } from "firebase/firestore";
import { toStreamingError } from "@/lib/utils/errorHandler";
import { LogData } from "@/lib/types/utils";

// Create context-specific loggers
const streamLogger = createLogger("Streaming");

/**
 * Generates a URL-friendly slug from a title
 * @param title The title to convert to a slug
 * @returns A URL-friendly slug
 */
const generateSlug = (title: string): string => {
  if (!title) return uuidv4();
  return `${title
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") // Remove special chars
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Remove consecutive hyphens
    .substring(0, 40)}-${uuidv4().substring(0, 8)}`;
};

/**
 * Creates a new stream document in Firestore.
 * @param userId - The UID of the user creating the stream.
 * @param title - The title of the stream.
 * @param description - The description of the stream.
 * @param [thumbnail=""] - Optional URL for the stream thumbnail.
 * @param [scheduledAt=null] - Optional date object for scheduling the stream.
 * @param category - The category of the stream.
 * @param tags - An array of tags for the stream.
 * @returns A promise resolving to an object indicating success or failure,
 *          including the generated streamId on success or an error message on failure.
 */
export const createStream = async (
  userId: string,
  title: string,
  description: string = "",
  thumbnail: string = "",
  scheduledTime: Date | null = null,
  category: string = "Fitness",
  tags: string[] = []
): Promise<{ success: boolean; streamId?: string; error?: string }> => {
  try {
    if (!userId || !title) {
      return { success: false, error: "Missing required fields" };
    }

    // Generate a unique ID for the stream
    const streamId = uuidv4();

    // Validate thumbnail URL if provided
    let validatedThumbnail = "";
    if (thumbnail) {
      try {
        const url = new URL(thumbnail);
        // List of allowed domains for thumbnails
        const allowedDomains = [
          "googleusercontent.com",
          "firebasestorage.googleapis.com",
          "lh3.googleusercontent.com",
          "blogspot.com",
          "unsplash.com",
          "source.unsplash.com",
          "img.icons8.com",
          "randomuser.me",
          "bing.com",
          "th.bing.com",
        ];

        // Check if the URL is from an allowed domain
        const isAllowedDomain = allowedDomains.some((domain) =>
          url.hostname.endsWith(domain)
        );

        if (isAllowedDomain) {
          validatedThumbnail = thumbnail;
        } else {
          streamLogger.warn(
            `Rejected thumbnail URL from non-allowed domain: ${url.hostname}`
          );
        }
      } catch (error) {
        streamLogger.warn(`Invalid thumbnail URL provided: ${thumbnail}`, {
          errorDetails: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Prepare stream document data using proper type
    const now = Timestamp.now();

    const streamDoc: StreamData = {
      id: streamId,
      title: title.trim(),
      description: description.trim(),
      thumbnail: validatedThumbnail,
      userId,
      username: "", // This will be set by the UI
      userPhotoURL: "", // This will be set by the UI
      category,
      tags,
      language: "en",
      hasStarted: false,
      // Don't set hasEnded initially - only set when stream is actually ended
      isPrivate: false,
      requiresSubscription: false,
      viewerCount: 0,
      likeCount: 0,
      commentCount: 0,
      createdAt: now.toDate().toISOString(),
      updatedAt: now.toDate().toISOString(),
      slug: generateSlug(title),
      scheduledAt: scheduledTime ? scheduledTime.toISOString() : null,
      streamerId: userId,
      streamerName: "", // Set if available
      isLive: false,
    };

    // Use the streamId as document ID, not the slug
    await setDoc(doc(db, "streams", streamId), streamDoc);

    // Return both the streamId for database operations
    return { success: true, streamId };
  } catch (err) {
    const error = toStreamingError(err);
    streamLogger.error("Error creating stream:", error);
    return {
      success: false,
      error:
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message: string }).message
          : typeof error === "object" &&
            error !== null &&
            "error" in error &&
            typeof (error as { error: unknown }).error === "string"
          ? (error as { error: string }).error
          : "Unknown error",
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
  // TODO: Define a proper type for streamProfile if/when implemented
  streamProfile: unknown
): Promise<{ success: boolean; error?: string }> => {
  try {
    // This is a placeholder for future implementation
    // In a real application, this would save the profile to Firestore
    streamLogger.info("Stream Profile Submitted:", streamProfile as LogData);
    return { success: true };
  } catch (err) {
    const error = toStreamingError(err);
    streamLogger.error("Error creating stream profile:", error);
    return {
      success: false,
      error:
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message: string }).message
          : typeof error === "object" &&
            error !== null &&
            "error" in error &&
            typeof (error as { error: unknown }).error === "string"
          ? (error as { error: string }).error
          : "Unknown error",
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
      error:
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message: string }).message
          : typeof error === "object" &&
            error !== null &&
            "error" in error &&
            typeof (error as { error: unknown }).error === "string"
          ? (error as { error: string }).error
          : "Unknown error",
    };
  }
};

/**
 * Updates the title and thumbnail URL of a stream document in Firestore.
 * @param slug - The unique slug identifier of the stream.
 * @param title - The new title for the stream.
 * @param thumbnail - The new thumbnail URL for the stream.
 * @returns A promise resolving to an object indicating success or failure.
 */
export const updateStreamInfo = async (
  slug: string,
  title: string,
  thumbnail: string
): Promise<{ success: boolean; error?: string }> => {
  if (!slug) return { success: false, error: "Slug is required" };
  try {
    const streamDocRef = doc(db, "streams", slug);
    await updateDoc(streamDocRef, {
      title,
      thumbnail,
    });
    return { success: true };
  } catch (err) {
    const error = toStreamingError(err);
    streamLogger.error("Error updating stream info:", error);
    return {
      success: false,
      error:
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message: string }).message
          : typeof error === "object" &&
            error !== null &&
            "error" in error &&
            typeof (error as { error: unknown }).error === "string"
          ? (error as { error: string }).error
          : "Unknown error",
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
      error:
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message: string }).message
          : typeof error === "object" &&
            error !== null &&
            "error" in error &&
            typeof (error as { error: unknown }).error === "string"
          ? (error as { error: string }).error
          : "Unknown error",
    };
  }
};

/**
 * Ends the stream by updating its status in Firestore.
 * @param slug - The unique slug identifier of the stream.
 * @returns Promise resolving to a success/error status object.
 */
export const endStream = async (
  slug: string
): Promise<{ success: boolean; error?: string }> => {
  const logger = streamLogger.withContext("EndStream");
  logger.info(`Ending stream: ${slug}`);

  try {
    // Update Firestore first
    logger.debug(`Updating Firestore stream status to ended`);
    const streamDocRef = doc(db, "streams", slug);
    await updateDoc(streamDocRef, {
      hasEnded: true,
      hasStarted: false,
      updatedAt: Timestamp.now().toDate().toISOString(),
    });
    logger.info(`Stream marked as ended in Firestore`);
    return { success: true };
  } catch (error: unknown) {
    const streamingError = toStreamingError(error);
    logger.error(`Error ending stream:`, streamingError);
    return {
      success: false,
      error:
        typeof streamingError === "object" &&
        streamingError !== null &&
        "message" in streamingError
          ? (streamingError as { message: string }).message
          : typeof streamingError === "object" &&
            streamingError !== null &&
            "error" in streamingError &&
            typeof (streamingError as { error: unknown }).error === "string"
          ? (streamingError as { error: string }).error
          : "Unknown error",
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
      error:
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message: string }).message
          : typeof error === "object" &&
            error !== null &&
            "error" in error &&
            typeof (error as { error: unknown }).error === "string"
          ? (error as { error: string }).error
          : "Unknown error",
    };
  }
};

/**
 * Creates a new stream in Firebase
 * @param streamData The stream data to create
 * @returns Promise with the created stream ID and success status
 */
export const createStreamFirebase = async (streamData: {
  title: string;
  description?: string;
  thumbnail?: string;
  category?: string;
  tags?: string[];
  language?: string;
  isScheduled?: boolean;
  scheduledFor?: Date | null;
  isPrivate?: boolean;
  requiresSubscription?: boolean;
}): Promise<{ streamId: string | null; success: boolean }> => {
  try {
    if (!auth.currentUser) {
      throw new Error("User must be authenticated to create a stream");
    }

    const userId = auth.currentUser.uid;
    const username = auth.currentUser.displayName || "Anonymous";
    const userPhotoURL = auth.currentUser.photoURL || "";

    // Generate a unique ID for the stream
    const streamId = uuidv4();

    // Prepare stream document data
    const now = Timestamp.now();

    const streamDoc: StreamData = {
      id: streamId,
      title: streamData.title,
      description: streamData.description || "",
      thumbnail: streamData.thumbnail || "",
      userId,
      username,
      userPhotoURL,
      category: streamData.category || "Fitness",
      tags: streamData.tags || [],
      language: streamData.language || "English",
      hasStarted: false,
      hasEnded: false,
      isPrivate: streamData.isPrivate || false,
      requiresSubscription: streamData.requiresSubscription || false,
      viewerCount: 0,
      likeCount: 0,
      commentCount: 0,
      createdAt: now.toDate().toISOString(),
      updatedAt: now.toDate().toISOString(),
      slug: generateSlug(streamData.title),
      scheduledAt: streamData.scheduledFor
        ? streamData.scheduledFor.toISOString()
        : null,
      streamerId: userId,
      streamerName: "", // Set if available
      isLive: false,
    };

    // Create the document with the specified ID
    await setDoc(doc(db, "streams", streamId), streamDoc);

    // Log the stream creation in user activity
    await addDoc(collection(db, "userActivities"), {
      userId,
      type: "stream_created",
      streamId,
      streamTitle: streamData.title,
      timestamp: now,
      read: false,
    });

    streamLogger.info(
      `Stream ${streamId} created successfully by user ${userId}`
    );
    return { streamId, success: true };
  } catch (error) {
    streamLogger.error("Error creating stream:", toStreamingError(error));
    return { streamId: null, success: false };
  }
};

/**
 * Updates a stream in Firebase
 * @param streamId The ID of the stream to update
 * @param updateData The stream data to update
 * @returns Promise with success status
 */
export const updateStreamFirebase = async (
  streamId: string,
  updateData: Partial<{
    title: string;
    description: string;
    thumbnail: string;
    category: string;
    tags: string[];
    language: string;
    isPrivate: boolean;
    requiresSubscription: boolean;
    scheduledFor: Date | null;
  }>
): Promise<boolean> => {
  try {
    if (!auth.currentUser) {
      throw new Error("User must be authenticated to update a stream");
    }

    // Get the current user ID
    const userId = auth.currentUser.uid;

    // Get the current stream to verify ownership
    const streamRef = doc(db, "streams", streamId);
    const streamSnap = await getDoc(streamRef);

    if (!streamSnap.exists()) {
      throw new Error("Stream not found");
    }

    const streamData = streamSnap.data();
    if (streamData.userId !== userId) {
      throw new Error("User does not have permission to update this stream");
    }

    // Use the proper StreamUpdateObject type
    const updateObj: Partial<StreamData> = {
      ...updateData,
      updatedAt: Timestamp.now().toDate().toISOString(),
    };

    // Handle scheduled time if provided
    if (updateData.scheduledFor) {
      updateObj.scheduledAt = updateData.scheduledFor.toISOString();
    } else if (updateData.scheduledFor === null) {
      updateObj.scheduledAt = null;
    }

    // If title is updated, update the slug
    if (updateData.title) {
      updateObj.slug = generateSlug(updateData.title);
    }

    // Update the stream
    await updateDoc(streamRef, updateObj);

    // Log the update in user activity
    await addDoc(collection(db, "userActivities"), {
      userId,
      type: "stream_updated",
      streamId,
      streamTitle: updateData.title || streamData.title,
      timestamp: Timestamp.now(),
      read: false,
    });

    streamLogger.info(
      `Stream ${streamId} updated successfully by user ${userId}`
    );
    return true;
  } catch (error) {
    streamLogger.error(
      `Error updating stream ${streamId}:`,
      toStreamingError(error)
    );
    return false;
  }
};

/**
 * Starts a stream in Firebase
 * @param streamId The ID of the stream to start
 * @returns Promise with success status
 */
export const startStreamFirebase = async (
  streamId: string
): Promise<boolean> => {
  try {
    if (!auth.currentUser) {
      throw new Error("User must be authenticated to start a stream");
    }

    const userId = auth.currentUser.uid;

    // Get the current stream
    const streamRef = doc(db, "streams", streamId);
    const streamSnap = await getDoc(streamRef);

    if (!streamSnap.exists()) {
      throw new Error("Stream not found");
    }

    const streamData = streamSnap.data();
    if (streamData.userId !== userId) {
      throw new Error("User does not have permission to start this stream");
    }

    if (streamData.hasStarted && !streamData.hasEnded) {
      // Stream is already live, don't need to update
      return true;
    }

    // Update the stream status
    const now = Timestamp.now();
    await updateDoc(streamRef, {
      hasStarted: true,
      hasEnded: false,
      startedAt: now,
      endedAt: null,
      updatedAt: now,
      viewCount: 0, // Reset view count when starting/restarting
    });

    // Log the stream start in user activity
    await addDoc(collection(db, "userActivities"), {
      userId,
      type: "stream_started",
      streamId,
      streamTitle: streamData.title,
      timestamp: now,
      read: false,
    });

    streamLogger.info(`Stream ${streamId} started by user ${userId}`);
    return true;
  } catch (error) {
    streamLogger.error(
      `Error starting stream ${streamId}:`,
      toStreamingError(error)
    );
    return false;
  }
};

/**
 * Ends a stream in Firebase
 * @param streamId The ID of the stream to end
 * @returns Promise with success status
 */
export const endStreamFirebase = async (streamId: string): Promise<boolean> => {
  try {
    if (!auth.currentUser) {
      throw new Error("User must be authenticated to end a stream");
    }

    const userId = auth.currentUser.uid;

    // Get the current stream
    const streamRef = doc(db, "streams", streamId);
    const streamSnap = await getDoc(streamRef);

    if (!streamSnap.exists()) {
      throw new Error("Stream not found");
    }

    const streamData = streamSnap.data();
    if (streamData.userId !== userId) {
      throw new Error("User does not have permission to end this stream");
    }

    if (!streamData.hasStarted || streamData.hasEnded) {
      // Stream is not live, don't need to update
      return true;
    }

    // Update the stream status
    const now = Timestamp.now();
    await updateDoc(streamRef, {
      hasEnded: true,
      endedAt: now,
      updatedAt: now,
    });

    // Log the stream end in user activity
    await addDoc(collection(db, "userActivities"), {
      userId,
      type: "stream_ended",
      streamId,
      streamTitle: streamData.title,
      timestamp: now,
      read: false,
    });

    streamLogger.info(`Stream ${streamId} ended by user ${userId}`);
    return true;
  } catch (error) {
    streamLogger.error(
      `Error ending stream ${streamId}:`,
      toStreamingError(error)
    );
    return false;
  }
};

/**
 * Deletes a stream from Firebase
 * @param streamId The ID of the stream to delete
 * @returns Promise with success status
 */
export const deleteStreamFirebase = async (
  streamId: string
): Promise<boolean> => {
  try {
    if (!auth.currentUser) {
      throw new Error("User must be authenticated to delete a stream");
    }

    const userId = auth.currentUser.uid;

    // Get the current stream
    const streamRef = doc(db, "streams", streamId);
    const streamSnap = await getDoc(streamRef);

    if (!streamSnap.exists()) {
      throw new Error("Stream not found");
    }

    const streamData = streamSnap.data();
    if (streamData.userId !== userId) {
      throw new Error("User does not have permission to delete this stream");
    }

    // Delete the stream
    await deleteDoc(streamRef);

    // Log the deletion in user activity
    await addDoc(collection(db, "userActivities"), {
      userId,
      type: "stream_deleted",
      streamTitle: streamData.title,
      timestamp: Timestamp.now(),
      read: false,
    });

    streamLogger.info(`Stream ${streamId} deleted by user ${userId}`);
    return true;
  } catch (error) {
    streamLogger.error(
      `Error deleting stream ${streamId}:`,
      toStreamingError(error)
    );
    return false;
  }
};

/**
 * Adds a viewer to a stream and updates view count
 * @param streamId The ID of the stream to update
 * @param viewerId The ID of the viewer
 * @returns Promise with success status
 */
export const addStreamViewer = async (
  streamId: string,
  viewerId: string
): Promise<boolean> => {
  try {
    // Get the stream reference
    const streamRef = doc(db, "streams", streamId);
    const streamSnap = await getDoc(streamRef);

    if (!streamSnap.exists()) {
      throw new Error("Stream not found");
    }

    const streamData = streamSnap.data();
    if (!streamData.hasStarted || streamData.hasEnded) {
      throw new Error("Stream is not live");
    }

    // Add viewer to viewers collection
    const viewerRef = doc(db, "streams", streamId, "viewers", viewerId);
    await setDoc(viewerRef, {
      joinedAt: Timestamp.now(),
      lastActiveAt: Timestamp.now(),
    });

    // Increment view count in the stream document
    await updateDoc(streamRef, {
      viewCount: increment(1),
    });

    return true;
  } catch (error) {
    streamLogger.error(
      `Error adding viewer ${viewerId} to stream ${streamId}:`,
      toStreamingError(error)
    );
    return false;
  }
};

/**
 * Updates a viewer's active status in a stream
 * @param streamId The ID of the stream
 * @param viewerId The ID of the viewer
 * @returns Promise with success status
 */
export const updateViewerActivity = async (
  streamId: string,
  viewerId: string
): Promise<boolean> => {
  try {
    const viewerRef = doc(db, "streams", streamId, "viewers", viewerId);
    await updateDoc(viewerRef, {
      lastActiveAt: Timestamp.now(),
    });

    return true;
  } catch (error) {
    streamLogger.error(
      `Error updating viewer ${viewerId} activity in stream ${streamId}:`,
      toStreamingError(error)
    );
    return false;
  }
};
