import React, { useState, useEffect } from "react";
import { AudioLevelMeterProps } from "@/lib/types/ui";

const AudioLevelMeter: React.FC<AudioLevelMeterProps> = ({
  level,
  isActive = false,
  // We're keeping type for API consistency with other audio components
  type = "microphone",
}) => {
  // Add a key to force re-rendering when values change significantly
  const [meterKey, setMeterKey] = useState<number>(0);

  // Add state for pulse effect
  const [shouldPulse, setShouldPulse] = useState<boolean>(false);

  // Create a pulse effect when level is high
  useEffect(() => {
    if (level > 30) {
      setShouldPulse(true);
      // Reset after animation
      const timer = setTimeout(() => setShouldPulse(false), 500);
      return () => clearTimeout(timer);
    }
    return undefined; // Return undefined for paths where we don't have cleanup
  }, [level]);

  // Force re-render when isActive changes
  useEffect(() => {
    setMeterKey((prev) => prev + 1);
  }, [isActive]);

  // Force re-render when level changes significantly
  useEffect(() => {
    // Only re-render when level changes significantly to avoid excessive updates
    const threshold = 20;
    const currentKey = Math.floor(level / threshold);
    if (currentKey !== Math.floor(meterKey)) {
      setMeterKey(currentKey);
    }
  }, [level, meterKey]);

  // Total number of segments for the meter
  const totalSegments = 16;

  // Determine how many segments should be active based on level
  const getActiveSegments = () => {
    // Calculate active segments without excessive randomness
    const baseSegments = Math.max(1, Math.ceil((level / 100) * totalSegments));

    // Use a small amount of randomness only when actively testing
    const randomFactor = isActive ? Math.random() * 0.1 : 0; // Reduced from 0.15 to 0.1
    const finalSegments = Math.min(
      totalSegments,
      Math.max(1, Math.floor(baseSegments * (1 + randomFactor)))
    );

    return finalSegments;
  };

  const activeSegments = getActiveSegments();

  // Create an array of segments
  const segments = Array.from({ length: totalSegments }, (_, index) => {
    // Each segment has a position (0 to 1) that determines its color
    const position = index / totalSegments;

    // Determine if this segment should be active
    const isActiveSegment = index < activeSegments;

    // Determine segment color based on position - Match the design in screenshot
    let segmentColor = "bg-gray-800"; // Default inactive color

    if (isActiveSegment) {
      if (position < 0.625) {
        // First 10/16 segments - green (matches screenshot)
        segmentColor = "bg-green-500";
      } else if (position < 0.75) {
        // Next 2/16 segments - yellow (matches screenshot)
        segmentColor = "bg-yellow-500";
      } else {
        // Last 4/16 segments - red (matches screenshot)
        segmentColor = "bg-red-500";
      }
    }

    // Make all segments the same height to match the design
    return (
      <div
        key={`${index}-${isActiveSegment}-${meterKey}`}
        className={`h-3 rounded-sm transition-colors duration-100 ${segmentColor}`}
        style={{
          width: "100%", // All segments have the same width
          opacity: isActiveSegment ? 1 : 0.25, // Higher contrast between active/inactive
          transform:
            shouldPulse && isActiveSegment ? "scaleY(1.1)" : "scaleY(1)",
          transition:
            "transform 100ms ease-out, opacity 100ms ease-out, background-color 100ms ease-out",
        }}
      />
    );
  });

  // Render a simplified meter that looks like the design in the screenshot
  return (
    <div className="relative">
      <div className="flex items-center justify-between gap-1">{segments}</div>
      <div className="text-xs text-gray-400 flex justify-between mt-1">
        <span>Low</span>
        {type === "microphone" ? (
          <span className="font-mono">{Math.round(level)}</span>
        ) : (
          <span className="font-mono">{Math.round(level)}</span>
        )}
        <span>High</span>
      </div>
    </div>
  );
};

export default AudioLevelMeter;
