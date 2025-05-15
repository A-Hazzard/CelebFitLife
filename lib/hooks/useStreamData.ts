import { useState, useEffect } from "react";
import { doc, onSnapshot, Unsubscribe } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Stream } from "@/lib/types/streaming.types";
import { useRouter } from "next/navigation";
import { createLogger } from "@/lib/utils/logger";

const logger = createLogger("StreamData");

/**
 * Custom hook to subscribe to Firestore updates for a specific stream document.
 * It manages the stream data state, loading status, and handles redirection
 * if the stream ends or is not found.
 *
 * @param slug - The unique slug identifier of the stream.
 * @returns An object containing the stream data, loading status, and any error encountered.
 */
export const useStreamData = (slug: string) => {
  const [streamData, setStreamData] = useState<Partial<Stream> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!slug) {
      logger.error("No slug provided to useStreamData hook");
      setLoading(false);
      setError("Slug is required to fetch stream data.");
      return;
    }

    logger.info(`Subscribing to stream data for: ${slug}`);
    setLoading(true);
    setError(null);
    const streamDocRef = doc(db, "streams", slug);

    const unsubscribe: Unsubscribe = onSnapshot(
      streamDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as Stream; // Assume it fits Stream
          logger.debug(`Received stream data update for: ${slug}`);
          setStreamData({
            ...data,
            // Provide defaults for potentially missing fields if needed
            title: data.title || "",
            thumbnailUrl:
              data.thumbnailUrl ||
              "https://1.bp.blogspot.com/-Rsu_fHvj-IA/YH0ohFqGK_I/AAAAAAAAm7o/dOKXFVif7hYDymAsCNZRe4MK3p7ihTGmgCLcBGAsYHQ/s2362/Stream.jpg",
            audioMuted: data.audioMuted ?? false,
            cameraOff: data.cameraOff ?? false,
          });

          // Handle stream ending
          if (data.hasEnded) {
            logger.info(`Stream ${slug} has ended, redirecting to dashboard`);
            // Potential TODO: Disconnect Twilio room here if not handled elsewhere
            router.push("/dashboard/streams");
          }

          setLoading(false);
        } else {
          logger.error(`Stream document not found for slug: ${slug}`);
          setError("Stream not found.");
          setStreamData(null);
          setLoading(false);
          // Optionally redirect if the stream doesn't exist
          // router.push('/dashboard/streams');
        }
      },
      (err) => {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        logger.error(
          `Error listening to stream document: ${errorMessage}`,
          err
        );
        setError(errorMessage || "Failed to listen to stream updates.");
        setStreamData(null);
        setLoading(false);
      }
    );

    // Cleanup function to unsubscribe from the listener when the component unmounts or slug changes
    return () => {
      logger.debug(`Unsubscribing from stream updates for: ${slug}`);
      unsubscribe();
    };
  }, [slug, router]); // Rerun effect if slug changes

  return { streamData, loading, error };
};
