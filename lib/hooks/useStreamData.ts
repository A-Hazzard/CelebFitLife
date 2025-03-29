import { useState, useEffect } from "react";
import { doc, onSnapshot, Unsubscribe } from "firebase/firestore";
import { db } from "@/lib/config/firebase";
import { StreamData } from "@/lib/types/streaming";
import { useRouter } from "next/navigation";

/**
 * Custom hook to subscribe to Firestore updates for a specific stream document.
 * It manages the stream data state, loading status, and handles redirection
 * if the stream ends or is not found.
 *
 * @param slug - The unique slug identifier of the stream.
 * @returns An object containing the stream data, loading status, and any error encountered.
 */
export const useStreamData = (slug: string) => {
  const [streamData, setStreamData] = useState<Partial<StreamData> | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      setError("Slug is required to fetch stream data.");
      return;
    }

    setLoading(true);
    setError(null);
    const streamDocRef = doc(db, "streams", slug);

    const unsubscribe: Unsubscribe = onSnapshot(
      streamDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as StreamData; // Assume it fits StreamData
          setStreamData({
            ...data,
            // Provide defaults for potentially missing fields if needed
            title: data.title || "",
            thumbnail:
              data.thumbnail ||
              "https://1.bp.blogspot.com/-Rsu_fHvj-IA/YH0ohFqGK_I/AAAAAAAAm7o/dOKXFVif7hYDymAsCNZRe4MK3p7ihTGmgCLcBGAsYHQ/s2362/Stream.jpg",
            audioMuted: data.audioMuted ?? false,
            cameraOff: data.cameraOff ?? false,
          });

          // Handle stream ending
          if (data.hasEnded) {
            console.log("Stream has ended, redirecting...");
            // Potential TODO: Disconnect Twilio room here if not handled elsewhere
            router.push("/dashboard/streams");
          }

          setLoading(false);
        } else {
          console.error("Stream document not found for slug:", slug);
          setError("Stream not found.");
          setStreamData(null);
          setLoading(false);
          // Optionally redirect if the stream doesn't exist
          // router.push('/dashboard/streams');
        }
      },
      (err) => {
        console.error("Error listening to stream document:", err);
        setError(err.message || "Failed to listen to stream updates.");
        setStreamData(null);
        setLoading(false);
      }
    );

    // Cleanup function to unsubscribe from the listener when the component unmounts or slug changes
    return () => unsubscribe();
  }, [slug, router]); // Rerun effect if slug changes

  return { streamData, loading, error };
};
