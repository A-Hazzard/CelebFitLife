
"use client";

import { useEffect, useState } from 'react';

export function Countdown({ scheduledTime }: { scheduledTime: string }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const scheduled = new Date();
      const [hours, minutes] = scheduledTime.split(':');
      scheduled.setHours(parseInt(hours), parseInt(minutes), 0);

      const diff = scheduled.getTime() - now.getTime();
      
      if (diff <= 0) return "Starting soon...";
      
      const minsLeft = Math.floor(diff / 60000);
      const hoursLeft = Math.floor(minsLeft / 60);
      const minutesLeft = minsLeft % 60;
      
      return `Starting in ${hoursLeft}h ${minutesLeft}m`;
    };

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [scheduledTime]);

  return (
    <div className="bg-brandBlack/80 p-4 rounded-lg text-brandOrange text-center text-xl font-semibold">
      {timeLeft}
    </div>
  );
}
