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
import { DeviceOption, DeviceTesterProps } from "@/lib/types/streaming.types";

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

  // 1. Add state for mic pulse
  const [micPulse, setMicPulse] = useState(false);
  const micMovingAvgRef = useRef(0);

  // 1. Add state for speaker pulse
  const [speakerPulse, setSpeakerPulse] = useState(false);
  const speakerMovingAvgRef = useRef(0);

  // Add state for speaker test
  const [isSpeakerTestActive, setIsSpeakerTestActive] = useState(false);

  // Add refs for the speaker test
  const speakerAudioContextRef = useRef<AudioContext | null>(null);
  const speakerAudioElRef = useRef<HTMLAudioElement | null>(null);
  const speakerAnalysisFrameRef = useRef<number | null>(null);
  const speakerTestTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const speakerOscillatorRefs = useRef<OscillatorNode[]>([]);
  const speakerGainRefs = useRef<GainNode[]>([]);

  // 1. Add useEffect to watch isTesting and testType
  useEffect(() => {
    toast.info(`State changed: isTesting=${isTesting}, testType=${testType}`);
  }, [isTesting, testType]);

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

    // Call any stored cleanup function
    if (speakerAnalysisCleanupRef.current) {
      speakerAnalysisCleanupRef.current();
      speakerAnalysisCleanupRef.current = null;
    }

    // Disconnect audio nodes in a try/catch to prevent errors
    if (speakerSourceNodeRef.current) {
      try {
        speakerSourceNodeRef.current.disconnect();
      } catch (error) {
        console.error("Error disconnecting speaker source node:", error);
      }
      speakerSourceNodeRef.current = null;
    }

    if (speakerAnalyserRef.current) {
      try {
        speakerAnalyserRef.current.disconnect();
      } catch (error) {
        console.error("Error disconnecting speaker analyser:", error);
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
      audioContext.close().catch((error) => {
        console.error("Error closing AudioContext:", error);
      });
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
      currentContext.resume().catch((error) => {
        console.error("Error resuming AudioContext:", error);
      });
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

  // 2. Update toggleMicEnabled to control MediaStream tracks and analysis
  const toggleMicEnabled = () => {
    const newState = !micEnabled;
    setMicEnabled(newState);
    if (micStreamRef.current) {
      micStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = newState;
      });
    }
    if (!newState && isTesting && testType === "mic") {
      cleanupMicAnalysis();
    } else if (newState && isTesting && testType === "mic") {
      startMicAnalysis(selectedMic);
    }
  };

  // 3. Refactor mic analysis for compression and pulse
  const startMicAnalysis = useCallback(
    async (deviceId?: string) => {
      try {
        cleanupMicAnalysis();
        setMicLevel(10);
        setMicPulse(false);
        const stream = await getMicStream(deviceId);
        if (!stream) {
          toast.error("Could not access microphone");
          return;
        }
        micStreamRef.current = stream;
        const context = getAudioContext();
        if (!context) {
          toast.error("Audio system not available for microphone test");
          return;
        }
        try {
          const analyser = context.createAnalyser();
          analyser.fftSize = 1024;
          analyser.smoothingTimeConstant = 0.2;
          micAnalyserRef.current = analyser;
          const sourceNode = context.createMediaStreamSource(stream);
          micSourceNodeRef.current = sourceNode;
          const gainNode = context.createGain();
          gainNode.gain.value = 3.0;
          micGainNodeRef.current = gainNode;
          sourceNode.connect(gainNode);
          gainNode.connect(analyser);
          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          let movingAvg = 0;
          const runAnalysis = () => {
            if (!micAnalyserRef.current) return;
            try {
              micAnalyserRef.current.getByteFrequencyData(dataArray);
              let sum = 0;
              let peak = 0;
              const voiceStart = Math.floor(dataArray.length * 0.05);
              const voiceEnd = Math.floor(dataArray.length * 0.3);
              for (let i = voiceStart; i < voiceEnd; i++) {
                sum += dataArray[i];
                peak = Math.max(peak, dataArray[i]);
              }
              const count = voiceEnd - voiceStart;
              const average = sum / count;
              // Soft-knee compression: log curve
              const noiseFloor = 3;
              const adjustedPeak = Math.max(0, peak - noiseFloor);
              let compressed = Math.log1p(average * 0.3 + adjustedPeak * 0.7);
              compressed = Math.min(1, compressed / Math.log1p(255));
              // Moving average for smoothness
              movingAvg = movingAvg * 0.8 + compressed * 0.2;
              micMovingAvgRef.current = movingAvg;
              // Scale to 0-100
              const scaledLevel = Math.round(movingAvg * 100);
              setMicLevel(scaledLevel);
              // Pulse if above 60% of recent average
              if (
                scaledLevel > Math.max(30, micMovingAvgRef.current * 100 * 0.6)
              ) {
                setMicPulse(true);
                setTimeout(() => setMicPulse(false), 300);
              }
              animationFrameRef.current = requestAnimationFrame(runAnalysis);
            } catch (error) {
              console.error("Error in mic analysis:", error);
              cleanupMicAnalysis();
              setMicLevel(15);
            }
          };
          animationFrameRef.current = requestAnimationFrame(runAnalysis);
        } catch (error) {
          console.error("Error setting up mic analysis:", error);
          toast.error("Failed to analyze microphone input");
          cleanupMicAnalysis();
          setMicLevel(15);
        }
      } catch (error) {
        console.error("Critical error in mic analysis:", error);
        toast.error("Could not access microphone");
        setMicLevel(15);
      }
    },
    [getAudioContext, getMicStream, cleanupMicAnalysis]
  );

  // 2. Refactor startSpeakerAnalysis for robust visualization and pulse
  const startSpeakerAnalysis = useCallback(() => {
    toast.info("Speaker test: startSpeakerAnalysis called");
    if (!audioRef.current) {
      setSpeakerLevel(15);
      return;
    }
    const context = getAudioContext();
    if (!context) {
      toast.error("Audio system not available for speaker test");
      setSpeakerLevel(15);
      return;
    }
    cleanupSpeakerAnalysis();
    setSpeakerLevel(15);
    setSpeakerPulse(false);
    try {
      if (context.state === "suspended") {
        context.resume().catch((error) => {
          console.error("Error resuming AudioContext:", error);
        });
      }
      const analyser = context.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.3;
      let sourceNode;
      if (!speakerSourceNodeRef.current) {
        try {
          sourceNode = context.createMediaElementSource(audioRef.current);
          speakerSourceNodeRef.current = sourceNode;
        } catch (error) {
          console.error("Error creating media element source:", error);
        }
        speakerSourceNodeRef.current = null;
      } else {
        sourceNode = speakerSourceNodeRef.current;
      }
      if (!sourceNode) {
        setSpeakerLevel(15);
        return;
      }
      sourceNode.connect(analyser);
      analyser.connect(context.destination);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let movingAvg = 0;
      const analyse = () => {
        if (!analyser) return;
        try {
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          let peak = 0;
          const midStart = Math.floor(dataArray.length * 0.1);
          const midEnd = Math.floor(dataArray.length * 0.7);
          for (let i = midStart; i < midEnd; i++) {
            sum += dataArray[i];
            peak = Math.max(peak, dataArray[i]);
          }
          const count = midEnd - midStart;
          const average = sum / count;
          // Soft-knee compression: log curve
          const noiseFloor = 3;
          const adjustedPeak = Math.max(0, peak - noiseFloor);
          let compressed = Math.log1p(average * 0.3 + adjustedPeak * 0.7);
          compressed = Math.min(1, compressed / Math.log1p(255));
          movingAvg = movingAvg * 0.8 + compressed * 0.2;
          speakerMovingAvgRef.current = movingAvg;
          const scaledLevel = Math.round(movingAvg * 100);
          setSpeakerLevel(scaledLevel);
          if (
            scaledLevel > Math.max(30, speakerMovingAvgRef.current * 100 * 0.6)
          ) {
            setSpeakerPulse(true);
            setTimeout(() => setSpeakerPulse(false), 300);
          }
          if (isTesting && testType === "speaker") {
            animationFrameRef.current = requestAnimationFrame(analyse);
          }
        } catch (error) {
          console.error("Error in speaker analysis:", error);
        }
      };
      animationFrameRef.current = requestAnimationFrame(analyse);
      speakerAnalysisCleanupRef.current = () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.srcObject = null;
          audioRef.current.src = "";
          audioRef.current.oncanplaythrough = null;
          audioRef.current.onerror = null;
        }
        if (sourceNode) {
          try {
            sourceNode.disconnect();
          } catch (error) {
            console.error("Error disconnecting speaker source node:", error);
          }
        }
        if (analyser) {
          try {
            analyser.disconnect();
          } catch (error) {
            console.error("Error disconnecting speaker analyser:", error);
          }
        }
        try {
          if (context && context.state !== "closed") {
            context.close();
          }
        } catch (error) {
          console.error("Error closing AudioContext:", error);
        }
        setIsTesting(false);
        setTestType(null);
        setSpeakerLevel(0);
      };
    } catch (error) {
      console.error("Error in speaker analysis:", error);
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
        } catch (error) {
          console.error("Error during mic setup:", error);
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

  // Update the speaker test useEffect to handle setSinkId, autoplay, and call startSpeakerAnalysis
  useEffect(() => {
    // Handle speaker testing
    if (isTesting && testType === "speaker") {
      if (VERBOSE_LOGGING) console.log("Setting up speaker test");
      let hasErrored = false; // Flag to prevent multiple error toasts
      let playCount = 0;
      const maxPlays = 3;

      // Ensure we always clean up before setting up a new test
      // This is critical to avoid the "already connected" error
      cleanupSpeakerAnalysis();

      // Clean up any previous audio element
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        // Remove all event listeners to prevent memory leaks
        audioRef.current.oncanplaythrough = null;
        audioRef.current.onended = null;
        audioRef.current.onerror = null;
      }

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
              .catch((error) => {
                console.error("Error setting sink ID:", error);
              });
          } else if (VERBOSE_LOGGING) {
            console.warn("setSinkId not supported in this browser");
          }
        } catch (error) {
          console.error("Error setting sink ID:", error);
        }
      }

      // Save reference for cleanup
      audioRef.current = audioEl;

      // Function to handle multiple plays with delays
      const playWithDelay = () => {
        if (playCount < maxPlays && isTesting && testType === "speaker") {
          playCount++;
          audioEl.play().catch((error) => {
            console.error("Error playing audio:", error);
          });
        }
      };

      // Set up onended handler to handle repeating playback
      audioEl.onended = () => {
        if (playCount < maxPlays && isTesting && testType === "speaker") {
          // Wait 2 seconds before playing again
          setTimeout(playWithDelay, 2000);
        } else if (playCount >= maxPlays) {
          // We've reached max plays, show toast notification
          toast.info("Speaker test complete");
        }
      };

      audioEl.oncanplaythrough = () => {
        if (VERBOSE_LOGGING)
          console.log("Audio can play through, starting playback and analysis");
        startSpeakerAnalysis();
        playWithDelay(); // Start the first play
      };

      audioEl.onerror = () => {
        console.error("Audio element error:");
        if (!hasErrored) {
          toast.error("Failed to load test sound");
          hasErrored = true;
        }
      };

      return () => {
        if (VERBOSE_LOGGING) console.log("Cleaning up speaker test");
        // First make sure to cancel any animations
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }

        // Then run the full cleanup
        cleanupSpeakerAnalysis();

        // Finally, clean up the audio element
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = "";
          audioRef.current.onended = null;
          audioRef.current.oncanplaythrough = null;
          audioRef.current.onerror = null;
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
          level={
            isTesting && testType === "mic" ? Math.max(micLevel, 5) : micLevel
          }
          isActive={isTesting && testType === "mic"}
          type="microphone"
          pulse={micPulse}
        />
      </div>

      <div className="flex gap-3">
        <Button
          variant={isTesting && testType === "mic" ? "default" : "outline"}
          onClick={() => {
            if (isTesting && testType === "mic") {
              toast.info("Mic test: Stop Test button pressed (button branch)");
              setIsTesting(false);
              setTestType(null);
              cleanupMicAnalysis();
              toast.info("Mic test stopped (button branch)");
            } else {
              toast.info("Mic test: Start Test button pressed (button branch)");
              handleTestMic();
            }
          }}
          className="min-w-24"
          aria-label={
            isTesting && testType === "mic"
              ? "Stop Microphone Test"
              : "Start Microphone Test"
          }
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
        see the bars move.
      </div>

      <div className="w-full max-w-md mb-6">
        <AudioLevelMeter
          level={speakerLevel}
          isActive={isSpeakerTestActive}
          pulse={speakerPulse}
        />
      </div>

      <Button
        variant={isSpeakerTestActive ? "default" : "outline"}
        onClick={testSpeaker}
        className={`min-w-24 ${
          isSpeakerTestActive ? "bg-white hover:bg-gray-200 text-black" : ""
        }`}
        aria-label={
          isSpeakerTestActive ? "Stop Speaker Test" : "Start Speaker Test"
        }
      >
        {isSpeakerTestActive ? "Stop Test" : "Start Test"}
      </Button>
    </div>
  );

  // --- Test Initiation ---
  const handleTestMic = useCallback(() => {
    if (!micEnabled) {
      toast.error("Please unmute your microphone before testing");
      return;
    }
    toast.info("Mic test: Start Test button pressed");
    setIsTesting(true);
    setTestType("mic");
    setMicLevel(5);
    if (VERBOSE_LOGGING) console.log("Test mic requested");
  }, [micEnabled]);

  // Cleanup function for speaker test
  const speakerTestCleanup = useCallback(() => {
    setIsSpeakerTestActive(false);

    // Cancel animation frame if active
    if (speakerAnalysisFrameRef.current) {
      cancelAnimationFrame(speakerAnalysisFrameRef.current);
      speakerAnalysisFrameRef.current = null;
    }

    // Clear timeout if active
    if (speakerTestTimeoutRef.current) {
      clearTimeout(speakerTestTimeoutRef.current);
      speakerTestTimeoutRef.current = null;
    }

    // Stop all oscillators
    if (
      speakerOscillatorRefs.current &&
      speakerOscillatorRefs.current.length > 0
    ) {
      speakerOscillatorRefs.current.forEach((osc) => {
        try {
          osc.stop();
          osc.disconnect();
        } catch (error) {
          console.error("Error stopping oscillator:", error);
        }
      });
      speakerOscillatorRefs.current = [];
    }

    // Disconnect gain nodes
    if (speakerGainRefs.current && speakerGainRefs.current.length > 0) {
      speakerGainRefs.current.forEach((gain) => {
        try {
          gain.disconnect();
        } catch (error) {
          console.error("Error disconnecting gain node:", error);
        }
      });
      speakerGainRefs.current = [];
    }

    // Close audio context
    if (speakerAudioContextRef.current) {
      try {
        speakerAudioContextRef.current.close();
      } catch (error) {
        console.error("Error closing AudioContext:", error);
      }
      speakerAudioContextRef.current = null;
    }

    // Clean up audio element
    if (speakerAudioElRef.current) {
      speakerAudioElRef.current.pause();
      speakerAudioElRef.current.src = "";
      speakerAudioElRef.current = null;
    }

    // Reset source node
    if (speakerSourceNodeRef.current) {
      try {
        speakerSourceNodeRef.current.disconnect();
      } catch (error) {
        console.error("Error disconnecting speaker source node:", error);
      }
      speakerSourceNodeRef.current = null;
    }

    // Reset speaker level
    setSpeakerLevel(0);
  }, []);

  // Speaker test function
  const testSpeaker = useCallback(() => {
    if (isSpeakerTestActive) {
      // Already running, so stop the test
      speakerTestCleanup();
      return;
    }

    // Show toast notification at the start
    toast.info(
      "Speaker test starting - please ensure your volume is turned up"
    );

    setIsSpeakerTestActive(true);

    try {
      // Create an audio context for the test
      const audioCtx = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)();
      speakerAudioContextRef.current = audioCtx;

      // Create an audio element for routing to the selected output device
      const routingAudioEl = new Audio();
      routingAudioEl.autoplay = true;
      speakerAudioElRef.current = routingAudioEl;

      // Check if the selected device is supported
      let outputConnected = false;
      if (selectedSpeaker && "setSinkId" in HTMLAudioElement.prototype) {
        try {
          routingAudioEl
            .setSinkId(selectedSpeaker)
            .then(() => {
              console.log("Audio output successfully set to:", selectedSpeaker);
              outputConnected = true;
            })
            .catch((error) => {
              console.error("Error setting sink ID:", error);
            });
        } catch (error) {
          console.error("Error setting sink ID:", error);
        }
      }

      // Create analyzer for visualization
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.3;

      // Create oscillators for test sound
      const osc1 = audioCtx.createOscillator();
      osc1.type = "square"; // Square wave is more audible
      osc1.frequency.value = 440; // A4 note

      const osc2 = audioCtx.createOscillator();
      osc2.type = "sine";
      osc2.frequency.value = 587.33; // D5 note - creates an interval with A4

      // Create gain nodes for volume control
      const gain1 = audioCtx.createGain();
      gain1.gain.value = 0.3; // Higher gain for better audibility

      const gain2 = audioCtx.createGain();
      gain2.gain.value = 0.25;

      // Connect nodes
      osc1.connect(gain1);
      osc2.connect(gain2);

      gain1.connect(analyser);
      gain2.connect(analyser);

      // If we successfully set the sink ID, route through the audio element
      if (outputConnected && "setSinkId" in HTMLAudioElement.prototype) {
        const sourceNode = audioCtx.createMediaElementSource(routingAudioEl);
        sourceNode.connect(audioCtx.destination);
        speakerSourceNodeRef.current = sourceNode;
      } else {
        // Otherwise connect directly to the destination
        analyser.connect(audioCtx.destination);
      }

      // Store references for cleanup
      speakerOscillatorRefs.current = [osc1, osc2];
      speakerGainRefs.current = [gain1, gain2];

      // Start oscillators
      osc1.start();
      osc2.start();

      // Start analysis loop
      const analyzeLoop = () => {
        if (!isSpeakerTestActive) return;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);

        // Calculate level - amplify for better visualization
        const sum = dataArray.reduce((acc, val) => acc + val, 0);
        const avg = sum / dataArray.length;
        const speakerLevel = Math.min(100, avg * 2); // Amplify for better visibility

        setSpeakerLevel(speakerLevel);

        // Set pulse when level exceeds threshold
        if (speakerLevel > 30) {
          setSpeakerPulse(true);
          setTimeout(() => setSpeakerPulse(false), 300);
        }

        speakerAnalysisFrameRef.current = requestAnimationFrame(analyzeLoop);
      };

      speakerAnalysisFrameRef.current = requestAnimationFrame(analyzeLoop);

      // Set a timeout to cleanup after 5 seconds
      speakerTestTimeoutRef.current = setTimeout(() => {
        // Fade out the oscillators gracefully
        const currentTime = audioCtx.currentTime;
        gain1.gain.linearRampToValueAtTime(0, currentTime + 0.5);
        gain2.gain.linearRampToValueAtTime(0, currentTime + 0.5);

        // Cleanup after fade out
        setTimeout(() => {
          speakerTestCleanup();
          toast.success(
            "Speaker test completed - if you didn't hear any sound, check your device volume settings"
          );
        }, 600);
      }, 5000); // Extended to 5 seconds for better user experience
    } catch (error) {
      console.error("Error in speaker test:", error);
      toast.error("Failed to run speaker test");
      speakerTestCleanup();
    }
  }, [isSpeakerTestActive, selectedSpeaker, speakerTestCleanup]);

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
