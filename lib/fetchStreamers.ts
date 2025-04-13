import { Streamer } from "@/lib/types/streaming.types";

export const fetchStreamersFromDB = async (): Promise<Streamer[]> => {
  try {
    const response = await fetch('/api/streamers'); // Adjust the endpoint as necessary
    if (!response.ok) {
      throw new Error('Failed to fetch streamers');
    }
    const data = await response.json();
    return data.streamers; // Adjust based on your API response structure
  } catch (error) {
    console.error("Error fetching streamers:", error);
    return [];
  }
}; 