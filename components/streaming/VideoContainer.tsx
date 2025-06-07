"use client";

import React from "react";
import MuxPlayer from "@mux/mux-player-react";
import { VideoContainerProps } from "@/lib/types/streaming.types";

const VideoContainer: React.FC<Omit<VideoContainerProps, "controls">> = ({
  playbackId,
  isLive = false,
  autoplay = true,
  muted = false,
  accentColor = "#FF3E00",
  onError,
  className = "",
}) => {
  const handleError = (error: unknown) => {
    console.error("Mux Player error:", error);
    onError?.({
      code: "PLAYBACK_ERROR",
      message: "Failed to load video stream",
      isRecoverable: true,
      context: { error },
    });
  };

  const handleLoadStart = () => {
    console.log("Video loading started");
  };

  const handleLoadedData = () => {
    console.log("Video data loaded");
  };

  if (!playbackId) {
    return (
      <div
        className={`w-full h-full bg-gray-900 flex items-center justify-center text-white ${className}`}
      >
        <div className="text-center">
          <div className="mb-2">No stream available</div>
          <div className="text-sm text-gray-400">
            Waiting for stream to start...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full h-full ${className}`}>
      <MuxPlayer
        playbackId={playbackId}
        streamType={isLive ? "live" : "on-demand"}
        autoPlay={autoplay}
        muted={muted}
        accentColor={accentColor}
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: "#000000",
        }}
        onError={handleError}
        onLoadStart={handleLoadStart}
        onLoadedData={handleLoadedData}
        metadata={{
          video_title: isLive ? "Live Stream" : "Video",
          viewer_user_id: "anonymous",
        }}
      />
    </div>
  );
};

export default VideoContainer;
