"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
    connect,
    createLocalVideoTrack,
    createLocalAudioTrack,
    LocalAudioTrack,
    LocalTrackPublication,
    LocalVideoTrack,
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
import { Camera, Mic, MicOff, Video, VideoOff } from "lucide-react";

interface ChatMessage {
    id: string;
    userName: string;
    content: string;
}

// Updated clearVideoContainer: if a track is provided, detach its elements safely.
const clearVideoContainer = (
    container: HTMLDivElement,
    track?: LocalVideoTrack
) => {
    if (track) {
        // Detach all elements attached by the track and remove them if they're still in the container.
        const attachedElements = track.detach();
        attachedElements.forEach((el) => {
            if (el.parentNode === container) {
                container.removeChild(el);
            }
        });
    } else {
        // Fallback: safely remove all children
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
    }
};

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
    const [currentVideoTrack, setCurrentVideoTrack] = useState<LocalVideoTrack | null>(
        null
    );
    const [currentAudioTrack, setCurrentAudioTrack] = useState<LocalAudioTrack | null>(
        null
    );
    const [showEndConfirmation, setShowEndConfirmation] = useState(false);
    const [modalOpacity, setModalOpacity] = useState(false);
    const [loading, setLoading] = useState(true);
    const [streamerStatus, setStreamerStatus] = useState({
        audioMuted: false,
        cameraOff: false,
    });

    const { currentUser } = useAuthStore();

    // Wait for user data to load
    useEffect(() => {
        if (currentUser) {
            setLoading(false);
        }
    }, [currentUser]);

    // Listen for chat messages
    useEffect(() => {
        if (!slug) return;
        const unsubscribe = listenToMessages(slug, (msgs: ChatMessage[]) =>
            setMessages(msgs)
        );
        return () => {
            unsubscribe();
            roomRef.current && roomRef.current.disconnect();
        };
    }, [slug]);

    // Listen for stream status changes in Firestore
    useEffect(() => {
        if (!slug) return;
        const streamDocRef = doc(db, "streams", slug);
        const unsubscribe = onSnapshot(streamDocRef, (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                setIsStreamStarted(Boolean(data.hasStarted));
            }
        });
        return () => unsubscribe();
    }, [slug]);

    // Get camera and mic devices
    useEffect(() => {
        if (!currentUser) return;
        navigator.mediaDevices
            .enumerateDevices()
            .then((devices) => {
                const videoInputs = devices.filter(
                    (device) => device.kind === "videoinput"
                );
                const audioInputs = devices.filter(
                    (device) => device.kind === "audioinput"
                );
                setCameraDevices(videoInputs);
                setMicDevices(audioInputs);
            })
            .catch((err) => console.error("Error enumerating devices:", err));
    }, [currentUser]);

    // Automatically start the stream if it's active
    useEffect(() => {
        if (!slug || !currentUser || !isStreamStarted) return;
        const startStreamOnLoad = async () => {
            setIsRoomConnecting(true);
            try {
                const res = await fetch("/api/twilio/token", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        roomName: slug,
                        userName: currentUser.displayName || currentUser.email,
                    }),
                });
                const data = await res.json();
                if (!data.token) throw new Error("No Twilio token returned");

                // Request mic and camera permissions
                const audioTrack = await createLocalAudioTrack();
                const videoTrack = await createLocalVideoTrack({ width: 640, height: 360 });

                const twRoom = await connect(data.token, {
                    tracks: [audioTrack, videoTrack],
                });
                roomRef.current = twRoom;

                if (videoContainerRef.current) {
                    const videoEl = videoTrack.attach() as HTMLVideoElement;
                    videoEl.style.width = "100%";
                    videoEl.style.height = "100%";
                    videoEl.style.objectFit = "cover";

                    // Safely detach any previously attached elements for this track.
                    clearVideoContainer(videoContainerRef.current, videoTrack);
                    videoContainerRef.current.appendChild(videoEl);
                    setCurrentVideoTrack(videoTrack);
                }

                setCurrentAudioTrack(audioTrack);
                setIsConnected(true);
                setIsRoomConnecting(false);
                twRoom.on("disconnected", () => {
                    setIsConnected(false);
                    setIsStreamStarted(false);
                });
            } catch (error) {
                console.error("Error starting stream on load:", error);
                setIsRoomConnecting(false);
            }
        };
        startStreamOnLoad();
    }, [slug, currentUser, isStreamStarted]);

    // Start stream manually
    const startStream = useCallback(async () => {
        if (!slug || !currentUser) {
            console.error("Missing slug or current user");
            return;
        }
        setIsRoomConnecting(true);
        try {
            const res = await fetch("/api/twilio/token", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    roomName: slug,
                    userName: currentUser.displayName || currentUser.email,
                }),
            });
            const data = await res.json();
            if (!data.token) throw new Error("No Twilio token returned");

            // Request mic and camera permissions
            const audioTrack = await createLocalAudioTrack();
            const videoTrack = await createLocalVideoTrack({ width: 640, height: 360 });

            const twRoom = await connect(data.token, {
                tracks: [audioTrack, videoTrack],
            });
            roomRef.current = twRoom;

            await updateDoc(doc(db, "streams", slug), { hasStarted: true });

            if (videoContainerRef.current) {
                const videoEl = videoTrack.attach() as HTMLVideoElement;
                videoEl.style.width = "100%";
                videoEl.style.height = "100%";
                videoEl.style.objectFit = "cover";

                clearVideoContainer(videoContainerRef.current, videoTrack);
                videoContainerRef.current.appendChild(videoEl);
                setCurrentVideoTrack(videoTrack);
            }

            setCurrentAudioTrack(audioTrack);
            setIsConnected(true);
            setIsStreamStarted(true);
            setIsRoomConnecting(false);
            twRoom.on("disconnected", () => {
                setIsConnected(false);
                setIsStreamStarted(false);
            });
        } catch (error) {
            console.error("Error starting stream:", error);
            alert(`Error starting stream: ${error}`);
            setIsRoomConnecting(false);
        }
    }, [slug, currentUser]);

    // End stream
    const endStream = useCallback(async () => {
        if (roomRef.current) {
            roomRef.current.disconnect();
            setIsConnected(false);
        }
        try {
            await updateDoc(doc(db, "streams", slug), { hasStarted: false });
            router.push("/dashboard");
        } catch (error) {
            console.error("Error ending stream:", error);
        }
    }, [router, slug]);

    // Toggle audio
    const handleToggleAudio = useCallback(() => {
        if (currentAudioTrack) {
            currentAudioTrack.enable(!currentAudioTrack.isEnabled);
            setIsAudioEnabled((prev) => !prev);
            const userName = currentUser?.displayName || currentUser?.email || "Unknown User";
            sendChatMessage(slug, userName, currentAudioTrack.isEnabled ? "Microphone muted" : "Microphone enabled");
        }
    }, [currentAudioTrack, currentUser, slug]);

    // Toggle video
    const handleToggleVideo = useCallback(() => {
        if (currentVideoTrack) {
            currentVideoTrack.enable(!currentVideoTrack.isEnabled);
            setIsVideoEnabled((prev) => !prev);
            const userName = currentUser?.displayName || currentUser?.email || "Unknown User";
            sendChatMessage(slug, userName, currentVideoTrack.isEnabled ? "Camera turned OFF" : "Camera turned ON");
        }
    }, [currentVideoTrack, currentUser, slug]);

    // Switch camera
    const switchCamera = useCallback(async (deviceId: string) => {
        if (!isConnected) {
            alert("Still connecting or no stream. Please wait until fully connected.");
            return;
        }

        // Stop and unpublish the current video track if it exists
        if (currentVideoTrack && roomRef.current) {
            currentVideoTrack.stop();
            roomRef.current.localParticipant.unpublishTrack(currentVideoTrack);
        }

        try {
            const newVideoTrack = await createLocalVideoTrack({ deviceId });
            if (roomRef.current) {
                await roomRef.current.localParticipant.publishTrack(newVideoTrack);
            }
            if (videoContainerRef.current) {
                clearVideoContainer(videoContainerRef.current);
                const videoEl = newVideoTrack.attach() as HTMLVideoElement;
                videoEl.style.width = "100%";
                videoEl.style.height = "100%";
                videoEl.style.objectFit = "cover";
                videoContainerRef.current.appendChild(videoEl);
            }
            setCurrentVideoTrack(newVideoTrack);
        } catch (error) {
            console.error("Error switching camera:", error);
        }
        setShowCameraOptions(false);
    }, [currentVideoTrack, isConnected]);

    // Switch mic
    const switchMic = useCallback(async (deviceId: string) => {
        if (!isConnected) {
            alert("Still connecting or no stream. Please wait until fully connected.");
            return;
        }

        // Stop and unpublish the current audio track if it exists
        if (currentAudioTrack && roomRef.current) {
            currentAudioTrack.stop();
            roomRef.current.localParticipant.unpublishTrack(currentAudioTrack);
        }

        try {
            const newAudioTrack = await createLocalAudioTrack({ deviceId });
            if (roomRef.current) {
                await roomRef.current.localParticipant.publishTrack(newAudioTrack);
            }
            setCurrentAudioTrack(newAudioTrack);
        } catch (error) {
            console.error("Error switching mic:", error);
        }
        setShowMicOptions(false);
    }, [currentAudioTrack, isConnected]);

    // Handle sending a chat message
    const handleSendMessage = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            if (!newMessage.trim() || !currentUser) return;
            const userName = currentUser.displayName || currentUser.email;
            await sendChatMessage(slug, userName, newMessage.trim());
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

    if (loading) return null;

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

            <div className="flex flex-1">
                {/* Side Navigation */}
                <nav className="w-20 bg-brandBlack border-r border-brandOrange flex flex-col items-center py-4 space-y-4">
                    <div className="w-12 h-12 rounded-full bg-brandWhite"></div>
                    <div className="w-12 h-12 rounded-full bg-brandWhite opacity-50"></div>
                    <div className="w-12 h-12 rounded-full bg-brandWhite opacity-75"></div>
                    <div className="w-12 h-12 rounded-full bg-brandWhite opacity-50"></div>
                </nav>

                {/* Main Content */}
                <main className="flex-1 flex flex-col md:flex-row">
                    {/* Video Section */}
                    <div className="flex-1 p-4 relative">
                        {!isStreamStarted && (
                            <div className="mb-4">
                                <Button
                                    type="button"
                                    onClick={startStream}
                                    className="bg-brandOrange text-brandBlack"
                                >
                                    Start Stream (Enable Mic/Camera)
                                </Button>
                            </div>
                        )}
                        <div
                            ref={videoContainerRef}
                            className="bg-black w-full h-[60vh] md:h-[75vh] rounded-lg shadow-lg overflow-hidden relative flex items-center justify-center"
                        >
                            {isRoomConnecting && (
                                <p className="absolute text-brandOrange text-xl font-bold">
                                    Connecting...
                                </p>
                            )}
                            {streamerStatus.audioMuted && (
                                <div className="absolute bottom-2 right-2 bg-black/80 p-1 rounded-full">
                                    <MicOff className="h-6 w-6 text-red-500" />
                                </div>
                            )}
                            {streamerStatus.cameraOff && (
                                <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                                    <p className="text-brandOrange text-xl font-bold">
                                        Camera is currently off
                                    </p>
                                </div>
                            )}
                        </div>

                        {isStreamStarted && !isRoomConnecting && (
                            <div className="mt-2 space-x-2 flex items-center justify-center flex-wrap gap-2">
                                <div className="relative">
                                    <Button
                                        onClick={() => setShowMicOptions((prev) => !prev)}
                                        className="rounded-full bg-brandOrange text-white shadow-lg px-6 py-2 transition duration-200 hover:scale-105"
                                    >
                                        {isAudioEnabled ? <Mic /> : <MicOff />}
                                    </Button>
                                    {showMicOptions && (
                                        <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-brandBlack border border-brandOrange rounded-xl shadow-xl z-50">
                                            {micDevices.map((device) => (
                                                <Button
                                                    key={device.deviceId}
                                                    onClick={() => switchMic(device.deviceId)}
                                                    className="w-full justify-start text-sm bg-transparent hover:bg-brandOrange hover:text-white rounded-xl px-3 py-2"
                                                >
                                                    🎤 {device.label || "Unnamed Mic"}
                                                </Button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <Button
                                    onClick={handleToggleVideo}
                                    className="rounded-full bg-brandOrange text-white shadow-lg px-6 py-2 transition duration-200 hover:scale-105"
                                >
                                    {isVideoEnabled ? <Video /> : <VideoOff />}
                                </Button>
                                <div className="relative">
                                    <Button
                                        onClick={() => setShowCameraOptions((prev) => !prev)}
                                        className="rounded-full bg-brandOrange text-white shadow-lg p-3 transition duration-200 hover:scale-110"
                                    >
                                        <Camera />
                                    </Button>
                                    {showCameraOptions && (
                                        <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-brandBlack border border-brandOrange rounded-xl shadow-xl z-50">
                                            {cameraDevices.map((device) => (
                                                <Button
                                                    key={device.deviceId}
                                                    onClick={() => switchCamera(device.deviceId)}
                                                    className="w-full justify-start text-sm bg-transparent hover:bg-brandOrange hover:text-white rounded-xl px-3 py-2"
                                                >
                                                    📷 {device.label || "Unnamed Camera"}
                                                </Button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <Button
                                    onClick={openModal}
                                    className="rounded-full bg-red-500 text-white shadow-lg px-6 py-2 transition duration-200 hover:scale-105"
                                >
                                    End Stream
                                </Button>
                            </div>
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
                        <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[300px] md:max-h-none">
                            {messages.map((msg) => (
                                <div key={msg.id} className="bg-brandBlack p-2 rounded-md text-sm">
                                    <strong className="text-brandOrange">{msg.userName}:</strong> {msg.content}
                                </div>
                            ))}
                        </div>
                        <div className="relative p-2 border-t border-brandOrange flex items-center">
                            <Input
                                className="flex-1 border border-brandOrange mr-2 bg-brandBlack text-brandWhite"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type your message..."
                            />
                            <Button
                                type="button"
                                onClick={() => setShowEmojiPicker((prev) => !prev)}
                                className="px-2 py-1 bg-brandGray rounded"
                            >
                                😊
                            </Button>
                            <Button
                                type="submit"
                                onClick={handleSendMessage}
                                className="bg-brandOrange text-brandBlack ml-2"
                            >
                                Send
                            </Button>
                            {showEmojiPicker && (
                                <div className="absolute bottom-full mb-2 right-0 z-50">
                                    <EmojiPicker
                                        onEmojiClick={(emojiData) =>
                                            setNewMessage((prev) => prev + emojiData.emoji)
                                        }
                                        theme={"dark" as Theme}
                                        width={320}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>

            {/* End Stream Confirmation Modal */}
            {showEndConfirmation && (
                <div
                    className={`fixed inset-0 z-50 flex items-center justify-center bg-black transition-all duration-300 ${
                        modalOpacity ? "bg-opacity-50 opacity-100" : "bg-opacity-0 opacity-0"
                    }`}
                >
                    <div
                        className={`bg-white p-6 rounded-md shadow-lg text-center transform transition-all duration-300 ${
                            modalOpacity ? "scale-100 opacity-100" : "scale-95 opacity-0"
                        }`}
                    >
                        <p className="text-2xl font-bold text-brandBlack mb-4">
                            Are you sure you want to end the stream?
                        </p>
                        <div className="space-x-4">
                            <Button
                                onClick={() => {
                                    closeModal();
                                    endStream();
                                }}
                                className="bg-brandOrange text-white rounded px-4 py-2"
                            >
                                Yes, End Stream
                            </Button>
                            <Button onClick={closeModal} className="bg-brandGray text-brandBlack rounded px-4 py-2">
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageStreamPage;