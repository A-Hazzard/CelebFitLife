/**
 * CLIENT-SIDE STREAMING SERVICE
 * This service contains client-side functions for interacting with streamer-related APIs.
 */

import { StreamerSelection, RecommendedStreamer } from "@/lib/types/streamer";
import { toStreamingError } from "@/lib/types/streaming";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/config/firebase";

export async function saveStreamerSelections(
  userId: string,
  selectedStreamers: StreamerSelection[],
  myStreamers?: string[]
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
        myStreamers
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

export async function getRecommendedStreamers(): Promise<RecommendedStreamer[]> {
  try {
    // Fetch streamers from Firebase with role.streamer = true
    const streamersRef = collection(db, "users");
    const q = query(streamersRef, where("role.streamer", "==", true));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log("No streamers found");
      return [];
    }
    
    // Map the documents to RecommendedStreamer objects
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.username || 'Unnamed Streamer',
        username: data.username || 'unnamed_streamer',
        profileImage: data.profileImage || '',
        avatarUrl: data.profileImage || '',
        category: data.specialty || 'Fitness',
        description: data.bio || '',
        bio: data.bio || ''
      };
    });
  } catch (error) {
    console.error("Error fetching recommended streamers:", error);
    return [];
  }
}
