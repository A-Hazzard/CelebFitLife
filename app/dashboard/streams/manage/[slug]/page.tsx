"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ShareButton from "@/components/ui/ShareButton";
import { db } from "@/lib/config/firebase";
import { sendChatMessage } from "@/lib/services/ChatService";
import { useAuthStore } from "@/lib/store/useAuthStore";
import axios from "axios";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { doc, onSnapshot, updateDoc, getDoc } from "firebase/firestore";
import { Check, ChevronUp, Mic, MicOff, Video, VideoOff } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  connect,
  createLocalAudioTrack,
  createLocalVideoTrack,
  LocalAudioTrack,
  LocalTrack,
  LocalVideoTrack,
  Room,
} from "twilio-video";

/** Helper to safely detach a video track's DOM elements. */
const clearVideoContainer = (
  container: HTMLDivElement,
  track?: LocalVideoTrack
) => {
  if (!container) return;

  // Remove all elements
  while (container.firstChild) {
    const el = container.firstChild as HTMLVideoElement;
    if (track) {
      track.detach(el);
    }
    container.removeChild(el);
  }
};

const ManageStreamPage = () => {
  const pathname = usePathname();
  const router = useRouter();
  const slug = pathname?.split("/").pop() || "";
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
  const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([]);
  const [micDevices, setMicDevices] = useState<MediaDeviceInfo[]>([]);
  const [currentVideoTrack, setCurrentVideoTrack] =
    useState<LocalVideoTrack | null>(null);
  const [currentAudioTrack, setCurrentAudioTrack] =
    useState<LocalAudioTrack | null>(null);
  const [showEndConfirmation, setShowEndConfirmation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentMicId, setCurrentMicId] = useState<string>("");
  const [currentCameraId, setCurrentCameraId] = useState<string>("");
  const [streamTitle, setStreamTitle] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState(
    "https://1.bp.blogspot.com/-Rsu_fHvj-IA/YH0ohFqGK_I/AAAAAAAAm7o/dOKXFVif7hYDymAsCNZRe4MK3p7ihTGmgCLcBGAsYHQ/s2362/Stream.jpg"
  );

  // Function declarations
  const switchVideoQuality = useCallback(
    async (quality: "low" | "medium" | "high") => {
      try {
        if (!currentCameraId || !roomRef.current?.localParticipant) return;

        const constraints = {
          low: { width: 640, height: 480 },
          medium: { width: 960, height: 540 },
          high: { width: 1280, height: 720 },
        };

        const newVideoTrack = await createLocalVideoTrack({
          deviceId: currentCameraId,
          ...constraints[quality],
        });

        // Publish new track BEFORE unpublishing old track
        await roomRef.current.localParticipant.publishTrack(newVideoTrack);

        if (currentVideoTrack) {
          await roomRef.current.localParticipant.unpublishTrack(
            currentVideoTrack
          );
          currentVideoTrack.stop();
        }

        setCurrentVideoTrack(newVideoTrack);
        console.log(`Switched to ${quality} quality video track`);
      } catch (error) {
        console.error("Error switching video quality:", error);
      }
    },
    [currentCameraId, currentVideoTrack]
  );

  const switchCamera = useCallback(
    async (deviceId: string) => {
      try {
        console.log("Switching camera to device:", deviceId);

        const newVideoTrack = await createLocalVideoTrack({
          deviceId,
          width: 1280,
          height: 720,
          name: `camera-${deviceId.substring(0, 8)}-${Date.now()}`,
        });

        if (roomRef.current?.localParticipant) {
          await roomRef.current.localParticipant.publishTrack(newVideoTrack);

          if (currentVideoTrack) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            await roomRef.current.localParticipant.unpublishTrack(
              currentVideoTrack
            );
            currentVideoTrack.stop();
          }
        }

        setCurrentVideoTrack(newVideoTrack);
        setCurrentCameraId(deviceId);
        setShowCameraOptions(false);

        const streamRef = doc(db, "streams", slug);
        await updateDoc(streamRef, {
          currentCameraId: deviceId,
        });
      } catch (error) {
        console.error("Error switching camera:", error);
      }
    },
    [currentVideoTrack, slug]
  );

  const switchMic = useCallback(
    async (deviceId: string) => {
      try {
        const newAudioTrack = await createLocalAudioTrack({
          deviceId,
          name: "microphone",
        });

        if (roomRef.current?.localParticipant) {
          await roomRef.current.localParticipant.publishTrack(newAudioTrack);

          if (currentAudioTrack) {
            await roomRef.current.localParticipant.unpublishTrack(
              currentAudioTrack
            );
            currentAudioTrack.stop();
          }
        }

        setCurrentAudioTrack(newAudioTrack);
        setCurrentMicId(deviceId);
        setShowMicOptions(false);

        const streamRef = doc(db, "streams", slug);
        await updateDoc(streamRef, {
          currentMicId: deviceId,
        });
      } catch (error) {
        console.error("Error switching microphone:", error);
      }
    },
    [currentAudioTrack, slug]
  );

  const startStream = useCallback(async () => {
    if (!currentUser || !currentCameraId || !currentMicId) {
      console.error("Missing required data to start stream");
      return;
    }

    try {
      setIsRoomConnecting(true);

      // Update Firestore immediately when starting
      const streamDocRef = doc(db, "streams", slug);
      await updateDoc(streamDocRef, {
        hasStarted: true,
        hasEnded: false,
        startedAt: new Date().toISOString(),
      });

      const res = await fetch("/api/twilio/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomName: slug,
          userName: currentUser.username || currentUser.email,
        }),
      });

      const data = await res.json();
      if (!data.token) throw new Error("No Twilio token returned");

      // Create tracks silently without showing alerts
      const audioTrack = await createLocalAudioTrack({
        deviceId: currentMicId,
        name: "microphone",
      });
      const videoTrack = await createLocalVideoTrack({
        width: 1280,
        height: 720,
        deviceId: currentCameraId,
        name: `camera-${
          currentCameraId?.substring(0, 8) || "default"
        }-${Date.now()}`,
      });
      const tracks = [audioTrack, videoTrack];

      const twRoom = await connect(data.token, {
        tracks,
        bandwidthProfile: {
          video: {
            mode: "collaboration",
            maxTracks: 2,
            dominantSpeakerPriority: "high",
            maxSubscriptionBitrate: 1500000, // 1.5 Mbps
          },
        },
        dominantSpeaker: true,
      });
      roomRef.current = twRoom;

      // Attach video if available
      if (videoTrack && videoContainerRef.current) {
        clearVideoContainer(videoContainerRef.current);
        const videoEl = videoTrack.attach();
        videoEl.style.width = "100%";
        videoEl.style.height = "100%";
        videoEl.style.objectFit = "cover";
        videoContainerRef.current.appendChild(videoEl);
        setCurrentVideoTrack(videoTrack);
      }

      if (audioTrack) {
        setCurrentAudioTrack(audioTrack);
      }

      setIsConnected(true);
      setIsStreamStarted(true);
      setIsRoomConnecting(false);

      twRoom.on("disconnected", () => {
        console.log("Room disconnected event triggered");
        setIsConnected(false);
      });
    } catch (error) {
      console.error("Error starting stream:", error);
      setIsRoomConnecting(false);

      // Reset Firestore if stream fails to start
      const streamDocRef = doc(db, "streams", slug);
      await updateDoc(streamDocRef, {
        hasStarted: false,
        hasEnded: false,
      }).catch(console.error);
    }
  }, [slug, currentUser, currentCameraId, currentMicId]);

  const endStream = useCallback(async () => {
    if (roomRef.current) {
      roomRef.current.disconnect();
      setIsConnected(false);
    }
    try {
      await updateDoc(doc(db, "streams", slug), {
        hasStarted: false,
        hasEnded: true,
        endedAt: new Date().toISOString(),
      });
      router.push("/dashboard");
    } catch (error) {
      console.error("Error ending stream:", error);
    }
  }, [router, slug]);

  const toggleAudio = useCallback(async () => {
    if (!currentAudioTrack) return;

    if (isAudioEnabled) {
      currentAudioTrack.disable();
      // Update Firestore
      const streamRef = doc(db, "streams", slug);
      await updateDoc(streamRef, {
        audioMuted: true,
      });
    } else {
      currentAudioTrack.enable();
      // Update Firestore
      const streamRef = doc(db, "streams", slug);
      await updateDoc(streamRef, {
        audioMuted: false,
      });
    }
    setIsAudioEnabled(!isAudioEnabled);
  }, [currentAudioTrack, isAudioEnabled, slug]);

  const toggleVideo = useCallback(async () => {
    if (!currentVideoTrack) return;

    if (isVideoEnabled) {
      currentVideoTrack.disable();
      // Update Firestore
      const streamRef = doc(db, "streams", slug);
      await updateDoc(streamRef, {
        cameraOff: true,
      });
    } else {
      currentVideoTrack.enable();
      // Update Firestore
      const streamRef = doc(db, "streams", slug);
      await updateDoc(streamRef, {
        cameraOff: false,
      });
    }
    setIsVideoEnabled(!isVideoEnabled);
  }, [currentVideoTrack, isVideoEnabled, slug]);

  const handleSendMessage = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newMessage.trim() || !currentUser) return;
      const userName = currentUser.username || currentUser.email;
      await sendChatMessage(slug, userName || "User", newMessage.trim());
      setNewMessage("");
    },
    [newMessage, currentUser, slug]
  );

  // Effects
  useEffect(() => {
    let hasCheckedPermissions = false;
    if (!hasCheckedPermissions) {
      navigator.mediaDevices
        .getUserMedia({ audio: true, video: true })
        .then(() => {
          hasCheckedPermissions = true;
        })
        .catch((err) => {
          console.error("Media permissions error:", err);
        });
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!slug) return;
    const streamDocRef = doc(db, "streams", slug);
    const unsubscribe = onSnapshot(streamDocRef, async (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setStreamerStatus({
          audioMuted: data.audioMuted || false,
          cameraOff: data.cameraOff || false,
        });

        // Update video status based on stream state
        if (data.hasEnded) {
          setIsStreamStarted(false);
          if (roomRef.current) {
            roomRef.current.disconnect();
          }
        } else if (data.hasStarted) {
          setIsStreamStarted(true);

          // Load device preferences if stream hasn't started
          if (!data.hasStarted) {
            const devices = await navigator.mediaDevices.enumerateDevices();
            if (data.currentMicId) {
              const savedMic = devices.find(
                (d: MediaDeviceInfo) =>
                  d.deviceId === data.currentMicId && d.kind === "audioinput"
              );
              if (savedMic) {
                setCurrentMicId(data.currentMicId);
                await switchMic(data.currentMicId);
              }
            }
            if (data.currentCameraId) {
              const savedCamera = devices.find(
                (d: MediaDeviceInfo) =>
                  d.deviceId === data.currentCameraId && d.kind === "videoinput"
              );
              if (savedCamera) {
                setCurrentCameraId(data.currentCameraId);
                await switchCamera(data.currentCameraId);
              }
            }
          }
        } else {
          setIsStreamStarted(false);
        }
      }
    });
    return () => unsubscribe();
  }, [slug, roomRef, switchCamera, switchMic]);

  useEffect(() => {
    if (!roomRef.current || !isConnected) return;

    const handleTrackStatus = (track: LocalTrack) => {
      if (track.kind === "video") {
        setStreamerStatus((prev) => ({
          ...prev,
          cameraOff: !track.isEnabled,
        }));
      } else if (track.kind === "audio") {
        setStreamerStatus((prev) => ({
          ...prev,
          audioMuted: !track.isEnabled,
        }));
      }
    };

    const handleVideoDisabled = () => {
      if (currentVideoTrack) handleTrackStatus(currentVideoTrack);
    };

    const handleAudioDisabled = () => {
      if (currentAudioTrack) handleTrackStatus(currentAudioTrack);
    };

    currentVideoTrack?.on("disabled", handleVideoDisabled);
    currentVideoTrack?.on("enabled", handleVideoDisabled);
    currentAudioTrack?.on("disabled", handleAudioDisabled);
    currentAudioTrack?.on("enabled", handleAudioDisabled);

    return () => {
      currentVideoTrack?.off("disabled", handleVideoDisabled);
      currentVideoTrack?.off("enabled", handleVideoDisabled);
      currentAudioTrack?.off("disabled", handleAudioDisabled);
      currentAudioTrack?.off("enabled", handleAudioDisabled);
    };
  }, [isConnected, currentVideoTrack, currentAudioTrack]);

  // Update stream status in Firestore
  const updateStreamStatus = useCallback(async () => {
    if (!slug || !isConnected) return;

    await updateDoc(doc(db, "streams", slug), {
      isMuted: !isAudioEnabled,
      isCameraOff: !isVideoEnabled,
      currentMicId,
      currentCameraId,
      lastUpdated: new Date().toISOString(),
    }).catch(console.error);
  }, [
    slug,
    isAudioEnabled,
    isVideoEnabled,
    currentMicId,
    currentCameraId,
    isConnected,
  ]);

  useEffect(() => {
    updateStreamStatus();
  }, [
    slug,
    isAudioEnabled,
    isVideoEnabled,
    currentMicId,
    currentCameraId,
    isConnected,
    updateStreamStatus,
  ]);

  useEffect(() => {
    if (!roomRef.current || !isConnected) return;

    const networkQualityInterval = setInterval(async () => {
      const localParticipant = roomRef.current?.localParticipant;
      if (!localParticipant) return;

      interface NetworkQualityStats {
        networkQualityLevel?: number;
      }

      const quality = (localParticipant as NetworkQualityStats)
        .networkQualityLevel;

      if (quality !== undefined) {
        if (quality <= 2) {
          await switchVideoQuality("low");
        } else if (quality === 3) {
          await switchVideoQuality("medium");
        } else {
          await switchVideoQuality("high");
        }
      }
    }, 5000);

    return () => clearInterval(networkQualityInterval);
  }, [roomRef, isConnected, switchVideoQuality, currentCameraId, currentMicId]);

  useEffect(() => {
    if (!currentUser) return;

    const setupDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === "videoinput");
        const audioInputs = devices.filter((d) => d.kind === "audioinput");

        setCameraDevices(videoInputs);
        setMicDevices(audioInputs);

        // Initialize with saved preferences or defaults
        if (!currentCameraId && videoInputs.length > 0) {
          setCurrentCameraId(videoInputs[0].deviceId);
          await switchCamera(videoInputs[0].deviceId);
        }
        if (!currentMicId && audioInputs.length > 0) {
          setCurrentMicId(audioInputs[0].deviceId);
          await switchMic(audioInputs[0].deviceId);
        }
      } catch (error) {
        console.error("Error setting up devices:", error);
      }
    };

    setupDevices();
  }, [currentUser, currentCameraId, currentMicId, switchCamera, switchMic]);

  useEffect(() => {
    if (!currentUser || !slug) return;

    const setupStream = async () => {
      try {
        console.log("Setting up stream...");
        const { data } = await axios.post("/api/twilio/connect", {
          roomName: slug,
          userName: currentUser.username || currentUser.email,
        });

        // Create video track
        const videoTrack = await createLocalVideoTrack({
          width: 1280,
          height: 720,
          deviceId: currentCameraId,
          name: `camera-${
            currentCameraId?.substring(0, 8) || "default"
          }-${Date.now()}`,
        });

        // Create audio track
        const audioTrack = await createLocalAudioTrack({
          deviceId: currentMicId,
          name: "microphone",
        });

        // Connect to room
        const twRoom = await connect(data.token, {
          name: slug,
          tracks: [videoTrack, audioTrack],
          bandwidthProfile: {
            video: {
              mode: "collaboration",
              maxTracks: 2,
              dominantSpeakerPriority: "high",
              maxSubscriptionBitrate: 1500000, // 1.5 Mbps
            },
          },
          dominantSpeaker: true,
        });

        roomRef.current = twRoom;

        // Attach local video
        if (videoContainerRef.current) {
          clearVideoContainer(videoContainerRef.current);
          const videoEl = videoTrack.attach();
          videoEl.style.width = "100%";
          videoEl.style.height = "100%";
          videoEl.style.objectFit = "cover";
          videoContainerRef.current.appendChild(videoEl);
        }

        setCurrentVideoTrack(videoTrack);
        setCurrentAudioTrack(audioTrack);
        setIsVideoEnabled(true);
        setIsAudioEnabled(true);

        // Update Firestore with initial state - DO NOT set hasStarted here!
        const streamRef = doc(db, "streams", slug);
        await updateDoc(streamRef, {
          // DO NOT set hasStarted to true here - only when Start Stream button is clicked
          cameraOff: false,
          audioMuted: false,
        });

        // Handle room events
        twRoom.on("disconnected", () => {
          console.log("Room disconnected event triggered");
          setIsConnected(false);
        });

        // Cleanup interval on component unmount
        return () => {
          twRoom.disconnect();
        };
      } catch (error) {
        console.error("Error setting up stream:", error);
      }
    };

    setupStream();
  }, [currentUser, slug, currentCameraId, currentMicId]);

  useEffect(() => {
    if (!currentUser || !slug) return;
    const startStreamOnLoad = async () => {
      try {
        const streamDocRef = doc(db, "streams", slug);
        const unsubscribe = onSnapshot(streamDocRef, async (snapshot) => {
          const data = snapshot.data();
          if (!data) return;

          if (data.hasEnded) {
            if (roomRef.current) {
              roomRef.current.disconnect();
            }
            setIsConnected(false);
            setIsStreamStarted(false);
            setIsRoomConnecting(false);
            router.push("/dashboard/streams");
          } else if (data.hasStarted) {
            setIsStreamStarted(true);

            // Load device preferences if stream hasn't started
            if (!data.hasStarted) {
              const devices = await navigator.mediaDevices.enumerateDevices();
              const videoInputs = devices.filter(
                (d) => d.kind === "videoinput"
              );
              const audioInputs = devices.filter(
                (d) => d.kind === "audioinput"
              );

              if (videoInputs.length > 0 && !currentCameraId) {
                setCurrentCameraId(videoInputs[0].deviceId);
              }
              if (audioInputs.length > 0 && !currentMicId) {
                setCurrentMicId(audioInputs[0].deviceId);
              }
            }
          }
        });

        return () => unsubscribe();
      } catch (error) {
        console.error("Error starting stream on load:", error);
        setIsRoomConnecting(false);
      }
    };
    startStreamOnLoad();
  }, [
    slug,
    currentUser,
    isStreamStarted,
    currentCameraId,
    currentMicId,
    router,
  ]);

  // Streamer status overlay
  const [streamerStatus, setStreamerStatus] = useState({
    audioMuted: false,
    cameraOff: false,
  });

  // Modal controls
  const openModal = () => {
    setShowEndConfirmation(true);
  };

  const closeModal = () => {
    setShowEndConfirmation(false);
  };

  // Add effect to fetch stream title and thumbnail
  useEffect(() => {
    if (!slug) return;

    const fetchStreamInfo = async () => {
      try {
        const streamDoc = await getDoc(doc(db, "streams", slug));
        if (streamDoc.exists()) {
          const data = streamDoc.data();
          setStreamTitle(data.title || "Untitled Stream");
          if (data.thumbnail) {
            setThumbnailUrl(data.thumbnail);
          }
        }
      } catch (error) {
        console.error("Error fetching stream info:", error);
      }
    };

    fetchStreamInfo();
  }, [slug]);

  if (loading) {
    return null;
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-brandOrange">
        <div className="flex items-center space-x-4">
          <div className="h-10 w-10 rounded overflow-hidden flex-shrink-0 bg-brandGray">
            <Image
              src={thumbnailUrl}
              alt="Stream thumbnail"
              className="h-full w-full object-cover"
              width={40}
              height={40}
              onError={() => {
                setThumbnailUrl(
                  "https://1.bp.blogspot.com/-Rsu_fHvj-IA/YH0ohFqGK_I/AAAAAAAAm7o/dOKXFVif7hYDymAsCNZRe4MK3p7ihTGmgCLcBGAsYHQ/s2362/Stream.jpg"
                );
              }}
            />
          </div>
          <h1 className="text-xl font-bold text-brandWhite">{streamTitle}</h1>
        </div>
        <div className="flex items-center space-x-4">
          <Button className="px-4 py-2 bg-brandOrange text-brandBlack rounded hover:bg-brandWhite hover:text-brandBlack">
            Subscribe
          </Button>
          <Button className="p-2 bg-brandGray rounded-full">😀</Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row h-[calc(100vh-4rem)]">
        {/* Video Section */}
        <div className="flex-1 p-4 relative">
          <div className="relative bg-black w-full h-full rounded-lg overflow-hidden">
            <div ref={videoContainerRef} className="w-full h-full" />

            {/* 🔥 Overlays for streamer status */}
            {streamerStatus?.cameraOff && (
              <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-20">
                <VideoOff className="w-10 h-10 text-brandOrange mb-2" />
                <p className="text-brandOrange text-xl font-semibold">
                  Camera is Off
                </p>
              </div>
            )}

            {/* 🔧 Stream Controls (Streamer only) */}
            {isStreamStarted && !isRoomConnecting && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-4 bg-black/50 p-3 rounded-lg z-40">
                {/* 🎤 Audio Toggle */}
                <div className="relative">
                  <button
                    onClick={toggleAudio}
                    className="p-3 rounded-full bg-brandOrange hover:bg-brandOrange/80 transition-colors"
                  >
                    {isAudioEnabled ? (
                      <Mic className="w-5 h-5" />
                    ) : (
                      <MicOff className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={() => setShowMicOptions(!showMicOptions)}
                    className="absolute -right-1 -top-1 p-1 rounded-md bg-orange-100 hover:bg-orange-200 transition-colors"
                  >
                    <ChevronUp className="w-3 h-3 text-orange-600" />
                  </button>
                  {showMicOptions && (
                    <div className="absolute bottom-full left-0 mb-2 w-48 bg-neutral-800 rounded-lg shadow-lg overflow-hidden z-50">
                      {micDevices.map((device) => (
                        <button
                          key={device.deviceId}
                          onClick={() => {
                            switchMic(device.deviceId);
                            setShowMicOptions(false);
                          }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-brandOrange/20 flex items-center justify-between ${
                            currentMicId === device.deviceId
                              ? "bg-brandOrange/10"
                              : ""
                          }`}
                        >
                          <span className="truncate">{device.label}</span>
                          {currentMicId === device.deviceId && (
                            <Check className="w-4 h-4 text-brandOrange flex-shrink-0 ml-2" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 📷 Video Toggle */}
                <div className="relative">
                  <button
                    onClick={toggleVideo}
                    className="p-3 rounded-full bg-brandOrange hover:bg-brandOrange/80 transition-colors"
                  >
                    {isVideoEnabled ? (
                      <Video className="w-5 h-5" />
                    ) : (
                      <VideoOff className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={() => setShowCameraOptions(!showCameraOptions)}
                    className="absolute -right-1 -top-1 p-1 rounded-md bg-orange-100 hover:bg-orange-200 transition-colors"
                  >
                    <ChevronUp className="w-3 h-3 text-orange-600" />
                  </button>
                  {showCameraOptions && (
                    <div className="absolute bottom-full left-0 mb-2 w-48 bg-neutral-800 rounded-lg shadow-lg overflow-hidden z-50">
                      {cameraDevices.map((device) => (
                        <button
                          key={device.deviceId}
                          onClick={() => {
                            switchCamera(device.deviceId);
                            setShowCameraOptions(false);
                          }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-brandOrange/20 flex items-center justify-between ${
                            currentCameraId === device.deviceId
                              ? "bg-brandOrange/10"
                              : ""
                          }`}
                        >
                          <span className="truncate">{device.label}</span>
                          {currentCameraId === device.deviceId && (
                            <Check className="w-4 h-4 text-brandOrange flex-shrink-0 ml-2" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 🔴 End Stream Button */}
                <Button
                  onClick={openModal}
                  className="rounded-full bg-red-500 text-white shadow-lg px-6 py-2"
                >
                  End Stream
                </Button>
              </div>
            )}

            {/* ▶️ Start Stream Button */}
            {!isStreamStarted && !isRoomConnecting && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-40">
                <Button
                  onClick={startStream}
                  className="bg-brandOrange text-white px-6 py-2 rounded-full"
                >
                  Start Stream
                </Button>
              </div>
            )}
          </div>

          {/* Connecting Indicator */}
          {isRoomConnecting && (
            <p className="absolute text-brandOrange text-xl font-bold">
              Connecting...
            </p>
          )}
        </div>

        {/* Chat Panel */}
        <div className="w-full md:w-96 lg:w-80 bg-brandGray border-l border-brandOrange flex flex-col">
          <div className="flex items-center justify-end p-2 border-b border-brandOrange">
            <ShareButton
              streamLink={
                typeof window !== "undefined" ? window.location.href : ""
              }
            />
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {/* messages.map((msg) => (
              <div
                key={msg.id}
                className="bg-brandBlack p-2 rounded-md text-sm"
              >
                <strong className="text-brandOrange">{msg.userName}:</strong>{" "}
                {msg.content}
              </div>
            )) */}
          </div>

          <div className="p-4 border-t border-brandOrange">
            <form onSubmit={handleSendMessage} className="relative">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="absolute right-2 top-1/2 -translate-y-1/2"
              >
                😊
              </button>
            </form>
            {showEmojiPicker && (
              <div className="absolute bottom-full right-4 mb-2">
                <EmojiPicker
                  theme={Theme.DARK}
                  onEmojiClick={(emoji) => {
                    setNewMessage((prev) => prev + emoji.emoji);
                    setShowEmojiPicker(false);
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* End Stream Confirmation Modal */}
      {showEndConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-brandGray p-6 rounded-lg max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold mb-4">End Stream?</h2>
            <p className="text-gray-300 mb-6">
              Are you sure you want to end the stream? This cannot be undone.
            </p>
            <div className="flex justify-end gap-4">
              <Button
                onClick={closeModal}
                className="bg-gray-600 hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button
                onClick={endStream}
                className="bg-red-500 hover:bg-red-600"
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
