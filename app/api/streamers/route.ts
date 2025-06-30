import { db } from "@/lib/firebase/client";
import { collection, getDocs, query, where } from "firebase/firestore";

// Minimal types to replace deleted streaming types
type Stream = {
  id: string;
  title?: string;
  hasEnded?: boolean;
  thumbnail?: string;
};

type StreamerWithStreams = {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
  bio?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  thumbnail?: string;
  Category?: string;
  Tags?: string[];
  streams?: Stream[];
};

export const fetchStreamersWithStreams = async () => {
  const streamerCol = collection(db, "streamer");
  const streamerSnap = await getDocs(streamerCol);

  const streamerData: StreamerWithStreams[] = [];

  for (const streamerDoc of streamerSnap.docs) {
    const data = streamerDoc.data();
    // Map streamerName to name and username for compatibility
    const streamer = {
      id: streamerDoc.id,
      name:
        data.streamerName || data.username || data.name || "Unknown Streamer",
      username: data.streamerName || data.username || "unknown_streamer",
      avatarUrl: data.avatarUrl || "",
      bio: data.bio || data.Quote || "",
      isActive: data.isActive ?? true,
      createdAt: data.createdAt || "",
      updatedAt: data.updatedAt || "",
      thumbnail: data.thumbnail || "",
      Category: data.Category || "",
      Tags: data.Tags || [],
      // Any other fields needed for StreamerWithStreams
    } as StreamerWithStreams;

    const streamQuery = query(
      collection(db, "streams"),
      where("streamerId", "==", streamerDoc.id)
    );

    const streamSnap = await getDocs(streamQuery);
    const streams = streamSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Stream[];

    streamerData.push({ ...streamer, streams });
  }

  return streamerData;
};
