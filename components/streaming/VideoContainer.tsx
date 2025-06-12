"use client";

import React, { useState, useEffect } from "react";
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
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const handleError = (error: unknown) => {
    console.error("Mux Player error:", error);

    // Check if it's a network error or stream not ready
    const errorMessage = error instanceof Error ? error.message : String(error);
    let userMessage = "Failed to load video stream";
    let shouldRetry = false;

    if (
      errorMessage.includes("412") ||
      errorMessage.includes("Precondition Failed") ||
      errorMessage.includes("not currently active") ||
      errorMessage.includes("not ready")
    ) {
      userMessage = "Stream is starting up, please wait...";
      shouldRetry = true;
    } else if (errorMessage.includes("NetworkError")) {
      userMessage = "Network connection issue, retrying...";
      shouldRetry = true;
    } else if (errorMessage.includes("idle")) {
      userMessage =
        "Stream is idle - waiting for streamer to start broadcasting...";
      shouldRetry = true;
    }

    setError(userMessage);

    // Auto-retry for certain errors
    if (shouldRetry && retryCount < 5) {
      setIsRetrying(true);
      setTimeout(() => {
        setRetryCount((prev) => prev + 1);
        setError(null);
        setIsRetrying(false);
      }, 3000 + retryCount * 2000); // Exponential backoff
    }

    onError?.({
      code: "PLAYBACK_ERROR",
      message: userMessage,
      isRecoverable: shouldRetry,
      context: { error, playbackId, retryCount },
    });
  };

  const handleLoadStart = () => {
    console.log("Video loading started");
    setError(null);
    setRetryCount(0);
  };

  const handleLoadedData = () => {
    console.log("Video data loaded");
    setError(null);
    setRetryCount(0);
  };

  const handleRetry = () => {
    setError(null);
    setRetryCount(0);
    setIsRetrying(false);
  };

  // Reset error state when playbackId changes
  useEffect(() => {
    setError(null);
    setRetryCount(0);
    setIsRetrying(false);
  }, [playbackId]);

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

  // Show error state with retry option
  if (error && !isRetrying) {
    return (
      <div
        className={`w-full h-full bg-gray-900 flex items-center justify-center text-white ${className}`}
      >
        <div className="text-center">
          {error.includes("starting up") ? (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
              <h3 className="text-xl mb-2">Stream Starting Up</h3>
              <p className="text-gray-400 mb-4">
                The streamer has started their session. Video will appear
                shortly...
              </p>
              <p className="text-sm text-gray-500">
                This usually takes 10-30 seconds
              </p>
              {retryCount > 0 && (
                <p className="text-xs text-gray-600 mt-2">
                  Retry attempt {retryCount}/5
                </p>
              )}
            </>
          ) : (
            <>
              <div className="mb-4 text-red-500">⚠️</div>
              <div className="mb-2">{error}</div>
              <button
                onClick={handleRetry}
                className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
              >
                Retry
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full h-full ${className}`}>
      <MuxPlayer
        key={`${playbackId}-${retryCount}`} // Force re-render on retry
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
