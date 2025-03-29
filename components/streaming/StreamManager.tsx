import React, {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Button } from "@/components/ui/button";
import { Settings, Mic, MicOff, Video, VideoOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Stream } from "@/lib/models/Stream";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/config/firebase";

interface StreamManagerProps {
  stream: Stream;
  className?: string;
}

// Convert to forwardRef
const StreamManager = forwardRef<
  { startStream: () => Promise<void> },
  StreamManagerProps
>(({ stream, className = "" }, ref) => {
  const [isStreaming, setIsStreaming] = useState(stream.hasStarted);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [title, setTitle] = useState(stream.title);
  const [shareUrl, setShareUrl] = useState("");
  const [showEndConfirmation, setShowEndConfirmation] = useState(false);
  const [streamingTimer, setStreamingTimer] = useState(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    startStream,
  }));

  // Set share URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      setShareUrl(`${window.location.origin}/streaming/live/${stream.slug}`);
    }
  }, [stream.slug]);

  // Timer for streaming duration
  useEffect(() => {
    if (isStreaming && !timerIntervalRef.current) {
      timerIntervalRef.current = setInterval(() => {
        setStreamingTimer((prevTime) => prevTime + 1);
      }, 1000);
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [isStreaming]);

  // Format the timer as HH:MM:SS
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Start streaming
  const startStream = async () => {
    try {
      // Get the selected camera and mic from localStorage if available
      const savedSettings = localStorage.getItem("deviceSettings");
      const videoConstraints: MediaTrackConstraints = {
        width: { ideal: 1280 },
        height: { ideal: 720 },
      };
      const audioConstraints: MediaTrackConstraints = {
        echoCancellation: true,
        noiseSuppression: true,
      };

      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        if (settings.selectedCamera) {
          videoConstraints.deviceId = { exact: settings.selectedCamera };
        }
        if (settings.selectedMic) {
          audioConstraints.deviceId = { exact: settings.selectedMic };
        }
      }

      // Request media with saved device preferences
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: audioConstraints,
        video: videoConstraints,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      localStreamRef.current = mediaStream;
      setIsStreaming(true);
      setStreamingTimer(0);

      // Update hasStarted in Firestore
      try {
        // Ensure stream.id exists before using it
        if (!stream.id) {
          throw new Error("Stream ID is undefined");
        }

        const streamDocRef = doc(db, "streams", stream.id);
        await updateDoc(streamDocRef, {
          hasStarted: true,
          hasEnded: false,
          startedAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
        });
        toast.success("Stream started successfully!");
      } catch (dbError) {
        console.error("Error updating stream status:", dbError);
        toast.error(
          "Stream started locally but failed to update status in database."
        );
      }
    } catch (error) {
      console.error("Error starting stream:", error);
      toast.error(
        "Failed to start stream. Please check your camera and microphone permissions."
      );
    }
  };

  // End streaming
  const endStream = () => {
    // Clean up local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsStreaming(false);
    setShowEndConfirmation(false);

    // Update hasEnded in Firestore
    try {
      // Ensure stream.id exists before using it
      if (!stream.id) {
        throw new Error("Stream ID is undefined");
      }

      const streamDocRef = doc(db, "streams", stream.id);
      updateDoc(streamDocRef, {
        hasEnded: true,
        endedAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      })
        .then(() => {
          toast.info("Stream ended");
        })
        .catch((dbError) => {
          console.error("Error updating stream status:", dbError);
          toast.error(
            "Stream ended locally but failed to update status in database."
          );
        });
    } catch (error) {
      console.error("Error ending stream:", error);
      toast.error("Failed to end stream properly.");
    }
  };

  // Toggle microphone
  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = !isMicEnabled;
      });
      setIsMicEnabled(!isMicEnabled);

      // Update Firestore
      try {
        // Ensure stream.id exists before using it
        if (!stream.id) {
          throw new Error("Stream ID is undefined");
        }

        const streamDocRef = doc(db, "streams", stream.id);
        updateDoc(streamDocRef, {
          audioMuted: isMicEnabled,
          lastUpdated: new Date().toISOString(),
        }).catch((error) => {
          console.error("Error updating audio status in Firestore:", error);
        });
      } catch (error) {
        console.error("Error updating audio status:", error);
      }

      toast.info(isMicEnabled ? "Microphone muted" : "Microphone unmuted");
    }
  };

  // Toggle camera
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      videoTracks.forEach((track) => {
        track.enabled = !isVideoEnabled;
      });
      setIsVideoEnabled(!isVideoEnabled);

      // Update Firestore
      try {
        // Ensure stream.id exists before using it
        if (!stream.id) {
          throw new Error("Stream ID is undefined");
        }

        const streamDocRef = doc(db, "streams", stream.id);
        updateDoc(streamDocRef, {
          cameraOff: isVideoEnabled,
          lastUpdated: new Date().toISOString(),
        }).catch((error) => {
          console.error("Error updating camera status in Firestore:", error);
        });
      } catch (error) {
        console.error("Error updating camera status:", error);
      }

      toast.info(isVideoEnabled ? "Camera turned off" : "Camera turned on");
    }
  };

  // Update stream info
  const updateStreamInfo = () => {
    // In a real implementation, this would update the stream info in the database
    console.log("Updated stream info:", { title });
    toast.success("Stream info updated!");
  };

  // Share stream
  const shareStream = () => {
    if (navigator.share) {
      navigator
        .share({
          title: title,
          text: "Check out my live stream!",
          url: shareUrl,
        })
        .catch((error) => console.log("Error sharing:", error));
    } else {
      // Fallback
      navigator.clipboard
        .writeText(shareUrl)
        .then(() => toast.success("Stream URL copied to clipboard!"))
        .catch((err) => console.error("Failed to copy:", err));
    }
  };

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Video Preview */}
      <div className="aspect-video bg-gray-900 rounded-lg relative overflow-hidden mb-4">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />

        {!isStreaming && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
            <div className="text-brandWhite text-center">
              <VideoOff size={48} className="mx-auto mb-2" />
              <p>Stream Offline</p>
            </div>
          </div>
        )}

        {isStreaming && !isVideoEnabled && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
            <div className="text-brandWhite text-center">
              <VideoOff size={48} className="mx-auto mb-2" />
              <p>Camera Off</p>
            </div>
          </div>
        )}

        {/* Stream Status Indicators */}
        {isStreaming && (
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <div className="flex items-center gap-2 bg-red-600 px-3 py-1 rounded-full text-white text-sm">
              <span className="h-2 w-2 rounded-full bg-white animate-pulse"></span>
              LIVE
            </div>
            <div className="bg-black bg-opacity-60 px-3 py-1 rounded-full text-white text-sm">
              {formatTime(streamingTimer)}
            </div>
          </div>
        )}

        {/* Audio/Video Status Indicators - Visible to streamer */}
        {isStreaming && (
          <div className="absolute top-4 right-4 flex items-center gap-2">
            {!isMicEnabled && (
              <div className="flex items-center gap-1 bg-black bg-opacity-70 px-3 py-1 rounded-full text-white text-sm">
                <MicOff size={16} />
                <span>Muted</span>
              </div>
            )}
            {!isVideoEnabled && (
              <div className="flex items-center gap-1 bg-black bg-opacity-70 px-3 py-1 rounded-full text-white text-sm">
                <VideoOff size={16} />
                <span>Camera Off</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stream Controls */}
      <div className="bg-gray-900 p-4 rounded-lg shadow-md mb-4 border border-gray-800">
        <div className="flex justify-between mb-6">
          <h2 className="text-lg font-semibold text-brandWhite">
            Stream Controls
          </h2>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={shareStream}
              title="Share stream"
              className="border-gray-700 text-brandBlack bg-brandGray hover:bg-gray-300"
            >
              <Settings size={18} />
            </Button>

            {isStreaming ? (
              <Button
                variant="destructive"
                onClick={() => setShowEndConfirmation(true)}
              >
                End Stream
              </Button>
            ) : (
              <Button
                className="bg-brandOrange hover:bg-brandOrange/90 text-brandBlack"
                onClick={startStream}
              >
                Start Streaming
              </Button>
            )}
          </div>
        </div>

        {isStreaming && (
          <div className="flex gap-4 mb-6 justify-center">
            <Button
              variant="outline"
              size="lg"
              onClick={toggleMic}
              className={`flex flex-col items-center gap-2 p-6 ${
                isMicEnabled
                  ? "bg-gray-800 text-brandWhite border-gray-700"
                  : "bg-gray-800 text-brandOrange border-brandOrange/30"
              }`}
            >
              {isMicEnabled ? <Mic size={24} /> : <MicOff size={24} />}
              <span className="text-xs">
                {isMicEnabled ? "Mic On" : "Mic Off"}
              </span>
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={toggleVideo}
              className={`flex flex-col items-center gap-2 p-6 ${
                isVideoEnabled
                  ? "bg-gray-800 text-brandWhite border-gray-700"
                  : "bg-gray-800 text-brandOrange border-brandOrange/30"
              }`}
            >
              {isVideoEnabled ? <Video size={24} /> : <VideoOff size={24} />}
              <span className="text-xs">
                {isVideoEnabled ? "Camera On" : "Camera Off"}
              </span>
            </Button>
          </div>
        )}

        {/* Stream Info Form */}
        <div className="space-y-3">
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Stream Title
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter stream title"
              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
            />
          </div>

          <Button
            variant="outline"
            onClick={updateStreamInfo}
            className="w-full bg-gray-800 border-gray-700 text-brandWhite hover:bg-gray-700"
          >
            Update Stream Info
          </Button>
        </div>
      </div>

      {/* End Stream Confirmation Modal */}
      <Dialog open={showEndConfirmation} onOpenChange={setShowEndConfirmation}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-brandOrange">End Stream?</DialogTitle>
          </DialogHeader>
          <p className="mb-6">
            Are you sure you want to end this stream? This action cannot be
            undone.
          </p>
          <DialogFooter className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setShowEndConfirmation(false)}
              className="border-gray-600 text-white hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={endStream}>
              End Stream
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});

// Add display name
StreamManager.displayName = "StreamManager";

export default StreamManager;
