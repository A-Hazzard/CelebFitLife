// Define the Stream type inline based on expected fields
interface Stream {
  id: string;
  title: string;
  thumbnail?: string;
  createdAt?: string;
  updatedAt?: string;
  isLive?: boolean;
  hasStarted?: boolean;
  hasEnded?: boolean;
  category?: string;
  tags?: string[];
}

// Define the Streamer type inline based on expected fields
interface Streamer {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
  bio?: string;
  category?: string;
  tags?: string[];
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  thumbnail?: string;
  streams?: Stream[];
}

export const fetchStreamersFromDB = async (): Promise<Streamer[]> => {
  try {
    const response = await fetch("/api/streamers"); // Adjust the endpoint as necessary
    if (!response.ok) {
      throw new Error("Failed to fetch streamers");
    }
    const data = await response.json();
    return data.streamers; // Adjust based on your API response structure
  } catch (error) {
    console.error("Error fetching streamers:", error);
    return [];
  }
};
