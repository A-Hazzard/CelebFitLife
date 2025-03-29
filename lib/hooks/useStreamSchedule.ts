import { useState, useEffect, useCallback } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/config/firebase";

/**
 * Custom hook to manage scheduled stream countdown functionality.
 * Checks if a stream is scheduled and calculates time remaining until start.
 *
 * @param slug - The stream identifier
 * @returns Object containing schedule status and time information
 */
export const useStreamSchedule = (slug: string) => {
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledTime, setScheduledTime] = useState<string | null>(null);
  const [streamTitle, setStreamTitle] = useState("");
  const [timeRemaining, setTimeRemaining] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch stream schedule info from Firestore
  const fetchScheduleInfo = useCallback(async () => {
    if (!slug) return;

    try {
      setLoading(true);
      setError(null);

      const streamDocRef = doc(db, "streams", slug);
      const streamSnapshot = await getDoc(streamDocRef);

      if (streamSnapshot.exists()) {
        const data = streamSnapshot.data();

        // Set stream title
        setStreamTitle(data.title || "Upcoming Stream");

        // Check if stream is scheduled
        if (data.scheduledAt) {
          const scheduledDate = new Date(data.scheduledAt);
          const now = new Date();

          // Only consider scheduled if date is in the future
          if (scheduledDate > now) {
            setIsScheduled(true);
            setScheduledTime(data.scheduledAt);
          } else {
            setIsScheduled(false);
            setScheduledTime(null);
          }
        } else {
          setIsScheduled(false);
          setScheduledTime(null);
        }
      } else {
        setError("Stream not found");
      }
    } catch (error) {
      console.error("Error fetching stream schedule:", error);
      setError("Failed to fetch stream schedule");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  // Calculate time remaining until scheduled start
  const calculateTimeRemaining = useCallback(() => {
    if (!scheduledTime) return null;

    const scheduledDate = new Date(scheduledTime);
    const now = new Date();

    // If scheduled time is in the past, return null
    if (scheduledDate <= now) {
      setIsScheduled(false);
      setScheduledTime(null);
      return null;
    }

    const diffMs = scheduledDate.getTime() - now.getTime();

    // Calculate remaining time units
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds };
  }, [scheduledTime]);

  // Initial fetch of schedule info
  useEffect(() => {
    fetchScheduleInfo();
  }, [fetchScheduleInfo]);

  // Update countdown timer every second
  useEffect(() => {
    if (!isScheduled || !scheduledTime) return;

    const intervalId = setInterval(() => {
      const remaining = calculateTimeRemaining();
      setTimeRemaining(remaining);

      // Stop timer if countdown is complete
      if (!remaining) {
        clearInterval(intervalId);
      }
    }, 1000);

    // Initial calculation
    setTimeRemaining(calculateTimeRemaining());

    return () => clearInterval(intervalId);
  }, [isScheduled, scheduledTime, calculateTimeRemaining]);

  // Format scheduled time for display
  const formattedScheduledTime = useCallback(() => {
    if (!scheduledTime) return "";

    const date = new Date(scheduledTime);
    return date.toLocaleString();
  }, [scheduledTime]);

  return {
    isScheduled,
    scheduledTime,
    streamTitle,
    timeRemaining,
    formattedScheduledTime: formattedScheduledTime(),
    loading,
    error,
    refetch: fetchScheduleInfo,
  };
};
