"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";
import Image from "next/image";

export const StreamStatusOverlay = ({
  status,
  error,
  isRetrying,
  onRetry,
  connectionAttempts = 0,
  maxConnectionAttempts = 5,
  thumbnail,
  streamTitle,
}: {
  status: string;
  error?: string;
  isRetrying: boolean;
  onRetry?: () => void;
  connectionAttempts?: number;
  maxConnectionAttempts?: number;
  thumbnail?: string;
  streamTitle?: string;
}) => {
  const getStatusMessage = (): {
    title: string;
    subtitle: string;
    actionText?: string;
  } => {
    switch (status) {
      case "waiting":
        return {
          title: "Stream hasn't started yet",
          subtitle: "The stream will begin soon. Please wait.",
        };
      case "connecting":
        return {
          title: "Connecting to stream",
          subtitle: "Please wait while we connect you...",
        };
      case "error":
        let actionText: string | undefined;

        if (error) {
          if (error.includes("token") || error.includes("refresh")) {
            actionText = "Refresh Page";
          } else if (error.includes("network") || error.includes("internet")) {
            actionText = "Check Connection";
          } else if (error.includes("ended") || error.includes("offline")) {
          } else {
            actionText = "Try Again";
          }
        }

        return {
          title: "Connection error",
          subtitle: error || "Failed to connect to the stream",
          actionText,
        };
      case "ended":
        return {
          title: "Stream has ended",
          subtitle: "Thank you for watching! The stream is no longer active.",
        };
      case "offline":
        return {
          title: "Stream is offline",
          subtitle: "The streamer is currently offline.",
        };
      default:
        return {
          title: "",
          subtitle: "",
        };
    }
  };

  if (status === "active") return null;

  const { title, subtitle, actionText } = getStatusMessage();

  const handleAction = () => {
    if (error?.includes("token") || error?.includes("refresh")) {
      window.location.reload();
    } else if (onRetry) {
      onRetry();
    }
  };

  return (
    <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center p-4 text-center z-10">
      {thumbnail && status !== "connecting" && (
        <div className="relative w-full max-w-md h-48 mb-6 rounded-lg overflow-hidden">
          <Image
            src={thumbnail}
            alt={streamTitle || "Stream thumbnail"}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      <div className="flex flex-col items-center space-y-4 max-w-md">
        {status === "error" && (
          <div className="w-12 h-12 rounded-full bg-red-600/20 flex items-center justify-center mb-2">
            <AlertCircle className="h-6 w-6 text-red-500" />
          </div>
        )}

        {status === "connecting" && (
          <div className="w-12 h-12 flex items-center justify-center mb-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
          </div>
        )}

        <h2 className="text-xl font-semibold text-white">{title}</h2>
        <p className="text-gray-300">{subtitle}</p>

        {streamTitle && status !== "connecting" && (
          <h3 className="text-lg font-medium text-white mt-2">{streamTitle}</h3>
        )}

        {status === "error" && (
          <div className="mt-4">
            {onRetry && (
              <Button
                onClick={handleAction}
                disabled={
                  isRetrying ||
                  connectionAttempts >= (maxConnectionAttempts || 5)
                }
                className="bg-primary hover:bg-primary/90 text-white"
              >
                {isRetrying ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  actionText || "Try Again"
                )}
              </Button>
            )}
            {connectionAttempts > 0 && maxConnectionAttempts && (
              <p className="text-sm text-gray-400 mt-2">
                Attempt {connectionAttempts} of {maxConnectionAttempts}
              </p>
            )}

            {connectionAttempts >= (maxConnectionAttempts || 5) && (
              <Button
                onClick={() => window.location.reload()}
                className="mt-2 bg-gray-700 hover:bg-gray-600 text-white"
              >
                Refresh Page
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StreamStatusOverlay;
