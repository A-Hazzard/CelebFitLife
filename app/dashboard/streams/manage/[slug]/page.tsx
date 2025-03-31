"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
// Import regular Firebase client for client components
import { db } from "@/lib/config/firebase";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
// Use the client service, not direct server imports
import StreamManager from "@/components/streaming/StreamManager";
import StreamChat from "@/components/streaming/StreamChat";
import DeviceTester from "@/components/streaming/DeviceTester";
import { Button } from "@/components/ui/button";
import { Settings, RefreshCw, AlertCircle, Mic, VideoOff } from "lucide-react";
// Import Stream type from the models
import { Stream } from "@/lib/models/Stream";
import { toast } from "sonner";

export default function ManageStreamPage() {
  const pathname = usePathname();
  const slug = pathname?.split("/").pop() || "";

  const [stream, setStream] = useState<Partial<Stream> | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeviceTester, setShowDeviceTester] = useState(false);
  const [shouldStartStreamAfterTest, setShouldStartStreamAfterTest] =
    useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const streamManagerRef = useRef<{ startStream: () => Promise<void> } | null>(
    null
  );

  // Function to fetch stream data wrapped in useCallback
  const fetchStream = useCallback(async () => {
    try {
      setLoading(true);
      const streamDoc = await getDoc(doc(db, "streams", slug));

      if (!streamDoc.exists()) {
        setError("Stream not found");
        setStream(null);
      } else {
        setStream({
          id: streamDoc.id,
          ...streamDoc.data(),
        } as Stream);
      }
    } catch (err) {
      console.error("Error fetching stream:", err);
      setError("Error fetching stream details");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    // Fetch the stream data from Firestore client-side
    fetchStream();

    // Return undefined to satisfy TypeScript return type requirement
    return undefined;
  }, [fetchStream]);

  const handleStartStream = () => {
    // If device tester hasn't been shown yet, show it first and flag to start streaming after
    if (!localStorage.getItem("deviceSettings")) {
      setShowDeviceTester(true);
      setShouldStartStreamAfterTest(true);
      return;
    }

    // Otherwise, start stream directly
    startStream();
  };

  const startStream = async () => {
    try {
      if (!stream?.id) return;

      const streamDocRef = doc(db, "streams", stream.id);
      await updateDoc(streamDocRef, {
        hasStarted: true,
        hasEnded: false,
        startedAt: serverTimestamp(), // Use serverTimestamp instead of local date
        lastUpdated: serverTimestamp(),
        audioMuted: false,
        cameraOff: false,
      });

      // Call the internal startStream method of StreamManager
      if (typeof streamManagerRef.current?.startStream === "function") {
        await streamManagerRef.current.startStream();
      }

      setStream((prev) => (prev ? { ...prev, hasStarted: true } : null));
      toast.success("Stream started successfully!");
      setConnectionError(null); // Reset any connection errors
    } catch (error) {
      console.error("Error starting stream:", error);
      toast.error("Failed to start the stream. Please try again.");
      setConnectionError("Failed to start stream. Please retry.");
    }
  };

  const handleRetryConnection = async () => {
    setIsRetrying(true);
    try {
      // Call startStream again, which will try to reconnect without refreshing the page
      await startStream();
      setConnectionError(null);
    } catch (error) {
      console.error("Error retrying connection:", error);
      setConnectionError("Connection attempt failed. Please try again.");
    } finally {
      setIsRetrying(false);
    }
  };

  const handleDeviceTestComplete = () => {
    setShowDeviceTester(false);

    // If we should start streaming after device test
    if (shouldStartStreamAfterTest) {
      setShouldStartStreamAfterTest(false);
      startStream();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brandBlack text-brandWhite">
        <div className="text-center">
          <div className="spinner mb-4"></div>
          <p>Loading stream details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brandBlack text-brandWhite">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold mb-4">{error}</h2>
          <p className="text-gray-400">
            The stream you&apos;re looking for doesn&apos;t exist or you
            don&apos;t have permission to access it.
          </p>
        </div>
      </div>
    );
  }

  if (!stream) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brandBlack text-brandWhite">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold mb-4">Stream Not Found</h2>
          <p className="text-gray-400">
            The stream you&apos;re looking for doesn&apos;t exist or you
            don&apos;t have permission to access it.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-brandBlack text-brandWhite overflow-hidden">
      {/* Left sidebar for navigation/avatar placeholders */}
      <div className="w-16 bg-gray-900 flex flex-col items-center py-4 border-r border-gray-800">
        {/* Avatar placeholders */}
        {[1, 2, 3, 4, 5, 6, 7].map((index) => (
          <div
            key={index}
            className="w-10 h-10 rounded-full bg-gray-800 mb-4 flex items-center justify-center overflow-hidden"
          >
            {index === 1 && (
              <div className="w-2 h-2 rounded-full bg-green-500 absolute top-0 right-0"></div>
            )}
          </div>
        ))}
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header with stream title and controls */}
        <div className="bg-gray-900 border-b border-gray-800 p-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">
              {stream.title || "Untitled Stream"}
            </h1>
            <div className="text-sm text-gray-400 mt-1">
              Manage your live stream settings and interact with viewers
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!showDeviceTester && (
              <>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 border-gray-700 bg-transparent hover:bg-gray-800 text-gray-300"
                  onClick={() => setShowDeviceTester(true)}
                >
                  <Settings size={16} />
                  <span className="hidden sm:inline">Device Settings</span>
                </Button>

                {!stream.hasStarted ? (
                  <Button
                    className="bg-brandOrange hover:bg-brandOrange/90 text-brandBlack"
                    onClick={handleStartStream}
                  >
                    <span className="hidden sm:inline">Start Streaming</span>
                    <span className="sm:hidden">Go Live</span>
                  </Button>
                ) : null}
              </>
            )}
          </div>
        </div>

        {/* Main content grid */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 overflow-auto">
          {/* Stream manager panel */}
          <div className="lg:col-span-2 flex flex-col">
            {/* Stream preview and controls */}
            <div className="bg-gray-900 rounded-lg overflow-hidden shadow-lg flex-1 relative">
              {showDeviceTester ? (
                <DeviceTester
                  onComplete={handleDeviceTestComplete}
                  className="h-full min-h-[400px]"
                />
              ) : (
                <StreamManager
                  ref={streamManagerRef}
                  stream={stream as Stream}
                  className="h-full"
                />
              )}

              {/* Connection error overlay */}
              {connectionError && (
                <div className="absolute inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center z-10">
                  <div className="w-16 h-16 rounded-full bg-gray-800 mb-6 mx-auto flex items-center justify-center">
                    <AlertCircle size={32} className="text-red-500" />
                  </div>
                  <div className="text-xl font-bold mb-4 text-red-500">
                    Connection Error
                  </div>
                  <p className="text-gray-300 mb-6 max-w-md text-center">
                    {connectionError}
                  </p>
                  <Button
                    onClick={handleRetryConnection}
                    className="bg-brandOrange hover:bg-brandOrange/90 text-brandBlack"
                    disabled={isRetrying}
                  >
                    {isRetrying ? (
                      <>
                        <RefreshCw size={16} className="animate-spin mr-2" />
                        Retrying...
                      </>
                    ) : (
                      <>
                        <RefreshCw size={16} className="mr-2" />
                        Retry Connection
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>

            {/* Stream stats and additional controls could go here */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="bg-gray-900 rounded-lg p-4 shadow-md flex flex-col items-center justify-center">
                <div className="text-3xl font-bold text-brandOrange mb-1">
                  0
                </div>
                <div className="text-sm text-gray-400">Viewers</div>
              </div>
              <div className="bg-gray-900 rounded-lg p-4 shadow-md flex flex-col items-center justify-center">
                <div className="text-3xl font-bold text-brandOrange mb-1">
                  0
                </div>
                <div className="text-sm text-gray-400">Likes</div>
              </div>
              <div className="bg-gray-900 rounded-lg p-4 shadow-md flex flex-col items-center justify-center">
                <div className="text-3xl font-bold text-brandOrange mb-1">
                  0
                </div>
                <div className="text-sm text-gray-400">Comments</div>
              </div>
            </div>
          </div>

          {/* Chat panel */}
          <div className="bg-gray-900 rounded-lg overflow-hidden shadow-lg flex flex-col">
            <div className="p-4 border-b border-gray-800">
              <h2 className="text-lg font-bold flex items-center">
                <span>Live Chat</span>
                <span className="ml-2 px-2 py-0.5 bg-brandOrange text-brandBlack text-xs rounded-full">
                  LIVE
                </span>
              </h2>
            </div>
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="flex-1 overflow-y-auto">
                <StreamChat streamId={slug} className="h-full min-h-[400px]" />
              </div>

              {/* Chat input */}
              <div className="p-4 border-t border-gray-800">
                <div className="relative">
                  <div className="flex items-center space-x-2 absolute bottom-3 left-3">
                    <button className="text-brandOrange">
                      <Mic size={20} />
                    </button>
                    <button className="text-brandOrange">
                      <VideoOff size={20} />
                    </button>
                    <button className="text-brandOrange">😊</button>
                  </div>
                  <input
                    type="text"
                    placeholder="Send a message..."
                    className="w-full bg-gray-800 text-white border-0 rounded-lg p-3 pl-28 focus:ring-brandOrange focus:ring-1 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
