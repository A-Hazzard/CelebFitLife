import React, { useEffect, useState } from "react";

interface AudioLevelMeterProps {
  level: number; // 0-100
  isActive: boolean;
  type: "microphone" | "speaker";
  className?: string;
}

const AudioLevelMeter: React.FC<AudioLevelMeterProps> = ({
  level,
  isActive = false,
  // We're keeping type for API consistency with other audio components
  type = "microphone",
  className = "",
}) => {
  const [isPulsing, setIsPulsing] = useState(false);

  // Add pulsing effect when level changes significantly
  useEffect(() => {
    if (level > 30) {
      setIsPulsing(true);
      const timer = setTimeout(() => setIsPulsing(false), 300);
      return () => clearTimeout(timer);
    }
    return () => {}; // Return empty cleanup function for when level <= 30
  }, [level]);

  // Create an array of segments for the level meter
  const segments = Array.from({ length: 16 }, (_, i) => {
    const segmentThreshold = (i + 1) * (100 / 16);
    const isActiveSegment = level >= segmentThreshold;

    // Determine color based on segment position and type
    let color = "bg-green-500";
    if (i >= 11) color = "bg-red-500";
    else if (i >= 6) color = "bg-yellow-500";

    return { isActive: isActiveSegment, color };
  });

  // Apply type-specific class name for styling differences between mic and speaker
  const typeClass = type === "microphone" ? "meter-mic" : "meter-speaker";

  return (
    <div className={`relative w-full ${typeClass} ${className}`}>
      {/* Level meter container */}
      <div
        className={`flex h-8 gap-0.5 items-center ${
          isPulsing ? "scale-105 transition-transform duration-300" : ""
        }`}
      >
        {segments.map((segment, index) => (
          <div
            key={index}
            className={`h-full flex-1 rounded-sm transition-all duration-75 ${
              isActive && segment.isActive
                ? `${segment.color} ${
                    isPulsing && index > 10 ? "animate-pulse" : ""
                  }`
                : "bg-gray-700"
            }`}
            style={{
              height: `${Math.max(30, 60 + index * 2)}%`,
              opacity: isActive ? 1 : 0.6,
              transform:
                isActive && segment.isActive ? "scaleY(1.05)" : "scaleY(1)",
              transition:
                "transform 100ms, opacity 100ms, background-color 100ms",
            }}
          />
        ))}
      </div>

      {/* Text indicator */}
      {isActive && (
        <div className="absolute top-0 right-0 text-xs font-medium text-white bg-black/50 px-2 py-0.5 rounded">
          {Math.round(level)}%
        </div>
      )}

      {/* Animated pulse dot when active */}
      {isActive && level > 5 && (
        <div className="absolute -right-2 -top-2">
          <div
            className={`w-2 h-2 rounded-full ${
              level > 30 ? "bg-green-500" : "bg-gray-500"
            } ${level > 5 ? "animate-ping" : ""}`}
          ></div>
        </div>
      )}
    </div>
  );
};

export default AudioLevelMeter;
