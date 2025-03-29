import { db } from "@/lib/config/firebase";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";

export interface Stream {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  hasStarted: boolean;
  createdAt: string;
  userId: string;
}

/**
 * Fetch a stream by its slug
 * @param slug The unique stream identifier
 * @returns The stream data or null if not found
 */
export async function getStreamBySlug(slug: string): Promise<Stream | null> {
  try {
    // Query the streams collection where slug equals the provided slug
    const streamsRef = collection(db, "streams");
    const q = query(streamsRef, where("slug", "==", slug));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    // Get the first (and should be only) document
    const streamDoc = querySnapshot.docs[0];
    const data = streamDoc.data();

    return {
      id: streamDoc.id,
      slug: data.slug,
      title: data.title,
      description: data.description || null,
      thumbnail: data.thumbnail || null,
      hasStarted: data.hasStarted || false,
      createdAt: data.createdAt,
      userId: data.userId,
    };
  } catch (error) {
    console.error("Error in getStreamBySlug:", error);
    return null;
  }
}

/**
 * Fetch all streams for a user
 * @param userId The user ID to fetch streams for
 * @returns Array of stream data
 */
export async function getStreamsByUser(userId: string): Promise<Stream[]> {
  try {
    const streamsRef = collection(db, "streams");
    const q = query(
      streamsRef,
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return [];
    }

    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        slug: data.slug,
        title: data.title,
        description: data.description || null,
        thumbnail: data.thumbnail || null,
        hasStarted: data.hasStarted || false,
        createdAt: data.createdAt,
        userId: data.userId,
      };
    });
  } catch (error) {
    console.error("Error in getStreamsByUser:", error);
    return [];
  }
}

/**
 * Fetch all currently live streams
 * @returns Array of live stream data
 */
export async function getLiveStreams(): Promise<Stream[]> {
  try {
    const streamsRef = collection(db, "streams");
    const q = query(
      streamsRef,
      where("hasStarted", "==", true),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return [];
    }

    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        slug: data.slug,
        title: data.title,
        description: data.description || null,
        thumbnail: data.thumbnail || null,
        hasStarted: data.hasStarted || false,
        createdAt: data.createdAt,
        userId: data.userId,
      };
    });
  } catch (error) {
    console.error("Error in getLiveStreams:", error);
    return [];
  }
}
