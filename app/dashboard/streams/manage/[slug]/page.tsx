"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ShareButton from "@/components/ui/ShareButton";
import { db } from "@/lib/config/firebase";
import { useAuthStore } from "@/lib/store/useAuthStore";
import {
  switchCamera,
  switchMic,
  switchVideoQuality,
} from "@/lib/utils/streaming";
import {
  updateStreamInfo,
  prepareStreamStart,
  endStream,
  updateStreamDeviceStatus,
  setupTwilioRoom,
  safelyDetachTrack,
} from "@/lib/helpers/streaming";
import { createLogger } from "@/lib/utils/logger";
import { doc, updateDoc } from "firebase/firestore";
import { ChevronUp, Mic, MicOff, Video, VideoOff } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useMemo } from "react";
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
import { toStreamingError } from "@/lib/types/streaming";
import {
  useVideoContainer,
  VideoTrackRenderer,
} from "@/lib/hooks/useVideoContainer";
import { useAudioTracks, AudioTrackRenderer } from "@/lib/hooks/useAudioTracks";

// Create page-specific logger
const pageLogger = createLogger("ManagePage");

const ManageStreamPage = () => {
  const pathname = usePathname();
  const router = useRouter();
  const slug = useMemo(() => pathname?.split("/").pop() || "", [pathname]);
  const { currentUser } = useAuthStore();

  // Use our new video container hook
  const {
    videoElements,
    addVideo,
    removeVideo,
    clearVideos,
    videoContainerRef,
  } = useVideoContainer();

  // Use our new audio tracks hook
  const {
    audioElements,
    isGloballyMuted,
    addAudio,
    removeAudio,
    toggleTrackMute,
    toggleGlobalMute,
    clearAudios,
  } = useAudioTracks();

  // State declarations
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isStreamStarted, setIsStreamStarted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isRoomConnecting, setIsRoomConnecting] = useState(false);
  const [showCameraOptions, setShowCameraOptions] = useState(false);
  const [showMicOptions, setShowMicOptions] = useState(false);
  const [currentVideoTrack, setCurrentVideoTrack] =
    useState<LocalVideoTrack | null>(null);
  const [currentAudioTrack, setCurrentAudioTrack] =
    useState<LocalAudioTrack | null>(null);
  const [showEndConfirmation, setShowEndConfirmation] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  // Room ref
  const roomRef = useRef<Room | null>(null);

  // Use custom hooks
  const { streamData, loading } = useStreamData(slug);
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
        // Update the video in our container
        if (currentVideoTrack) {
          removeVideo(currentVideoTrack.id);
        }
        addVideo(result.track, { replaceExisting: true });

        setCurrentVideoTrack(result.track);
        setCurrentCameraId(deviceId);
        setShowCameraOptions(false);
      }
    },
    [currentVideoTrack, slug, setCurrentCameraId, addVideo, removeVideo]
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
        // Update the audio in our container
        if (currentAudioTrack) {
          removeAudio(currentAudioTrack.id);
        }
        addAudio(result.track, { muted: !isAudioEnabled });

        setCurrentAudioTrack(result.track);
        setCurrentMicId(deviceId);
        setShowMicOptions(false);
      }
    },
    [
      currentAudioTrack,
      slug,
      setCurrentMicId,
      addAudio,
      removeAudio,
      isAudioEnabled,
    ]
  );

  // Handle stream start
  const handleStartStream = useCallback(async () => {
    const logger = pageLogger.withContext("StartStream");

    logger.info(`Starting stream for slug: ${slug}`);

    if (!currentUser?.uid || !currentCameraId || !currentMicId || !slug) {
      const missingItems = [];
      if (!currentUser?.uid) missingItems.push("user ID");
      if (!currentCameraId) missingItems.push("camera");
      if (!currentMicId) missingItems.push("microphone");
      if (!slug) missingItems.push("stream ID");

      logger.error(
        `Missing required data to start stream: ${missingItems.join(", ")}`
      );
      alert(
        "Cannot start stream. Ensure camera and mic are selected and you are logged in."
      );
      return;
    }

    setIsRoomConnecting(true);
    logger.debug(`Setting isRoomConnecting = true`);

    try {
      // Type guard to ensure uid is defined
      const uid = currentUser.uid;
      if (!uid) {
        logger.error(`User ID is unexpectedly undefined after check`);
        return;
      }

      const username = currentUser.username || currentUser.email || "Streamer";
      logger.debug(`Preparing stream start with username: ${username}`);

      // Step 1: Prepare the stream in Firestore
      logger.debug(`Calling prepareStreamStart...`);
      const prepareResult = await prepareStreamStart(slug, uid, username);

      if (!prepareResult.success || !prepareResult.token) {
        const errorMsg =
          prepareResult.error || "Failed to prepare stream start";
        logger.error(`Stream preparation failed: ${errorMsg}`);
        throw new Error(errorMsg);
      }

      logger.info(`Stream preparation successful, token received`);

      // Step 2: Setup Twilio room, now using our add functions for both video and audio
      logger.debug(`Setting up Twilio room...`);
      const roomResult = await setupTwilioRoom(
        slug,
        username,
        currentCameraId,
        currentMicId,
        videoContainerRef as React.RefObject<HTMLDivElement>,
        {
          audioMuted: !isAudioEnabled,
          cameraOff: !isVideoEnabled,
        },
        // Pass the addVideo function to handle video rendering
        (videoTrack) => addVideo(videoTrack, { replaceExisting: true }),
        // Pass the addAudio function to handle audio rendering
        (audioTrack, options) => addAudio(audioTrack, options)
      );

      if (!roomResult.success) {
        const errorMsg = roomResult.error || "Failed to setup Twilio room";
        logger.error(`Room setup failed: ${errorMsg}`);
        throw new Error(errorMsg);
      }

      logger.info(`Room setup successful`);
      logger.debug(`Storing room reference and tracks`);

      // Store references
      roomRef.current = roomResult.room;
      setCurrentAudioTrack(roomResult.audioTrack);
      setCurrentVideoTrack(roomResult.videoTrack);
      setIsConnected(true);
      logger.debug(`Setting isConnected = true`);

      // Step 3: Setup room disconnection handler
      logger.debug(`Setting up room disconnection handler`);
      roomResult.room?.on(
        "disconnected",
        (_disconnectedRoom: Room, error: TwilioError | undefined) => {
          logger.info(`Room disconnected event triggered`);
          if (error) {
            logger.error(`Room disconnected due to error:`, error);
          }

          logger.debug(`Clearing state after disconnection`);
          setIsConnected(false);
          setCurrentAudioTrack(null);
          setCurrentVideoTrack(null);
          roomRef.current = null;

          logger.debug(`Clearing video container`);
          clearVideos();
        }
      );

      logger.info(`Stream started successfully`);
    } catch (err) {
      const error = toStreamingError(err);
      logger.error(`Error starting stream:`, error);
      logger.trace(`Start stream error stack trace`);

      // Log detailed error information
      if (err instanceof TwilioError) {
        logger.error(`Twilio error details:`, {
          code: err.code,
          message: err.message,
        });
      }

      alert(`Failed to start stream: ${error.message}`);

      // Reset stream status in Firestore if start failed
      try {
        logger.debug(`Resetting stream status in Firestore`);
        await updateDoc(doc(db, "streams", slug), { hasStarted: false });
        logger.debug(`Stream status reset successful`);
      } catch (updateErr) {
        const updateError = toStreamingError(updateErr);
        logger.error(`Failed to reset stream status:`, updateError);
      }
    } finally {
      logger.debug(`Setting isRoomConnecting = false`);
      setIsRoomConnecting(false);
    }
  }, [
    currentUser,
    slug,
    currentCameraId,
    currentMicId,
    isAudioEnabled,
    isVideoEnabled,
    addVideo,
    addAudio,
  ]);

  const handleEndStream = useCallback(async () => {
    setShowEndConfirmation(false);
    const logger = pageLogger.withContext("EndStream");

    try {
      logger.info("Ending stream...");

      // Safely clean up current tracks before ending stream
      if (currentVideoTrack) {
        try {
          safelyDetachTrack(currentVideoTrack);
        } catch (err) {
          const error = toStreamingError(err);
          logger.error("Error cleaning up video track:", error);
          // Continue despite errors
        }
      }

      if (currentAudioTrack) {
        try {
          safelyDetachTrack(currentAudioTrack);
        } catch (err) {
          const error = toStreamingError(err);
          logger.error("Error cleaning up audio track:", error);
          // Continue despite errors
        }
      }

      // Now end the stream with our enhanced helper function
      const result = await endStream(slug, roomRef.current);

      if (!result.success) {
        logger.error("Failed to end stream gracefully:", result.error);
        alert(`There was an issue ending the stream: ${result.error}`);

        // Force disconnect room as fallback
        if (roomRef.current) {
          try {
            roomRef.current.disconnect();
          } catch (err) {
            const error = toStreamingError(err);
            logger.error("Force disconnect failed:", error);
          }
        }
      } else {
        logger.info("Stream ended successfully");
        setIsStreamStarted(false);
        setIsConnected(false);

        // Reset track references
        setCurrentVideoTrack(null);
        setCurrentAudioTrack(null);
        roomRef.current = null;
      }

      // Clear both video and audio elements using our React functions
      clearVideos();
      clearAudios();

      // After small delay, redirect to dashboard
      setTimeout(() => {
        router.push("/dashboard/streams");
      }, 1500);
    } catch (err) {
      const error = toStreamingError(err);
      logger.error("Critical error in handleEndStream:", error);
      alert("Failed to end stream properly. Please try again.");
    }
  }, [
    slug,
    currentVideoTrack,
    currentAudioTrack,
    router,
    clearVideos,
    clearAudios,
  ]);

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

    // Use our hook's function to update audio state
    if (currentAudioTrack) {
      toggleTrackMute(currentAudioTrack.id);
    }
  }, [currentAudioTrack, isAudioEnabled, slug, toggleTrackMute]);

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

  // Modal controls
  const openModal = (): void => setShowEndConfirmation(true);
  const closeModal = (): void => setShowEndConfirmation(false);

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
            className="mt-4 bg-black rounded-lg aspect-video relative overflow-hidden"
          >
            {/* Render video elements from our hook state */}
            {videoElements.map(({ id, track, style }) => (
              <VideoTrackRenderer key={id} track={track} style={style} />
            ))}

            {/* Overlay for camera off state */}
            {(!isConnected || !isVideoEnabled) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-70">
                <VideoOff className="w-16 h-16 text-brandGray mb-4" />
                <p className="text-lg text-brandWhite">
                  {isStreamStarted ? "Camera Off" : "Stream Offline"}
                </p>
              </div>
            )}
          </div>

          {/* Render audio elements hidden from view */}
          <div className="hidden">
            {audioElements.map(({ id, track, muted }) => (
              <AudioTrackRenderer key={id} track={track} muted={muted} />
            ))}
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

        {/* Right Column: Stream Info */}
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
                onChange={() => {
                  // Update will be handled by the Update Info button
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
                onChange={() => {
                  // Update will be handled by the Update Info button
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
