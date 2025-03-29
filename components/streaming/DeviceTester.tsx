import React, { useState, useEffect, useRef } from "react";
import { Mic } from "lucide-react";
import { Camera } from "lucide-react";
import { Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAudioLevelMeter } from "@/lib/hooks/useAudioLevelMeter";
import AudioLevelMeter from "./AudioLevelMeter";

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

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Audio level meter
  const {
    level: micLevel,
    startAnalyzing: startMicAnalyzing,
    stopAnalyzing: stopMicAnalyzing,
  } = useAudioLevelMeter("microphone", micStream);
  const {
    level: speakerLevel,
    startAnalyzing: startSpeakerAnalyzing,
    stopAnalyzing: stopSpeakerAnalyzing,
  } = useAudioLevelMeter("speaker", null, audioRef.current);

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
            startMicAnalyzing();
          }
        } catch (error) {
          console.error("Error accessing microphone:", error);
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
        }
      } else if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };

    setupCameraStream();
  }, [selectedCamera, cameraEnabled]);

  // Speaker test
  const testSpeaker = () => {
    setIsTesting(true);
    setTestType("speaker");

    if (audioRef.current) {
      audioRef.current.src = "/audio/test-sound.mp3";
      audioRef.current.play();
      startSpeakerAnalyzing();
    }
  };

  // Mic test
  const testMic = () => {
    setIsTesting(true);
    setTestType("mic");

    if (micStream) {
      startMicAnalyzing();
    }
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
    } else if (deviceType === "speaker") {
      setSelectedSpeaker(deviceId);
    } else if (deviceType === "camera") {
      setSelectedCamera(deviceId);
    }
  };

  return (
    <div className={`bg-white p-6 rounded-lg shadow-md ${className}`}>
      <h2 className="text-2xl font-bold mb-6 text-center">Device Test</h2>

      <div className="grid grid-cols-1 gap-8">
        {/* Microphone Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <button
              onClick={toggleMic}
              className={`p-2 rounded-full ${
                micEnabled
                  ? "bg-green-100 text-green-600"
                  : "bg-red-100 text-red-600"
              }`}
            >
              <Mic size={24} />
            </button>

            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">
                Microphone
              </label>
              <select
                value={selectedMic}
                onChange={(e) => handleDeviceChange("mic", e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!micEnabled}
              >
                {audioInputs.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label}
                  </option>
                ))}
              </select>
            </div>

            <Button
              variant="outline"
              onClick={testMic}
              disabled={!micEnabled || isTesting}
              className="whitespace-nowrap"
            >
              Test Mic
            </Button>
          </div>
        </div>

        {/* Speaker Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-full bg-blue-100 text-blue-600">
              <Volume2 size={24} />
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Speaker</label>
              <select
                value={selectedSpeaker}
                onChange={(e) => handleDeviceChange("speaker", e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {audioOutputs.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label}
                  </option>
                ))}
              </select>
            </div>

            <Button
              variant="outline"
              onClick={testSpeaker}
              disabled={isTesting}
              className="whitespace-nowrap"
            >
              Test Speaker
            </Button>
          </div>
        </div>

        {/* Camera Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <button
              onClick={toggleCamera}
              className={`p-2 rounded-full ${
                cameraEnabled
                  ? "bg-green-100 text-green-600"
                  : "bg-red-100 text-red-600"
              }`}
            >
              <Camera size={24} />
            </button>

            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Camera</label>
              <select
                value={selectedCamera}
                onChange={(e) => handleDeviceChange("camera", e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!cameraEnabled}
              >
                {videoInputs.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label}
                  </option>
                ))}
              </select>
            </div>

            <Button
              variant="outline"
              onClick={testCamera}
              disabled={!cameraEnabled || isTesting}
              className="whitespace-nowrap"
            >
              Test Camera
            </Button>
          </div>
        </div>

        {/* Testing Area */}
        {isTesting && (
          <div className="mt-4 p-4 border rounded-lg">
            <div className="flex justify-between mb-4">
              <h3 className="text-lg font-medium">
                {testType === "mic"
                  ? "Testing Microphone"
                  : testType === "speaker"
                  ? "Testing Speaker"
                  : "Testing Camera"}
              </h3>
              <Button variant="outline" size="sm" onClick={stopTesting}>
                Stop Test
              </Button>
            </div>

            {testType === "mic" && (
              <div className="flex flex-col items-center">
                <p className="mb-2">Speak into your microphone</p>
                <AudioLevelMeter
                  level={micLevel}
                  isActive={true}
                  type="microphone"
                  className="w-full h-8 mb-4"
                />
              </div>
            )}

            {testType === "speaker" && (
              <div className="flex flex-col items-center">
                <p className="mb-2">Listen for the test sound</p>
                <AudioLevelMeter
                  level={speakerLevel}
                  isActive={true}
                  type="speaker"
                  className="w-full h-8 mb-4"
                />
                <audio ref={audioRef} className="hidden" />
              </div>
            )}

            {testType === "camera" && (
              <div className="flex flex-col items-center">
                <p className="mb-2">Check your camera view</p>
                <div className="relative w-full max-w-md bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-auto"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end mt-4">
          <Button
            variant="default"
            onClick={onComplete}
            className="flex items-center gap-2"
          >
            Confirm Settings
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DeviceTester;
