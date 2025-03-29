import React, { useState, useEffect, useRef, useCallback } from "react";
import { Mic, Camera, Volume2, ChevronUp, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import AudioLevelMeter from "./AudioLevelMeter";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface DeviceOption {
  deviceId: string;
  label: string;
}

interface DeviceTesterProps {
  onComplete: () => void;
  className?: string;
}

// Constants
const FFT_SIZE_MIC = 1024;
const SMOOTHING_MIC = 0.3;
const GAIN_MIC = 2.0; // Adjusted gain
const FFT_SIZE_SPEAKER = 256;
const SMOOTHING_SPEAKER = 0.6;
const VERBOSE_LOGGING = false; // Disable verbose logging for production

const DeviceTester: React.FC<DeviceTesterProps> = ({
  onComplete,
  className = "",
}) => {
  // Device lists
  const [audioInputs, setAudioInputs] = useState<DeviceOption[]>([]);
  const [audioOutputs, setAudioOutputs] = useState<DeviceOption[]>([]);
  const [videoInputs, setVideoInputs] = useState<DeviceOption[]>([]);

  // Selected devices
  const [selectedMic, setSelectedMic] = useState<string>("");
  const [selectedSpeaker, setSelectedSpeaker] = useState<string>("");
  const [selectedCamera, setSelectedCamera] = useState<string>("");

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

  // Enhance the getMicStream function with better error handling
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

      // Get new stream
      const constraints: MediaStreamConstraints = {
        audio: deviceId
          ? {
              deviceId: { exact: deviceId },
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            }
          : true,
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
      console.error("Failed to get microphone stream:", error);
      toast.error(
        `Failed to access microphone: ${
          (error as Error).message || "Unknown error"
        }`
      );
      return null;
    }
  }, []);

  // Helper function to get device name - moved up to prevent reference errors
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

  // --- Device Handling Effects ---
  // Get devices on mount
  useEffect(() => {
    let isMounted = true;
    const getDevices = async () => {
      try {
        if (VERBOSE_LOGGING) console.log("Requesting media permissions...");
        await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        if (VERBOSE_LOGGING)
          console.log("Permissions granted. Enumerating devices...");
        const devices = await navigator.mediaDevices.enumerateDevices();
        if (!isMounted) return;

        const mics: DeviceOption[] = [];
        const speakers: DeviceOption[] = [];
        const cameras: DeviceOption[] = [];
        devices.forEach((device) => {
          const option = {
            deviceId: device.deviceId,
            label:
              device.label ||
              `${device.kind} (${device.deviceId.substring(0, 8)}...)`,
          };
          if (device.kind === "audioinput") mics.push(option);
          else if (device.kind === "audiooutput") speakers.push(option);
          else if (device.kind === "videoinput") cameras.push(option);
        });

        if (VERBOSE_LOGGING) {
          console.log(
            `Found ${mics.length} mics, ${speakers.length} speakers, ${cameras.length} cameras.`
          );
        }

        setAudioInputs(mics);
        setAudioOutputs(speakers);
        setVideoInputs(cameras);
        if (mics.length > 0) setSelectedMic((prev) => prev || mics[0].deviceId);
        if (speakers.length > 0)
          setSelectedSpeaker((prev) => prev || speakers[0].deviceId);
        if (cameras.length > 0)
          setSelectedCamera((prev) => prev || cameras[0].deviceId);
      } catch (error) {
        console.error("Error accessing media devices:", error);
        toast.error(
          "Failed to access media devices. Please check browser permissions."
        );
      }
    };
    getDevices();
    return () => {
      isMounted = false;
      if (VERBOSE_LOGGING) console.log("Device enumeration effect cleanup.");
      // Ensure streams are stopped on unmount
      micStreamRef.current?.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
      closeAudioContext(); // Close context on unmount
    };
  }, [closeAudioContext]);

  // --- Test Initiation ---
  const handleTestSpeaker = useCallback(() => {
    setIsTesting(true);
    setTestType("speaker");
    // Note: The actual audio setup and analysis is now handled by the useEffect
    if (VERBOSE_LOGGING) console.log("Test speaker requested");
  }, []);

  const handleTestMic = useCallback(() => {
    setIsTesting(true);
    setTestType("mic");
    // Note: The actual stream acquisition and analysis is now handled by the useEffect
    if (VERBOSE_LOGGING) console.log("Test mic requested");
  }, []);

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

  // --- Analysis Logic ---
  const startMicAnalysis = useCallback(() => {
    try {
      if (VERBOSE_LOGGING) console.log("Starting mic analysis");
      if (!micStreamRef.current) {
        console.error("No mic stream available");
        toast.error("Microphone stream not available");
        return;
      }

      if (VERBOSE_LOGGING) {
        console.log("Stream details:", {
          active: micStreamRef.current.active,
          trackCount: micStreamRef.current.getAudioTracks().length,
          track0Enabled: micStreamRef.current.getAudioTracks()[0]?.enabled,
          track0ReadyState:
            micStreamRef.current.getAudioTracks()[0]?.readyState,
          track0Settings: micStreamRef.current
            .getAudioTracks()[0]
            ?.getSettings(),
        });
      }

      try {
        if (VERBOSE_LOGGING) console.log("Getting audio context");
        const context = getAudioContext();
        if (VERBOSE_LOGGING)
          console.log("Audio context obtained:", !!context, context?.state);

        if (!context) {
          console.error("Failed to get audio context");
          toast.error(
            "Failed to initialize audio context. Please refresh and try again."
          );
          return;
        }

        if (VERBOSE_LOGGING) {
          console.log(
            "Starting microphone analysis with valid stream and context"
          );
          console.log("Animation frame exists:", !!animationFrameRef.current);
        }

        if (animationFrameRef.current) {
          if (VERBOSE_LOGGING)
            console.log("Canceling existing animation frame");
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }

        // Clean up any existing nodes
        if (VERBOSE_LOGGING) {
          console.log("Cleaning up existing audio nodes");
          console.log("Existing mic source node:", !!micSourceNodeRef.current);
          console.log("Existing mic gain node:", !!micGainNodeRef.current);
          console.log("Existing mic analyser node:", !!micAnalyserRef.current);
        }

        if (micSourceNodeRef.current) {
          if (VERBOSE_LOGGING) console.log("Disconnecting source node");
          micSourceNodeRef.current.disconnect();
        }
        if (micGainNodeRef.current) {
          if (VERBOSE_LOGGING) console.log("Disconnecting gain node");
          micGainNodeRef.current.disconnect();
        }
        if (micAnalyserRef.current) {
          if (VERBOSE_LOGGING) console.log("Disconnecting analyser node");
          micAnalyserRef.current.disconnect();
        }

        // Create new nodes
        try {
          if (VERBOSE_LOGGING) {
            console.log("Creating new audio nodes");
            console.log("Creating analyser node");
          }

          const analyser = context.createAnalyser();
          analyser.fftSize = FFT_SIZE_MIC;
          analyser.smoothingTimeConstant = SMOOTHING_MIC;
          micAnalyserRef.current = analyser;

          if (VERBOSE_LOGGING)
            console.log("Analyser created with fftSize:", FFT_SIZE_MIC);

          if (VERBOSE_LOGGING) {
            console.log("Creating MediaStreamSource from mic stream");
            console.log("Stream active:", micStreamRef.current.active);
            console.log(
              "Audio tracks:",
              micStreamRef.current.getAudioTracks().length
            );
          }

          try {
            const source = context.createMediaStreamSource(
              micStreamRef.current
            );
            micSourceNodeRef.current = source;
            if (VERBOSE_LOGGING)
              console.log("MediaStreamSource created successfully");
          } catch (sourceError) {
            console.error("Failed to create media stream source:", sourceError);
            throw sourceError;
          }

          if (VERBOSE_LOGGING) console.log("Creating gain node");
          const gainNode = context.createGain();
          gainNode.gain.value = GAIN_MIC;
          micGainNodeRef.current = gainNode;
          if (VERBOSE_LOGGING)
            console.log("Gain node created with value:", GAIN_MIC);

          // Connect the nodes
          if (VERBOSE_LOGGING) {
            console.log("Connecting audio nodes");
            console.log("Source node exists:", !!micSourceNodeRef.current);
            console.log("Gain node exists:", !!micGainNodeRef.current);
            console.log("Analyser node exists:", !!micAnalyserRef.current);
          }

          try {
            micSourceNodeRef.current.connect(gainNode);
            if (VERBOSE_LOGGING) console.log("Source connected to gain");
            gainNode.connect(analyser);
            if (VERBOSE_LOGGING) console.log("Gain connected to analyser");
            if (VERBOSE_LOGGING)
              console.log("Audio nodes connected successfully");
          } catch (connectError) {
            console.error("Failed to connect audio nodes:", connectError);
            throw connectError;
          }

          // Analysis setup
          if (VERBOSE_LOGGING) {
            console.log("Setting up analysis loop");
            console.log("Frequency bin count:", analyser.frequencyBinCount);
          }

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          let frameCount = 0;

          const runAnalysis = () => {
            if (!micAnalyserRef.current) {
              if (VERBOSE_LOGGING)
                console.log("Mic analysis loop stopping: Analyser cleared.");
              return;
            }

            try {
              micAnalyserRef.current.getByteFrequencyData(dataArray);

              let sum = 0;
              let peak = 0;
              for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
                if (dataArray[i] > peak) peak = dataArray[i];
              }

              // Apply level calculation with better scaling for visualization
              const average = sum / dataArray.length;

              if (VERBOSE_LOGGING) {
                console.log(
                  `DEBUG - Peak: ${peak}, Avg: ${average.toFixed(1)}`
                );
              }

              // Apply a noise floor threshold - any signal below this is considered noise
              const noiseFloor = 10; // Lower threshold to allow more sensitivity

              // Subtract noise floor and apply more reasonable scaling
              const adjustedPeak = Math.max(0, peak - noiseFloor);

              // Apply a more sensitive curve to make lower sounds more visible
              let level = 0;
              if (adjustedPeak > 0) {
                // More sensitive scale for lower values
                level = Math.min(
                  100,
                  Math.pow(adjustedPeak / (255 - noiseFloor), 0.75) * 130
                );
              }

              if (VERBOSE_LOGGING) {
                console.log(
                  `DEBUG - Adjusted Peak: ${adjustedPeak}, Calculated Level: ${level.toFixed(
                    1
                  )}`
                );
              }

              // Use the ref for comparison instead of the state dependency
              if (
                frameCount % 1 === 0 || // Update on every frame for immediate response
                Math.abs(level - currentMicLevelRef.current) > 0.5 // Lower threshold for more responsiveness
              ) {
                currentMicLevelRef.current = level; // Update ref
                setMicLevel(level);
                if (VERBOSE_LOGGING && level > 3) {
                  console.log(`UPDATING MIC LEVEL: ${level.toFixed(1)}`);
                }
              }

              frameCount++;
              animationFrameRef.current = requestAnimationFrame(runAnalysis);
            } catch (analysisError) {
              console.error("Error in analysis loop:", analysisError);
              setMicLevel(0);
              currentMicLevelRef.current = 0; // Reset ref on error
            }
          };

          // Start the analysis loop
          if (VERBOSE_LOGGING) console.log("Starting analysis loop");
          runAnalysis();
          if (VERBOSE_LOGGING) {
            console.log("Microphone analysis loop started");
            console.log("==========================================");
          }
        } catch (nodeError) {
          console.error("Error creating audio nodes:", nodeError);
          toast.error(
            "Failed to setup microphone analyzer - Error creating audio nodes"
          );
          cleanupMicAnalysis();
        }
      } catch (error) {
        console.error("Critical error in startMicAnalysis:", error);
        toast.error("Failed to initialize microphone analyzer.");
        cleanupMicAnalysis();
      }
    } catch (err) {
      console.error("Critical error in startMicAnalysis:", err);
      toast.error("Failed to start microphone test");
    }
  }, [getAudioContext, cleanupMicAnalysis]);

  const startSpeakerAnalysis = useCallback(() => {
    if (!audioContext || !audioRef.current) {
      console.warn(
        "Cannot start speaker analysis: AudioContext or audio element not ready."
      );
      return;
    }

    // Declare analyser and sourceNode at the function scope
    let analyser: AnalyserNode | null = null;
    let sourceNode:
      | MediaStreamAudioSourceNode
      | MediaElementAudioSourceNode
      | null = null;

    // Ensure speaker source node ref is cleared
    speakerSourceNodeRef.current = null;

    try {
      // Create Analyser node
      analyser = audioContext.createAnalyser();
      analyser.fftSize = FFT_SIZE_SPEAKER;
      analyser.smoothingTimeConstant = SMOOTHING_SPEAKER;
      speakerAnalyserRef.current = analyser;

      // Create MediaElementSourceNode
      console.log("Creating source node from audio element");
      sourceNode = audioContext.createMediaElementSource(audioRef.current);
      speakerSourceNodeRef.current = sourceNode; // Store in ref
    } catch (error: unknown) {
      const err = error as { name?: string; message?: string };
      console.error("Error creating initial audio nodes:", err.message);

      if (err.name === "InvalidStateError") {
        console.error(
          "Audio element already connected. Recreating audio element and source node."
        );
        // Recreate audio element
        const newAudioEl = new Audio("/audio/test-speaker.mp3");
        newAudioEl.loop = true;
        if (audioRef.current) audioRef.current.pause();
        audioRef.current = newAudioEl;

        if (audioRef.current) {
          audioRef.current.oncanplaythrough = () => {
            audioRef.current
              ?.play()
              .catch((e) => console.error("Play error:", e));
          };
          // Try recreating source node
          try {
            if (!audioContext || !audioRef.current) {
              throw new Error(
                "Context or element null during source recreation."
              );
            }
            // Assign to the higher-scoped sourceNode
            sourceNode = audioContext.createMediaElementSource(
              audioRef.current
            );
            speakerSourceNodeRef.current = sourceNode; // Update ref
            console.info("Successfully recreated media element source node.");
          } catch (recreateError: unknown) {
            const errRecreate = recreateError as { message?: string };
            console.error(
              "Error recreating media element source:",
              errRecreate.message
            );
            sourceNode = null; // Ensure sourceNode is null on error
            speakerSourceNodeRef.current = null;
          }
        } else {
          console.error("Failed to create new audio element.");
          sourceNode = null; // Ensure sourceNode is null if element creation failed
          speakerSourceNodeRef.current = null;
        }
      } else {
        // For other errors during initial node creation
        console.error("Unhandled error during speaker analysis setup:", err);
        toast.error("Failed to set up speaker test");
        cleanupSpeakerAnalysis();
        return; // Stop execution if initial setup failed critically
      }
    }

    // Connect nodes if sourceNode and analyser were successfully created/recreated
    if (sourceNode && analyser) {
      try {
        sourceNode.connect(analyser);
        analyser.connect(audioContext.destination);
        console.log("Connected speaker source -> analyser -> destination");

        // Start analysis loop
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        let animationFrameId: number;

        const analyse = () => {
          if (!analyser) return;
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const average = sum / dataArray.length;
          const level = Math.min(
            100,
            Math.round((average / 255) * 100 * GAIN_MIC)
          );

          // Update speaker level only if it changed significantly
          if (Math.abs(level - currentSpeakerLevelRef.current) > 0.5) {
            currentSpeakerLevelRef.current = level; // Update ref
            setSpeakerLevel(level);
          }

          animationFrameId = requestAnimationFrame(analyse);
        };
        animationFrameId = requestAnimationFrame(analyse);

        // Store cleanup function for animation frame
        speakerAnalysisCleanupRef.current = () => {
          cancelAnimationFrame(animationFrameId);
        };
      } catch (connectError: unknown) {
        const errConnect = connectError as { message?: string };
        console.error(
          "Error connecting speaker analysis nodes:",
          errConnect.message
        );
        toast.error("Failed to connect speaker analyzer");
        cleanupSpeakerAnalysis();
      }
    } else {
      console.error(
        "Failed to create source or analyser node, cannot start analysis."
      );
      toast.error("Failed to initialize speaker analyzer components.");
      cleanupSpeakerAnalysis();
    }
  }, [audioContext, cleanupSpeakerAnalysis]);

  // Update the microphone related useEffect with better error handling
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
      audioEl.loop = true;

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

  const toggleMicEnabled = () => setMicEnabled((prev) => !prev);
  const toggleCameraEnabled = () => setCameraEnabled((prev) => !prev);

  // --- Render ---
  return (
    <div className={`bg-gray-900 rounded-lg shadow-md text-white ${className}`}>
      <h2 className="text-2xl font-bold p-6 text-center">
        Device Setup & Test
      </h2>

      <div className="p-6 space-y-6">
        {/* Camera Preview */}
        <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4 relative border border-gray-700">
          {cameraEnabled && cameraStreamRef.current ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
              <div className="text-center text-gray-500">
                <Camera size={48} className="mx-auto mb-2" />
                <p>Camera Off or Not Selected</p>
              </div>
            </div>
          )}
        </div>

        {/* Device Controls Row */}
        <div className="grid grid-cols-3 gap-4">
          {/* Microphone Control */}
          <div className="flex flex-col items-center gap-2">
            <Button
              onClick={toggleMicEnabled}
              size="icon"
              variant={micEnabled ? "default" : "secondary"}
              className={`rounded-full ${
                micEnabled
                  ? "bg-brandOrange hover:bg-brandOrange/90 text-brandBlack"
                  : "bg-gray-700 hover:bg-gray-600 text-gray-400"
              }`}
            >
              <Mic size={20} />
            </Button>
            <Popover
              open={popoverStates.mic}
              onOpenChange={(isOpen) =>
                setPopoverStates((prev) => ({ ...prev, mic: isOpen }))
              }
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full text-xs truncate justify-between bg-gray-800 border-gray-700 hover:bg-gray-700"
                  disabled={!micEnabled}
                >
                  {micEnabled ? getDeviceName("mic", selectedMic) : "Mic Off"}
                  <ChevronUp
                    size={14}
                    className={`ml-1 transition-transform ${
                      popoverStates.mic ? "rotate-180" : ""
                    }`}
                  />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-60 p-0 bg-gray-800 border-gray-700">
                {audioInputs.length > 0 ? (
                  audioInputs.map((device) => (
                    <button
                      key={device.deviceId}
                      onClick={() => handleDeviceChange("mic", device.deviceId)}
                      className={popoverItem}
                    >
                      <span className="truncate flex-1 mr-2">
                        {device.label}
                      </span>
                      {selectedMic === device.deviceId && (
                        <Check size={16} className="text-brandOrange" />
                      )}
                    </button>
                  ))
                ) : (
                  <div className={popoverItem + " text-gray-400"}>
                    No mics found
                  </div>
                )}
                <div className="p-2 border-t border-gray-700 mt-1">
                  <Button
                    size="sm"
                    className="w-full bg-brandOrange text-brandBlack hover:bg-brandOrange/90"
                    onClick={handleTestMic}
                    disabled={!micEnabled}
                  >
                    Test Mic
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Speaker Control */}
          <div className="flex flex-col items-center gap-2">
            <Button
              size="icon"
              variant="default"
              className="rounded-full bg-brandOrange text-brandBlack cursor-default"
            >
              <Volume2 size={20} />
            </Button>
            <Popover
              open={popoverStates.speaker}
              onOpenChange={(isOpen) =>
                setPopoverStates((prev) => ({ ...prev, speaker: isOpen }))
              }
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full text-xs truncate justify-between bg-gray-800 border-gray-700 hover:bg-gray-700"
                >
                  {getDeviceName("speaker", selectedSpeaker)}
                  <ChevronUp
                    size={14}
                    className={`ml-1 transition-transform ${
                      popoverStates.speaker ? "rotate-180" : ""
                    }`}
                  />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-60 p-0 bg-gray-800 border-gray-700">
                {audioOutputs.length > 0 ? (
                  audioOutputs.map((device) => (
                    <button
                      key={device.deviceId}
                      onClick={() =>
                        handleDeviceChange("speaker", device.deviceId)
                      }
                      className={popoverItem}
                    >
                      <span className="truncate flex-1 mr-2">
                        {device.label}
                      </span>
                      {selectedSpeaker === device.deviceId && (
                        <Check size={16} className="text-brandOrange" />
                      )}
                    </button>
                  ))
                ) : (
                  <div className={popoverItem + " text-gray-400"}>
                    No speakers found
                  </div>
                )}
                <div className="p-2 border-t border-gray-700 mt-1">
                  <Button
                    size="sm"
                    className="w-full bg-brandOrange text-brandBlack hover:bg-brandOrange/90"
                    onClick={handleTestSpeaker}
                  >
                    Test Speaker
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Camera Control */}
          <div className="flex flex-col items-center gap-2">
            <Button
              onClick={toggleCameraEnabled}
              size="icon"
              variant={cameraEnabled ? "default" : "secondary"}
              className={`rounded-full ${
                cameraEnabled
                  ? "bg-brandOrange hover:bg-brandOrange/90 text-brandBlack"
                  : "bg-gray-700 hover:bg-gray-600 text-gray-400"
              }`}
            >
              <Camera size={20} />
            </Button>
            <Popover
              open={popoverStates.camera}
              onOpenChange={(isOpen) =>
                setPopoverStates((prev) => ({ ...prev, camera: isOpen }))
              }
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full text-xs truncate justify-between bg-gray-800 border-gray-700 hover:bg-gray-700"
                  disabled={!cameraEnabled}
                >
                  {cameraEnabled
                    ? getDeviceName("camera", selectedCamera)
                    : "Camera Off"}
                  <ChevronUp
                    size={14}
                    className={`ml-1 transition-transform ${
                      popoverStates.camera ? "rotate-180" : ""
                    }`}
                  />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-60 p-0 bg-gray-800 border-gray-700">
                {videoInputs.length > 0 ? (
                  videoInputs.map((device) => (
                    <button
                      key={device.deviceId}
                      onClick={() =>
                        handleDeviceChange("camera", device.deviceId)
                      }
                      className={popoverItem}
                    >
                      <span className="truncate flex-1 mr-2">
                        {device.label}
                      </span>
                      {selectedCamera === device.deviceId && (
                        <Check size={16} className="text-brandOrange" />
                      )}
                    </button>
                  ))
                ) : (
                  <div className={popoverItem + " text-gray-400"}>
                    No cameras found
                  </div>
                )}
                {/* No separate test button for camera, preview is the test */}
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Confirm Button */}
        <div className="flex justify-center pt-4">
          <Button
            onClick={onComplete}
            size="lg"
            className="bg-brandOrange hover:bg-brandOrange/90 text-brandBlack font-semibold"
          >
            Confirm Settings & Join
          </Button>
        </div>

        {/* Hidden audio element */}
        <audio ref={audioRef} className="hidden" preload="metadata" />
      </div>

      {/* --- Test Dialogs --- */}
      {/* Speaker Test Dialog */}
      <Dialog
        open={isTesting && testType === "speaker"}
        onOpenChange={(open) => !open && stopTesting()}
      >
        <DialogContent className="bg-gray-800 text-white border-gray-700 sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-brandOrange">
              Testing Speaker
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              Do you hear the test sound?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {/* Speaker Selector (optional, could be removed if controlled outside) */}
            <select
              value={selectedSpeaker}
              onChange={(e) => handleDeviceChange("speaker", e.target.value)}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm focus:ring-brandOrange focus:border-brandOrange"
              style={{ color: "white", backgroundColor: "#374151" }}
              aria-label="Select speaker"
            >
              {audioOutputs.map((device) => (
                <option
                  key={device.deviceId}
                  value={device.deviceId}
                  style={{ backgroundColor: "white", color: "#1f2937" }}
                >
                  {device.label}
                </option>
              ))}
            </select>
            <div className="space-y-2">
              <p className="text-sm text-gray-400">Output Level:</p>
              <AudioLevelMeter
                level={speakerLevel}
                isActive={isTesting && testType === "speaker"}
                type="speaker"
              />
            </div>
            <p className="text-xs text-gray-400 text-center pt-2">
              If you don&apos;t hear anything, check system volume and the
              selected output device.
            </p>
          </div>
          <DialogFooter className="justify-between sm:justify-between">
            <Button
              variant="outline"
              className="text-gray-300 border-gray-600 hover:bg-gray-700"
              onClick={() => {
                // Complete reset for "Play Again"
                if (audioRef.current) {
                  // First stop and clean up everything
                  cleanupSpeakerAnalysis();
                  audioRef.current.pause();

                  // Reset the audio element
                  audioRef.current.currentTime = 0;

                  // Play again and restart analysis - Add null check
                  audioRef.current
                    ?.play()
                    .then(() => {
                      startSpeakerAnalysis();
                    })
                    .catch((err) => {
                      console.error("Replay failed:", err);
                      toast.error("Failed to replay test sound");
                    });
                } else {
                  console.warn(
                    "Play Again clicked but audio element ref is null."
                  );
                }
              }}
            >
              Play Again
            </Button>
            <Button
              className="bg-brandOrange hover:bg-brandOrange/90 text-brandBlack"
              onClick={stopTesting}
            >
              Yes, I Hear It
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mic Test Dialog */}
      <Dialog
        open={isTesting && testType === "mic"}
        onOpenChange={(open) => !open && stopTesting()}
      >
        <DialogContent className="bg-gray-800 text-white border-gray-700 sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-brandOrange">
              Testing Microphone
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              Speak into your microphone to see the level.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {/* Apply dialog-select class for styling */}
            <select
              value={selectedMic}
              onChange={(e) => handleDeviceChange("mic", e.target.value)}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm focus:ring-brandOrange focus:border-brandOrange"
              style={{ color: "white", backgroundColor: "#374151" }}
              aria-label="Select microphone"
            >
              {audioInputs.map((device) => (
                <option
                  key={device.deviceId}
                  value={device.deviceId}
                  style={{ backgroundColor: "white", color: "#1f2937" }}
                >
                  {device.label}
                </option>
              ))}
            </select>
            <div className="space-y-2">
              <p className="text-sm text-gray-400">Input Level:</p>
              <AudioLevelMeter
                level={micLevel}
                isActive={isTesting && testType === "mic"}
                type="microphone"
              />
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <div
                className={`h-2 w-2 rounded-full ${
                  micLevel > 10 ? "bg-green-500 animate-pulse" : "bg-gray-600"
                }`}
              ></div>
              <p className="text-xs text-gray-400">
                {micLevel < 10
                  ? "Speak or make a sound..."
                  : "Microphone detected sound!"}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              className="bg-brandOrange hover:bg-brandOrange/90 text-brandBlack w-full"
              onClick={stopTesting}
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Camera Test Dialog (Simplified as preview is main test) */}
      {/* Removing Camera Dialog for now as preview serves the purpose 
        <Dialog open={isTesting && testType === "camera"} onOpenChange={(open) => !open && stopTesting()}> 
            // ... Camera dialog content (optional) ... 
        </Dialog> 
        */}
    </div>
  );
};

// Helper CSS classes for UI components
const popoverItem =
  "flex items-center justify-between px-3 py-1.5 w-full text-xs text-left hover:bg-gray-700 text-white rounded-sm cursor-pointer";

export default DeviceTester;
