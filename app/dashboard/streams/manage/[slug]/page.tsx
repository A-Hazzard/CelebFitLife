"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import StreamManager from "@/components/streaming/StreamManager";
import StreamChat from "@/components/streaming/StreamChat";
import DeviceTester from "@/components/streaming/DeviceTester";
import { Button } from "@/components/ui/button";
import { Stream, getStreamBySlug } from "@/lib/services/StreamService";
import { Settings } from "lucide-react";

export default function ManageStreamPage() {
  const pathname = usePathname();
  const slug = pathname?.split("/").pop() || "";

  const [stream, setStream] = useState<Stream | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeviceTester, setShowDeviceTester] = useState(false);
  const [hasCompletedTest, setHasCompletedTest] = useState(false);

  useEffect(() => {
    const fetchStream = async () => {
      try {
        const streamData = await getStreamBySlug(slug);
        if (streamData) {
          setStream(streamData);
        }
      } catch (error) {
        console.error("Error fetching stream:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStream();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brandBlack">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-t-brandOrange border-gray-700"></div>
      </div>
    );
  }

  if (!stream) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brandBlack text-brandWhite">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold mb-4">Stream Not Found</h2>
          <p className="text-gray-400">
            The stream you're looking for doesn't exist or you don't have
            permission to access it.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brandBlack text-brandWhite">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold">{`Managing: ${stream.title}`}</h1>

          {!showDeviceTester && (
            <Button
              variant="outline"
              onClick={() => setShowDeviceTester(true)}
              className="flex items-center gap-2 border-gray-700 text-brandWhite hover:bg-gray-800"
            >
              <Settings size={16} />
              {hasCompletedTest ? "Test Devices Again" : "Test Your Devices"}
            </Button>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-4 h-[calc(100vh-200px)]">
          <div className="flex-1 flex flex-col">
            {/* Show Device Tester or Stream Manager */}
            {showDeviceTester ? (
              <DeviceTester
                onComplete={() => {
                  setShowDeviceTester(false);
                  setHasCompletedTest(true);
                }}
                className="min-h-[400px]"
              />
            ) : (
              <StreamManager stream={stream} className="flex-1" />
            )}
          </div>

          {/* Chat Panel */}
          <div className="w-full md:w-96 h-full">
            <StreamChat streamId={stream.id} className="h-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
