"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuthStore } from "@/lib/store/useAuthStore";
import VideoContainer from "@/components/streaming/VideoContainer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StreamData } from "@/lib/types/streaming.types";

export default function LiveViewPage() {
  const pathname = usePathname();
  const slug = pathname?.split("/").pop() || "";
  const { currentUser } = useAuthStore();
  const [hasHydrated, setHasHydrated] = useState(false);

  // Simple hydration check
  useEffect(() => {
    setHasHydrated(true);
  }, []);

  // State management
  const [streamData, setStreamData] = useState<StreamData | null>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [showLockModal, setShowLockModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch stream data and check authorization
  useEffect(() => {
    if (!slug || !currentUser) return;

    const fetchStreamData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get stream data from Firestore
        const streamRef = doc(db, "streams", slug);
        const streamDoc = await getDoc(streamRef);

        if (!streamDoc.exists()) {
          setIsAuthorized(false);
          setShowLockModal(true);
          return;
        }

        const data = streamDoc.data() as StreamData;
        setStreamData(data);

        // Any authenticated user can view streams
        setIsAuthorized(true);

        console.log("Stream data loaded:", {
          id: data.id,
          title: data.title,
          isLive: data.isLive,
          muxPlaybackId: data.muxPlaybackId,
          muxStatus: data.muxStatus,
        });
      } catch (error) {
        console.error("Error fetching stream data:", error);
        setError("Failed to load stream data");
        setIsAuthorized(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStreamData();
  }, [slug, currentUser]);

  // Handle stream errors
  const handleStreamError = (error: unknown) => {
    console.error("Stream playback error:", error);
    setError((error as Error)?.message || "Stream playback error occurred");
  };

  // Show loading state while hydrating or loading data
  if (!hasHydrated || isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading stream...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <h2 className="text-xl mb-4">Error Loading Stream</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="bg-white text-black"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Show unauthorized modal
  if (isAuthorized === false) {
    return (
      <Dialog open={showLockModal} onOpenChange={setShowLockModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Stream Not Found</DialogTitle>
            <DialogDescription>
              The stream you&apos;re trying to access doesn&apos;t exist or has
              been removed.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => window.history.back()}>
              Go Back
            </Button>
            <Button
              onClick={() => (window.location.href = "/dashboard")}
              className="bg-brandOrange hover:bg-brandOrange/90"
            >
              Go to Dashboard
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Show stream not live message if stream hasn't started, has ended, or no playback ID available
  if (
    streamData &&
    ((!streamData.hasStarted && !streamData.isLive) ||
      streamData.hasEnded ||
      !streamData.muxPlaybackId)
  ) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <h2 className="text-2xl mb-4">{streamData.title}</h2>
          <p className="text-gray-400 mb-4">
            {streamData.hasEnded
              ? "This stream has ended"
              : "This stream is not currently live"}
          </p>
          <p className="text-sm text-gray-500">
            Check back later or follow the streamer for updates
          </p>
          {/* Debug info for development */}
          {process.env.NODE_ENV === "development" && (
            <div className="mt-4 text-xs text-gray-600 bg-gray-800 p-2 rounded">
              Debug: hasStarted={String(streamData.hasStarted)}, hasEnded=
              {String(streamData.hasEnded)}, isLive={String(streamData.isLive)},
              muxPlaybackId={streamData.muxPlaybackId || "none"}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render the stream
  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8">
        {/* Stream Title */}
        {streamData && (
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-white mb-2">
              {streamData.title}
            </h1>
            {streamData.description && (
              <p className="text-gray-400">{streamData.description}</p>
            )}
            <div className="flex items-center space-x-4 mt-2 text-sm">
              <span className="text-gray-500">
                Streamer: {streamData.streamerName || "Unknown"}
              </span>
              {streamData.hasStarted && !streamData.hasEnded && (
                <span className="flex items-center space-x-1 text-red-500">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span>LIVE</span>
                </span>
              )}
              {streamData.viewerCount !== undefined && (
                <span className="text-gray-500">
                  {streamData.viewerCount} viewers
                </span>
              )}
            </div>
          </div>
        )}

        {/* Video Container */}
        <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
          {streamData?.muxPlaybackId ? (
            <VideoContainer
              playbackId={streamData.muxPlaybackId}
              isLive={streamData.isLive || streamData.hasStarted}
              autoplay={true}
              muted={false}
              accentColor="#FF3E00"
              onError={handleStreamError}
              className="w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white">
              <div className="text-center">
                <h3 className="text-xl mb-2">Stream Unavailable</h3>
                <p className="text-gray-400">
                  {streamData?.hasStarted
                    ? "Waiting for stream to become available..."
                    : "The stream is not currently available for viewing"}
                </p>
                {/* Debug info for development */}
                {process.env.NODE_ENV === "development" && streamData && (
                  <div className="mt-4 text-xs text-gray-600 bg-gray-800 p-2 rounded">
                    Debug: hasStarted={String(streamData.hasStarted)}, isLive=
                    {String(streamData.isLive)}, muxPlaybackId=
                    {streamData.muxPlaybackId || "none"}, muxStatus=
                    {streamData.muxStatus || "unknown"}
                    {/* Add debug controls for stream management */}
                    <div className="mt-2 space-y-2">
                      <div className="text-yellow-400">
                        Stream Status: {streamData.muxStatus || "unknown"}
                      </div>
                      {streamData.muxStreamId && (
                        <div className="space-x-2">
                          <button
                            onClick={async () => {
                              try {
                                const response = await fetch(
                                  `/api/mux/streams/enable?streamId=${streamData.muxStreamId}`,
                                  {
                                    method: "POST",
                                  }
                                );
                                const result = await response.json();
                                console.log("Enable stream result:", result);
                                alert(
                                  `Enable stream: ${
                                    result.success ? "Success" : result.error
                                  }`
                                );
                              } catch (error) {
                                console.error("Error enabling stream:", error);
                                alert("Error enabling stream");
                              }
                            }}
                            className="px-2 py-1 bg-blue-600 text-white rounded text-xs"
                          >
                            Enable Stream
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                const response = await fetch(
                                  `/api/mux/streams?streamId=${streamData.muxStreamId}`
                                );
                                const result = await response.json();
                                console.log("Stream status:", result);
                                alert(
                                  `Stream status: ${
                                    result.liveStream?.status || "unknown"
                                  }`
                                );
                              } catch (error) {
                                console.error("Error checking stream:", error);
                                alert("Error checking stream");
                              }
                            }}
                            className="px-2 py-1 bg-green-600 text-white rounded text-xs"
                          >
                            Check Status
                          </button>
                          {streamData.muxStreamKey && (
                            <button
                              onClick={async () => {
                                try {
                                  const response = await fetch(
                                    `/api/streaming/rtmp-bridge?streamKey=${streamData.muxStreamKey}`
                                  );
                                  const result = await response.json();
                                  console.log("RTMP bridge status:", result);
                                  alert(
                                    `RTMP bridge active: ${
                                      result.isActive ? "Yes" : "No"
                                    }`
                                  );
                                } catch (error) {
                                  console.error(
                                    "Error checking RTMP bridge:",
                                    error
                                  );
                                  alert("Error checking RTMP bridge");
                                }
                              }}
                              className="px-2 py-1 bg-purple-600 text-white rounded text-xs"
                            >
                              Check RTMP
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Stream Information */}
        {streamData && (
          <div className="mt-6 bg-gray-900 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Stream Information
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Status:</span>
                <span className="ml-2 text-white">
                  {streamData.hasStarted && !streamData.hasEnded
                    ? "Live"
                    : streamData.hasEnded
                    ? "Ended"
                    : "Offline"}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Category:</span>
                <span className="ml-2 text-white">
                  {streamData.category || "Fitness"}
                </span>
              </div>
              {streamData.tags && streamData.tags.length > 0 && (
                <div className="col-span-2">
                  <span className="text-gray-400">Tags:</span>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {streamData.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-800 text-white rounded-full text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
