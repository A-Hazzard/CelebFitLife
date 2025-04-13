"use client";

import React, { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { Timestamp } from "firebase/firestore";

type StreamDurationProps = {
  startTime: Timestamp | Date | string | null;
  className?: string;
};

export function StreamDuration({
  startTime,
  className = "",
}: StreamDurationProps) {
  const [duration, setDuration] = useState("00:00:00");

  useEffect(() => {
    if (!startTime) return;

    const updateDuration = () => {
      // Convert startTime to Date based on its type
      let start: Date;

      if (startTime instanceof Timestamp) {
        start = startTime.toDate();
      } else if (startTime instanceof Date) {
        start = startTime;
      } else if (typeof startTime === "string") {
        start = new Date(startTime);
      } else {
        // If we can't determine a valid date, return early
        console.error("Invalid startTime format:", startTime);
        return;
      }

      const now = new Date();
      const diffMs = now.getTime() - start.getTime();

      // Calculate hours, minutes, seconds
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      // Format as HH:MM:SS
      const formattedHours = hours.toString().padStart(2, "0");
      const formattedMinutes = minutes.toString().padStart(2, "0");
      const formattedSeconds = seconds.toString().padStart(2, "0");

      setDuration(`${formattedHours}:${formattedMinutes}:${formattedSeconds}`);
    };

    // Update immediately and then every second
    updateDuration();
    const intervalId = setInterval(updateDuration, 1000);

    return () => clearInterval(intervalId);
  }, [startTime]);

  return (
    <div className={`flex items-center ${className}`}>
      <Clock className="w-4 h-4 mr-1.5 text-brandOrange" />
      <span className="font-medium">{duration}</span>
    </div>
  );
}
