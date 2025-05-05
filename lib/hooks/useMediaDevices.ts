import { useState, useEffect, useCallback } from "react";
import { createLogger } from "@/lib/utils/logger";

const logger = createLogger("MediaDevices");

/**
 * Custom hook to manage media input and output devices (cameras, microphones, speakers).
 * It fetches the list of available devices and manages the state for
 * the currently selected device IDs.
 *
 * @param initialCameraId - Optional initial camera ID to select.
 * @param initialMicId - Optional initial microphone ID to select.
 * @param initialSpeakerId - Optional initial speaker ID to select.
 * @returns An object containing device lists, current IDs, setters, loading/error states, and refresh function.
 */
export const useMediaDevices = (
  initialCameraId?: string,
  initialMicId?: string,
  initialSpeakerId?: string
) => {
  const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([]);
  const [micDevices, setMicDevices] = useState<MediaDeviceInfo[]>([]);
  const [speakerDevices, setSpeakerDevices] = useState<MediaDeviceInfo[]>([]);
  const [currentCameraId, setCurrentCameraId] = useState<string>(
    initialCameraId || ""
  );
  const [currentMicId, setCurrentMicId] = useState<string>(initialMicId || "");
  const [currentSpeakerId, setCurrentSpeakerId] = useState<string>(
    initialSpeakerId || ""
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Loads device lists and updates state
   */
  const loadDevices = useCallback(async () => {
    logger.debug("START: Loading devices...");
    setLoading(true);
    setError(null);
    let devices: MediaDeviceInfo[] = [];

    try {
      // Try to request permission for AUDIO ONLY initially
      try {
        logger.debug("Attempting getUserMedia({ audio: true })...");
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        }); // AUDIO ONLY
        logger.debug(
          "getUserMedia({ audio: true }) successful, stopping tracks..."
        );
        stream.getTracks().forEach((t) => t.stop());
        logger.debug("Audio tracks stopped.");
      } catch (permissionError) {
        logger.warn(
          "getUserMedia({ audio: true }) failed. Audio device access might be limited.",
          permissionError as Error
        );
        // Continue anyway
      }

      // Always enumerate devices
      logger.debug("Attempting enumerateDevices...");
      devices = await navigator.mediaDevices.enumerateDevices();
      logger.debug(
        `enumerateDevices successful. Found ${devices.length} devices total.`
      );

      const cameras = devices.filter((d) => d.kind === "videoinput");
      const mics = devices.filter((d) => d.kind === "audioinput");
      const speakers = devices.filter((d) => d.kind === "audiooutput");

      logger.debug("Setting device state...");
      setCameraDevices(cameras);
      setMicDevices(mics);
      setSpeakerDevices(speakers);
      logger.debug(
        `State set: ${cameras.length} cameras, ${mics.length} mics, ${speakers.length} speakers`
      );

      // --- Select default/initial devices ---
      logger.debug("Selecting default devices (if needed)...");

      // Camera
      const selectedCameraExists = cameras.some(
        (c) => c.deviceId === currentCameraId
      );
      if (cameras.length > 0 && (!currentCameraId || !selectedCameraExists)) {
        const defaultCamera =
          initialCameraId && cameras.find((c) => c.deviceId === initialCameraId)
            ? initialCameraId
            : cameras[0].deviceId;
        logger.debug(
          `Setting default camera: ${
            cameras.find((c) => c.deviceId === defaultCamera)?.label ||
            "Unknown"
          }`
        );
        setCurrentCameraId(defaultCamera);
      }

      // Microphone
      const selectedMicExists = mics.some((m) => m.deviceId === currentMicId);
      if (mics.length > 0 && (!currentMicId || !selectedMicExists)) {
        const defaultMic =
          initialMicId && mics.find((m) => m.deviceId === initialMicId)
            ? initialMicId
            : mics[0].deviceId;
        logger.debug(
          `Setting default microphone: ${
            mics.find((m) => m.deviceId === defaultMic)?.label || "Unknown"
          }`
        );
        setCurrentMicId(defaultMic);
      }

      // Speaker (only select if available)
      const selectedSpeakerExists = speakers.some(
        (s) => s.deviceId === currentSpeakerId
      );
      if (
        speakers.length > 0 &&
        (!currentSpeakerId || !selectedSpeakerExists)
      ) {
        const defaultSpeaker =
          initialSpeakerId &&
          speakers.find((s) => s.deviceId === initialSpeakerId)
            ? initialSpeakerId
            : speakers[0].deviceId;
        logger.debug(
          `Setting default speaker: ${
            speakers.find((s) => s.deviceId === defaultSpeaker)?.label ||
            "Unknown"
          }`
        );
        setCurrentSpeakerId(defaultSpeaker);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Unknown error during device loading";
      logger.error(
        "CRITICAL ERROR in loadDevices try block:",
        errorMessage,
        err as Error
      );
      setError(errorMessage);
    } finally {
      logger.debug("FINALLY: Setting loading to false.");
      setLoading(false);
    }
  }, [
    currentCameraId,
    currentMicId,
    currentSpeakerId,
    initialCameraId,
    initialMicId,
    initialSpeakerId,
  ]);

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
  }, [loadDevices]); // loadDevices dependency is correct here

  // Listen for device changes
  useEffect(() => {
    const handleDeviceChange = () => {
      logger.info("Media devices changed, refreshing list...");
      loadDevices();
    };

    navigator.mediaDevices.addEventListener("devicechange", handleDeviceChange);

    return () => {
      navigator.mediaDevices.removeEventListener(
        "devicechange",
        handleDeviceChange
      );
    };
  }, [loadDevices]);

  // Allow external updates to IDs (e.g., from localStorage on mount)
  useEffect(() => {
    if (initialCameraId && initialCameraId !== currentCameraId) {
      logger.debug(`Updating camera ID from initial prop: ${initialCameraId}`);
      setCurrentCameraId(initialCameraId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCameraId]);

  useEffect(() => {
    if (initialMicId && initialMicId !== currentMicId) {
      logger.debug(`Updating mic ID from initial prop: ${initialMicId}`);
      setCurrentMicId(initialMicId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMicId]);

  useEffect(() => {
    if (initialSpeakerId && initialSpeakerId !== currentSpeakerId) {
      logger.debug(
        `Updating speaker ID from initial prop: ${initialSpeakerId}`
      );
      setCurrentSpeakerId(initialSpeakerId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSpeakerId]);

  return {
    cameraDevices,
    micDevices,
    speakerDevices, // Return speaker devices
    currentCameraId,
    currentMicId,
    currentSpeakerId, // Return speaker ID
    setCurrentCameraId,
    setCurrentMicId,
    setCurrentSpeakerId, // Return speaker setter
    loadingDevices: loading,
    deviceError: error,
    refreshDevices,
  };
};
