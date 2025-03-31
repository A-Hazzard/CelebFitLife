/**
 * CLIENT-SIDE STREAMING SERVICE
 * This service contains client-side functions for interacting with streamer-related APIs.
 */

import { StreamerSelection, RecommendedStreamer } from "@/lib/types/streamer";
import { toStreamingError } from "@/lib/types/streaming";

export async function saveStreamerSelections(
  userId: string,
  selectedStreamers: StreamerSelection[]
): Promise<void> {
  try {
    const response = await fetch("/api/streamers/selection", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        selectedStreamers,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to save streamer selections");
    }
  } catch (error) {
    console.error("Streamer selection error:", toStreamingError(error));
    throw error;
  }
}

export async function getRecommendedStreamers(): Promise<
  RecommendedStreamer[]
> {
  // Implementation to fetch recommended streamers
  return [];
}
