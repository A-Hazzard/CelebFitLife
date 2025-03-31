/**
 * STREAMING UTILITIES
 *
 * This file contains utilities for managing streams, including:
 * - Stream creation, updating, and management
 * - Stream filtering and discovery
 * - URL and slug generation
 * - Date and time handling for streams
 */

import { createLogger } from "./logger";
import {
  Streamer,
  Stream,
  StreamStatus,
  StreamUpdateData,
  StreamWithDetails,
} from "@/lib/types/streaming";
import {
  LocalVideoTrack,
  RemoteTrack,
  LocalAudioTrack,
  Room,
} from "twilio-video";
import { createLocalVideoTrack, createLocalAudioTrack } from "twilio-video";
import { updateStreamDeviceStatus } from "@/lib/helpers/streaming";

// Create context-specific logger
const streamLogger = createLogger("Streaming");

// ===== STREAM FILTERING AND DISCOVERY =====

/**
 * Filters an array of streamers based on selected categories and tags
 */
export function filterStreamers(
  streamers: Streamer[],
  selectedCategories: string[] = [],
  selectedTags: string[] = []
): Streamer[] {
  if (!streamers || streamers.length === 0) {
    return [];
  }

  // If no filters are applied, return all streamers
  if (selectedCategories.length === 0 && selectedTags.length === 0) {
    return streamers;
  }

  return streamers.filter((streamer) => {
    // Filter by categories if any are selected
    const matchesCategory =
      selectedCategories.length === 0 ||
      (streamer.categories &&
        streamer.categories.some((category) =>
          selectedCategories.includes(category)
        ));

    // Filter by tags if any are selected
    const matchesTags =
      selectedTags.length === 0 ||
      (streamer.tags &&
        streamer.tags.some((tag) => selectedTags.includes(tag)));

    return matchesCategory && matchesTags;
  });
}

/**
 * Sorts streams by scheduled date, putting currently live streams first
 */
export function sortStreamsBySchedule(
  streams: StreamWithDetails[]
): StreamWithDetails[] {
  if (!streams || streams.length === 0) {
    return [];
  }

  // First sort into live and scheduled
  const liveStreams = streams.filter((stream) => stream.status === "live");
  const scheduledStreams = streams.filter(
    (stream) => stream.status === "scheduled"
  );

  // Sort scheduled streams by date
  scheduledStreams.sort((a, b) => {
    if (!a.scheduledFor || !b.scheduledFor) return 0;
    return (
      new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime()
    );
  });

  // Return live streams first, then upcoming scheduled streams
  return [...liveStreams, ...scheduledStreams];
}

// ===== URL AND SLUG GENERATION =====

/**
 * Generates a URL-friendly slug from a title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove non-word chars
    .replace(/[\s_-]+/g, "-") // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

/**
 * Constructs the full streaming URL for a stream
 */
export function getStreamingUrl(streamId: string): string {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    (typeof window !== "undefined" ? window.location.origin : "");
  return `${baseUrl}/streaming/live/${streamId}`;
}

// ===== DATE AND TIME HANDLING =====

/**
 * Calculates a default schedule time (minutes from now)
 */
export function getDefaultScheduleTime(minutesFromNow: number = 15): Date {
  const date = new Date();
  date.setMinutes(date.getMinutes() + minutesFromNow);
  return date;
}

/**
 * Formats a date for display in stream details
 */
