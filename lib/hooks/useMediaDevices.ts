import { useState, useEffect } from "react";
import { setupDevices } from "@/lib/utils/streaming";

/**
 * Custom hook to manage media input devices (cameras and microphones).
 * It fetches the list of available devices and manages the state for
 * the currently selected camera and microphone IDs.
 *
 * @param initialCameraId - Optional initial camera ID to select.
 * @param initialMicId - Optional initial microphone ID to select.
 * @returns An object containing device lists, current IDs, setters, and loading/error states.
 */
export const useMediaDevices = (
  initialCameraId?: string,
  initialMicId?: string
) => {
  const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([]);
  const [micDevices, setMicDevices] = useState<MediaDeviceInfo[]>([]);
  const [currentCameraId, setCurrentCameraId] = useState<string>(
    initialCameraId || ""
  );
  const [currentMicId, setCurrentMicId] = useState<string>(initialMicId || "");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setupDevices()
      .then(({ cameras, mics, error: deviceError }) => {
        if (deviceError) {
          console.error("Failed to get devices:", deviceError);
          setError(deviceError);
          setLoading(false);
          return;
        }
        setCameraDevices(cameras);
        setMicDevices(mics);

        // Select initial device if not already set or if the stored one isn't available
        const selectedCameraExists = cameras.some(
          (c) => c.deviceId === currentCameraId
        );
        if (cameras.length > 0 && (!currentCameraId || !selectedCameraExists)) {
          setCurrentCameraId(cameras[0].deviceId);
        }

        const selectedMicExists = mics.some((m) => m.deviceId === currentMicId);
        if (mics.length > 0 && (!currentMicId || !selectedMicExists)) {
          setCurrentMicId(mics[0].deviceId);
        }

        setLoading(false);
      })
      .catch((err) => {
        console.error("Error setting up devices:", err);
        setError(
          err.message || "An unknown error occurred while fetching devices."
        );
        setLoading(false);
      });
    // No dependency array needed here if it should only run once on mount.
    // However, if initial IDs might change and trigger a re-fetch/re-selection, add them.
  }, []); // Runs once on mount

  // Allow external updates to IDs (e.g., from Firestore)
  useEffect(() => {
    if (initialCameraId) setCurrentCameraId(initialCameraId);
  }, [initialCameraId]);

  useEffect(() => {
    if (initialMicId) setCurrentMicId(initialMicId);
  }, [initialMicId]);

  return {
    cameraDevices,
    micDevices,
    currentCameraId,
    currentMicId,
    setCurrentCameraId, // Expose setters if needed by the component
    setCurrentMicId,
    loadingDevices: loading, // Rename to avoid conflict with useStreamData loading
    deviceError: error, // Rename to avoid conflict
  };
};
