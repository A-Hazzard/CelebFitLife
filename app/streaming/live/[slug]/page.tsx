"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase/client";
import { doc, getDoc } from "firebase/firestore";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

export default function LiveViewPage() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const slug = pathname?.split("/").pop() || "";
  const { currentUser } = useAuthStore();

  // Preview mode state
  const isPreview = searchParams.get("preview") === "true";
  const initialCountdown = parseInt(searchParams.get("countdown") || "0", 10);
  const [previewCountdown, setPreviewCountdown] = useState(initialCountdown);
  const [previewInterval, setPreviewInterval] = useState<NodeJS.Timeout | null>(
    null
  );

  // Start preview countdown if in preview mode
  useEffect(() => {
    if (isPreview && previewCountdown > 0) {
      const interval = setInterval(() => {
        setPreviewCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            // Redirect back to streaming page when preview ends
            router.push("/streaming");
            return 0;
          }
          // Update countdown in URL to persist across page refreshes
          const newParams = new URLSearchParams(searchParams);
          newParams.set("countdown", (prev - 1).toString());
          router.replace(`${pathname}?${newParams.toString()}`, {
            scroll: false,
          });
          return prev - 1;
        });
      }, 1000);
      setPreviewInterval(interval);

      return () => {
        if (interval) clearInterval(interval);
      };
    }
    // Always return a cleanup function
    return () => {};
  }, [isPreview, pathname, router, searchParams, previewCountdown]);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (previewInterval) clearInterval(previewInterval);
    };
  }, [previewInterval]);

  // Stream state
  const [hasStarted, setHasStarted] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);
  const [videoStatus, setVideoStatus] = useState<
    "waiting" | "connecting" | "active" | "offline" | "ended" | "error"
  >("waiting");
  const [hasHydrated, setHasHydrated] = useState(false);
  const [streamTitle, setStreamTitle] = useState("");
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Video container reference
  const videoContainerRef = useRef<HTMLDivElement>(null);

  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [showLockModal, setShowLockModal] = useState(false);

  // Load the stream and check authorization
  useEffect(() => {
    if (!slug || !currentUser) return;

    const loadStream = async () => {
      try {
        const streamRef = doc(db, "streams", slug);
        const streamDoc = await getDoc(streamRef);

        if (!streamDoc.exists()) {
          setIsAuthorized(false);
          setShowLockModal(true);
          setVideoStatus("offline");
          return;
        }

        const streamData = streamDoc.data();
        // Update UI based on stream data
        setStreamTitle(streamData.title || "Live Stream");
        setHasStarted(streamData.hasStarted || false);
        setHasEnded(streamData.hasEnded || false);

        if (streamData.hasStarted && !streamData.hasEnded) {
          setVideoStatus("active");
        } else if (streamData.hasEnded) {
          setVideoStatus("ended");
        } else {
          setVideoStatus("offline");
        }

        // Check authorization
        const streamerId = streamData.streamerId;
        if (
          currentUser.myStreamers &&
          Array.isArray(currentUser.myStreamers) &&
          currentUser.myStreamers.includes(streamerId)
        ) {
          setIsAuthorized(true);
        } else {
          setIsAuthorized(false);
          setShowLockModal(true);
        }
      } catch (error) {
        console.error("Error loading stream:", error);
        setConnectionError("Failed to load stream data");
        setVideoStatus("error");
      }
    };

    loadStream();
  }, [slug, currentUser]);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  if (!hasHydrated || !currentUser) return null;
  if (isAuthorized === false) {
    return (
      <Dialog open={showLockModal} onOpenChange={setShowLockModal}>
        <DialogContent className="max-w-lg p-10 rounded-2xl border-2 border-brandOrange bg-brandBlack">
          <DialogHeader>
            <div className="flex flex-col items-center gap-4">
              <span className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brandOrange/10 mb-2">
                <Lock className="w-10 h-10 text-brandOrange" />
              </span>
              <DialogTitle className="text-2xl text-center text-brandOrange font-extrabold">
                Access Denied
              </DialogTitle>
              <DialogDescription className="text-base text-center text-brandGray mt-2">
                You do not have access to this stream. Only users who own this
                streamer can view this stream.
                <br />
                Please add this streamer to your account to unlock access.
              </DialogDescription>
            </div>
          </DialogHeader>
          <div className="my-6 border-t border-brandOrange/20" />
          <DialogFooter className="flex flex-row gap-4 justify-center">
            <DialogClose asChild>
              <Button
                variant="default"
                className="bg-brandOrange text-brandBlack font-bold px-6 py-3 rounded-full text-lg shadow-md hover:scale-105 transition-transform"
                onClick={() => setShowLockModal(false)}
              >
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-4">
      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-bold mb-2 truncate">
          {streamTitle || "Live Stream"}
        </h1>
        <div className="mb-4">
          {hasStarted && !hasEnded ? (
            <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm">
              LIVE
            </span>
          ) : hasEnded ? (
            <span className="bg-gray-900 text-gray-400 px-3 py-1 rounded-full text-sm">
              Ended
            </span>
          ) : (
            <span className="bg-gray-700 text-gray-300 px-3 py-1 rounded-full text-sm">
              Offline
            </span>
          )}
        </div>
        <div
          className="aspect-video bg-black rounded-lg border border-gray-800 flex items-center justify-center mb-4"
          style={{ minHeight: 320 }}
          ref={videoContainerRef}
        >
          {videoStatus === "waiting" && (
            <span className="text-gray-400">Loading...</span>
          )}
          {videoStatus === "active" && (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-gray-400">Stream is live</span>
            </div>
          )}
          {videoStatus === "offline" && (
            <span className="text-gray-400">The stream is not live yet.</span>
          )}
          {videoStatus === "ended" && (
            <span className="text-gray-500">This stream has ended.</span>
          )}
          {videoStatus === "error" && (
            <span className="text-red-500">Error loading stream</span>
          )}
        </div>
        {connectionError && (
          <div className="text-red-500 mb-2">{connectionError}</div>
        )}
      </div>

      {/* Preview countdown overlay */}
      {isPreview && previewCountdown > 0 && (
        <div className="fixed top-4 right-4 z-50 bg-brandBlack border-2 border-brandOrange rounded-lg p-4 text-white">
          <p className="text-lg font-bold">Preview Time Remaining:</p>
          <p className="text-3xl text-brandOrange text-center">
            {previewCountdown}s
          </p>
        </div>
      )}
    </div>
  );
}
