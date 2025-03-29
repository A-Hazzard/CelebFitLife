"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import StreamManager from "@/components/streaming/StreamManager";
import StreamChat from "@/components/streaming/StreamChat";
import DeviceTester from "@/components/streaming/DeviceTester";
import { Button } from "@/components/ui/button";
import { Stream, getStreamBySlug } from "@/lib/services/StreamService";

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
    return <div className="p-8 text-center">Loading stream details...</div>;
  }

  if (!stream) {
    return <div className="p-8 text-center">Stream not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{`Managing: ${stream.title}`}</h1>
      </div>

      <div className="flex flex-col md:flex-row gap-4 h-[calc(100vh-200px)]">
        <div className="flex-1 flex flex-col">
          {/* Device Tester Button */}
          {!showDeviceTester && !hasCompletedTest && (
            <div className="mb-4">
              <Button
                variant="outline"
                onClick={() => setShowDeviceTester(true)}
                className="w-full"
              >
                Test your mic, camera and speakers
              </Button>
            </div>
          )}

          {/* Show Device Tester or Stream Manager */}
          {showDeviceTester ? (
            <DeviceTester
              onComplete={() => {
                setShowDeviceTester(false);
                setHasCompletedTest(true);
              }}
              className="mb-4 min-h-[300px]"
            />
          ) : (
            <StreamManager stream={stream} className="flex-1" />
          )}
        </div>

        {/* Chat Panel */}
        <div className="w-full md:w-96 h-full">
          <StreamChat slug={stream.slug} className="h-full" />
        </div>
      </div>
    </div>
  );
}