export function formatStreamDate(date: Date | string | null): string {
  if (!date) return "No date set";

  const dateObj = typeof date === "string" ? new Date(date) : date;

  return dateObj.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Determines if a scheduled stream should be considered "upcoming soon"
 * (within the next hour)
 */
export function isStreamUpcomingSoon(
  scheduledFor: string | Date | null,
  thresholdMinutes: number = 60
): boolean {
  if (!scheduledFor) return false;

  const scheduledDate =
    typeof scheduledFor === "string" ? new Date(scheduledFor) : scheduledFor;

  const now = new Date();
  const diffMs = scheduledDate.getTime() - now.getTime();
  const diffMinutes = diffMs / (1000 * 60);

  return diffMinutes > 0 && diffMinutes <= thresholdMinutes;
}

// ===== STREAM MANAGEMENT =====

/**
 * Prepares a stream for starting by updating its status
 */
export async function prepareStreamToStart(
  streamId: string
): Promise<Stream | null> {
  try {
    const response = await fetch(`/api/streams/${streamId}/prepare`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      streamLogger.error(`Failed to prepare stream ${streamId}:`, errorData);
      throw new Error(errorData.message || "Failed to prepare stream");
    }

    const data = await response.json();
    streamLogger.info(`Stream ${streamId} prepared successfully`);
    return data.stream;
  } catch (error) {
    streamLogger.error(`Error preparing stream ${streamId}:`, error);
    return null;
  }
}

/**
 * Updates a stream with new data
 */
export async function updateStream(
  streamId: string,
  updateData: StreamUpdateData
): Promise<Stream | null> {
  try {
    const response = await fetch(`/api/streams/${streamId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      streamLogger.error(`Failed to update stream ${streamId}:`, errorData);
      throw new Error(errorData.message || "Failed to update stream");
    }

    const data = await response.json();
    streamLogger.info(`Stream ${streamId} updated successfully`);
    return data.stream;
  } catch (error) {
    streamLogger.error(`Error updating stream ${streamId}:`, error);
    return null;
  }
}

/**
 * Creates a new stream
 */
export async function createStream(streamData: {
  title: string;
  description?: string;
  thumbnailUrl?: string;
  isScheduled?: boolean;
  scheduledFor?: string | Date | null;
}): Promise<{ stream: Stream; success: boolean }> {
  try {
    const response = await fetch("/api/streams", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(streamData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      streamLogger.error("Failed to create stream:", errorData);
      return {
        stream: null as unknown as Stream,
        success: false,
      };
    }

    const data = await response.json();
    streamLogger.info("Stream created successfully");
    return { stream: data.stream, success: true };
  } catch (error) {
    streamLogger.error("Error creating stream:", error);
    return {
      stream: null as unknown as Stream,
      success: false,
    };
  }
}

/**
 * Fetches a stream by ID
 */
export async function fetchStreamById(
  streamId: string
): Promise<Stream | null> {
  try {
    const response = await fetch(`/api/streams/${streamId}`);

    if (!response.ok) {
      const errorData = await response.json();
      streamLogger.error(`Failed to fetch stream ${streamId}:`, errorData);
      throw new Error(errorData.message || "Failed to fetch stream");
    }

    const data = await response.json();
    return data.stream;
  } catch (error) {
    streamLogger.error(`Error fetching stream ${streamId}:`, error);
    return null;
  }
}

/**
 * Fetches streams for a given user
 */
export async function fetchStreamsForUser(userId: string): Promise<Stream[]> {
  try {
    const response = await fetch(`/api/users/${userId}/streams`);

    if (!response.ok) {
      const errorData = await response.json();
      streamLogger.error(
        `Failed to fetch streams for user ${userId}:`,
        errorData
      );
      throw new Error(errorData.message || "Failed to fetch streams");
    }

    const data = await response.json();
    return data.streams;
  } catch (error) {
    streamLogger.error(`Error fetching streams for user ${userId}:`, error);
    return [];
  }
}

/**
 * Updates the status of a stream
 */
export async function updateStreamStatus(
  streamId: string,
  status: StreamStatus
): Promise<Stream | null> {
  try {
    const response = await fetch(`/api/streams/${streamId}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      streamLogger.error(
        `Failed to update stream ${streamId} status:`,
        errorData
      );
      throw new Error(errorData.message || "Failed to update stream status");
    }

    const data = await response.json();
    streamLogger.info(`Stream ${streamId} status updated to ${status}`);
    return data.stream;
  } catch (error) {
    streamLogger.error(`Error updating stream ${streamId} status:`, error);
    return null;
  }
}

/**
 * Ends a stream, updating its status and performing cleanup
 */
export async function endStream(streamId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/streams/${streamId}/end`, {
      method: "PUT",
    });

    if (!response.ok) {
      const errorData = await response.json();
      streamLogger.error(`Failed to end stream ${streamId}:`, errorData);
      throw new Error(errorData.message || "Failed to end stream");
    }

    streamLogger.info(`Stream ${streamId} ended successfully`);
    return true;
  } catch (error) {
    streamLogger.error(`Error ending stream ${streamId}:`, error);
    return false;
  }
}
