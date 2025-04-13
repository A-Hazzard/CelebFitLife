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
import { StreamDoc } from "@/lib/types/streaming";

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

  const pastStreamQuery = query(
    collection(db, "streams"),
    where("userId", "==", userId),
    where("hasEnded", "==", true),
    orderBy("endedAt", "desc"),
    limit(limitCount)
  );

  const snapshot = await getDocs(pastStreamQuery);
  return snapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
      } as StreamDoc)
  );
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
 * Fetches all streams for a user in a single call
 * This is useful for the dashboard to load everything at once
 * @param userId The user's ID
 * @returns Promise with object containing live, upcoming and past streams
 */
export const fetchAllUserStreams = async (
  userId: string
): Promise<{
  live: StreamDoc[];
  upcoming: StreamDoc[];
  past: StreamDoc[];
}> => {
  if (!userId) {
    throw new Error("User ID is required to fetch all user streams");
  }

  const [live, upcoming, past] = await Promise.all([
    fetchLiveStreams(userId),
    fetchUpcomingStreams(userId),
    fetchPastStreams(userId),
  ]);

  return { live, upcoming, past };
};
