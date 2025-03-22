"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  connect,
  createLocalAudioTrack,
  createLocalVideoTrack,
  LocalAudioTrack,
  LocalVideoTrack,
  LocalTrack,
  Room,
} from "twilio-video";
import { listenToMessages, sendChatMessage } from "@/lib/services/ChatService";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "@/lib/config/firebase";
import EmojiPicker, { Theme } from "emoji-picker-react";
import ShareButton from "@/components/ui/ShareButton";
import {
  Camera,
  Check,
  ChevronUp,
  Mic,
  MicOff,
  Video,
  VideoOff,
} from "lucide-react";
import axios from "axios";

/** Helper to safely detach a video track's DOM elements. */
const clearVideoContainer = (
  container: HTMLDivElement,
  track?: LocalVideoTrack
) => {
  if (track) {
    const attachedElements = track.detach();
    attachedElements.forEach((el) => {
      if (el.parentNode === container) {
        container.removeChild(el);
      }
    });
  } else {
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
  }
};

interface ChatMessage {
  id: string;
  userName: string;
  content: string;
}

const ManageStreamPage: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const slug = pathname?.split("/").pop() || "";

  const videoContainerRef = useRef<HTMLDivElement>(null);
  const roomRef = useRef<Room | null>(null);

  // State declarations
  const [messages, setMessages] = useState<ChatMessage[]>([]);
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
  const [modalOpacity, setModalOpacity] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentMicId, setCurrentMicId] = useState<string>("");
  const [currentCameraId, setCurrentCameraId] = useState<string>("");
  const [isBuffering, setIsBuffering] = useState(false); // Buffering state

  // Streamer status overlay
  const [streamerStatus, setStreamerStatus] = useState({
    audioMuted: false,
    cameraOff: false,
  });

  const [streamData, setStreamData] = useState<{
    hasStarted: boolean;
    hasEnded: boolean;
    thumbnailUrl: string;
  } | null>(null);

  const { currentUser } = useAuthStore();

  // Check media permissions
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

  // Wait for user data to load
  useEffect(() => {
    if (currentUser) {
      setLoading(false);
    }
  }, [currentUser]);

  // Listen for chat messages
  useEffect(() => {
    if (!slug) return;
    const unsubscribe = listenToMessages(slug, (msgs: ChatMessage[]) => {
      setMessages(msgs);
    });
    return () => {
      unsubscribe();
      if (roomRef.current) {
        roomRef.current.disconnect();
      }
    };
  }, [slug]);

  // Update Firestore with stream status
  useEffect(() => {
    if (!slug || !isConnected) return;
    const streamDocRef = doc(db, "streams", slug);
    updateDoc(streamDocRef, {
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

  // Load saved device preferences and status from Firestore
  useEffect(() => {
    if (!slug) return;
    let isSubscribed = true;
    const streamDocRef = doc(db, "streams", slug);
    const unsubscribe = onSnapshot(streamDocRef, async (snapshot) => {
      if (!isSubscribed) return;
      if (snapshot.exists()) {
        const data = snapshot.data();
        setStreamData({
          hasStarted: data.hasStarted || false,
          hasEnded: data.hasEnded || false,
          thumbnailUrl: data.thumbnailUrl || "",
        });
        setIsStreamStarted(data.hasStarted || false);

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
            } else {
              const defaultMic = devices.find(
                (d: MediaDeviceInfo) => d.kind === "audioinput"
              );
              if (defaultMic) {
                setCurrentMicId(defaultMic.deviceId);
                await switchMic(defaultMic.deviceId);
              }
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
            } else {
              const defaultCamera = devices.find(
                (d: MediaDeviceInfo) => d.kind === "videoinput"
              );
              if (defaultCamera) {
                setCurrentCameraId(defaultCamera.deviceId);
                await switchCamera(defaultCamera.deviceId);
              }
            }
          }
        }
      }
    });
    return () => {
      isSubscribed = false;
      unsubscribe();
    };
  }, [slug]);
  const switchVideoQuality = async (quality: "low" | "medium" | "high") => {
    try {
      const constraints = {
        low: { width: 640, height: 480 },
        medium: { width: 960, height: 540 },
        high: { width: 1280, height: 720 },
      };

      const newVideoTrack = await createLocalVideoTrack({
        deviceId: currentCameraId,
        ...constraints[quality],
      });

      if (roomRef.current && roomRef.current.localParticipant) {
        // Publish the new track
        await roomRef.current.localParticipant.publishTrack(newVideoTrack);

        // Unpublish the old track
        if (currentVideoTrack) {
          await roomRef.current.localParticipant.unpublishTrack(
            currentVideoTrack
          );
          currentVideoTrack.stop();
        }
      }

      // Update the current video track
      setCurrentVideoTrack(newVideoTrack);

      // Attach the new track to the video container
      if (videoContainerRef.current) {
        clearVideoContainer(videoContainerRef.current);
        const videoEl = newVideoTrack.attach();
        videoEl.style.width = "100%";
        videoEl.style.height = "100%";
        videoEl.style.objectFit = "cover";
        videoContainerRef.current.appendChild(videoEl);
      }

      console.log(`Switched to ${quality} quality video track`);
    } catch (error) {
      console.error("Error switching video quality:", error);
    }
  };
  // Setup stream
  useEffect(() => {
    if (!currentUser || !slug) return;

    const setupStream = async () => {
        try {
            console.log('Setting up stream...');
            const { data } = await axios.post("/api/twilio/token", {
                roomName: slug,
                userName: currentUser.username || currentUser.email,
            });

            // Create video track
            const videoTrack = await createLocalVideoTrack({
                width: 1280,
                height: 720,
                deviceId: currentCameraId,
                name: `camera-${currentCameraId?.substring(0, 8) || 'default'}-${Date.now()}`,
            });

            // Create audio track
            const audioTrack = await createLocalAudioTrack({
                deviceId: currentMicId,
                name: 'microphone',
            });

            // Connect to room
            const twRoom = await connect(data.token, {
                name: slug,
                tracks: [videoTrack, audioTrack],
                bandwidthProfile: {
                    video: {
                        mode: 'collaboration',
                        maxTracks: 2,
                        dominantSpeakerPriority: 'high',
                        maxSubscriptionBitrate: 1500000, // 1.5 Mbps
                    },
                },
                dominantSpeaker: true,
            });

            roomRef.current = twRoom;

            // Network quality monitoring
            const networkQualityInterval = setInterval(() => {
                if (twRoom?.localParticipant?.networkQualityStats) {
                    const networkQuality = twRoom.localParticipant.networkQualityStats;
                    console.log('Network quality:', networkQuality);

                    // Adjust video quality based on network conditions
                    if (networkQuality.level === 1) {
                        // Poor network, reduce quality
                        switchVideoQuality('low');
                    } else if (networkQuality.level === 5) {
                        // Good network, increase quality
                        switchVideoQuality('high');
                    }
                }
            }, 5000); // Check every 5 seconds

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

            // Update Firestore with initial state
            const streamRef = doc(db, "streams", slug);
            await updateDoc(streamRef, {
                hasStarted: true,
                cameraOff: false,
                audioMuted: false,
            });

            // Handle room events
            twRoom.on("disconnected", () => {
                console.log('Room disconnected event triggered');
                setIsConnected(false);
                clearInterval(networkQualityInterval); // Clear the interval on disconnect
            });

            // Cleanup interval on component unmount
            return () => {
                clearInterval(networkQualityInterval);
            };
        } catch (error) {
            console.error("Error setting up stream:", error);
        }
    };

    setupStream();
}, [currentUser, slug, currentCameraId, currentMicId]);
  // Get camera and mic devices
  useEffect(() => {
    if (!currentUser) return;
    navigator.mediaDevices
      .enumerateDevices()
      .then((devices) => {
        const videoInputs = devices.filter((d) => d.kind === "videoinput");
        const audioInputs = devices.filter((d) => d.kind === "audioinput");
        setCameraDevices(videoInputs);
        setMicDevices(audioInputs);
        const defaultMic = devices.find((d) => d.kind === "audioinput");
        const defaultCamera = devices.find((d) => d.kind === "videoinput");
        if (defaultMic) setCurrentMicId(defaultMic.deviceId);
        if (defaultCamera) setCurrentCameraId(defaultCamera.deviceId);
      })
      .catch((err) => console.error("Error enumerating devices:", err));
  }, [currentUser]);

  // Automatically start the stream if it’s active
  useEffect(() => {
    if (!slug || !currentUser || !isStreamStarted) return;
    const startStreamOnLoad = async () => {
      try {
        setIsRoomConnecting(true);
        const res = await fetch("/api/twilio/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomName: slug,
            userName: currentUser.username || currentUser.email,
          }),
        });
        const data = await res.json();
        if (!data.token) throw new Error("No Twilio token returned");

        const audioTrack = await createLocalAudioTrack({
          deviceId: currentMicId,
          name: "microphone",
        });
        const videoTrack = await createLocalVideoTrack({
          width: 1280,
          height: 720,
          deviceId: currentCameraId,
          name: "camera",
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
        setIsConnected(true);
        setIsStreamStarted(true);
        setIsRoomConnecting(false);

        twRoom.on("disconnected", () => {
          console.log("Room disconnected event triggered");
          setIsConnected(false);
        });
      } catch (error) {
        console.error("Error starting stream on load:", error);
        setIsRoomConnecting(false);
      }
    };
    startStreamOnLoad();
  }, [slug, currentUser, isStreamStarted]);

  // START STREAM (manually)
  const startStream = useCallback(async () => {
    if (!slug || !currentUser) return;

    try {
      setIsRoomConnecting(true);

      // Update Firestore immediately when starting
      const streamDocRef = doc(db, "streams", slug);
      await updateDoc(streamDocRef, {
        hasStarted: true,
        hasEnded: false,
        startedAt: new Date().toISOString(),
      });

      const res = await fetch("/api/twilio/token", {
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
  }, [slug, currentUser]);

  // END STREAM
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

  // TOGGLE AUDIO
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

  // TOGGLE VIDEO
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

  // SWITCH CAMERA
  const switchCamera = useCallback(
    async (deviceId: string) => {
      try {
        console.log("Switching camera to device:", deviceId);

        // Create new video track
        const newVideoTrack = await createLocalVideoTrack({
          deviceId,
          width: 1280,
          height: 720,
          name: `camera-${deviceId.substring(0, 8)}-${Date.now()}`,
        });

        // Publish new track BEFORE unpublishing old track
        if (roomRef.current && roomRef.current.localParticipant) {
          await roomRef.current.localParticipant.publishTrack(newVideoTrack);

          // Small delay before unpublishing old track
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

        // Save preference to Firestore
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

  // SWITCH MIC
  const switchMic = useCallback(
    async (deviceId: string) => {
      try {
        // Create new audio track
        const newAudioTrack = await createLocalAudioTrack({
          deviceId,
          name: "microphone",
        });

        // Publish new track BEFORE unpublishing old track
        if (roomRef.current && roomRef.current.localParticipant) {
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

        // Save preference to Firestore
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

  // SEND CHAT MESSAGE
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

  // Modal controls
  const openModal = () => {
    setShowEndConfirmation(true);
    setTimeout(() => setModalOpacity(true), 10);
  };

  const closeModal = () => {
    setModalOpacity(false);
    setTimeout(() => setShowEndConfirmation(false), 300);
  };

  // Add track status handlers
  useEffect(() => {
    if (!currentVideoTrack && !currentAudioTrack) return;

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
  }, [currentVideoTrack, currentAudioTrack]);

  if (loading) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-brandBlack text-brandWhite relative">
      {/* Header */}
      <header className="h-16 flex items-center justify-between px-4 border-b border-brandOrange">
        <div className="text-2xl font-bold">CelebFitLife</div>
        <div className="flex-1 mx-4">
          <Input
            placeholder="Search..."
            className="w-3/4 border border-brandOrange bg-brandBlack text-brandWhite rounded-md px-2 py-1"
          />
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

            {/* Stream Controls */}
            {isStreamStarted && !isRoomConnecting && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-4 bg-black/50 p-3 rounded-lg">
                {/* Audio Controls */}
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

                {/* Video Controls */}
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

                {/* End Stream Button */}
                <Button
                  onClick={openModal}
                  className="rounded-full bg-red-500 text-white shadow-lg px-6 py-2"
                >
                  End Stream
                </Button>
              </div>
            )}

            {/* Start Stream Button */}
            {!isStreamStarted && !isRoomConnecting && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                <Button
                  onClick={startStream}
                  className="bg-brandOrange text-white px-6 py-2 rounded-full"
                >
                  Start Stream
                </Button>
              </div>
            )}
          </div>

          {/* Buffering Indicator */}
          {isBuffering && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <p className="text-brandOrange text-xl font-bold">Buffering...</p>
            </div>
          )}

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
            {messages.map((msg) => (
              <div
                key={msg.id}
                className="bg-brandBlack p-2 rounded-md text-sm"
              >
                <strong className="text-brandOrange">{msg.userName}:</strong>{" "}
                {msg.content}
              </div>
            ))}
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
