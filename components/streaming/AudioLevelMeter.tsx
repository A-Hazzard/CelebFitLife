import React from "react";
import { AudioLevelMeterProps } from "@/lib/types/ui";

const getBarColor = (level: number) => {
  if (level < 30) return "bg-green-500";
  if (level < 70) return "bg-yellow-400";
  return "bg-red-500";
};

const AudioLevelMeter: React.FC<Pick<AudioLevelMeterProps, "level">> = ({
  level,
}) => {
  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="flex items-center mb-1.5">
        <div className="text-xs text-gray-400 mr-2 w-8 text-right">0</div>
        <div className="h-2.5 flex-grow rounded-full bg-gray-700/40 relative overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-150 ease-out ${getBarColor(
              level
            )}`}
            style={{
              width: `${Math.max(2, Math.min(100, level))}%`,
            }}
          />
          {/* Tick marks for visual reference */}
          <div className="absolute inset-0 flex justify-between pointer-events-none">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="w-px h-full bg-gray-600/30" />
            ))}
          </div>
        </div>
        <div className="text-xs text-gray-400 ml-2 w-16">
          <span
            className={`font-medium ${
              level > 70
                ? "text-red-400"
                : level > 30
                ? "text-yellow-400"
                : "text-green-400"
            }`}
          >
            {Math.round(level)}
          </span>
          <span className="text-gray-500"> / 100</span>
        </div>
      </div>
    </div>
  );
};

export default AudioLevelMeter;
