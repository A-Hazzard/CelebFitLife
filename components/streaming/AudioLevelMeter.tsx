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
  type = "microphone",
  className = "",
}) => {
  // Determine color based on level
  const getColor = (level: number) => {
    if (level < 30) return "bg-green-500";
    if (level < 70) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div
      className={`relative w-full h-6 bg-gray-200 rounded-lg overflow-hidden ${className}`}
    >
      {/* Level bar */}
      <div
        className={`absolute h-full ${
          isActive ? getColor(level) : "bg-gray-400"
        } transition-all duration-100 ease-out`}
        style={{ width: `${isActive ? level : 0}%` }}
      />

      {/* Show level text only when active */}
      {isActive && (
        <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white z-10">
          {level}%
        </div>
      )}
    </div>
  );
};

export default AudioLevelMeter;
