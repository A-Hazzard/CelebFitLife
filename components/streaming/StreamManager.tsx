import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Share, Video, VideoOff, Mic, MicOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Stream } from "@/lib/services/StreamService";

interface StreamManagerProps {
  stream: Stream;
  className?: string;
}

const StreamManager: React.FC<StreamManagerProps> = ({
  stream,
  className = "",
}) => {
  const [isStreaming, setIsStreaming] = useState(stream.hasStarted);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [title, setTitle] = useState(stream.title);
  const [shareUrl, setShareUrl] = useState("");
  const [showEndConfirmation, setShowEndConfirmation] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Set share URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      setShareUrl(`${window.location.origin}/streaming/live/${stream.slug}`);
    }
  }, [stream.slug]);

  // Start streaming
  const startStream = async () => {
    try {
      // In a real implementation, this would connect to Twilio or other streaming service
      // For now, we'll just show local video as a placeholder
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      localStreamRef.current = stream;
      setIsStreaming(true);

      // In a real implementation, we would update hasStarted in the database
      console.log("Stream started for:", stream.slug);
    } catch (error) {
      console.error("Error starting stream:", error);
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

    // In a real implementation, we would update hasStarted in the database
    console.log("Stream ended for:", stream.slug);
  };

  // Toggle microphone
  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = !isMicEnabled;
      });
      setIsMicEnabled(!isMicEnabled);
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
    }
  };

  // Update stream info
  const updateStreamInfo = () => {
    // In a real implementation, this would update the stream info in the database
    console.log("Updated stream info:", { title });
    alert("Stream info updated!");
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
        .then(() => alert("Stream URL copied to clipboard!"))
        .catch((err) => console.error("Failed to copy:", err));
    }
  };

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Video Preview */}
      <div className="aspect-video bg-black rounded-lg relative overflow-hidden mb-4">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />

        {!isStreaming && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
            <div className="text-white text-center">
              <VideoOff size={48} className="mx-auto mb-2" />
              <p>Stream Offline</p>
            </div>
          </div>
        )}

        {isStreaming && !isVideoEnabled && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
            <div className="text-white text-center">
              <VideoOff size={48} className="mx-auto mb-2" />
              <p>Camera Off</p>
            </div>
          </div>
        )}
      </div>

      {/* Stream Controls */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
        <div className="flex justify-between mb-4">
          <h2 className="text-lg font-semibold">Stream Controls</h2>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={shareStream}
              title="Share stream"
            >
              <Share size={18} />
            </Button>

            {isStreaming ? (
              <Button
                variant="destructive"
                onClick={() => setShowEndConfirmation(true)}
              >
                End Stream
              </Button>
            ) : (
              <Button variant="default" onClick={startStream}>
                Start Streaming
              </Button>
            )}
          </div>
        </div>

        {isStreaming && (
          <div className="flex gap-2 mb-4">
            <Button
              variant={isMicEnabled ? "default" : "secondary"}
              size="icon"
              onClick={toggleMic}
              className="rounded-full"
              title={isMicEnabled ? "Mute microphone" : "Unmute microphone"}
            >
              {isMicEnabled ? <Mic size={18} /> : <MicOff size={18} />}
            </Button>

            <Button
              variant={isVideoEnabled ? "default" : "secondary"}
              size="icon"
              onClick={toggleVideo}
              className="rounded-full"
              title={isVideoEnabled ? "Turn off camera" : "Turn on camera"}
            >
              {isVideoEnabled ? <Video size={18} /> : <VideoOff size={18} />}
            </Button>
          </div>
        )}

        {/* Stream Info Form */}
        <div className="space-y-3">
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Stream Title
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter stream title"
            />
          </div>

          <Button
            variant="outline"
            onClick={updateStreamInfo}
            className="w-full"
          >
            Update Stream Info
          </Button>
        </div>
      </div>

      {/* End Stream Confirmation Modal */}
      {showEndConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md">
            <h3 className="text-xl font-bold mb-4">End Stream?</h3>
            <p className="mb-6">
              Are you sure you want to end this stream? This action cannot be
              undone.
            </p>
            <div className="flex justify-end gap-4">
              <Button
                variant="outline"
                onClick={() => setShowEndConfirmation(false)}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={endStream}>
                End Stream
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StreamManager;
