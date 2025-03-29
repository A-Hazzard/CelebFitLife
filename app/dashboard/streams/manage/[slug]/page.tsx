"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
// Import regular Firebase client for client components
import { db } from "@/lib/config/firebase";
import { doc, getDoc } from "firebase/firestore";
// Use the client service, not direct server imports
import StreamManager from "@/components/streaming/StreamManager";
import StreamChat from "@/components/streaming/StreamChat";
import DeviceTester from "@/components/streaming/DeviceTester";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
// Import Stream type from the models
import { Stream } from "@/lib/models/Stream";

export default function ManageStreamPage() {
  const pathname = usePathname();
  const slug = pathname?.split("/").pop() || "";

  const [stream, setStream] = useState<Partial<Stream> | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeviceTester, setShowDeviceTester] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch the stream data from Firestore client-side
    const fetchStream = async () => {
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
    };

    fetchStream();
  }, [slug]);

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
          <h1 className="text-2xl font-bold">{`Managing: ${
            stream.title || "Untitled Stream"
          }`}</h1>

          {!showDeviceTester && (
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => setShowDeviceTester(true)}
            >
              <Settings size={16} />
              Device Settings
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-gray-900 rounded-lg overflow-hidden">
            <div className="h-full">
              {showDeviceTester ? (
                <DeviceTester
                  onComplete={() => {
                    setShowDeviceTester(false);
                  }}
                  className="min-h-[400px]"
                />
              ) : (
                <StreamManager stream={stream as Stream} className="flex-1" />
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
