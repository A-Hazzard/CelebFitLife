import { useState, useEffect, useCallback } from "react";
import { setupDevices } from "@/lib/utils/streaming";
import { createLogger } from "@/lib/utils/logger";

const logger = createLogger("MediaDevices");

/**
 * Custom hook to manage media input devices (cameras and microphones).
 * It fetches the list of available devices and manages the state for
 * the currently selected camera and microphone IDs.
 *
 * @param initialCameraId - Optional initial camera ID to select.
 * @param initialMicId - Optional initial microphone ID to select.
 * @returns An object containing device lists, current IDs, setters, loading/error states, and refresh function.
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

  /**
   * Loads device lists and updates state
   */
  const loadDevices = useCallback(async () => {
    logger.debug("Loading devices...");
    setLoading(true);
    setError(null);

    try {
      const { cameras, mics, error: deviceError } = await setupDevices();

      if (deviceError) {
        logger.error("Failed to get devices:", deviceError);
        setError(deviceError);
        return;
      }

      setCameraDevices(cameras);
      setMicDevices(mics);
      logger.debug(
        `Found ${cameras.length} cameras and ${mics.length} microphones`
      );

      // Select initial device if not already set or if the stored one isn't available
      const selectedCameraExists = cameras.some(
        (c) => c.deviceId === currentCameraId
      );
      if (cameras.length > 0 && (!currentCameraId || !selectedCameraExists)) {
        logger.debug(
          `Setting default camera: ${cameras[0].label || "Unknown camera"}`
        );
        setCurrentCameraId(cameras[0].deviceId);
      }

      const selectedMicExists = mics.some((m) => m.deviceId === currentMicId);
      if (mics.length > 0 && (!currentMicId || !selectedMicExists)) {
        logger.debug(
          `Setting default microphone: ${mics[0].label || "Unknown microphone"}`
        );
        setCurrentMicId(mics[0].deviceId);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error fetching devices";
      logger.error("Error setting up devices:", errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [currentCameraId, currentMicId]);

  /**
   * Public function to refresh the list of available devices
   */
  const refreshDevices = useCallback(async () => {
    logger.info("Refreshing device list...");
    return loadDevices();
  }, [loadDevices]);

  // Initialize devices on mount
  useEffect(() => {
    loadDevices();
  }, [loadDevices]);

  // Allow external updates to IDs (e.g., from Firestore)
  useEffect(() => {
    if (initialCameraId && initialCameraId !== currentCameraId) {
      logger.debug(
        `Updating camera ID from external source: ${initialCameraId}`
      );
      setCurrentCameraId(initialCameraId);
    }
  }, [initialCameraId, currentCameraId]);

  useEffect(() => {
    if (initialMicId && initialMicId !== currentMicId) {
      logger.debug(
        `Updating microphone ID from external source: ${initialMicId}`
      );
      setCurrentMicId(initialMicId);
    }
  }, [initialMicId, currentMicId]);

  return {
    cameraDevices,
    micDevices,
    currentCameraId,
    currentMicId,
    setCurrentCameraId,
    setCurrentMicId,
    loadingDevices: loading, // Rename to avoid conflict with useStreamData loading
    deviceError: error, // Rename to avoid conflict
    refreshDevices, // New function to allow manual refresh
  };
};
