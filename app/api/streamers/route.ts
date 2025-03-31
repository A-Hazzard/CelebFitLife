import { db } from "@/lib/config/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { Stream, StreamerWithStreams } from "@/lib/types/streaming";

// Define a simpler Streamer type that matches the database structure
type Streamer = Omit<StreamerWithStreams, "streams" | "Category" | "Tags">;

export const fetchStreamersWithStreams = async () => {
  const streamerCol = collection(db, "streamer");
  const streamerSnap = await getDocs(streamerCol);

  const streamerData: StreamerWithStreams[] = [];

  for (const streamerDoc of streamerSnap.docs) {
    const streamer = { id: streamerDoc.id, ...streamerDoc.data() } as Streamer;

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
