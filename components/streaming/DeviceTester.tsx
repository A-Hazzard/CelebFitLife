"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { Mic, Camera, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import AudioLevelMeter from "./AudioLevelMeter";
import { toast } from "sonner";
import { createLogger } from "@/lib/utils/logger";

// --- Constants ---
const VERBOSE_LOGGING = false;

// Helper to check if setSinkId is supported
const isSetSinkIdSupported = (): boolean => {
  if (typeof window === "undefined" || !("createElement" in document)) {
    return false; // Cannot check on server or if document is unavailable
  }
  const audio = document.createElement("audio");
  return typeof audio.setSinkId === "function";
};

const logger = createLogger("DeviceTester");

export default function DeviceTester({
  onComplete,
  cameraDevices,
  micDevices,
  speakerDevices,
  currentCameraId,
  currentMicId,
  currentSpeakerId,
  setCurrentCameraId,
  setCurrentMicId,
  setCurrentSpeakerId,
  loadingDevices,
}: {
  onComplete: () => void;
  cameraDevices: MediaDeviceInfo[];
  micDevices: MediaDeviceInfo[];
  speakerDevices: MediaDeviceInfo[];
  currentCameraId?: string;
  currentMicId?: string;
  currentSpeakerId?: string;
  setCurrentCameraId: (id: string) => void;
  setCurrentMicId: (id: string) => void;
  setCurrentSpeakerId: (id: string) => void;
  loadingDevices: boolean;
}) {
  // --- UI state ---
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testType, setTestType] = useState<"mic" | "speaker" | "camera" | null>(
    null
  );
  const [micEnabled, setMicEnabled] = useState<boolean>(true);
  const [micLevel, setMicLevel] = useState(0);
  const [speakerLevel, setSpeakerLevel] = useState(0);
  const [isSpeakerTestActive, setIsSpeakerTestActive] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "microphone" | "speakers" | "camera"
  >("microphone");
  const [isCameraTestActive, setIsCameraTestActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [micRecordingUrl, setMicRecordingUrl] = useState<string>("");
  const [autoPlaybackTimeout, setAutoPlaybackTimeout] =
    useState<NodeJS.Timeout | null>(null);

  // --- Refs ---
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const micAnalyserRef = useRef<AnalyserNode | null>(null);
  const micSourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const micGainNodeRef = useRef<GainNode | null>(null);
  const speakerAnalyserRef = useRef<AnalyserNode | null>(null);
  const speakerAnalysisFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const micRecorderRef = useRef<MediaRecorder | null>(null);
  const micRecordedChunksRef = useRef<Blob[]>([]);
  const previousTabRef = useRef<string | null>(null);

  // --- Cleanup Functions ---
  const cleanupMicAnalysis = useCallback(() => {
    if (autoPlaybackTimeout) {
      clearTimeout(autoPlaybackTimeout);
      setAutoPlaybackTimeout(null);
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (micRecorderRef.current && micRecorderRef.current.state !== "inactive") {
      micRecorderRef.current.stop();
    }
    setMicLevel(0);
    setMicRecordingUrl(""); // Clear recording URL
    micRecordedChunksRef.current = []; // Clear chunks
    if (micSourceNodeRef.current) {
      micSourceNodeRef.current.disconnect();
      micSourceNodeRef.current = null;
    }
    if (micGainNodeRef.current) {
      micGainNodeRef.current.disconnect();
      micGainNodeRef.current = null;
    }
    if (micAnalyserRef.current) {
      micAnalyserRef.current.disconnect();
      micAnalyserRef.current = null;
    }
    // Release mic stream
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }
  }, [autoPlaybackTimeout]);

  const cleanupSpeakerAnalysis = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (speakerAnalysisFrameRef.current) {
      cancelAnimationFrame(speakerAnalysisFrameRef.current);
      speakerAnalysisFrameRef.current = null;
    }
    if (speakerAnalyserRef.current) {
      try {
        speakerAnalyserRef.current.disconnect();
      } catch {}
      speakerAnalyserRef.current = null;
    }
    setSpeakerLevel(0);
  }, []);

  const cleanupCameraTest = useCallback(() => {
    setIsCameraTestActive(false);
    setCameraError(null);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }
  }, []);

  // --- Audio Context Helper ---
  const getAudioContext = useCallback((): AudioContext | null => {
    let ctx = audioContextRef.current;
    if (!ctx || ctx.state === "closed") {
      ctx =
        typeof window !== "undefined" && "AudioContext" in window
          ? new window.AudioContext()
          : null;
      audioContextRef.current = ctx;
    }
    return ctx;
  }, []);

  // --- Camera Test Logic ---
  const startCameraTest = useCallback(
    async (deviceId?: string) => {
      cleanupCameraTest();
      setIsCameraTestActive(true);
      setCameraError(null);
      if (!deviceId) {
        setCameraError("No camera selected.");
        setIsCameraTestActive(false);
        return;
      }
      try {
        logger.debug("Requesting video permission for camera test...");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: deviceId } },
        });
        logger.debug("Video permission granted.");
        cameraStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {
            logger.warn("Camera preview play() failed.");
          });
        }
      } catch (err) {
        logger.error("Could not access camera for test:", err as Error);
        setCameraError("Could not access camera. Please check permissions.");
        setIsCameraTestActive(false);
        // Attempt to cleanup if stream acquisition failed
        if (cameraStreamRef.current) {
          cameraStreamRef.current.getTracks().forEach((track) => track.stop());
          cameraStreamRef.current = null;
        }
      }
    },
    [cleanupCameraTest] // Keep dependencies minimal
  );

  // Update camera preview when camera selection changes or tab becomes active
  useEffect(() => {
    if (activeTab === "camera" && isCameraTestActive && currentCameraId) {
      startCameraTest(currentCameraId);
    } else if (activeTab !== "camera" && isCameraTestActive) {
      // Cleanup camera if tab changes while test is active
      cleanupCameraTest();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCameraId, activeTab, isCameraTestActive]); // Removed startCameraTest dependency

  // --- Mic Analysis & Recording ---
  const startMicAnalysis = useCallback(
    async (deviceId?: string) => {
      logger.debug(`START: startMicAnalysis called with deviceId: ${deviceId}`);
      cleanupMicAnalysis(); // Clears existing recording/timeout
      setMicLevel(5);
      micRecordedChunksRef.current = [];

      if (!deviceId) {
        logger.error("Mic Test Error: No deviceId provided.");
        toast.error("No microphone selected.");
        setIsTesting(false);
        setTestType(null);
        return;
      }
      logger.debug(`Using microphone deviceId: ${deviceId}`);

      try {
        logger.debug("Attempting getUserMedia for microphone...");
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { deviceId: { exact: deviceId } },
        });
        logger.debug("getUserMedia for microphone SUCCESSFUL.");
        micStreamRef.current = stream;

        // Setup MediaRecorder for playback
        try {
          logger.debug("Setting up MediaRecorder...");
          const recorder = new MediaRecorder(stream);
          micRecorderRef.current = recorder;
          recorder.ondataavailable = (e) => {
            if (e.data.size > 0) micRecordedChunksRef.current.push(e.data);
          };
          recorder.onstop = () => {
            logger.debug("MediaRecorder stopped. Creating Blob...");
            const blob = new Blob(micRecordedChunksRef.current, {
              type: "audio/webm",
            });
            const url = URL.createObjectURL(blob);
            logger.debug(`Blob created, URL: ${url}`);
            setMicRecordingUrl(url); // Save URL in state

            // Auto-playback after 2 seconds
            const timeoutId = setTimeout(() => {
              logger.debug("Attempting auto-playback...");
              const audio = new Audio(url);
              audio
                .play()
                .then(() => logger.debug("Auto-playback started."))
                .catch((e) => logger.error("Audio playback error:", e));
              setAutoPlaybackTimeout(null); // Clear timeout ref after playing
            }, 2000);
            setAutoPlaybackTimeout(timeoutId);
            // Clean up the stream tracks *after* recorder has stopped and blob is created
            if (micStreamRef.current) {
              logger.debug(
                "Cleaning up mic stream tracks after recording stop."
              );
              micStreamRef.current.getTracks().forEach((track) => track.stop());
              micStreamRef.current = null;
            }
          };
          recorder.start();
          logger.debug("MediaRecorder started.");
        } catch (recorderErr) {
          logger.error("MediaRecorder setup FAILED:", recorderErr as Error);
          toast.error("Could not start mic recording.");
          // Clean up stream if recorder failed
          if (micStreamRef.current) {
            micStreamRef.current.getTracks().forEach((track) => track.stop());
            micStreamRef.current = null;
          }
        }

        // Setup Analyser for level meter
        logger.debug("Setting up AnalyserNode...");
        const ctx = getAudioContext();
        if (!ctx) {
          logger.error("Audio context not available for analyser.");
          toast.error("Audio context not available.");
          cleanupMicAnalysis(); // Cleanup stream if context fails
          return;
        }
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = 0.2;
        micAnalyserRef.current = analyser;
        const source = ctx.createMediaStreamSource(stream);
        micSourceNodeRef.current = source;
        const gainNode = ctx.createGain();
        gainNode.gain.value = 1.0;
        micGainNodeRef.current = gainNode;
        source.connect(gainNode).connect(analyser);
        logger.debug("AnalyserNode setup complete. Starting analysis loop.");
        const data = new Uint8Array(analyser.frequencyBinCount);
        let movingAvg = 0;
        const runAnalysis = () => {
          if (!micAnalyserRef.current) {
            if (animationFrameRef.current)
              cancelAnimationFrame(animationFrameRef.current);
            return; // Stop if analyser is gone
          }
          if (!micEnabled) {
            setMicLevel((prev) => Math.max(0, prev - 5));
            animationFrameRef.current = requestAnimationFrame(runAnalysis);
            return;
          }
          micAnalyserRef.current.getByteTimeDomainData(data);
          let sumSq = 0;
          for (let i = 0; i < data.length; i++) {
            const n = (data[i] - 128) / 128;
            sumSq += n * n;
          }
          const rms = Math.sqrt(sumSq / data.length);
          const noiseFloor = 0.02;
          const adj =
            rms < noiseFloor ? 0 : (rms - noiseFloor) / (1 - noiseFloor);
          let comp = Math.log1p(adj * 10) / Math.log1p(10);
          comp = Math.min(1, Math.max(0, comp));
          movingAvg = movingAvg * 0.8 + comp * 0.2;
          const level = Math.round(movingAvg * 100);
          if (level !== micLevel) {
            logger.debug(`Mic Level Calculated: ${level}`);
          }
          setMicLevel(level);
          animationFrameRef.current = requestAnimationFrame(runAnalysis);
        };
        animationFrameRef.current = requestAnimationFrame(runAnalysis);
      } catch (getUserMediaError) {
        logger.error(
          "getUserMedia for microphone FAILED:",
          getUserMediaError as Error
        );
        toast.error("Could not access microphone. Please check permissions.");
        setIsTesting(false);
        setTestType(null);
      }
    },
    [getAudioContext, cleanupMicAnalysis, micEnabled, micLevel]
  );

  // --- Stop Mic Test and Trigger Auto-Playback Setup ---
  const stopMicTest = useCallback(() => {
    if (VERBOSE_LOGGING) console.log("stopMicTest called");
    setIsTesting(false);
    setTestType(null);
    // Stop analysis first
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setMicLevel(0); // Reset level immediately

    // Stop recorder - this triggers the onstop handler which creates the blob URL,
    // sets the playback timeout, and stops the stream tracks.
    if (micRecorderRef.current && micRecorderRef.current.state !== "inactive") {
      if (VERBOSE_LOGGING) console.log("Stopping mic recorder...");
      micRecorderRef.current.stop();
    } else {
      // If recorder wasn't active or doesn't exist, clean up stream now
      if (micStreamRef.current) {
        if (VERBOSE_LOGGING)
          console.log("Recorder inactive, stopping stream tracks directly.");
        micStreamRef.current.getTracks().forEach((track) => track.stop());
        micStreamRef.current = null;
      }
    }

    // Disconnect audio nodes immediately
    if (micSourceNodeRef.current) {
      micSourceNodeRef.current.disconnect();
      micSourceNodeRef.current = null;
    }
    if (micGainNodeRef.current) {
      micGainNodeRef.current.disconnect();
      micGainNodeRef.current = null;
    }
    if (micAnalyserRef.current) {
      micAnalyserRef.current.disconnect();
      micAnalyserRef.current = null;
    }

    // Note: Stream track cleanup is now handled within the recorder's onstop handler
    // or directly above if the recorder wasn't active.
  }, []);

  // --- Speaker Analysis & Test ---
  const testSpeaker = useCallback(() => {
    if (speakerAnalysisFrameRef.current) {
      cleanupSpeakerAnalysis();
      setIsSpeakerTestActive(false);
      return;
    }
    setIsSpeakerTestActive(true);
    const ctx = getAudioContext();
    if (!ctx) {
      toast.error("Audio system not available for speaker test");
      setIsSpeakerTestActive(false);
      return;
    }
    if (!currentSpeakerId && isSetSinkIdSupported()) {
      toast.error("No speaker selected.");
      setIsSpeakerTestActive(false);
      return;
    }

    cleanupSpeakerAnalysis();
    setSpeakerLevel(5);

    try {
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.2;
      speakerAnalyserRef.current = analyser;

      const audioEl = new Audio("/audio/test.mp3"); // Ensure this file exists in public/audio
      audioEl.autoplay = true;
      if (currentSpeakerId && isSetSinkIdSupported()) {
        audioEl.setSinkId(currentSpeakerId).catch(() => {
          toast.error("Failed to set speaker output device.");
        });
      }

      const srcNode = ctx.createMediaElementSource(audioEl);
      srcNode.connect(analyser).connect(ctx.destination);

      const data = new Uint8Array(analyser.frequencyBinCount);
      let movingAvg = 0;

      const loop = () => {
        if (!speakerAnalyserRef.current) {
          if (speakerAnalysisFrameRef.current)
            cancelAnimationFrame(speakerAnalysisFrameRef.current);
          return; // Stop loop if analyser is gone
        }
        speakerAnalyserRef.current.getByteTimeDomainData(data);
        let sumSq = 0;
        for (let i = 0; i < data.length; i++) {
          const n = (data[i] - 128) / 128;
          sumSq += n * n;
        }
        const rms = Math.sqrt(sumSq / data.length);
        let comp = Math.log1p(rms * 10) / Math.log1p(10);
        comp = Math.min(1, Math.max(0, comp));
        movingAvg = movingAvg * 0.8 + comp * 0.2;
        const level = Math.round(movingAvg * (audioEl.volume ?? 1) * 100);
        setSpeakerLevel(level);
        speakerAnalysisFrameRef.current = requestAnimationFrame(loop);
      };
      speakerAnalysisFrameRef.current = requestAnimationFrame(loop);

      audioEl.onended = () => {
        cleanupSpeakerAnalysis();
        setIsSpeakerTestActive(false);
        toast.success("Speaker test completed");
      };
      audioEl.onerror = () => {
        cleanupSpeakerAnalysis();
        setIsSpeakerTestActive(false);
        toast.error("Failed to play test sound");
      };
      audioEl.play().catch(() => {
        cleanupSpeakerAnalysis();
        setIsSpeakerTestActive(false);
      });
    } catch (err) {
      if (VERBOSE_LOGGING) console.error(err);
      cleanupSpeakerAnalysis();
      setIsSpeakerTestActive(false);
      toast.error("Failed to run speaker test");
    }
  }, [getAudioContext, currentSpeakerId, cleanupSpeakerAnalysis]);

  // --- Save device settings ---
  const handleSaveAndContinue = useCallback(() => {
    const settings = {
      selectedCamera: currentCameraId,
      selectedMic: currentMicId,
      selectedSpeaker: currentSpeakerId,
    };
    try {
      localStorage.setItem("deviceSettings", JSON.stringify(settings));
      if (VERBOSE_LOGGING) console.info("Save & Continue clicked", settings);
      toast.success("Device settings saved!");
      if (onComplete) onComplete();
    } catch (error) {
      toast.error("Could not save device settings to local storage.");
      console.error("Error saving to localStorage:", error);
    }
  }, [currentCameraId, currentMicId, currentSpeakerId, onComplete]);

  // Effect to cleanup streams on unmount
  useEffect(() => {
    return () => {
      if (VERBOSE_LOGGING)
        console.log("DeviceTester unmounting, cleaning up streams...");
      cleanupMicAnalysis();
      cleanupSpeakerAnalysis();
      cleanupCameraTest();
      if (
        audioContextRef.current &&
        audioContextRef.current.state !== "closed"
      ) {
        audioContextRef.current
          .close()
          .catch((e) => console.error("Error closing AudioContext:", e));
        audioContextRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only on unmount

  // Effect to cleanup tests when switching tabs
  useEffect(() => {
    // Store previous tab to know what to cleanup
    const previousTab = previousTabRef.current;
    previousTabRef.current = activeTab;

    if (
      previousTab === "microphone" &&
      activeTab !== "microphone" &&
      isTesting
    ) {
      if (VERBOSE_LOGGING)
        console.log("Cleaning up mic test due to tab switch");
      stopMicTest();
    }
    if (
      previousTab === "speakers" &&
      activeTab !== "speakers" &&
      isSpeakerTestActive
    ) {
      if (VERBOSE_LOGGING)
        console.log("Cleaning up speaker test due to tab switch");
      cleanupSpeakerAnalysis();
      setIsSpeakerTestActive(false); // Ensure state is reset
    }
    if (
      previousTab === "camera" &&
      activeTab !== "camera" &&
      isCameraTestActive
    ) {
      if (VERBOSE_LOGGING)
        console.log("Cleaning up camera test due to tab switch");
      cleanupCameraTest();
    }
  }, [
    activeTab,
    isTesting,
    isSpeakerTestActive,
    isCameraTestActive,
    stopMicTest,
    cleanupSpeakerAnalysis,
    cleanupCameraTest,
  ]);

  // --- UI Rendering (tabs, selectors, etc) ---
  return (
    <div className="device-tester-container p-4 bg-gray-950 text-white rounded-lg">
      {/* Tab navigation */}
      <div className="flex space-x-2 mb-4 border-b border-gray-800">
        <Button
          variant="ghost"
          onClick={() => setActiveTab("microphone")}
          className={`pb-2 rounded-none ${
            activeTab === "microphone"
              ? "border-b-2 border-brandOrange text-brandOrange"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Microphone
        </Button>
        <Button
          variant="ghost"
          onClick={() => setActiveTab("speakers")}
          className={`pb-2 rounded-none ${
            activeTab === "speakers"
              ? "border-b-2 border-brandOrange text-brandOrange"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Speakers
        </Button>
        <Button
          variant="ghost"
          onClick={() => setActiveTab("camera")}
          className={`pb-2 rounded-none ${
            activeTab === "camera"
              ? "border-b-2 border-brandOrange text-brandOrange"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Camera
        </Button>
      </div>

      {/* Microphone Tab */}
      {activeTab === "microphone" && (
        <div className="p-6 bg-gray-900 rounded-lg flex flex-col items-center border border-gray-800">
          <div className="mb-6 w-full max-w-xs">
            <label className="block text-xs text-gray-400 mb-1">
              Select Microphone
            </label>
            <select
              className="w-full bg-gray-800 text-white rounded px-2 py-1 border border-gray-700 focus:border-brandOrange focus:ring-brandOrange"
              value={currentMicId}
              onChange={(e) => setCurrentMicId(e.target.value)}
              disabled={loadingDevices || isTesting}
            >
              {loadingDevices && <option value="">Loading devices...</option>}
              {micDevices.length === 0 && !loadingDevices && (
                <option value="">No microphones found</option>
              )}
              {micDevices.map((d: MediaDeviceInfo) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || `Microphone (${d.deviceId.substring(0, 8)}...)`}
                </option>
              ))}
            </select>
          </div>

          <div className="w-16 h-16 rounded-full bg-gray-800 mb-4 flex items-center justify-center relative">
            <Mic
              size={28}
              className={`${
                micLevel > 10 ? "text-green-500" : "text-gray-400"
              } transition-colors duration-300`}
            />
          </div>
          <h3 className="text-lg font-bold mb-3">Microphone Test</h3>
          <div className="text-sm text-gray-400 mb-6 text-center max-w-md">
            Speak into your microphone. The meter below will move. Playback
            starts automatically after stopping.
          </div>
          <AudioLevelMeter
            level={
              isTesting && testType === "mic" ? Math.max(micLevel, 5) : micLevel
            }
          />
          <div className="flex space-x-4 mt-4">
            <Button
              variant={isTesting && testType === "mic" ? "default" : "outline"}
              onClick={() => {
                if (isTesting && testType === "mic") {
                  stopMicTest();
                } else {
                  setIsTesting(true);
                  setTestType("mic");
                  setMicLevel(5);
                  startMicAnalysis(currentMicId);
                }
              }}
              className={`min-w-24 ${
                isTesting && testType === "mic"
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : ""
              }`}
              aria-label={
                isTesting && testType === "mic"
                  ? "Stop Microphone Test"
                  : "Start Microphone Test"
              }
              disabled={loadingDevices || !currentMicId}
            >
              {isTesting && testType === "mic" ? "Stop Test" : "Start Test"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setMicEnabled((prev) => !prev)}
              className={`min-w-24 ${
                !micEnabled ? "bg-red-950 text-red-200 border-red-900" : ""
              }`}
              disabled={isTesting && testType === "mic"}
            >
              {micEnabled ? "Mute Mic" : "Unmute Mic"}
            </Button>
          </div>
          {micRecordingUrl && (
            <div className="mt-4 text-sm text-gray-400">
              Playing back last recording...
            </div>
          )}
        </div>
      )}

      {/* Speakers Tab */}
      {activeTab === "speakers" && (
        <div className="p-6 bg-gray-900 rounded-lg flex flex-col items-center border border-gray-800">
          {isSetSinkIdSupported() && (
            <div className="mb-6 w-full max-w-xs">
              <label className="block text-xs text-gray-400 mb-1">
                Select Speaker
              </label>
              <select
                className="w-full bg-gray-800 text-white rounded px-2 py-1 border border-gray-700 focus:border-brandOrange focus:ring-brandOrange"
                value={currentSpeakerId}
                onChange={(e) => setCurrentSpeakerId(e.target.value)}
                disabled={loadingDevices || isSpeakerTestActive}
              >
                {loadingDevices && <option value="">Loading devices...</option>}
                {speakerDevices.length === 0 && !loadingDevices && (
                  <option value="">No speakers found</option>
                )}
                {speakerDevices.map((d: MediaDeviceInfo) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label || `Speaker (${d.deviceId.substring(0, 8)}...)`}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="w-16 h-16 rounded-full bg-gray-800 mb-4 flex items-center justify-center relative">
            <Volume2
              size={28}
              className={`${
                speakerLevel > 10 ? "text-blue-500" : "text-gray-400"
              } transition-colors duration-300`}
            />
          </div>
          <h3 className="text-lg font-bold mb-3">Speaker Test</h3>
          <div className="text-sm text-gray-400 mb-6 text-center max-w-md">
            Click &quot;Start Test&quot; to play a sound. You should hear audio
            and see the meter move.
          </div>
          <AudioLevelMeter level={speakerLevel} />
          <Button
            variant={isSpeakerTestActive ? "default" : "outline"}
            onClick={testSpeaker}
            className={`min-w-24 mt-4 ${
              isSpeakerTestActive
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : ""
            }`}
            aria-label={
              isSpeakerTestActive ? "Stop Speaker Test" : "Start Speaker Test"
            }
            disabled={
              loadingDevices || (!currentSpeakerId && isSetSinkIdSupported())
            }
          >
            {isSpeakerTestActive ? "Stop Test" : "Start Test"}
          </Button>
        </div>
      )}

      {/* Camera Tab */}
      {activeTab === "camera" && (
        <div className="p-6 bg-gray-900 rounded-lg flex flex-col items-center border border-gray-800">
          <div className="mb-6 w-full max-w-xs">
            <label className="block text-xs text-gray-400 mb-1">
              Select Camera
            </label>
            <select
              className="w-full bg-gray-800 text-white rounded px-2 py-1 border border-gray-700 focus:border-brandOrange focus:ring-brandOrange"
              value={currentCameraId}
              onChange={(e) => setCurrentCameraId(e.target.value)}
              disabled={loadingDevices || isCameraTestActive}
            >
              {loadingDevices && <option value="">Loading devices...</option>}
              {cameraDevices.length === 0 && !loadingDevices && (
                <option value="">No cameras found</option>
              )}
              {cameraDevices.map((d: MediaDeviceInfo) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || `Camera (${d.deviceId.substring(0, 8)}...)`}
                </option>
              ))}
            </select>
          </div>

          <div className="w-16 h-16 rounded-full bg-gray-800 mb-4 flex items-center justify-center relative">
            <Camera size={28} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-bold mb-3">Camera Test</h3>
          <div className="text-sm text-gray-400 mb-6 text-center max-w-md min-h-[20px]">
            {isCameraTestActive
              ? "Camera preview is active."
              : cameraError ||
                (currentCameraId
                  ? "Click Start Test to preview your camera."
                  : "Select a camera to test.")}
          </div>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-64 h-48 bg-black rounded-lg border border-gray-700 mb-4 ${
              isCameraTestActive ? "" : "opacity-50 hidden" // Hide instead of just opacity
            }`}
            // style={{ display: isCameraTestActive ? "block" : "none" }} // Replaced by hidden class
          />
          {!isCameraTestActive && !cameraError && (
            <div className="w-64 h-48 bg-black rounded-lg border border-gray-700 mb-4 flex items-center justify-center text-gray-500">
              Camera Preview
            </div>
          )}
          <div className="flex space-x-4 mt-2">
            <Button
              variant={isCameraTestActive ? "default" : "outline"}
              onClick={() => {
                if (isCameraTestActive) {
                  cleanupCameraTest();
                } else {
                  startCameraTest(currentCameraId);
                }
              }}
              className={`min-w-24 ${
                isCameraTestActive
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : ""
              }`}
              disabled={loadingDevices || !currentCameraId}
            >
              {isCameraTestActive ? "Stop Test" : "Start Test"}
            </Button>
          </div>
        </div>
      )}

      {/* SAVE / CONTINUE */}
      <div className="flex justify-end mt-6">
        <Button
          className="bg-brandOrange hover:bg-brandOrange/90 text-brandBlack"
          onClick={handleSaveAndContinue}
          disabled={isTesting || isSpeakerTestActive || isCameraTestActive} // Disable if any test is running
        >
          Save & Continue
        </Button>
      </div>
    </div>
  );
}
