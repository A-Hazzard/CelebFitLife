import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  DocumentData,
  onSnapshot,
  QuerySnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { ActivityItem } from "@/lib/types/ui";
import { StreamDoc } from "@/lib/types/streaming.types";

/**
 * Fetches live streams for the specified user
 * @param userId The user's ID
 * @returns Promise with array of live streams
 */
export const fetchLiveStreams = async (
  userId: string
): Promise<StreamDoc[]> => {
  if (!userId) {
    throw new Error("User ID is required to fetch live streams");
  }

  const liveStreamQuery = query(
    collection(db, "streams"),
    where("userId", "==", userId),
    where("hasStarted", "==", true),
    where("hasEnded", "==", false)
  );

  const snapshot = await getDocs(liveStreamQuery);
  return snapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
      } as StreamDoc)
  );
};

/**
 * Fetches upcoming streams for the specified user
 * @param userId The user's ID
 * @returns Promise with array of upcoming streams
 */
export const fetchUpcomingStreams = async (
  userId: string
): Promise<StreamDoc[]> => {
  if (!userId) {
    throw new Error("User ID is required to fetch upcoming streams");
  }

  const now = Timestamp.now();
  const upcomingStreamQuery = query(
    collection(db, "streams"),
    where("userId", "==", userId),
    where("hasStarted", "==", false),
    where("scheduledAt", ">", now),
    orderBy("scheduledAt", "asc")
  );

  const snapshot = await getDocs(upcomingStreamQuery);
  return snapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
      } as StreamDoc)
  );
};

/**
 * Fetches past streams for the specified user
 * @param userId The user's ID
 * @param limitCount Number of past streams to fetch
 * @returns Promise with array of past streams
 */
export const fetchPastStreams = async (
  userId: string,
  limitCount: number = 10
): Promise<StreamDoc[]> => {
  if (!userId) {
    throw new Error("User ID is required to fetch past streams");
  }

  try {
    // First get streams by userId without the complex ordering that requires an index
    const userStreamsQuery = query(
      collection(db, "streams"),
      where("userId", "==", userId),
      where("hasEnded", "==", true)
    );

    const snapshot = await getDocs(userStreamsQuery);

    // Then manually sort and limit the results in memory
    // This approach won't be efficient for large datasets but works well for small datasets
    const pastStreams = snapshot.docs
      .map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as StreamDoc)
      )
      .sort((a, b) => {
        // Sort by endedAt date, most recent first
        const aDate = a.endedAt
          ? typeof a.endedAt === "string"
            ? new Date(a.endedAt)
            : a.endedAt.toDate()
          : new Date(0);

        const bDate = b.endedAt
          ? typeof b.endedAt === "string"
            ? new Date(b.endedAt)
            : b.endedAt.toDate()
          : new Date(0);

        return bDate.getTime() - aDate.getTime();
      })
      .slice(0, limitCount);

    return pastStreams;
  } catch (error) {
    console.error("Error fetching past streams:", error);
    return [];
  }
};

/**
 * Fetches user activities for the dashboard
 * @param userId The user's ID
 * @param limitCount Number of activities to fetch
 * @returns Promise with array of user activities
 */
export const fetchUserActivities = async (
  userId: string,
  limitCount: number = 30
): Promise<ActivityItem[]> => {
  if (!userId) {
    throw new Error("User ID is required to fetch user activities");
  }

  const activitiesQuery = query(
    collection(db, "userActivities"),
    where("userId", "==", userId),
    orderBy("timestamp", "desc"),
    limit(limitCount)
  );

  const snapshot = await getDocs(activitiesQuery);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(),
    } as ActivityItem;
  });
};

/**
 * Sets up a real-time listener for user activities
 * @param userId The user's ID
 * @param callback Function to call when activities change
 * @param limitCount Number of activities to fetch
 * @returns Unsubscribe function to stop listening
 */
export const subscribeToUserActivities = (
  userId: string,
  callback: (activities: ActivityItem[]) => void,
  limitCount: number = 30
): (() => void) => {
  if (!userId) {
    throw new Error("User ID is required to subscribe to user activities");
  }

  const activitiesQuery = query(
    collection(db, "userActivities"),
    where("userId", "==", userId),
    orderBy("timestamp", "desc"),
    limit(limitCount)
  );

  const unsubscribe = onSnapshot(
    activitiesQuery,
    (snapshot: QuerySnapshot<DocumentData>) => {
      const activities = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate
            ? data.timestamp.toDate()
            : new Date(),
        } as ActivityItem;
      });

      callback(activities);
    },
    (error) => {
      console.error("Error fetching activities:", error);
      callback([]);
    }
  );

  return unsubscribe;
};

/**
 * Fetches all streams (live, ended, and scheduled) for a specific user
 * @param userId The user ID to fetch streams for
 */
export async function fetchAllUserStreams(userId: string) {
  try {
    if (!userId) {
      throw new Error("User ID is required");
    }

    const [live, upcoming, past] = await Promise.all([
      fetchLiveStreams(userId),
      fetchUpcomingStreams(userId),
      fetchPastStreams(userId),
    ]);

    return { live, upcoming, past };
  } catch (error) {
    console.error("Error fetching all user streams:", error);
    throw error;
  }
}
