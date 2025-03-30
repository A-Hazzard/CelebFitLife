"use client";

import { useState, useEffect } from "react";
import { Timestamp } from "firebase/firestore";

type StreamDurationProps = {
  startedAt: Timestamp | string | Date | null;
  className?: string;
};

export function StreamDuration({
  startedAt,
  className = "",
}: StreamDurationProps) {
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (!startedAt) return;

    // Initial calculation
    const calculateDuration = () => {
      try {
        // Handle different formats of startedAt
        const startTime =
          startedAt instanceof Timestamp
            ? startedAt.toDate().getTime()
            : startedAt instanceof Date
            ? startedAt.getTime()
            : new Date(startedAt).getTime();

        const now = Date.now();
        const elapsedSeconds = Math.floor((now - startTime) / 1000);
        return elapsedSeconds > 0 ? elapsedSeconds : 0;
      } catch (error) {
        console.error("Error calculating stream duration:", error);
        return 0;
      }
    };

    // Set initial duration
    setDuration(calculateDuration());

    // Update every second
    const timer = setInterval(() => {
      setDuration(calculateDuration());
    }, 1000);

    return () => clearInterval(timer);
  }, [startedAt]);

  // Format the duration as HH:MM:SS
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className={`bg-black bg-opacity-60 px-3 py-1 rounded-full text-white text-sm ${className}`}
    >
      {formatDuration(duration)}
    </div>
  );
}
