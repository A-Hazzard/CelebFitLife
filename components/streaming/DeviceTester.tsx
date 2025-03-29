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
    console.log("Cleaning up speaker analysis resources...");
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    speakerStreamRef.current?.disconnect();
    speakerAnalyserRef.current?.disconnect();
    speakerStreamRef.current = null;
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

  // Mic Stream Management
  useEffect(() => {
    let isCancelled = false;
    const setupMicStream = async () => {
      // Stop existing stream and analysis
      micStreamRef.current?.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
      cleanupMicAnalysis();

      if (!selectedMic || !micEnabled) {
        console.log("Mic setup skipped (no selection or disabled).");
        return;
      }

      console.log(`Setting up microphone stream for device: ${selectedMic}`);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            deviceId: { exact: selectedMic },
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: false, // Manual gain control preferred
          },
        });
        if (isCancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        micStreamRef.current = stream;
        console.log("Microphone stream acquired.");
        // Re-start analysis only if currently testing mic
        if (testType === "mic") {
          startMicAnalysis(); // Call analysis setup
        }
      } catch (error) {
        console.error("Error setting up microphone stream:", error);
        toast.error(
          `Failed to access microphone: ${getDeviceName("mic", selectedMic)}`
        );
      }
    };

    setupMicStream();

    return () => {
      isCancelled = true;
      console.log("Mic stream effect cleanup.");
      micStreamRef.current?.getTracks().forEach((track) => track.stop());
      cleanupMicAnalysis();
    };
  }, [selectedMic, micEnabled, testType, cleanupMicAnalysis]);

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
  }, [selectedCamera, cameraEnabled]);

  // --- Analysis Logic ---
  const startMicAnalysis = useCallback(() => {
    if (!micStreamRef.current) {
      console.warn("Cannot start mic analysis: Stream not available.");
      return;
    }
    const context = getAudioContext();
    if (!context) return; // Failed to get context

    console.log("Starting microphone analysis...");
    cleanupMicAnalysis(); // Clean previous nodes first

    try {
      const analyser = context.createAnalyser();
      analyser.fftSize = FFT_SIZE_MIC;
      analyser.smoothingTimeConstant = SMOOTHING_MIC;
      micAnalyserRef.current = analyser;

      const source = context.createMediaStreamSource(micStreamRef.current);
      micSourceNodeRef.current = source;

      const gainNode = context.createGain();
      gainNode.gain.value = GAIN_MIC;
      micGainNodeRef.current = gainNode;

      source.connect(gainNode);
      gainNode.connect(analyser);
      console.log("Mic analysis nodes connected.");

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let frameCount = 0;

      const runAnalysis = () => {
        if (!micAnalyserRef.current) {
          console.log("Mic analysis loop stopping: Analyser cleared.");
          return; // Stop loop if analyser is cleared
        }
        micAnalyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        let peak = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
          if (dataArray[i] > peak) peak = dataArray[i];
        }
        const average = sum / dataArray.length;
        const level = Math.min(100, Math.max(0, (peak / 255) * 100 * 1.5)); // Simplified level calc

        // Update state only if level changes significantly or periodically
        if (frameCount % 3 === 0 || Math.abs(level - micLevel) > 2) {
          setMicLevel(level);
          // console.log(`[Mic Analyzer Loop] Level: ${level.toFixed(1)}`); // Keep logs minimal
        }
        frameCount++;
        animationFrameRef.current = requestAnimationFrame(runAnalysis);
      };
      runAnalysis();
    } catch (error) {
      console.error("Error setting up mic analysis nodes:", error);
      toast.error("Failed to initialize microphone analyzer.");
      cleanupMicAnalysis();
    }
  }, [getAudioContext, cleanupMicAnalysis, micLevel]); // Include micLevel to optimize state updates

  const startSpeakerAnalysis = useCallback(() => {
    if (!audioRef.current) {
      console.warn("Cannot start speaker analysis: Audio element not ready.");
      return;
    }
    const context = getAudioContext();
    if (!context) return;

    console.log("Starting speaker analysis...");
    cleanupSpeakerAnalysis(); // Clean previous nodes first

    try {
      // Ensure source node is created only once for the audio element
      if (
        !speakerSourceNodeRef.current ||
        speakerSourceNodeRef.current.mediaElement !== audioRef.current
      ) {
        console.log(
          "Creating/Re-creating MediaElementAudioSourceNode for speaker."
        );
        speakerSourceNodeRef.current?.disconnect();
        const context = getAudioContext();
        if (!context || !audioRef.current) {
          console.error(
            "Cannot create speaker source node: context or audio element missing."
          );
          throw new Error("Audio context or element unavailable");
        }
        speakerSourceNodeRef.current = context.createMediaElementSource(
          audioRef.current
        );
      } else {
        console.log("Reusing existing MediaElementAudioSourceNode.");
      }

      const analyser = context.createAnalyser();
      analyser.fftSize = FFT_SIZE_SPEAKER;
      analyser.smoothingTimeConstant = SMOOTHING_SPEAKER;
      speakerAnalyserRef.current = analyser;

      // Connect: Source -> Analyser -> Destination
      speakerSourceNodeRef.current.connect(analyser);
      analyser.connect(context.destination);
      console.log("Speaker analysis nodes connected.");

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let frameCount = 0;

      const runAnalysis = () => {
        if (!speakerAnalyserRef.current) {
          console.log("Speaker analysis loop stopping: Analyser cleared.");
          return; // Stop loop
        }
        speakerAnalyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        const level = Math.min(100, Math.pow(average / 150, 0.7) * 100);

        // Update state only if level changes significantly or periodically
        if (frameCount % 3 === 0 || Math.abs(level - speakerLevel) > 2) {
          setSpeakerLevel(level);
          // console.log(`[Speaker Analyzer Loop] Level: ${level.toFixed(1)}`);
        }
        frameCount++;
        animationFrameRef.current = requestAnimationFrame(runAnalysis);
      };
      runAnalysis();
    } catch (error) {
      console.error("Error setting up speaker analysis nodes:", error);
      // Check for specific errors if possible (e.g., InvalidStateNode error)
      if (error instanceof DOMException && error.name === "InvalidStateError") {
        toast.error("Speaker analyzer error: Audio source issue. Try again.");
        // Attempt to reset the source node if this specific error occurs
        speakerSourceNodeRef.current = null;
      } else {
        toast.error("Failed to initialize speaker analyzer.");
      }
      cleanupSpeakerAnalysis();
    }
  }, [getAudioContext, cleanupSpeakerAnalysis, speakerLevel]); // Include speakerLevel

  // --- Test Initiation ---
  const handleTestSpeaker = useCallback(() => {
    setIsTesting(true);
    setTestType("speaker");
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.src = "/audio/sound-test.mp3";
      audioRef.current.loop = true;
      audioRef.current.volume = 0.6; // Slightly lower volume

      const playPromise = audioRef.current.play();
      playPromise
        .then(() => {
          console.log("Speaker test audio playing...");
          startSpeakerAnalysis(); // Start analysis after play begins
        })
        .catch((err) => {
          console.error("Error playing speaker test sound:", err);
          toast.error("Could not play test sound. Check console.");
          stopTesting(); // Stop test if playback fails
        });
    } else {
      toast.error("Audio element not ready for speaker test.");
    }
  }, [startSpeakerAnalysis]); // Add dependency

  const handleTestMic = useCallback(() => {
    setIsTesting(true);
    setTestType("mic");
    // Ensure stream exists before starting analysis
    if (micStreamRef.current) {
      startMicAnalysis();
    } else {
      console.warn(
        "Mic stream not ready yet for testing, effect should handle it."
      );
      // The useEffect for micStream should trigger analysis when ready
    }
  }, [startMicAnalysis]);

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
  }, [cleanupMicAnalysis, cleanupSpeakerAnalysis]); // Add dependencies

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
                      className="popover-item"
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
                  <div className="popover-item text-gray-400">
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
                      className="popover-item"
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
                  <div className="popover-item text-gray-400">
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
                      className="popover-item"
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
                  <div className="popover-item text-gray-400">
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
              className="dialog-select"
            >
              {audioOutputs.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
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
              className="dialog-select w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm focus:ring-brandOrange focus:border-brandOrange"
              aria-label="Select microphone"
            >
              {audioInputs.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
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
const popoverItemClasses =
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
