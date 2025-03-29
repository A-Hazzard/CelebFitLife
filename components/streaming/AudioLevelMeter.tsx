import React from "react";

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
  // Create an array of segments for the level meter
  const segments = Array.from({ length: 16 }, (_, i) => {
    const segmentThreshold = (i + 1) * (100 / 16);
    const isActive = level >= segmentThreshold;

    // Determine color based on segment position and type
    let color = "bg-green-500";
    if (i >= 11) color = "bg-red-500";
    else if (i >= 6) color = "bg-yellow-500";

    return { isActive, color };
  });

  // Apply type-specific class name for styling differences between mic and speaker
  const typeClass = type === "microphone" ? "meter-mic" : "meter-speaker";

  return (
    <div className={`relative w-full ${typeClass} ${className}`}>
      {/* Level meter container */}
      <div className="flex h-6 gap-1 items-center">
        {segments.map((segment, index) => (
          <div
            key={index}
            className={`h-full flex-1 rounded-sm transition-all duration-75 ${
              isActive && segment.isActive ? segment.color : "bg-gray-700"
            }`}
            style={{
              height: `${Math.max(30, 60 + index * 2)}%`,
            }}
          />
        ))}
      </div>

      {/* Text indicator */}
      {isActive && (
        <div className="absolute top-0 right-0 text-xs font-medium text-white bg-black/40 px-2 py-0.5 rounded">
          {level}%
        </div>
      )}
    </div>
  );
};

export default AudioLevelMeter;
