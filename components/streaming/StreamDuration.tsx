import React, { useEffect, useState } from "react";
import { Timestamp } from "firebase/firestore";

export function StreamDuration({
  startTime,
  className = "",
}: {
  startTime: Date | string | Timestamp | null;
  className?: string;
}) {
  const [duration, setDuration] = useState("00:00:00");
  useEffect(() => {
    if (!startTime) return;
    let start: Date;
    if (startTime instanceof Timestamp) start = startTime.toDate();
    else if (startTime instanceof Date) start = startTime;
    else start = new Date(startTime);
    const update = () => {
      const now = new Date();
      const diff = Math.max(0, now.getTime() - start.getTime());
      const h = Math.floor(diff / 3600000)
        .toString()
        .padStart(2, "0");
      const m = Math.floor((diff % 3600000) / 60000)
        .toString()
        .padStart(2, "0");
      const s = Math.floor((diff % 60000) / 1000)
        .toString()
        .padStart(2, "0");
      setDuration(`${h}:${m}:${s}`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [startTime]);
  return <span className={className}>{duration}</span>;
}
