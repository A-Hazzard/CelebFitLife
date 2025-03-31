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
import { Settings, RefreshCw } from "lucide-react";
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
    <div className="min-h-screen bg-brandBlack text-brandWhite">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">{`Managing: ${
              stream.title || "Untitled Stream"
            }`}</h1>
          </div>

          {!showDeviceTester && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex items-center gap-2 bg-brandGray text-brandBlack hover:bg-gray-300"
                onClick={() => setShowDeviceTester(true)}
              >
                <Settings size={16} />
                Device Settings
              </Button>

              {!stream.status || stream.status !== "live" ? (
                <Button
                  className="bg-brandOrange hover:bg-brandOrange/90 text-brandBlack"
                  onClick={handleStartStream}
                >
                  Start Streaming
                </Button>
              ) : null}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-gray-900 rounded-lg overflow-hidden">
            <div className="h-full relative">
              {showDeviceTester ? (
                <DeviceTester
                  onComplete={handleDeviceTestComplete}
                  className="min-h-[400px]"
                />
              ) : (
                <StreamManager
                  ref={streamManagerRef}
                  stream={stream as Stream}
                  className="flex-1"
                />
              )}

              {/* Connection error overlay */}
              {connectionError && (
                <div className="absolute inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center">
                  <div className="text-red-500 text-xl mb-4">
                    {connectionError}
                  </div>
                  <Button
                    onClick={handleRetryConnection}
                    className="flex items-center gap-2 bg-brandOrange hover:bg-brandOrange/90 text-brandBlack"
                    disabled={isRetrying}
                  >
                    {isRetrying ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        Retrying...
                      </>
                    ) : (
                      <>
                        <RefreshCw size={16} />
                        Retry Connection
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
          <div className="bg-gray-900 rounded-lg overflow-hidden">
            <StreamChat streamId={slug} className="h-[600px]" />
          </div>
        </div>
      </div>
    </div>
  );
}
