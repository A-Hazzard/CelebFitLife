import React, { useState, useEffect, useRef } from "react";
import { Mic, Camera, Volume2, ChevronUp, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAudioLevelMeter } from "@/lib/hooks/useAudioLevelMeter";
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
  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

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
  const [audioAnalyser, setAudioAnalyser] = useState<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Popover states
  const [micPopoverOpen, setMicPopoverOpen] = useState(false);
  const [speakerPopoverOpen, setSpeakerPopoverOpen] = useState(false);
  const [cameraPopoverOpen, setCameraPopoverOpen] = useState(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Initialize AudioContext
  useEffect(() => {
    // Only create AudioContext when needed (on user interaction)
    return () => {
      if (audioContext) {
        audioContext.close();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [audioContext]);

  // Load available devices
  useEffect(() => {
    const getDevices = async () => {
      try {
        // Request permission to access devices
        await navigator.mediaDevices.getUserMedia({ audio: true, video: true });

        const devices = await navigator.mediaDevices.enumerateDevices();

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

          if (device.kind === "audioinput") {
            mics.push(option);
          } else if (device.kind === "audiooutput") {
            speakers.push(option);
          } else if (device.kind === "videoinput") {
            cameras.push(option);
          }
        });

        setAudioInputs(mics);
        setAudioOutputs(speakers);
        setVideoInputs(cameras);

        // Set default selections
        if (mics.length > 0) setSelectedMic(mics[0].deviceId);
        if (speakers.length > 0) setSelectedSpeaker(speakers[0].deviceId);
        if (cameras.length > 0) setSelectedCamera(cameras[0].deviceId);
      } catch (error) {
        console.error("Error accessing media devices:", error);
        toast.error(
          "Failed to access media devices. Please check permissions."
        );
      }
    };

    getDevices();

    // Cleanup function
    return () => {
      if (micStream) {
        micStream.getTracks().forEach((track) => track.stop());
      }
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Handle microphone change
  useEffect(() => {
    const setupMicStream = async () => {
      if (micStream) {
        micStream.getTracks().forEach((track) => track.stop());
        stopMicAnalyzing();
      }

      if (selectedMic && micEnabled) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: { deviceId: { exact: selectedMic } },
          });
          setMicStream(stream);

          if (testType === "mic") {
            startMicAnalyzing(stream);
          }
        } catch (error) {
          console.error("Error accessing microphone:", error);
          toast.error("Failed to access microphone. Please check permissions.");
        }
      }
    };

    setupMicStream();
  }, [selectedMic, micEnabled, testType]);

  // Handle camera change
  useEffect(() => {
    const setupCameraStream = async () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }

      if (selectedCamera && cameraEnabled) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: { exact: selectedCamera } },
          });
          setCameraStream(stream);

          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (error) {
          console.error("Error accessing camera:", error);
          toast.error("Failed to access camera. Please check permissions.");
        }
      } else if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };

    setupCameraStream();
  }, [selectedCamera, cameraEnabled]);

  // Initialize audio analyzer for microphone
  const startMicAnalyzing = (stream: MediaStream) => {
    try {
      console.log("Attempting to start microphone analysis...");
      // Clean up previous context
      if (audioContext) {
        audioContext
          .close()
          .catch((err) =>
            console.warn("Error closing previous audio context:", err)
          );
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // Create new audio context
      const context = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      setAudioContext(context);
      console.log("AudioContext created for mic analysis");

      // Create analyzer
      const analyser = context.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.2;
      setAudioAnalyser(analyser);
      console.log("AnalyserNode created for mic");

      // Connect mic stream to analyzer
      const source = context.createMediaStreamSource(stream);
      const gainNode = context.createGain();
      gainNode.gain.value = 2.5; // Slightly reduced gain to prevent clipping
      source.connect(gainNode);
      gainNode.connect(analyser);
      console.log("Mic stream connected to analyser via gain node");

      // Start analyzing
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let consecutiveZeros = 0; // Track silent frames
      const analyzeLevelMic = () => {
        if (!analyser) {
          console.log("Mic analysis stopped: Analyser is null");
          return;
        }

        analyser.getByteFrequencyData(dataArray);

        let peak = 0;
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
          if (dataArray[i] > peak) peak = dataArray[i];
        }
        const average = sum / dataArray.length;

        if (sum < dataArray.length * 2) {
          consecutiveZeros++;
        } else {
          consecutiveZeros = 0;
        }

        const combinedValue = peak * 0.6 + average * 0.4;
        const scalingFactor = 1.8;
        const calculatedLevel = Math.min(
          100,
          Math.round((combinedValue / 255) * 100 * scalingFactor)
        );

        // *** DEBUG LOGGING ***
        console.log(
          `[Mic Analyzer] Calculated Level: ${calculatedLevel}, Peak: ${peak.toFixed(
            1
          )}, Avg: ${average.toFixed(1)}, Sum: ${sum}`
        );

        setMicLevel(calculatedLevel);

        animationFrameRef.current = requestAnimationFrame(analyzeLevelMic);
      };

      analyzeLevelMic();
      console.log("Real-time microphone analysis started");
    } catch (error) {
      console.error("Error starting microphone analyzer:", error);
      toast.error("Failed to analyze microphone audio.");
      stopMicAnalyzing(); // Ensure cleanup on error
    }
  };

  // Stop analyzing microphone
  const stopMicAnalyzing = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    setMicLevel(0);

    if (audioContext) {
      audioContext.close().catch(console.error);
      setAudioContext(null);
    }

    setAudioAnalyser(null);
    console.log("Microphone analyzer stopped");
  };

  // Initialize audio analyzer for speaker
  const startSpeakerAnalyzing = (audioElement: HTMLAudioElement) => {
    try {
      console.log("Attempting to start speaker analysis from audio element...");
      // Clean up previous context if any
      if (audioContext) {
        audioContext
          .close()
          .catch((err) =>
            console.warn("Error closing previous audio context:", err)
          );
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // Create new audio context
      const context = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      setAudioContext(context);
      console.log("AudioContext created for speaker analysis");

      // Create source from the audio element
      const source = context.createMediaElementSource(audioElement);
      console.log("MediaElementAudioSourceNode created");

      // Create analyzer
      const analyser = context.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.6; // Slightly more smoothing for speaker output
      setAudioAnalyser(analyser);
      console.log("AnalyserNode created");

      // Connect the source to the analyser and the destination (speakers)
      source.connect(analyser);
      analyser.connect(context.destination);
      console.log("Source connected to Analyser and destination");

      // Start analyzing the audio data
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const analyzeLevelSpeaker = () => {
        if (!analyser) {
          console.log("Speaker analysis stopped: Analyser is null");
          return;
        }

        analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;

        const calculatedLevel = Math.min(
          100,
          Math.pow(average / 150, 0.7) * 100
        );

        // *** DEBUG LOGGING ***
        console.log(
          `[Speaker Analyzer] Calculated Level: ${calculatedLevel.toFixed(
            1
          )}, Avg Freq: ${average.toFixed(1)}, Sum: ${sum}`
        );

        setSpeakerLevel(calculatedLevel);

        animationFrameRef.current = requestAnimationFrame(analyzeLevelSpeaker);
      };

      analyzeLevelSpeaker();
      console.log("Real-time speaker analysis started");
    } catch (error) {
      console.error("Error starting real speaker analyzer:", error);
      toast.error("Failed to analyze speaker audio output.");
      stopSpeakerAnalyzing(); // Ensure cleanup on error
    }
  };

  // Stop analyzing speaker
  const stopSpeakerAnalyzing = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    setSpeakerLevel(0);

    if (audioContext) {
      audioContext.close().catch(console.error);
      setAudioContext(null);
    }

    setAudioAnalyser(null);
    console.log("Speaker analyzer stopped");
  };

  // Speaker test
  const testSpeaker = () => {
    setIsTesting(true);
    setTestType("speaker");

    stopSpeakerAnalyzing(); // Stop any previous analysis

    if (audioRef.current) {
      const audioElement = audioRef.current;
      audioElement.pause();
      audioElement.currentTime = 0;
      audioElement.src = "/audio/sound-test.mp3";
      audioElement.volume = 0.7; // Slightly lower volume to prevent clipping issues
      audioElement.loop = true;

      const playPromise = audioElement.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log("Audio playback started, initiating analysis...");
            // Start analysis *after* playback begins
            startSpeakerAnalyzing(audioElement);
          })
          .catch((error) => {
            console.error("Error playing audio:", error);
            toast.error(
              "Failed to play test sound. Check browser permissions or console."
            );
            stopSpeakerAnalyzing(); // Clean up if play fails
          });
      } else {
        console.error("audioRef.current.play() did not return a promise");
        toast.error("Could not initiate audio playback.");
      }
    } else {
      console.error("Audio element ref is null");
      toast.error("Audio player not ready.");
    }
  };

  // Mic test
  const testMic = () => {
    setIsTesting(true);
    setTestType("mic");

    // Force stop any existing analysis
    stopMicAnalyzing();

    // Force new stream creation for testing
    if (micStream) {
      micStream.getTracks().forEach((track) => track.stop());
      setMicStream(null);
    }

    // Create a fresh audio context for better reliability
    if (audioContext) {
      audioContext.close().catch(console.error);
      setAudioContext(null);
    }

    // Get a new microphone stream with explicit constraints
    navigator.mediaDevices
      .getUserMedia({
        audio: {
          deviceId: selectedMic ? { exact: selectedMic } : undefined,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
      .then((stream) => {
        console.log("New microphone stream created for testing");
        setMicStream(stream);

        // Wait a moment for stream to initialize properly
        setTimeout(() => {
          startMicAnalyzing(stream);
        }, 100);
      })
      .catch((error) => {
        console.error("Error accessing microphone:", error);
        toast.error("Failed to access microphone. Please check permissions.");
      });
  };

  // Camera test
  const testCamera = () => {
    setIsTesting(true);
    setTestType("camera");
  };

  // Stop testing
  const stopTesting = () => {
    setIsTesting(false);
    setTestType(null);

    stopMicAnalyzing();
    stopSpeakerAnalyzing();

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  // Toggle mic
  const toggleMic = () => {
    setMicEnabled(!micEnabled);
  };

  // Toggle camera
  const toggleCamera = () => {
    setCameraEnabled(!cameraEnabled);
  };

  // Handle device selection
  const handleDeviceChange = (
    deviceType: "mic" | "speaker" | "camera",
    deviceId: string
  ) => {
    if (deviceType === "mic") {
      setSelectedMic(deviceId);
      setMicPopoverOpen(false);
    } else if (deviceType === "speaker") {
      setSelectedSpeaker(deviceId);
      setSpeakerPopoverOpen(false);
    } else if (deviceType === "camera") {
      setSelectedCamera(deviceId);
      setCameraPopoverOpen(false);
    }
  };

  // Find device name by ID
  const getDeviceName = (
    deviceType: "mic" | "speaker" | "camera",
    deviceId: string
  ) => {
    let devices: DeviceOption[] = [];

    if (deviceType === "mic") devices = audioInputs;
    else if (deviceType === "speaker") devices = audioOutputs;
    else if (deviceType === "camera") devices = videoInputs;

    const device = devices.find((d) => d.deviceId === deviceId);
    return device?.label || "Unknown Device";
  };

  return (
    <div className={`bg-brandBlack rounded-lg shadow-md ${className}`}>
      <h2 className="text-2xl font-bold p-6 text-center text-brandWhite">
        Device Test
      </h2>

      <div className="p-6 space-y-8">
        {/* Camera Preview */}
        <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden mb-4 relative">
          {cameraEnabled ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Camera size={48} className="mx-auto mb-2 text-brandGray" />
                <p className="text-brandGray">Camera Off</p>
              </div>
            </div>
          )}
        </div>

        {/* Device Controls */}
        <div className="grid grid-cols-3 gap-4 justify-center">
          {/* Microphone */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={toggleMic}
              className={`p-3 rounded-full hover:bg-opacity-80 ${
                micEnabled
                  ? "bg-brandOrange text-brandBlack"
                  : "bg-gray-800 text-brandGray"
              }`}
            >
              <Mic size={24} />
            </button>
            <div className="relative w-full">
              <Popover open={micPopoverOpen} onOpenChange={setMicPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full flex justify-between items-center py-1 bg-gray-800 text-brandWhite border-gray-700 hover:bg-gray-700"
                    disabled={!micEnabled}
                  >
                    <span className="truncate text-xs">
                      {micEnabled
                        ? getDeviceName("mic", selectedMic)
                        : "Microphone Off"}
                    </span>
                    <ChevronUp size={14} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-0 bg-gray-800 border-gray-700">
                  <div className="py-2">
                    {audioInputs.map((device) => (
                      <button
                        key={device.deviceId}
                        onClick={() =>
                          handleDeviceChange("mic", device.deviceId)
                        }
                        className="flex items-center justify-between px-4 py-2 w-full text-sm text-left hover:bg-gray-700 text-white"
                      >
                        <span className="truncate">{device.label}</span>
                        {selectedMic === device.deviceId && (
                          <Check size={16} className="text-brandOrange" />
                        )}
                      </button>
                    ))}
                    <div className="px-4 py-2 border-t border-gray-700">
                      <Button
                        className="w-full bg-brandOrange hover:bg-brandOrange/90 text-brandBlack"
                        size="sm"
                        onClick={testMic}
                      >
                        Test Microphone
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Speaker */}
          <div className="flex flex-col items-center gap-2">
            <div className="p-3 rounded-full bg-brandOrange text-brandBlack">
              <Volume2 size={24} />
            </div>
            <div className="relative w-full">
              <Popover
                open={speakerPopoverOpen}
                onOpenChange={setSpeakerPopoverOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full flex justify-between items-center py-1 bg-gray-800 text-brandWhite border-gray-700 hover:bg-gray-700"
                  >
                    <span className="truncate text-xs">
                      {getDeviceName("speaker", selectedSpeaker)}
                    </span>
                    <ChevronUp size={14} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-0 bg-gray-800 border-gray-700">
                  <div className="py-2">
                    {audioOutputs.map((device) => (
                      <button
                        key={device.deviceId}
                        onClick={() =>
                          handleDeviceChange("speaker", device.deviceId)
                        }
                        className="flex items-center justify-between px-4 py-2 w-full text-sm text-left hover:bg-gray-700 text-white"
                      >
                        <span className="truncate">{device.label}</span>
                        {selectedSpeaker === device.deviceId && (
                          <Check size={16} className="text-brandOrange" />
                        )}
                      </button>
                    ))}
                    <div className="px-4 py-2 border-t border-gray-700">
                      <Button
                        className="w-full bg-brandOrange hover:bg-brandOrange/90 text-brandBlack"
                        size="sm"
                        onClick={testSpeaker}
                      >
                        Test Speaker
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Camera */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={toggleCamera}
              className={`p-3 rounded-full hover:bg-opacity-80 ${
                cameraEnabled
                  ? "bg-brandOrange text-brandBlack"
                  : "bg-gray-800 text-brandGray"
              }`}
            >
              <Camera size={24} />
            </button>
            <div className="relative w-full">
              <Popover
                open={cameraPopoverOpen}
                onOpenChange={setCameraPopoverOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full flex justify-between items-center py-1 bg-gray-800 text-brandWhite border-gray-700 hover:bg-gray-700"
                    disabled={!cameraEnabled}
                  >
                    <span className="truncate text-xs">
                      {cameraEnabled
                        ? getDeviceName("camera", selectedCamera)
                        : "Camera Off"}
                    </span>
                    <ChevronUp size={14} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-0 bg-gray-800 border-gray-700">
                  <div className="py-2">
                    {videoInputs.map((device) => (
                      <button
                        key={device.deviceId}
                        onClick={() =>
                          handleDeviceChange("camera", device.deviceId)
                        }
                        className="flex items-center justify-between px-4 py-2 w-full text-sm text-left hover:bg-gray-700 text-white"
                      >
                        <span className="truncate">{device.label}</span>
                        {selectedCamera === device.deviceId && (
                          <Check size={16} className="text-brandOrange" />
                        )}
                      </button>
                    ))}
                    <div className="px-4 py-2 border-t border-gray-700">
                      <Button
                        className="w-full bg-brandOrange hover:bg-brandOrange/90 text-brandBlack"
                        size="sm"
                        onClick={testCamera}
                      >
                        Test Camera
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        {/* Confirm Button */}
        <div className="flex justify-center mt-8">
          <Button
            onClick={onComplete}
            className="px-6 py-2 bg-brandOrange hover:bg-brandOrange/90 text-brandBlack font-medium"
          >
            Join with These Settings
          </Button>
        </div>

        {/* Hidden audio element for speaker test */}
        <audio ref={audioRef} className="hidden" preload="auto" />
      </div>

      {/* Speaker Test Dialog */}
      <Dialog
        open={isTesting && testType === "speaker"}
        onOpenChange={(open) => !open && stopTesting()}
      >
        <DialogContent className="bg-gray-800 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-brandOrange">
              Do you hear a ringtone?
            </DialogTitle>
            <DialogDescription className="text-white/70">
              Testing your speaker...
            </DialogDescription>
          </DialogHeader>

          <div className="mb-6">
            <select
              value={selectedSpeaker}
              onChange={(e) => handleDeviceChange("speaker", e.target.value)}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white"
            >
              {audioOutputs.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <p className="mb-2 text-white/70">Output level:</p>
            <AudioLevelMeter
              level={speakerLevel}
              isActive={true}
              type="speaker"
              className="w-full h-6"
            />
            <p className="mt-4 text-sm text-white/70 text-center">
              Playing test sound. If you don't hear anything, check your system
              volume and selected output device.
            </p>
          </div>

          <DialogFooter className="flex justify-between">
            <Button
              className="bg-brandOrange hover:bg-brandOrange/90 text-brandBlack"
              onClick={stopTesting}
            >
              Yes, I hear it
            </Button>
            <Button
              variant="outline"
              className="text-white border-gray-600 hover:bg-gray-700"
              onClick={() => {
                if (audioRef.current) {
                  audioRef.current.currentTime = 0;
                  audioRef.current.play();
                }
              }}
            >
              Play again
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Microphone Test Dialog */}
      <Dialog
        open={isTesting && testType === "mic"}
        onOpenChange={(open) => !open && stopTesting()}
      >
        <DialogContent className="bg-gray-800 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-brandOrange">
              Testing Microphone
            </DialogTitle>
            <DialogDescription className="text-white/70">
              Speak into your microphone to see the level indicator
            </DialogDescription>
          </DialogHeader>

          <div className="mb-6">
            <select
              value={selectedMic}
              onChange={(e) => handleDeviceChange("mic", e.target.value)}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white"
            >
              {audioInputs.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <p className="mb-2 text-white/70">Input level:</p>
            <AudioLevelMeter
              level={micLevel}
              isActive={true}
              type="microphone"
              className="w-full h-6"
            />
            <div className="flex items-center justify-center gap-1 mt-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
              <p className="text-sm text-white/70">
                {micLevel < 10
                  ? "Speak or make a sound to test your microphone..."
                  : "Microphone is working! Continue speaking to test."}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              className="bg-brandOrange hover:bg-brandOrange/90 text-brandBlack"
              onClick={stopTesting}
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Camera Test Dialog */}
      <Dialog
        open={isTesting && testType === "camera"}
        onOpenChange={(open) => !open && stopTesting()}
      >
        <DialogContent className="bg-gray-800 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-brandOrange">
              Testing Camera
            </DialogTitle>
            <DialogDescription className="text-white/70">
              Check how your camera looks
            </DialogDescription>
          </DialogHeader>

          <div className="mb-6">
            <select
              value={selectedCamera}
              onChange={(e) => handleDeviceChange("camera", e.target.value)}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white"
            >
              {videoInputs.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label}
                </option>
              ))}
            </select>
          </div>

          <div className="aspect-video bg-black rounded-lg overflow-hidden mb-6">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </div>

          <DialogFooter>
            <Button
              className="bg-brandOrange hover:bg-brandOrange/90 text-brandBlack"
              onClick={stopTesting}
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DeviceTester;
