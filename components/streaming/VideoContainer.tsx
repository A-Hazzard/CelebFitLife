"use client";

import React, { useEffect } from "react";
import { VideoContainerProps } from "@/lib/types/streaming-components";
import { clearVideoContainer } from "@/lib/utils/twilio";

export const VideoContainer = ({
  containerRef,
  room,
  isActive,
}: VideoContainerProps) => {
  // Clean up video container when component unmounts or room changes
  useEffect(() => {
    // Store the current value of the ref to use in cleanup
    const currentContainer = containerRef.current;

    if (!isActive && currentContainer) {
      clearVideoContainer(currentContainer);
    }

    return () => {
      if (currentContainer) {
        clearVideoContainer(currentContainer);
      }
    };
  }, [containerRef, room, isActive]);

  return (
    <div
      ref={containerRef}
      className={`w-full h-full bg-black ${
        isActive ? "opacity-100" : "opacity-0"
      } transition-opacity duration-300`}
      style={{
        aspectRatio: "16/9",
      }}
    />
  );
};

export default VideoContainer;
