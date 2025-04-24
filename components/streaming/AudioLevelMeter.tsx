import React, { useEffect, useState, useMemo } from "react";
import { AudioLevelMeterProps as BaseProps } from "@/lib/types/ui";

interface AudioLevelMeterProps extends BaseProps {
  pulse?: boolean;
}

const AudioLevelMeter: React.FC<AudioLevelMeterProps> = ({
  level,
  isActive = false,
  // Removed: type = "microphone",
  // Removed: pulse = false,
}) => {
  const [meterKey, setMeterKey] = useState<number>(0);
  const [isPulsing, setIsPulsing] = useState<boolean>(false);

  // Force re-render when isActive changes
  useEffect(() => {
    setMeterKey((prev) => prev + 1);
  }, [isActive]);

  // Handle pulsing effect when level exceeds threshold
  useEffect(() => {
    if (level > 30 && isActive) {
      setIsPulsing(true);
      const timeout = setTimeout(() => setIsPulsing(false), 300);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [level, isActive]);

  // Force re-render on significant level changes
  useEffect(() => {
    if (isActive) {
      // Only force re-render if level changes significantly
      const levelChange = Math.abs(level - prevLevelRef.current);
      if (levelChange > 5) {
        setMeterKey((prev) => prev + 1);
        prevLevelRef.current = level;
      }
    }
  }, [level, isActive]);

  // Ref to track previous level for change detection
  const prevLevelRef = React.useRef<number>(0);

  // Create the segments array - this will determine which segments are active
  const segments = useMemo(() => {
    const result = [];
    const totalSegments = 20;
    for (let i = 0; i < totalSegments; i++) {
      const isSegmentActive = isActive && (i === 0 || (i + 1) * 5 <= level);
      result.push({
        id: i,
        active: isSegmentActive,
      });
    }
    if (isActive) {
      const activeCount = result.filter((segment) => segment.active).length;
      console.log(
        `AudioLevelMeter: level=${level}, activeSegments=${activeCount}`
      );
    }
    return result;
  }, [level, isActive]);

  return (
    <div className="flex flex-col items-center space-y-1 w-20">
      <div className="relative h-60 w-6 bg-gray-200 dark:bg-gray-800 rounded overflow-hidden flex flex-col-reverse">
        {segments.map((segment) => (
          <div
            key={`segment-${segment.id}-${meterKey}`}
            className={`w-full h-3 ${
              segment.active
                ? segment.id < 13
                  ? "bg-emerald-400 dark:bg-emerald-500"
                  : segment.id < 17
                  ? "bg-amber-400 dark:bg-amber-500"
                  : "bg-red-500 dark:bg-red-600"
                : "bg-gray-300 dark:bg-gray-700"
            } transition-all duration-100 ease-out`}
            style={{
              height: `${segment.id === 0 ? "4px" : "3px"}`,
              marginBottom: "2px",
              opacity: segment.active ? 1 : 0.4,
            }}
          />
        ))}
        {isPulsing && level > 30 && (
          <div
            className={`absolute w-4 h-4 rounded-full left-1 transition-all duration-300 ease-out animate-pulse ${
              level < 65
                ? "bg-emerald-400"
                : level < 85
                ? "bg-amber-400"
                : "bg-red-500"
            }`}
            style={{ bottom: `${Math.min(90, level * 0.9)}%` }}
          />
        )}
      </div>
      <span className="text-xs font-medium">
        {isActive ? Math.round(level) : 0}
      </span>
    </div>
  );
};

export default AudioLevelMeter;
