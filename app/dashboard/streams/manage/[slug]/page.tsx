"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ShareButton from "@/components/ui/ShareButton";
import { db } from "@/lib/config/firebase";
import { sendChatMessage, listenToMessages } from "@/lib/services/ChatService";
import { useAuthStore } from "@/lib/store/useAuthStore";
import {
  clearVideoContainer,
  setupDevices,
  switchCamera,
  switchMic,
  switchVideoQuality,
} from "@/lib/utils/streaming";
import {
  fetchStreamInfo,
  updateStreamInfo,
  prepareStreamStart,
  endStream,
  updateStreamDeviceStatus,
  setupTwilioRoom,
} from "@/lib/helpers/streaming";
import EmojiPicker from "emoji-picker-react";
import { doc, updateDoc } from "firebase/firestore";
import { Check, ChevronUp, Mic, MicOff, Video, VideoOff } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import Image from "next/image";
import {
  LocalAudioTrack,
  LocalVideoTrack,
  Room,
  TwilioError,
} from "twilio-video";
import { useStreamData } from "@/lib/hooks/useStreamData";
import { useMediaDevices } from "@/lib/hooks/useMediaDevices";
import {
  useNetworkQualityMonitor,
  useTwilioTrackEvents,
} from "@/lib/hooks/useTwilioTrackEvents";
import { StreamData } from "@/lib/types/streaming";
import { ChatMessage } from "@/lib/types/stream";

