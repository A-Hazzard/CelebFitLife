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

  // Popover states
  const [popoverStates, setPopoverStates] = useState({
    mic: false,
    speaker: false,
    camera: false,
  });

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Update refs for audio nodes (keep these as refs)
  const micAnalyserRef = useRef<AnalyserNode | null>(null);
  const micSourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const micGainNodeRef = useRef<GainNode | null>(null);
  const speakerAnalyserRef = useRef<AnalyserNode | null>(null);
  const speakerSourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);

  // --- Utility Functions ---
  const cleanupMicAnalysis = useCallback(() => {
    console.log("Cleaning up mic analysis resources...");
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    micStreamRef.current?.getTracks().forEach((track) => track.stop());
    micStreamRef.current = null;
    setMicLevel(0);
  }, []);

  const cleanupSpeakerAnalysis = useCallback(() => {
    console.log("Cleaning up speaker analysis");
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Disconnect source node, not the stream (which doesn't have disconnect method)
    speakerSourceNodeRef.current?.disconnect();
    speakerAnalyserRef.current?.disconnect();

    // Clear references to nodes
    speakerSourceNodeRef.current = null;
    speakerAnalyserRef.current = null;
    setSpeakerLevel(0);
  }, []);

  const closeAudioContext = useCallback(() => {
    if (audioContext && audioContext.state !== "closed") {
      console.log("Closing AudioContext...");
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
          (window as any).webkitAudioContext)();
        setAudioContext(currentContext);
        console.log("Created new AudioContext. State:", currentContext.state);
      } catch (e) {
        console.error("Failed to create AudioContext:", e);
        toast.error("Web Audio API is not supported or blocked.");
        return null;
      }
    } else {
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
      console.log(
        "Getting microphone stream for device:",
        deviceId || "default"
      );

      // Stop any existing stream first
      if (micStreamRef.current) {
        console.log("Stopping existing mic stream");
        micStreamRef.current.getTracks().forEach((track) => track.stop());
        micStreamRef.current = null;
      }

      // Get new stream
      let constraints: MediaStreamConstraints = {
        audio: deviceId ? { deviceId: { exact: deviceId } } : true,
        video: false,
      };

      console.log(
        "Requesting microphone with constraints:",
        JSON.stringify(constraints)
      );
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      console.log(
        "Microphone stream acquired successfully:",
        stream.active,
        "Tracks:",
        stream.getAudioTracks().length,
        "Label:",
        stream.getAudioTracks()[0]?.label
      );

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
        console.log("Requesting media permissions...");
        await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
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
        console.log(
          `Found ${mics.length} mics, ${speakers.length} speakers, ${cameras.length} cameras.`
        );
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
      console.log("Device enumeration effect cleanup.");
      // Ensure streams are stopped on unmount
      micStreamRef.current?.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
      closeAudioContext(); // Close context on unmount
    };
  }, [closeAudioContext]);

  // --- Test Initiation ---
  const handleTestSpeaker = useCallback(() => {
    setSpeakerLevel(0);
    setTestType("speaker");
    setIsTesting(true);

    // Note: The actual audio setup and analysis is now handled by the useEffect
    console.log("Test speaker requested");
  }, []);

  const handleTestMic = useCallback(async () => {
    setMicLevel(0);
    setTestType("mic");
    setIsTesting(true);

    // Note: The actual stream acquisition and analysis is now handled by the useEffect
    console.log("Test mic requested");
  }, []);

  const handleTestCamera = useCallback(() => {
    setIsTesting(true);
    setTestType("camera");
    // No specific action needed other than opening the dialog
  }, []);

  const stopTesting = useCallback(() => {
    console.log("Stopping tests...");
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
    // Consider closing context only if BOTH are fully stopped and no longer needed
    // closeAudioContext();
  }, [cleanupMicAnalysis, cleanupSpeakerAnalysis]);

  // --- Analysis Logic ---
  const startMicAnalysis = useCallback(() => {
    console.log(
      "Starting mic analysis - Stream check:",
      !!micStreamRef.current
    );
    if (!micStreamRef.current) {
      console.warn("Cannot start mic analysis: Stream not available.");
      toast.error("Microphone stream not available. Please check permissions.");
      return;
    }

    try {
      const context = getAudioContext();
      if (!context) {
        console.error("Failed to get audio context");
        toast.error(
          "Failed to initialize audio context. Please refresh and try again."
        );
        return;
      }

      console.log(
        "Starting microphone analysis with valid stream and context."
      );
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      // Clean up any existing nodes
      micSourceNodeRef.current?.disconnect();
      micGainNodeRef.current?.disconnect();
      micAnalyserRef.current?.disconnect();

      // Create new nodes
      try {
        const analyser = context.createAnalyser();
        analyser.fftSize = FFT_SIZE_MIC;
        analyser.smoothingTimeConstant = SMOOTHING_MIC;
        micAnalyserRef.current = analyser;

        console.log(
          "Creating MediaStreamSource for mic:",
          micStreamRef.current.active,
          micStreamRef.current.getAudioTracks().length
        );
        const source = context.createMediaStreamSource(micStreamRef.current);
        micSourceNodeRef.current = source;
        console.log("MediaStreamSource created successfully");

        const gainNode = context.createGain();
        gainNode.gain.value = GAIN_MIC;
        micGainNodeRef.current = gainNode;
        console.log("Gain node created with value:", GAIN_MIC);

        // Connect the nodes
        source.connect(gainNode);
        gainNode.connect(analyser);
        console.log("Audio nodes connected successfully");

        // Analysis setup
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        let frameCount = 0;

        const runAnalysis = () => {
          if (!micAnalyserRef.current) {
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
            const level = Math.min(100, Math.max(0, (peak / 255) * 100 * 1.8)); // Increased scaling

            if (frameCount % 3 === 0 || Math.abs(level - micLevel) > 2) {
              setMicLevel(level);
              if (level > 5) {
                console.log(
                  `Mic level: ${level.toFixed(
                    1
                  )}, Peak: ${peak}, Avg: ${average.toFixed(1)}`
                );
              }
            }

            frameCount++;
            animationFrameRef.current = requestAnimationFrame(runAnalysis);
          } catch (analysisError) {
            console.error("Error in analysis loop:", analysisError);
            setMicLevel(0);
          }
        };

        // Start the analysis loop
        runAnalysis();
        console.log("Microphone analysis loop started");
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
  }, [getAudioContext, cleanupMicAnalysis, micLevel]);

  const startSpeakerAnalysis = useCallback(() => {
    try {
      console.log("Starting speaker analysis");
      const context = getAudioContext();
      if (!context) {
        console.error("Failed to get audio context");
        toast.error("Failed to initialize audio context for speaker test");
        return;
      }

      if (!audioRef.current) {
        console.error("No audio element available for speaker analysis");
        toast.error("Speaker test audio not ready");
        return;
      }

      // Clean up existing analyzer
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      speakerSourceNodeRef.current?.disconnect();
      speakerAnalyserRef.current?.disconnect();

      try {
        console.log("Creating source node from audio element");
        const sourceNode = context.createMediaElementSource(audioRef.current);
        speakerSourceNodeRef.current = sourceNode;

        const analyser = context.createAnalyser();
        analyser.fftSize = FFT_SIZE_SPEAKER;
        analyser.smoothingTimeConstant = SMOOTHING_SPEAKER;
        speakerAnalyserRef.current = analyser;

        // Connect audio to both analyzer and speakers
        sourceNode.connect(analyser);
        sourceNode.connect(context.destination);
        console.log("Speaker audio nodes connected successfully");

        // Create visualization
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        let time = 0;
        let frameCount = 0;

        const runVisualization = () => {
          if (!speakerAnalyserRef.current) {
            console.log("Speaker analysis loop stopping: Analyser cleared");
            return;
          }

          try {
            speakerAnalyserRef.current.getByteFrequencyData(dataArray);

            // Calculate real level from frequency data
            let sum = 0;
            let peak = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
              if (dataArray[i] > peak) peak = dataArray[i];
            }

            // Also add a sine wave pattern for visual feedback
            const baseLevel = (sum / dataArray.length / 255) * 80;
            time += 0.1;

            // Combine real audio data with a sine wave for better visual feedback
            // This helps even if the audio is quiet or browser doesn't provide real data
            const pulseFactor = (Math.sin(time) + 1) / 2; // 0 to 1 range
            const pulseAmount = 20; // Max additional percentage to add

            // Final level with pulse effect
            const level = Math.min(100, baseLevel + pulseFactor * pulseAmount);

            if (frameCount % 2 === 0 || Math.abs(level - speakerLevel) > 1) {
              setSpeakerLevel(level);
              if (frameCount % 15 === 0) {
                console.log(
                  `Speaker level: ${level.toFixed(
                    1
                  )}, Base: ${baseLevel.toFixed(1)}, Pulse: ${(
                    pulseFactor * pulseAmount
                  ).toFixed(1)}`
                );
              }
            }

            frameCount++;
            animationFrameRef.current = requestAnimationFrame(runVisualization);
          } catch (error) {
            console.error("Error in speaker visualization loop:", error);
            setSpeakerLevel(0);
          }
        };

        // Start visualization loop
        runVisualization();
        console.log("Speaker visualization started");
      } catch (error) {
        console.error("Failed to create speaker analysis nodes:", error);
        toast.error("Failed to initialize speaker analyzer");
        cleanupSpeakerAnalysis();
      }
    } catch (error) {
      console.error("Critical error in startSpeakerAnalysis:", error);
      toast.error("Failed to set up speaker test");
      cleanupSpeakerAnalysis();
    }
  }, [getAudioContext, cleanupSpeakerAnalysis, speakerLevel]);

  // Update the microphone related useEffect with better error handling
  useEffect(() => {
    // Handle microphone testing
    if (isTesting && testType === "mic") {
      console.log("Setting up microphone test:", selectedMic);

      const setupMic = async () => {
        try {
          const stream = await getMicStream(selectedMic);
          if (stream) {
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
        console.log("Cleaning up mic test");
        cleanupMicAnalysis();
      };
    }
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
        console.log("Camera setup skipped (no selection or disabled).");
        return;
      }

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
        console.log("Camera stream acquired.");
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
      console.log("Camera stream effect cleanup.");
      cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [selectedCamera, cameraEnabled, getDeviceName]);

  // Update the speaker test useEffect
  useEffect(() => {
    // Handle speaker testing
    if (isTesting && testType === "speaker") {
      console.log("Setting up speaker test");

      // Audio element for speaker test
      const audioEl = new Audio("/audio/sound-test.mp3");
      audioEl.loop = true;

      if (selectedSpeaker) {
        try {
          // @ts-ignore - setSinkId exists but TypeScript doesn't know about it
          if (audioEl.setSinkId && typeof audioEl.setSinkId === "function") {
            audioEl
              .setSinkId(selectedSpeaker)
              .then(() => {
                console.log(`Audio output device set to ${selectedSpeaker}`);
              })
              .catch((err) => {
                console.error("Error setting audio output device:", err);
                toast.error("Failed to set audio output device");
              });
          } else {
            console.warn("setSinkId not supported in this browser");
          }
        } catch (err) {
          console.error("Error setting audio sink:", err);
        }
      }

      audioEl.oncanplaythrough = () => {
        console.log("Audio can play through, starting playback");
        audioEl.play().catch((err) => {
          console.error("Error playing audio:", err);
          toast.error("Failed to play test sound");
        });
        startSpeakerAnalysis();
      };

      audioEl.onerror = (err) => {
        console.error("Audio element error:", err);
        toast.error("Failed to load test sound");
      };

      // Save reference for cleanup
      audioRef.current = audioEl;

      return () => {
        console.log("Cleaning up speaker test");
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = "";
          audioRef.current = null;
        }
        cleanupSpeakerAnalysis();
      };
    }
  }, [
    isTesting,
    testType,
    selectedSpeaker,
    startSpeakerAnalysis,
    cleanupSpeakerAnalysis,
  ]);

  // --- UI Handlers ---
  const togglePopover = (type: "mic" | "speaker" | "camera") => {
    setPopoverStates((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  const handleDeviceChange = (
    deviceType: "mic" | "speaker" | "camera",
    deviceId: string
  ) => {
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
              If you don't hear anything, check system volume and the selected
              output device.
            </p>
          </div>
          <DialogFooter className="justify-between sm:justify-between">
            <Button
              variant="outline"
              className="text-gray-300 border-gray-600 hover:bg-gray-700"
              onClick={() => {
                if (audioRef.current) {
                  audioRef.current.currentTime = 0;
                  audioRef.current
                    .play()
                    .catch((err) => console.error("Replay failed:", err));
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
                  micLevel > 5 ? "bg-green-500 animate-pulse" : "bg-gray-600"
                }`}
              ></div>
              <p className="text-xs text-gray-400">
                {micLevel < 5
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

// Helper CSS classes (consider moving to a global CSS or Tailwind plugin)
const popoverItem =
  "flex items-center justify-between px-3 py-1.5 w-full text-xs text-left hover:bg-gray-700 text-white rounded-sm cursor-pointer";
const dialogSelectClasses =
  "w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm focus:ring-brandOrange focus:border-brandOrange";

// Inject helper classes (Example - requires setup for actual injection or use Tailwind directly)
// For demonstration, assume these classes exist or are applied inline/via CSS modules
/*
.popover-item { @apply flex items-center justify-between px-3 py-1.5 w-full text-xs text-left hover:bg-gray-700 text-white rounded-sm cursor-pointer; }
.dialog-select { @apply w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm focus:ring-brandOrange focus:border-brandOrange; }
*/

export default DeviceTester;
