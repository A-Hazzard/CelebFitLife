"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Mic, Camera, Volume2, ChevronUp, Check, VideoOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import AudioLevelMeter from "./AudioLevelMeter";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DeviceOption,
  DeviceTesterProps,
} from "@/lib/types/streaming-components";

// Constants
// Comment out unused constants
// const FFT_SIZE_MIC = 1024;
// const SMOOTHING_MIC = 0.3;
// const GAIN_MIC = 2.0;
// const FFT_SIZE_SPEAKER = 256;
// const SMOOTHING_SPEAKER = 0.6;
const VERBOSE_LOGGING = false; // Keep this one as it might be used

const DeviceTester: React.FC<DeviceTesterProps> = ({
  onComplete,
  className = "",
}) => {
  // Device lists
  const [audioInputs, setAudioInputs] = useState<DeviceOption[]>([]);
  const [audioOutputs, setAudioOutputs] = useState<DeviceOption[]>([]);
  const [videoInputs, setVideoInputs] = useState<DeviceOption[]>([]);

  // Add useEffect to initialize device lists
  useEffect(() => {
    // Function to get devices and set them to state
    const getDevicesAndSetState = async () => {
      try {
        // Request permission to access devices
        await navigator.mediaDevices.getUserMedia({ audio: true, video: true });

        // Get all media devices
        const devices = await navigator.mediaDevices.enumerateDevices();

        // Filter devices by type
        const mics = devices.filter((device) => device.kind === "audioinput");
        const speakers = devices.filter(
          (device) => device.kind === "audiooutput"
        );
        const cameras = devices.filter(
          (device) => device.kind === "videoinput"
        );

        // Map devices to DeviceOption format
        setAudioInputs(
          mics.map((mic) => ({
            deviceId: mic.deviceId,
            label: mic.label || `Microphone ${mic.deviceId.slice(0, 5)}...`,
          }))
        );

        setAudioOutputs(
          speakers.map((speaker) => ({
            deviceId: speaker.deviceId,
            label:
              speaker.label || `Speaker ${speaker.deviceId.slice(0, 5)}...`,
          }))
        );

        setVideoInputs(
          cameras.map((camera) => ({
            deviceId: camera.deviceId,
            label: camera.label || `Camera ${camera.deviceId.slice(0, 5)}...`,
          }))
        );
      } catch (error) {
        console.error("Error getting media devices:", error);
        toast.error("Failed to access media devices");
      }
    };

    // Initialize devices
    getDevicesAndSetState();
  }, []);

  // Selected devices
  const [selectedMic, setSelectedMic] = useState<string>("");
  const [selectedSpeaker, setSelectedSpeaker] = useState<string>("");
  const [selectedCamera, setSelectedCamera] = useState<string>("");

  // UI State
  const [activeTab, setActiveTab] = useState<
    "camera" | "microphone" | "speakers"
  >("camera");

  // Streams
  const micStreamRef = useRef<MediaStream | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  // Testing states
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testType, setTestType] = useState<"mic" | "speaker" | "camera" | null>(
    null
  );
  const [micEnabled, setMicEnabled] = useState<boolean>(true);
  const [cameraEnabled, setCameraEnabled] = useState<boolean>(true);

  // Audio levels
  const [micLevel, setMicLevel] = useState(0);
  const [speakerLevel, setSpeakerLevel] = useState(0);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const currentMicLevelRef = useRef<number>(0); // Add ref to track current mic level
  const currentSpeakerLevelRef = useRef<number>(0); // Add ref to track current speaker level

  // Popover states
  const [popoverStates, setPopoverStates] = useState({
    mic: false,
    speaker: false,
    camera: false,
  });

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Update refs for audio nodes (keep these as refs)
  const micAnalyserRef = useRef<AnalyserNode | null>(null);
  const micSourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const micGainNodeRef = useRef<GainNode | null>(null);
  const speakerAnalyserRef = useRef<AnalyserNode | null>(null);
  const speakerSourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);

  // Add ref for speaker analysis cleanup function
  const speakerAnalysisCleanupRef = useRef<(() => void) | null>(null);

  // --- Utility Functions ---
  const cleanupMicAnalysis = useCallback(() => {
    // Cancel any running animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Return mic level to 0
    setMicLevel(0);

    // Disconnect audio nodes to free resources
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
  }, []);

  const cleanupSpeakerAnalysis = useCallback(() => {
    if (VERBOSE_LOGGING) console.log("Cleaning up speaker analysis");

    // Cancel animation frame first
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Disconnect audio nodes
    if (speakerSourceNodeRef.current) {
      try {
        speakerSourceNodeRef.current.disconnect();
      } catch (e) {
        if (VERBOSE_LOGGING)
          console.warn("Error disconnecting speaker source node:", e);
      }
      speakerSourceNodeRef.current = null;
    }

    if (speakerAnalyserRef.current) {
      try {
        speakerAnalyserRef.current.disconnect();
      } catch (e) {
        if (VERBOSE_LOGGING)
          console.warn("Error disconnecting speaker analyser node:", e);
      }
      speakerAnalyserRef.current = null;
    }

    // Reset levels
    setSpeakerLevel(0);
    currentSpeakerLevelRef.current = 0; // Reset speaker level ref
  }, []);

  const closeAudioContext = useCallback(() => {
    if (audioContext && audioContext.state !== "closed") {
      if (VERBOSE_LOGGING) console.log("Closing AudioContext...");
      audioContext
        .close()
        .catch((err) => console.warn("Error closing audio context:", err));
      setAudioContext(null);
    }
  }, [audioContext]);

  const getAudioContext = useCallback((): AudioContext | null => {
    let currentContext = audioContext;
    if (!currentContext || currentContext.state === "closed") {
      try {
        currentContext = new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext)();
        setAudioContext(currentContext);
        if (VERBOSE_LOGGING)
          console.log("Created new AudioContext. State:", currentContext.state);
      } catch (error: unknown) {
        const err = error as { name?: string; message?: string }; // Assert type for err
        console.error("Failed to create AudioContext:", err.message);
        toast.error("Web Audio API is not supported or blocked.");
        return null;
      }
    } else if (VERBOSE_LOGGING) {
      console.log(
        "Reusing existing AudioContext. State:",
        currentContext.state
      );
    }
    // Resume context if suspended
    if (currentContext.state === "suspended") {
      currentContext
        .resume()
        .catch((err) => console.warn("Error resuming AudioContext:", err));
    }
    return currentContext;
  }, [audioContext]);

  // Helper function to get device name that was referenced but not defined
  const getDeviceName = useCallback(
    (deviceType: "mic" | "speaker" | "camera", deviceId: string) => {
      const list =
        deviceType === "mic"
          ? audioInputs
          : deviceType === "speaker"
          ? audioOutputs
          : videoInputs;
      return (
        list.find((d) => d.deviceId === deviceId)?.label || "Select Device"
      );
    },
    [audioInputs, audioOutputs, videoInputs]
  );

  // Add the missing getMicStream function
  const getMicStream = useCallback(async (deviceId?: string) => {
    try {
      if (VERBOSE_LOGGING)
        console.log(
          "Getting microphone stream for device:",
          deviceId || "default"
        );

      // Stop any existing stream first
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
        micStreamRef.current = null;
      }

      // Check if media devices are supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Media devices API not supported in this browser");
      }

      // Get new stream with specific constraints for better compatibility
      const constraints: MediaStreamConstraints = {
        audio: deviceId
          ? {
              deviceId: { exact: deviceId },
              echoCancellation: { ideal: true },
              noiseSuppression: { ideal: true },
              autoGainControl: { ideal: true },
            }
          : {
              echoCancellation: { ideal: true },
              noiseSuppression: { ideal: true },
              autoGainControl: { ideal: true },
            },
        video: false,
      };

      if (VERBOSE_LOGGING) {
        console.log(
          "Requesting microphone with constraints:",
          JSON.stringify(constraints)
        );
        console.log("Before getUserMedia call");
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (VERBOSE_LOGGING) {
        console.log("After getUserMedia call - succeeded");
        console.log("Microphone stream details:", {
          active: stream.active,
          trackCount: stream.getAudioTracks().length,
          label: stream.getAudioTracks()[0]?.label,
          enabled: stream.getAudioTracks()[0]?.enabled,
          readyState: stream.getAudioTracks()[0]?.readyState,
          constraints: stream.getAudioTracks()[0]?.getConstraints(),
        });
      }

      micStreamRef.current = stream;
      return stream;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("Failed to get microphone stream:", error);

      // Provide more helpful error messages
      if (
        errorMessage.includes("Permission denied") ||
        errorMessage.includes("permission")
      ) {
      toast.error(
          "Microphone access denied. Please check your browser permissions."
        );
      } else if (
        errorMessage.includes("NotFoundError") ||
        errorMessage.includes("not found")
      ) {
        toast.error(
          "No microphone found. Please connect a microphone and try again."
        );
      } else if (
        errorMessage.includes("NotReadableError") ||
        errorMessage.includes("hardware")
      ) {
        toast.error(
          "Microphone hardware error. Try disconnecting and reconnecting your device."
        );
      } else {
        toast.error(`Failed to access microphone: ${errorMessage}`);
      }
      return null;
    }
  }, []);

  // Add the missing startMicAnalysis function
  const startMicAnalysis = useCallback(
    async (deviceId?: string) => {
      try {
        // Clean up any previous analysis
    cleanupMicAnalysis();

        // Get the microphone stream
        const stream = await getMicStream(deviceId);
        if (!stream) {
          toast.error("Could not access microphone");
        return;
      }

        micStreamRef.current = stream;

        // Get audio context
        const context = getAudioContext();
        if (!context) {
          toast.error("Audio system not available for microphone test");
          return;
        }

        try {
          // Create the audio nodes with improved settings
          const analyser = context.createAnalyser();
          analyser.fftSize = 1024; // Enough for detailed analysis
          analyser.smoothingTimeConstant = 0.2; // More responsive
          micAnalyserRef.current = analyser;

          // Create source from mic stream
          const sourceNode = context.createMediaStreamSource(stream);
          micSourceNodeRef.current = sourceNode;

          // Add gain to boost quiet voices
          const gainNode = context.createGain();
          gainNode.gain.value = 2.5; // Boost gain for better visualization
          micGainNodeRef.current = gainNode;

          // Connect nodes
          sourceNode.connect(gainNode);
            gainNode.connect(analyser);
          // Don't connect to destination to prevent feedback

          console.log("Mic test: Audio nodes connected successfully");

          // Create data array for analysis
          const dataArray = new Uint8Array(analyser.frequencyBinCount);

          // Analysis function with improved level calculation
          const runAnalysis = () => {
            if (!micAnalyserRef.current) return;

            try {
              micAnalyserRef.current.getByteFrequencyData(dataArray);

              // Calculate level with improved algorithm
              let sum = 0;
              let peak = 0;

              // Focus on voice frequencies (300Hz-3kHz range)
              const voiceStart = Math.floor(dataArray.length * 0.05);
              const voiceEnd = Math.floor(dataArray.length * 0.3);

              for (let i = voiceStart; i < voiceEnd; i++) {
                sum += dataArray[i];
                peak = Math.max(peak, dataArray[i]);
              }

              const count = voiceEnd - voiceStart;
              const average = sum / count;

              // Apply noise floor threshold for better sensitivity
              const noiseFloor = 5;
              const adjustedPeak = Math.max(0, peak - noiseFloor);

              // More sensitive scale for voice levels
              const scaledLevel = Math.min(
                100,
                Math.pow(
                  (average * 0.3 + adjustedPeak * 0.7) / (255 - noiseFloor),
                  0.65
                ) * 140
              );

              // Update level state with smoothing
              setMicLevel((prev) => {
                // Smooth transitions between values
                const smoothedLevel = prev * 0.2 + scaledLevel * 0.8;
                currentMicLevelRef.current = smoothedLevel;
                return smoothedLevel;
              });

              // Continue the analysis loop
              animationFrameRef.current = requestAnimationFrame(runAnalysis);
            } catch (error) {
              console.error("Error in mic analysis:", error);
              cleanupMicAnalysis();
            }
          };

          // Start the analysis loop
          animationFrameRef.current = requestAnimationFrame(runAnalysis);
        } catch (error) {
          console.error("Error setting up mic analysis:", error);
          toast.error("Failed to analyze microphone input");
          cleanupMicAnalysis();
        }
      } catch (error) {
        console.error("Critical error in mic analysis:", error);
        toast.error("Could not access microphone");
      }
    },
    [getAudioContext, getMicStream, cleanupMicAnalysis]
  );

  // Add back the startSpeakerAnalysis function
  const startSpeakerAnalysis = useCallback(() => {
    if (!audioRef.current) {
      console.warn("Cannot start speaker analysis: audio element not ready.");
      // Create a new audio element if it doesn't exist
      audioRef.current = new Audio("/audio/test-speaker.mp3");
      audioRef.current.loop = false; // Change to false to prevent continuous looping
    }

    // Make sure audio context is available
    const context = getAudioContext();
    if (!context) {
      console.error("Audio context could not be created");
      toast.error("Audio system not available for speaker test");
      return;
    }

    // Clean up any previous analysis
    cleanupSpeakerAnalysis();

    try {
      // Create new audio element to avoid previous connection issues
      const audioElement = new Audio("/audio/test-speaker.mp3");
      audioElement.loop = false; // Don't loop continuously
      audioRef.current = audioElement;

      // Track play count
      let playCount = 0;
      const maxPlays = 3;

      // Resume audio context if it's suspended
      if (context.state === "suspended") {
        context
          .resume()
          .catch((err) =>
            console.error("Failed to resume audio context:", err)
          );
      }

      // Create analyzer with improved settings
      const analyser = context.createAnalyser();
      analyser.fftSize = 256; // Lower FFT size for more responsive readings
      analyser.smoothingTimeConstant = 0.5; // Balance between smooth and responsive
      speakerAnalyserRef.current = analyser;

      // Create source node from audio element
      const sourceNode = context.createMediaElementSource(audioElement);
      speakerSourceNodeRef.current = sourceNode;

      // Connect the nodes
        sourceNode.connect(analyser);
      analyser.connect(context.destination);

      console.log("Speaker test: Audio nodes connected successfully");

      // Create data array for analysis
        const dataArray = new Uint8Array(analyser.frequencyBinCount);

      // Analysis function with improved level calculation
        const analyse = () => {
          if (!analyser) return;

        try {
          analyser.getByteFrequencyData(dataArray);

          // Calculate level with improved algorithm
          let sum = 0;
          let peak = 0;

          // Focus on mid-range frequencies which are most common in test audio
          const midStart = Math.floor(dataArray.length * 0.1);
          const midEnd = Math.floor(dataArray.length * 0.7);

          for (let i = midStart; i < midEnd; i++) {
            sum += dataArray[i];
            peak = Math.max(peak, dataArray[i]);
          }

          const count = midEnd - midStart;
          const average = sum / count;

          // Apply a better scaling algorithm
          // Use both average and peak for more accurate representation
          const scaledLevel = Math.min(
            100,
            ((average * 0.3 + peak * 0.7) / 255) * 130
          );

          // Update level state with smoothing
          setSpeakerLevel((prev) => {
            // Smooth transitions between values
            const smoothedLevel = prev * 0.3 + scaledLevel * 0.7;
            currentSpeakerLevelRef.current = smoothedLevel;
            return smoothedLevel;
          });

          // Continue the analysis loop only if we're still testing
          if (isTesting && testType === "speaker") {
            animationFrameRef.current = requestAnimationFrame(analyse);
          }
        } catch (error) {
          console.error("Error in speaker analysis:", error);
          cleanupSpeakerAnalysis();
        }
      };

      // Start the analysis loop
      animationFrameRef.current = requestAnimationFrame(analyse);

      // Function to play with delay and limited repeats
      const playWithDelay = () => {
        if (playCount < maxPlays && isTesting && testType === "speaker") {
          playCount++;
          audioElement.play().catch((error) => {
            console.error("Failed to play audio:", error);
            toast.error("Could not play audio for speaker test");
          });

          // Listen for when audio finishes
          audioElement.onended = () => {
            if (playCount < maxPlays && isTesting && testType === "speaker") {
              // Wait 2 seconds before playing again
              setTimeout(playWithDelay, 2000);
            } else if (playCount >= maxPlays) {
              // We've reached max plays, show toast notification
              toast.info("Speaker test complete");
            }
          };
        }
      };

      // Start the first play
      playWithDelay();

      // Store cleanup function
        speakerAnalysisCleanupRef.current = () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        if (audioElement) {
          audioElement.pause();
          audioElement.src = "";
          audioElement.onended = null; // Remove event listener
        }
      };
    } catch (error) {
      console.error("Critical error in speaker analysis:", error);
      toast.error("Failed to set up speaker test");
        cleanupSpeakerAnalysis();
      }
  }, [getAudioContext, cleanupSpeakerAnalysis, isTesting, testType]);

  const stopTesting = useCallback(() => {
    if (VERBOSE_LOGGING) console.log("Stopping tests...");
    setIsTesting(false);
    setTestType(null);

    // Stop speaker audio if playing
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = ""; // Clear src
    }

    // Cleanup analysis resources
    cleanupMicAnalysis();
      cleanupSpeakerAnalysis();
  }, [cleanupMicAnalysis, cleanupSpeakerAnalysis]);

  // Add this effect to stop tests when switching tabs
  useEffect(() => {
    // Stop any running tests when changing tabs
    if (isTesting && testType !== null) {
      console.log(`Stopping test because tab changed to ${activeTab}`);
      stopTesting();
    }
  }, [activeTab, stopTesting, isTesting, testType]);

  // Add back the microphone testing useEffect
  useEffect(() => {
    // Handle microphone testing
    if (isTesting && testType === "mic") {
      if (VERBOSE_LOGGING)
        console.log("Setting up microphone test:", selectedMic);

      const setupMic = async () => {
        try {
          const stream = await getMicStream(selectedMic);
          if (stream) {
            if (VERBOSE_LOGGING)
              console.log("Starting mic analysis with stream");
            startMicAnalysis();
          } else {
            console.error("Failed to get microphone stream");
            toast.error(
              "Unable to start microphone test. Please check your permissions."
            );
          }
        } catch (err) {
          console.error("Error during mic setup:", err);
          toast.error("Error setting up microphone test.");
        }
      };

      setupMic();

      return () => {
        if (VERBOSE_LOGGING) console.log("Cleaning up mic test");
        cleanupMicAnalysis();
      };
    }

    // Return empty cleanup function when not testing microphone
    return () => {};
  }, [
    isTesting,
    testType,
    selectedMic,
    getMicStream,
    startMicAnalysis,
    cleanupMicAnalysis,
  ]);

  // Camera Stream Management
  useEffect(() => {
    let isCancelled = false;
    const setupCameraStream = async () => {
      cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;

      if (!selectedCamera || !cameraEnabled) {
        if (VERBOSE_LOGGING)
          console.log("Camera setup skipped (no selection or disabled).");
        return;
      }

      if (VERBOSE_LOGGING)
        console.log(`Setting up camera stream for device: ${selectedCamera}`);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: selectedCamera } },
        });
        if (isCancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        cameraStreamRef.current = stream;
        if (VERBOSE_LOGGING) console.log("Camera stream acquired.");
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Error setting up camera stream:", error);
        toast.error(
          `Failed to access camera: ${getDeviceName("camera", selectedCamera)}`
        );
      }
    };
    setupCameraStream();
    return () => {
      isCancelled = true;
      if (VERBOSE_LOGGING) console.log("Camera stream effect cleanup.");
      cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [selectedCamera, cameraEnabled, getDeviceName]);

  // Update the speaker test useEffect with correct audio path and error handling
  useEffect(() => {
    // Handle speaker testing
    if (isTesting && testType === "speaker") {
      if (VERBOSE_LOGGING) console.log("Setting up speaker test");
      let hasErrored = false; // Flag to prevent multiple error toasts

      // Clean up any previous audio element and connections
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }

      // Clean up existing analyzer and nodes
      cleanupSpeakerAnalysis();

      // Audio element for speaker test
      const audioEl = new Audio("/audio/test-speaker.mp3");
      if (VERBOSE_LOGGING)
        console.log("Created Audio element with src: /audio/test-speaker.mp3");
      audioEl.loop = false;

      if (selectedSpeaker) {
        try {
          if (VERBOSE_LOGGING)
            console.log(
              `Attempting to set audio output device to: ${selectedSpeaker}`
            );
          if (audioEl.setSinkId && typeof audioEl.setSinkId === "function") {
            audioEl
              .setSinkId(selectedSpeaker)
              .then(() => {
                if (VERBOSE_LOGGING)
                  console.log(`Audio output device set to ${selectedSpeaker}`);
              })
              .catch((err) => {
                console.error("Error setting audio output device:", err);
                if (!hasErrored) {
                  toast.error("Failed to set audio output device");
                  hasErrored = true;
                }
              });
          } else if (VERBOSE_LOGGING) {
            console.warn("setSinkId not supported in this browser");
          }
        } catch (err) {
          console.error("Error setting audio sink:", err);
        }
      }

      // Save reference for cleanup
      audioRef.current = audioEl;

      audioEl.oncanplaythrough = () => {
        if (VERBOSE_LOGGING)
          console.log("Audio can play through, starting playback");
        audioEl.play().catch((err) => {
          console.error("Error playing audio:", err);
          if (!hasErrored) {
            toast.error("Failed to play test sound");
            hasErrored = true;
          }
        });
        startSpeakerAnalysis();
      };

      audioEl.onerror = (err) => {
        console.error("Audio element error:", err);
        console.error("Audio element error details:", {
          error: audioEl.error,
          networkState: audioEl.networkState,
          readyState: audioEl.readyState,
          src: audioEl.src,
        });
        if (!hasErrored) {
          toast.error("Failed to load test sound");
          hasErrored = true;
        }
      };

      return () => {
        if (VERBOSE_LOGGING) console.log("Cleaning up speaker test");
        cleanupSpeakerAnalysis();
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = "";
          audioRef.current = null;
        }
      };
    }

    // Return empty cleanup function when not testing speaker
    return () => {};
  }, [
    isTesting,
    testType,
    selectedSpeaker,
    startSpeakerAnalysis,
    cleanupSpeakerAnalysis,
  ]);

  // Handle test completion
  const handleComplete = useCallback(() => {
    // Make sure all tests are stopped first
    if (isTesting) {
      stopTesting();
    }

    // Save selected device settings to localStorage
    const deviceSettings = {
      selectedMic,
      selectedSpeaker,
      selectedCamera,
      micEnabled,
      cameraEnabled,
    };

    localStorage.setItem("deviceSettings", JSON.stringify(deviceSettings));

    // Clean up resources
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }

    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }

    cleanupMicAnalysis();
    cleanupSpeakerAnalysis();
    closeAudioContext();

    console.log("Device settings saved:", deviceSettings);
    toast.success("Device settings saved successfully!");

    // Notify parent component
    onComplete();
  }, [
    selectedMic,
    selectedSpeaker,
    selectedCamera,
    micEnabled,
    cameraEnabled,
    onComplete,
    cleanupMicAnalysis,
    cleanupSpeakerAnalysis,
    closeAudioContext,
    isTesting,
    stopTesting,
  ]);

  // --- UI Handlers ---
  const handleDeviceChange = (
    deviceType: "mic" | "speaker" | "camera",
    deviceId: string
  ) => {
    if (VERBOSE_LOGGING)
      console.log(`Device changed - Type: ${deviceType}, ID: ${deviceId}`);
    if (deviceType === "mic") setSelectedMic(deviceId);
    else if (deviceType === "speaker") setSelectedSpeaker(deviceId);
    else if (deviceType === "camera") setSelectedCamera(deviceId);
    setPopoverStates((prev) => ({ ...prev, [deviceType]: false })); // Close popover
  };

  // Update toggleMicEnabled to stop the microphone test when muted
  const toggleMicEnabled = () => {
    const newState = !micEnabled;
    setMicEnabled(newState);

    // If we're muting while testing, stop the test
    if (!newState && isTesting && testType === "mic") {
      stopTesting();
    }
  };

  const toggleCameraEnabled = () => setCameraEnabled((prev) => !prev);

  // Update the test sections UI to make it more user-friendly
  const renderMicrophoneTest = () => (
    <div className="p-6 bg-gray-900 rounded-lg flex flex-col items-center">
      <div className="w-16 h-16 rounded-full bg-gray-800 mb-4 flex items-center justify-center relative">
        <Mic
          size={28}
          className={`${
            micLevel > 10 ? "text-green-500" : "text-gray-400"
          } transition-colors`}
        />
        {micLevel > 30 && (
          <div className="absolute inset-0 border-2 border-green-500 rounded-full animate-ping opacity-75"></div>
        )}
      </div>

      <h3 className="text-lg font-bold mb-3">Microphone Test</h3>

      <div className="text-sm text-gray-400 mb-6 text-center max-w-md">
        Speak into your microphone. The bars below should move when you talk.
      </div>

      <div className="w-full max-w-md mb-6">
        <AudioLevelMeter
          level={micLevel}
          isActive={isTesting && testType === "mic" && micEnabled}
          type="microphone"
        />
              </div>

      <div className="flex gap-3">
        <Button
          variant={isTesting && testType === "mic" ? "default" : "outline"}
          onClick={() => {
            if (isTesting && testType === "mic") {
              setIsTesting(false);
              setTestType(null);
              cleanupMicAnalysis();
            } else {
              handleTestMic();
            }
          }}
          className="min-w-24"
        >
          {isTesting && testType === "mic" ? "Stop Test" : "Start Test"}
        </Button>

        <Button
          variant="outline"
          onClick={toggleMicEnabled}
          className={`min-w-24 ${
            !micEnabled ? "bg-red-950 text-red-200 border-red-900" : ""
          }`}
        >
          {micEnabled ? "Mute Mic" : "Unmute Mic"}
        </Button>
            </div>
    </div>
  );

  const renderSpeakerTest = () => (
    <div className="p-6 bg-gray-900 rounded-lg flex flex-col items-center">
      <div className="w-16 h-16 rounded-full bg-gray-800 mb-4 flex items-center justify-center relative">
        <Volume2
          size={28}
          className={`${
            speakerLevel > 10 ? "text-blue-500" : "text-gray-400"
          } transition-colors`}
        />
        {speakerLevel > 30 && (
          <div className="absolute inset-0 border-2 border-blue-500 rounded-full animate-ping opacity-75"></div>
          )}
        </div>

      <h3 className="text-lg font-bold mb-3">Speaker Test</h3>

      <div className="text-sm text-gray-400 mb-6 text-center max-w-md">
        Click &quot;Start Test&quot; to play a sound. You should hear audio and
        see the bars move. The sound will play 3 times with pauses.
      </div>

      <div className="w-full max-w-md mb-6">
        <AudioLevelMeter
          level={speakerLevel}
          isActive={isTesting && testType === "speaker"}
          type="speaker"
        />
      </div>

            <Button
        variant={isTesting && testType === "speaker" ? "default" : "outline"}
        onClick={() => {
          if (isTesting && testType === "speaker") {
            setIsTesting(false);
            setTestType(null);
            cleanupSpeakerAnalysis();
            if (audioRef.current) {
              audioRef.current.pause();
              audioRef.current.onended = null;
            }
          } else {
            handleTestSpeaker();
          }
        }}
        className={`min-w-24 ${
          isTesting && testType === "speaker"
            ? "bg-white hover:bg-gray-200 text-black"
            : ""
        }`}
      >
        {isTesting && testType === "speaker" ? "Stop Test" : "Start Test"}
            </Button>
    </div>
  );

  // --- Test Initiation ---
  const handleTestSpeaker = useCallback(() => {
    setIsTesting(true);
    setTestType("speaker");
    // Note: The actual audio setup and analysis is now handled by the useEffect
    if (VERBOSE_LOGGING) console.log("Test speaker requested");
  }, []);

  const handleTestMic = useCallback(() => {
    // Don't start the test if microphone is muted
    if (!micEnabled) {
      toast.error("Please unmute your microphone before testing");
      return;
    }

    setIsTesting(true);
    setTestType("mic");
    // Note: The actual stream acquisition and analysis is now handled by the useEffect
    if (VERBOSE_LOGGING) console.log("Test mic requested");
  }, [micEnabled]);

  // --- Render ---
  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Tabs */}
      <div className="flex border-b border-gray-800">
        <button
          onClick={() => setActiveTab("camera")}
          className={`py-3 px-4 font-medium flex items-center gap-2 ${
            activeTab === "camera"
              ? "border-b-2 border-brandOrange text-brandOrange"
              : "text-gray-400 hover:text-gray-300"
          }`}
        >
          <Camera size={18} />
          <span>Camera</span>
        </button>
        <button
          onClick={() => setActiveTab("microphone")}
          className={`py-3 px-4 font-medium flex items-center gap-2 ${
            activeTab === "microphone"
              ? "border-b-2 border-brandOrange text-brandOrange"
              : "text-gray-400 hover:text-gray-300"
          }`}
        >
          <Mic size={18} />
          <span>Microphone</span>
        </button>
                    <button
          onClick={() => setActiveTab("speakers")}
          className={`py-3 px-4 font-medium flex items-center gap-2 ${
            activeTab === "speakers"
              ? "border-b-2 border-brandOrange text-brandOrange"
              : "text-gray-400 hover:text-gray-300"
          }`}
        >
          <Volume2 size={18} />
          <span>Speakers</span>
                    </button>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-auto">
        {activeTab === "camera" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-900 rounded-lg overflow-hidden">
              <div className="aspect-video bg-black relative">
                {/* Video preview */}
                <video
                  ref={videoRef}
                  className={`w-full h-full object-cover ${
                    !cameraEnabled ? "hidden" : ""
                  }`}
                  muted
                  autoPlay
                  playsInline
                />
                {!cameraEnabled && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                    <VideoOff size={48} className="text-gray-600" />
                  </div>
                )}
              </div>
              <div className="p-4 flex items-center justify-between">
                  <Button
                  variant="outline"
                  onClick={toggleCameraEnabled}
                  className={`${
                    !cameraEnabled
                      ? "bg-red-900/20 text-red-300 border-red-900"
                      : ""
                  }`}
                >
                  {cameraEnabled ? "Disable Camera" : "Enable Camera"}
                  </Button>
                <div className="text-xs text-gray-400">
                  Preview only visible to you
                </div>
              </div>
          </div>

            <div className="space-y-6">
              <div className="bg-gray-900 rounded-lg p-6">
                <h3 className="text-lg font-bold mb-4">Camera Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Select Camera
                    </label>
            <Popover
                      open={popoverStates.camera}
                      onOpenChange={(open) =>
                        setPopoverStates((prev) => ({
                          ...prev,
                          camera: open,
                        }))
              }
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                          role="combobox"
                          aria-expanded={popoverStates.camera}
                          className="w-full justify-between bg-gray-800 border-gray-700"
                >
                          {videoInputs.find(
                            (camera) => camera.deviceId === selectedCamera
                          )?.label || "Default camera"}
                  <ChevronUp
                            className={`ml-2 h-4 w-4 shrink-0 opacity-50 ${
                              popoverStates.camera ? "rotate-180" : ""
                            } transition-transform`}
                  />
                </Button>
              </PopoverTrigger>
                      <PopoverContent className="w-full p-0 bg-gray-800 border-gray-700">
                        <div className="max-h-80 overflow-auto">
                          {videoInputs.map((camera) => (
                            <div
                              key={camera.deviceId}
                      className={popoverItem}
                              onClick={() => {
                                handleDeviceChange("camera", camera.deviceId);
                                setPopoverStates((prev) => ({
                                  ...prev,
                                  camera: false,
                                }));
                              }}
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${
                                  selectedCamera === camera.deviceId
                                    ? "opacity-100"
                                    : "opacity-0"
                                }`}
                              />
                              <span
                                className={`${
                                  selectedCamera === camera.deviceId
                                    ? "font-medium"
                                    : ""
                                }`}
                              >
                                {camera.label}
                      </span>
                  </div>
                          ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "microphone" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderMicrophoneTest()}

            <div className="bg-gray-900 rounded-lg p-6">
              <h3 className="text-lg font-bold mb-4">Microphone Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Select Microphone
                  </label>
            <Popover
                    open={popoverStates.mic}
                    onOpenChange={(open) =>
                      setPopoverStates((prev) => ({ ...prev, mic: open }))
              }
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                        role="combobox"
                        aria-expanded={popoverStates.mic}
                        className="w-full justify-between bg-gray-800 border-gray-700"
                >
                        {audioInputs.find((mic) => mic.deviceId === selectedMic)
                          ?.label || "Default microphone"}
                  <ChevronUp
                          className={`ml-2 h-4 w-4 shrink-0 opacity-50 ${
                            popoverStates.mic ? "rotate-180" : ""
                          } transition-transform`}
                  />
                </Button>
              </PopoverTrigger>
                    <PopoverContent className="w-full p-0 bg-gray-800 border-gray-700">
                      <div className="max-h-80 overflow-auto">
                        {audioInputs.map((mic) => (
                          <div
                            key={mic.deviceId}
                      className={popoverItem}
                            onClick={() => {
                              handleDeviceChange("mic", mic.deviceId);
                              setPopoverStates((prev) => ({
                                ...prev,
                                mic: false,
                              }));

                              // If we're currently testing, restart the test with the new device
                              if (isTesting && testType === "mic") {
                                cleanupMicAnalysis();
                                // Wait a moment for cleanup to finish
                                setTimeout(() => {
                                  startMicAnalysis(mic.deviceId);
                                }, 100);
                              }
                            }}
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${
                                selectedMic === mic.deviceId
                                  ? "opacity-100"
                                  : "opacity-0"
                              }`}
                            />
                            <span
                              className={`${
                                selectedMic === mic.deviceId
                                  ? "font-medium"
                                  : ""
                              }`}
                            >
                              {mic.label}
                      </span>
                  </div>
                        ))}
                      </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        </div>
      </div>
        )}

        {activeTab === "speakers" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderSpeakerTest()}

            <div className="bg-gray-900 rounded-lg p-6">
              <h3 className="text-lg font-bold mb-4">Speaker Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Select Speaker
                  </label>
                  <Popover
                    open={popoverStates.speaker}
                    onOpenChange={(open) =>
                      setPopoverStates((prev) => ({ ...prev, speaker: open }))
                    }
                  >
                    <PopoverTrigger asChild>
            <Button
              variant="outline"
                        role="combobox"
                        aria-expanded={popoverStates.speaker}
                        className="w-full justify-between bg-gray-800 border-gray-700"
                      >
                        {audioOutputs.find(
                          (speaker) => speaker.deviceId === selectedSpeaker
                        )?.label || "Default speaker"}
                        <ChevronUp
                          className={`ml-2 h-4 w-4 shrink-0 opacity-50 ${
                            popoverStates.speaker ? "rotate-180" : ""
                          } transition-transform`}
                        />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0 bg-gray-800 border-gray-700">
                      <div className="max-h-80 overflow-auto">
                        {audioOutputs.map((speaker) => (
                          <div
                            key={speaker.deviceId}
                            className={popoverItem}
              onClick={() => {
                              handleDeviceChange("speaker", speaker.deviceId);
                              setPopoverStates((prev) => ({
                                ...prev,
                                speaker: false,
                              }));

                              // If testing, restart with new device
                              if (isTesting && testType === "speaker") {
                  cleanupSpeakerAnalysis();
                                if (audioRef.current) {
                  audioRef.current.pause();
                                }
                                // Wait a moment for cleanup
                                setTimeout(() => {
                      startSpeakerAnalysis();
                                }, 100);
                              }
                            }}
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${
                                selectedSpeaker === speaker.deviceId
                                  ? "opacity-100"
                                  : "opacity-0"
                              }`}
                            />
                            <span
                              className={`${
                                selectedSpeaker === speaker.deviceId
                                  ? "font-medium"
                                  : ""
                              }`}
                            >
                              {speaker.label}
                            </span>
                          </div>
                        ))}
            </div>
                    </PopoverContent>
                  </Popover>
            </div>
          </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 bg-gray-900 border-t border-gray-800 flex justify-between items-center">
        <div className="text-sm text-gray-400">
          Your device settings will be saved for future streams
        </div>
            <Button
          onClick={handleComplete}
          className="bg-brandOrange hover:bg-brandOrange/90 text-brandBlack"
            >
          Save & Continue
            </Button>
      </div>
    </div>
  );
};

// Helper CSS classes for UI components
const popoverItem =
  "flex items-center justify-between px-3 py-1.5 w-full text-xs text-left hover:bg-gray-700 text-white rounded-sm cursor-pointer";

export default DeviceTester;