const ManageStreamPage = () => {
  const pathname = usePathname();
  const router = useRouter();
  const slug = useMemo(() => pathname?.split("/").pop() || "", [pathname]);
  const { currentUser } = useAuthStore();

  const videoContainerRef = useRef<HTMLDivElement>(null);
  const roomRef = useRef<Room | null>(null);

  // State declarations
  const [newMessage, setNewMessage] = useState("");
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isStreamStarted, setIsStreamStarted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isRoomConnecting, setIsRoomConnecting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showCameraOptions, setShowCameraOptions] = useState(false);
  const [showMicOptions, setShowMicOptions] = useState(false);
  const [currentVideoTrack, setCurrentVideoTrack] =
    useState<LocalVideoTrack | null>(null);
  const [currentAudioTrack, setCurrentAudioTrack] =
    useState<LocalAudioTrack | null>(null);
  const [showEndConfirmation, setShowEndConfirmation] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Use custom hooks
  const { streamData, loading, error: streamError } = useStreamData(slug);
  const {
    cameraDevices,
    micDevices,
    currentCameraId,
    currentMicId,
    setCurrentCameraId,
    setCurrentMicId,
    loadingDevices,
  } = useMediaDevices(
    streamData?.currentCameraId as string | undefined,
    streamData?.currentMicId as string | undefined
  );

  // Set state based on streamData
  useEffect(() => {
    if (streamData) {
      setIsStreamStarted(streamData.hasStarted || false);
      setIsAudioEnabled(!streamData.audioMuted);
      setIsVideoEnabled(!streamData.cameraOff);
    }
  }, [streamData]);

  // Update share URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      setShareUrl(`${window.location.origin}/streaming/live/${slug}`);
    }
  }, [slug]);

  // Track status handlers
  const handleTrackStatusChange = useCallback(
    (trackType: "video" | "audio", isEnabled: boolean) => {
      if (trackType === "video") {
        setIsVideoEnabled(isEnabled);
      } else if (trackType === "audio") {
        setIsAudioEnabled(isEnabled);
      }
    },
    []
  );

  // Use Twilio track events hook
  useTwilioTrackEvents(
    isConnected,
    currentVideoTrack,
    currentAudioTrack,
    handleTrackStatusChange
  );

  // Handle video quality changes from network monitor
  const handleQualityChange = useCallback(
    async (
      quality: "low" | "medium" | "high",
      prevResult: { success: boolean; track: LocalVideoTrack | null }
    ) => {
      if (!prevResult.success) {
        const result = await switchVideoQuality(
          quality,
          roomRef.current,
          currentVideoTrack,
          currentCameraId
        );

        if (result.success && result.track) {
          setCurrentVideoTrack(result.track);
        }
      }
    },
    [currentCameraId, currentVideoTrack]
  );

  // Use network quality monitor
  useNetworkQualityMonitor(
    isConnected,
    roomRef.current,
    currentCameraId,
    currentVideoTrack,
    handleQualityChange
  );

  // Handle camera switch
  const handleSwitchCamera = useCallback(
    async (deviceId: string) => {
      const result = await switchCamera(
        deviceId,
        roomRef.current,
        currentVideoTrack,
        slug
      );

      if (result.success && result.track) {
        setCurrentVideoTrack(result.track);
        setCurrentCameraId(deviceId);
        setShowCameraOptions(false);
      }
    },
    [currentVideoTrack, slug]
  );

  // Handle mic switch
  const handleSwitchMic = useCallback(
    async (deviceId: string) => {
      const result = await switchMic(
        deviceId,
        roomRef.current,
        currentAudioTrack,
        slug
      );

      if (result.success && result.track) {
        setCurrentAudioTrack(result.track);
        setCurrentMicId(deviceId);
        setShowMicOptions(false);
      }
    },
    [currentAudioTrack, slug]
  );

  // Handle stream start
  const handleStartStream = useCallback(async () => {
    if (!currentUser?.uid || !currentCameraId || !currentMicId || !slug) {
      console.error("Missing required data to start stream");
      alert(
        "Cannot start stream. Ensure camera and mic are selected and you are logged in."
      );
      return;
    }

    setIsRoomConnecting(true);
    try {
      const prepareResult = await prepareStreamStart(
        slug,
        currentUser.uid,
        currentUser.username || currentUser.email || "Streamer"
      );

      if (!prepareResult.success || !prepareResult.token) {
        throw new Error(
          prepareResult.error || "Failed to prepare stream start"
        );
      }

      // Setup Twilio room
      const roomResult = await setupTwilioRoom(
        slug,
        currentUser.username || currentUser.email || "Streamer",
        currentCameraId,
        currentMicId,
        videoContainerRef as React.RefObject<HTMLDivElement>,
        {
          audioMuted: !isAudioEnabled,
          cameraOff: !isVideoEnabled,
        }
      );

      if (!roomResult.success) {
        throw new Error(roomResult.error || "Failed to setup Twilio room");
      }

      roomRef.current = roomResult.room;
      setCurrentAudioTrack(roomResult.audioTrack);
      setCurrentVideoTrack(roomResult.videoTrack);
      setIsConnected(true);

      // Setup room disconnection handler
      roomResult.room?.on("disconnected", (room, error) => {
        console.log("Room disconnected event triggered", { error });
        setIsConnected(false);
        setCurrentAudioTrack(null);
        setCurrentVideoTrack(null);
        roomRef.current = null;
        clearVideoContainer(videoContainerRef.current);
        if (error) {
          console.error("Disconnected due to error:", error);
        }
      });
    } catch (error) {
      console.error("Error starting stream:", error);
      alert(
        `Failed to start stream: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );

      // Reset stream status in Firestore if start failed
      await updateDoc(doc(db, "streams", slug), { hasStarted: false });
    } finally {
      setIsRoomConnecting(false);
    }
  }, [
    currentUser,
    slug,
    currentCameraId,
    currentMicId,
    isAudioEnabled,
    isVideoEnabled,
  ]);

  const handleEndStream = useCallback(async () => {
    const result = await endStream(slug, roomRef.current);
    if (!result.success) {
      console.error("Failed to end stream gracefully:", result.error);
      roomRef.current?.disconnect();
    }
    setShowEndConfirmation(false);
  }, [slug]);

  const handleToggleAudio = useCallback(async () => {
    if (!currentAudioTrack) return;
    const newState = !isAudioEnabled;
    if (newState) {
      await currentAudioTrack.enable();
    } else {
      await currentAudioTrack.disable();
    }
    setIsAudioEnabled(newState);
    // Update Firestore
    await updateStreamDeviceStatus(slug, { audioMuted: !newState });
  }, [currentAudioTrack, isAudioEnabled, slug]);

  const handleToggleVideo = useCallback(async () => {
    if (!currentVideoTrack) return;
    const newState = !isVideoEnabled;
    if (newState) {
      await currentVideoTrack.enable();
    } else {
      await currentVideoTrack.disable();
    }
    setIsVideoEnabled(newState);
    // Update Firestore
    await updateStreamDeviceStatus(slug, { cameraOff: !newState });
  }, [currentVideoTrack, isVideoEnabled, slug]);

  const handleUpdateInfo = useCallback(async () => {
    if (!streamData) return;

    const result = await updateStreamInfo(
      slug,
      streamData.title || "",
      streamData.thumbnail || ""
    );

    if (result.success) {
      alert("Stream info updated successfully!");
    } else {
      alert(`Failed to update stream info: ${result.error}`);
    }
  }, [slug, streamData]);

  // Streamer status overlay
  const [streamerStatus, setStreamerStatus] = useState({
    audioMuted: false,
    cameraOff: false,
  });

  // Modal controls
  const openModal = () => setShowEndConfirmation(true);
  const closeModal = () => setShowEndConfirmation(false);

  // Subscribe to chat messages
  useEffect(() => {
    if (!slug) return;

    console.log("Subscribing to chat messages for stream:", slug);
    const unsubscribe = listenToMessages(slug, (newMessages) => {
      console.log("Received messages:", newMessages);
      setMessages(newMessages);
    });

    return () => {
      console.log("Unsubscribing from chat messages");
      unsubscribe();
    };
  }, [slug]);

  // Handle sending a message
  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() || !currentUser) return;

    try {
      await sendChatMessage(
        slug,
        currentUser.username || currentUser.email || "Streamer",
        newMessage
      );
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  }, [slug, newMessage, currentUser]);

  // Handle Enter key press for sending messages
  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    },
    [handleSendMessage]
  );

  if (loading || loadingDevices) {
    return null;
  }

  return (
    <div className="min-h-screen bg-brandBlack text-brandWhite p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <h1 className="text-2xl md:text-3xl font-bold text-brandOrange">
          Manage Stream
        </h1>
        <div className="flex space-x-2 md:space-x-4">
          <ShareButton streamLink={shareUrl} />
          {!isStreamStarted || !isConnected ? (
            <Button
              onClick={handleStartStream}
              disabled={isRoomConnecting || !currentCameraId || !currentMicId}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isRoomConnecting ? "Connecting..." : "Start Streaming"}
            </Button>
          ) : (
            <Button
              onClick={openModal}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              End Stream
            </Button>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Video Preview & Controls */}
        <div className="lg:col-span-2 space-y-4">
          {/* Video Preview */}
          <div
            ref={videoContainerRef}
            className="aspect-video bg-brandGray rounded-lg relative overflow-hidden border border-brandOrange/30"
          >
            {(!isConnected || !isVideoEnabled || streamerStatus.cameraOff) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-70">
                <VideoOff className="w-16 h-16 text-brandGray mb-4" />
                <p className="text-lg text-brandWhite">
                  {isStreamStarted ? "Camera Off" : "Stream Offline"}
                </p>
              </div>
            )}
          </div>

          {/* Controls */}
          {isConnected && (
            <div className="flex justify-center items-center space-x-4 bg-brandBlack border border-brandOrange/30 p-3 rounded-lg">
              {/* Mic Toggle */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleToggleAudio}
                  className="rounded-full bg-brandGray hover:bg-brandGray/80 text-brandWhite"
                >
                  {isAudioEnabled ? (
                    <Mic className="w-5 h-5" />
                  ) : (
                    <MicOff className="w-5 h-5 text-red-500" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowMicOptions(!showMicOptions)}
                  className="absolute -top-2 -right-2 w-5 h-5 p-0 rounded-full bg-brandOrange text-brandBlack text-xs"
                >
                  <ChevronUp
                    className={`w-3 h-3 transition-transform ${
                      showMicOptions ? "rotate-180" : ""
                    }`}
                  />
                </Button>
                {showMicOptions && (
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 bg-brandGray border border-brandOrange/30 rounded-lg shadow-lg z-10 p-2 space-y-1">
                    <p className="text-xs text-brandGray mb-1 px-1">
                      Microphones
                    </p>
                    {micDevices.map((device) => (
                      <button
                        key={device.deviceId}
                        onClick={() => handleSwitchMic(device.deviceId)}
                        className={`w-full text-left text-sm px-2 py-1 rounded hover:bg-brandOrange/20 ${
                          currentMicId === device.deviceId
                            ? "text-brandOrange"
                            : "text-brandWhite"
                        }`}
                      >
                        {device.label ||
                          `Mic ${micDevices.indexOf(device) + 1}`}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Camera Toggle */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleToggleVideo}
                  className="rounded-full bg-brandGray hover:bg-brandGray/80 text-brandWhite"
                >
                  {isVideoEnabled ? (
                    <Video className="w-5 h-5" />
                  ) : (
                    <VideoOff className="w-5 h-5 text-red-500" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowCameraOptions(!showCameraOptions)}
                  className="absolute -top-2 -right-2 w-5 h-5 p-0 rounded-full bg-brandOrange text-brandBlack text-xs"
                >
                  <ChevronUp
                    className={`w-3 h-3 transition-transform ${
                      showCameraOptions ? "rotate-180" : ""
                    }`}
                  />
                </Button>
                {showCameraOptions && (
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 bg-brandGray border border-brandOrange/30 rounded-lg shadow-lg z-10 p-2 space-y-1">
                    <p className="text-xs text-brandGray mb-1 px-1">Cameras</p>
                    {cameraDevices.map((device) => (
                      <button
                        key={device.deviceId}
                        onClick={() => handleSwitchCamera(device.deviceId)}
                        className={`w-full text-left text-sm px-2 py-1 rounded hover:bg-brandOrange/20 ${
                          currentCameraId === device.deviceId
                            ? "text-brandOrange"
                            : "text-brandWhite"
                        }`}
                      >
                        {device.label ||
                          `Camera ${cameraDevices.indexOf(device) + 1}`}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Stream Info & Chat */}
        <div className="lg:col-span-1 space-y-4">
          {/* Stream Info Card */}
          <div className="bg-brandBlack border border-brandOrange/30 p-4 rounded-lg space-y-3">
            <h2 className="text-lg font-semibold text-brandOrange mb-2">
              Stream Details
            </h2>
            <div>
              <label className="text-xs text-brandGray mb-1 block">Title</label>
              <Input
                value={streamData?.title || ""}
                onChange={(e) => {
                  if (streamData) {
                    // Create updated streamData with new title
                    const updatedData = {
                      ...streamData,
                      title: e.target.value,
                    };
                    // Update local state instead of direct Firestore write for each keystroke
                  }
                }}
                placeholder="Stream Title"
                className="bg-brandGray border-brandOrange/20 text-brandWhite"
              />
            </div>
            <div>
              <label className="text-xs text-brandGray mb-1 block">
                Thumbnail URL
              </label>
              <Input
                value={streamData?.thumbnail || ""}
                onChange={(e) => {
                  if (streamData) {
                    // Create updated streamData with new thumbnail
                    const updatedData = {
                      ...streamData,
                      thumbnail: e.target.value,
                    };
                    // Update local state instead of direct Firestore write for each keystroke
                  }
                }}
                placeholder="Thumbnail URL"
                className="bg-brandGray border-brandOrange/20 text-brandWhite"
              />
            </div>
            <Button
              onClick={handleUpdateInfo}
              className="w-full bg-brandOrange text-brandBlack hover:bg-brandOrange/90"
            >
              Update Info
            </Button>
          </div>

          {/* Chat Card */}
          <div className="bg-brandBlack border border-brandOrange/30 p-4 rounded-lg h-96 flex flex-col">
            <h2 className="text-lg font-semibold text-brandOrange mb-3">
              Live Chat
            </h2>
            {/* Chat Messages Area */}
            <div className="flex-grow bg-brandGray rounded p-2 mb-3 overflow-y-auto">
              {messages.length === 0 ? (
                <p className="text-sm text-brandGray italic">
                  No messages yet.
                </p>
              ) : (
                messages.map((msg) => (
                  <p key={msg.id} className="text-sm text-brandWhite mb-1">
                    <span className="font-semibold text-brandOrange">
                      {msg.userName}:
                    </span>{" "}
                    {msg.content}
                  </p>
                ))
              )}
            </div>
            {/* Chat Input */}
            <div className="flex space-x-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Send a message..."
                className="flex-grow bg-brandGray border-brandOrange/20 text-brandWhite"
                onKeyPress={handleKeyPress}
              />
              <Button
                onClick={handleSendMessage}
                className="bg-brandOrange text-brandBlack hover:bg-brandOrange/90"
              >
                Send
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* End Stream Confirmation Modal */}
      {showEndConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center">
          <div className="bg-brandBlack border border-red-500/50 rounded-lg p-6 max-w-sm text-center space-y-4">
            <h3 className="text-xl font-bold text-red-500">End Stream?</h3>
            <p className="text-brandWhite">
              Are you sure you want to end this stream? This action cannot be
              undone.
            </p>
            <div className="flex justify-center space-x-4">
              <Button variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={handleEndStream}
              >
                End Stream
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageStreamPage;
