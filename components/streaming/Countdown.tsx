"use client";

import { useEffect, useState } from "react";

export function Countdown({
  scheduledTime,
}: {
  scheduledTime: string | null | undefined;
}) {
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
    totalMs: 0,
  });
  const [status, setStatus] = useState<"waiting" | "soon" | "live" | "ended">(
    "waiting"
  );

  useEffect(() => {
    const calculateTimeLeft = () => {
      try {
        // Handle case where scheduledTime is null or undefined
        if (!scheduledTime) {
          console.error("No scheduled time provided to Countdown component");
          return { hours: 0, minutes: 0, seconds: 0, totalMs: 0 };
        }

        const now = new Date();
        const scheduled = new Date(scheduledTime);

        if (isNaN(scheduled.getTime())) {
          console.error("Invalid date format:", scheduledTime);
          return { hours: 0, minutes: 0, seconds: 0, totalMs: 0 };
        }

        const diff = scheduled.getTime() - now.getTime();

        // Update status based on time remaining
        if (diff <= 0) {
          setStatus("soon");
          return { hours: 0, minutes: 0, seconds: 0, totalMs: 0 };
        } else {
          setStatus("waiting");
        }

        // Calculate hours, minutes, seconds
        const totalSeconds = Math.floor(diff / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        return {
          hours,
          minutes,
          seconds,
          totalMs: diff,
        };
      } catch (error) {
        console.error("Error calculating time left:", error);
        return { hours: 0, minutes: 0, seconds: 0, totalMs: 0 };
      }
    };

    // Initial calculation
    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);

      // Auto-refresh page when timer hits zero
      if (newTimeLeft.totalMs <= 1000 && newTimeLeft.totalMs > 0) {
        setTimeout(() => {
          window.location.reload();
        }, newTimeLeft.totalMs + 500);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [scheduledTime]);

  return (
    <div className="bg-black/90 p-8 rounded-lg text-center max-w-xl w-full mx-auto">
      <h2 className="text-3xl font-bold text-brandOrange mb-6">
        Stream Scheduled
      </h2>

      {status === "waiting" && (
        <>
          <div className="text-xl text-white mb-8">
            Get ready! The stream will start soon.
          </div>

          <div className="flex justify-center gap-4">
            <TimeBlock value={timeLeft.hours} label="Hours" />
            <TimeBlock value={timeLeft.minutes} label="Minutes" />
            <TimeBlock value={timeLeft.seconds} label="Seconds" pulse />
          </div>

          <div className="mt-8 text-sm text-gray-400">
            The page will automatically refresh when the stream starts
          </div>
        </>
      )}

      {status === "soon" && (
        <div className="text-2xl text-brandOrange animate-pulse">
          Stream starting any moment now...
        </div>
      )}
    </div>
  );
}

// Individual time block component
function TimeBlock({
  value,
  label,
  pulse = false,
}: {
  value: number;
  label: string;
  pulse?: boolean;
}) {
  // Ensure two digits
  const displayValue = value.toString().padStart(2, "0");

  return (
    <div className="flex flex-col items-center">
      <div
        className={`
        bg-brandBlack border-2 border-brandOrange 
        rounded-lg w-24 h-24 flex items-center justify-center
        ${pulse ? "animate-pulse" : ""}
      `}
      >
        <span className="text-4xl font-bold text-brandOrange">
          {displayValue}
        </span>
      </div>
      <span className="text-white mt-2">{label}</span>
    </div>
  );
}
