"use client";

import React, {useEffect, useRef, useState} from "react";
import {usePathname, useRouter} from "next/navigation";
import {
    connect,
    createLocalVideoTrack,
    LocalAudioTrack,
    LocalTrackPublication,
    LocalVideoTrack,
    Room,
} from "twilio-video";
import {listenToMessages, sendChatMessage} from "@/lib/services/ChatService";
import {useAuthStore} from "@/lib/store/useAuthStore";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {doc, onSnapshot, updateDoc} from "firebase/firestore";
import {db} from "@/lib/config/firebase";
import EmojiPicker, {Theme} from "emoji-picker-react";
import ShareButton from "@/components/ui/ShareButton";
import {Camera, ChevronUp} from "lucide-react";

interface ChatMessage {
    id: string;
    userName: string;
    content: string;
}

export default function ManageStreamPage() {
    const pathname = usePathname();
    const router = useRouter();
    const slug = pathname?.split("/").pop() || "";

    const videoContainerRef = useRef<HTMLDivElement>(null);
    const roomRef = useRef<Room | null>(null);

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isStreamStarted, setIsStreamStarted] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showCameraOptions, setShowCameraOptions] = useState(false);
    const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([]);
    const [currentVideoTrack, setCurrentVideoTrack] = useState<LocalVideoTrack | null>(null);

    const [showEndConfirmation, setShowEndConfirmation] = useState(false);
    const [modalOpacity, setModalOpacity] = useState(false);

    const [loading, setLoading] = useState(true);
    const { currentUser } = useAuthStore();

    useEffect(() => {
        if (!currentUser) {
            router.push("/login");
            return;
        }
        setLoading(false);
    }, [currentUser, router]);

    // Chat subscription
    useEffect(() => {
        if (!slug) return;
        const unsub = listenToMessages(slug, (msgs: ChatMessage[]) => setMessages(msgs));
        return () => {
            unsub();
            if (roomRef.current) roomRef.current.disconnect();
        };
    }, [slug]);

    // Check Firestore for `hasStarted` changes
    useEffect(() => {
        if (!slug) return;
        const streamRef = doc(db, "streams", slug);
        const unsub = onSnapshot(streamRef, (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                // If hasStarted is already true (maybe a re-connect scenario)
                setIsStreamStarted(Boolean(data.hasStarted));
            }
        });
        return () => unsub();
    }, [slug]);

    // Get camera devices
    useEffect(() => {
        if (!currentUser) return;
        navigator.mediaDevices.enumerateDevices().then((devices) => {
            const cams = devices.filter((d) => d.kind === "videoinput");
            setCameraDevices(cams);
        });
    }, [currentUser]);

    // Streamer starts the stream
    const startStream = async () => {
        if (!slug || !currentUser) {
            console.error("❌ Missing slug or current user. Cannot start stream.");
            return;
        }

        console.log("🚀 Streamer starting the stream with slug:", slug);
        const res = await fetch("/api/twilio/token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                roomName: slug,
                userName: currentUser.displayName || currentUser.email,
            }),
        });

        const data = await res.json();
        if (!data.token) {
            console.error("❌ No token returned from Twilio API.");
            return;
        }

        const twRoom = await connect(data.token, {
            video: { width: 640, height: 360 },
            audio: true,
        });

        roomRef.current = twRoom;

        // Set hasStarted to true in Firestore
        await updateDoc(doc(db, "streams", slug), {
            hasStarted: true,
        });
        console.log("✅ Firestore: hasStarted = true");

        // Attach local video track
        twRoom.localParticipant.tracks.forEach((pub: LocalTrackPublication) => {
            if (pub.track.kind === "video" && videoContainerRef.current) {
                console.log("🎥 Streamer publishing video track");
                const videoEl = pub.track.attach() as HTMLVideoElement;
                videoEl.style.width = "100%";
                videoEl.style.height = "100%";
                videoEl.style.objectFit = "cover";

                videoContainerRef.current.innerHTML = "";
                videoContainerRef.current.appendChild(videoEl);

                setCurrentVideoTrack(pub.track as LocalVideoTrack);
            }
        });

        setIsStreamStarted(true);

        twRoom.on("disconnected", () => {
            console.log("🚫 Streamer disconnected from room");
            setIsStreamStarted(false);
        });
    };

    // End Stream
    const endStream = async () => {
        if (roomRef.current) {
            roomRef.current.disconnect();
        }
        try {
            await updateDoc(doc(db, "streams", slug), {
                hasStarted: false,
            });
            console.log("✅ Firestore: hasStarted = false");
            router.push("/dashboard");
        } catch (err) {
            console.error("❌ Error ending stream:", err);
        }
    };

    // Toggle audio
    const handleToggleAudio = () => {
        if (!roomRef.current) return;
        roomRef.current.localParticipant.audioTracks.forEach((pub: LocalTrackPublication) => {
            if (pub.track.kind === "audio") {
                const audioTrack = pub.track as LocalAudioTrack;
                const newStatus = !audioTrack.isEnabled;
                audioTrack.enable(newStatus);
                console.log(`🎙 Audio toggled. Now enabled? ${audioTrack.isEnabled}`);
            }
        });
        setIsAudioEnabled((prev) => !prev);
    };

    // Toggle video
    const handleToggleVideo = () => {
        if (!roomRef.current) return;
        roomRef.current.localParticipant.videoTracks.forEach((pub: LocalTrackPublication) => {
            if (pub.track.kind === "video") {
                const videoTrack = pub.track as LocalVideoTrack;
                const newStatus = !videoTrack.isEnabled;
                videoTrack.enable(newStatus);
                console.log(`📹 Video toggled. Now enabled? ${videoTrack.isEnabled}`);

                // Send an in-chat notification
                if (currentUser) {
                    const userName = currentUser.displayName || currentUser.email;
                    const cameraMsg = newStatus ? "Camera turned ON" : "Camera turned OFF";
                    sendChatMessage(slug, userName, cameraMsg);
                }
            }
        });
        setIsVideoEnabled((prev) => !prev);
    };


    // Switch camera
    const switchCamera = async (deviceId: string) => {
        if (!currentVideoTrack || !roomRef.current) return;
        console.log("🔄 Switching camera to:", deviceId);

        // Stop & unpublish the old video track
        currentVideoTrack.stop();
        currentVideoTrack.detach();

        roomRef.current.localParticipant.videoTracks.forEach((pub) => {
            pub.unpublish();
        });

        // Create new local video track from the selected device
        const newVideoTrack = await createLocalVideoTrack({ deviceId });

        // Publish the new track to Twilio
        await roomRef.current.localParticipant.publishTrack(newVideoTrack);

        // Attach the new track to container
        const videoEl = newVideoTrack.attach();
        videoEl.style.width = "100%";
        videoEl.style.height = "100%";
        videoEl.style.objectFit = "cover";
        if (videoContainerRef.current) {
            videoContainerRef.current.innerHTML = "";
            videoContainerRef.current.appendChild(videoEl);
        }

        setCurrentVideoTrack(newVideoTrack);
        setShowCameraOptions(false);
        console.log("✅ Camera switched successfully:", deviceId);
    };

    // Chat send
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !currentUser) return;
        const userName = currentUser.displayName || currentUser.email;
        await sendChatMessage(slug, userName, newMessage.trim());
        setNewMessage("");
    };

    const openModal = () => {
        setShowEndConfirmation(true);
        setTimeout(() => setModalOpacity(true), 10);
    };

    const closeModal = () => {
        setModalOpacity(false);
        setTimeout(() => setShowEndConfirmation(false), 300);
    };

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

            <div className="flex flex-1">
                {/* Side Nav */}
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
                            className="bg-black w-full h-64 md:h-full rounded-lg shadow-lg overflow-hidden"
                        ></div>

                        {isStreamStarted && (
                            <div className="mt-2 space-x-2 flex items-center relative">
                                <Button onClick={handleToggleAudio} className="bg-brandOrange text-brandBlack">
                                    {isAudioEnabled ? "Mute" : "Unmute"}
                                </Button>

                                <Button onClick={handleToggleVideo} className="bg-brandOrange text-brandBlack">
                                    {isVideoEnabled ? "Stop Cam" : "Start Cam"}
                                </Button>

                                {/* Camera Switch Button */}
                                <Button
                                    onClick={() => setShowCameraOptions(!showCameraOptions)}
                                    className="bg-brandOrange flex items-center gap-1 relative"
                                >
                                    <Camera />
                                    <ChevronUp />
                                </Button>

                                {/* Slide-up camera options */}
                                {showCameraOptions && (
                                    <div className="absolute bottom-full mb-2 bg-gray-700 p-2 rounded shadow-lg transition-all">
                                        {cameraDevices.map((device) => (
                                            <Button
                                                key={device.deviceId}
                                                className="w-full text-left bg-transparent hover:bg-gray-600 mb-1"
                                                onClick={() => switchCamera(device.deviceId)}
                                            >
                                                {device.label || "Camera"}
                                            </Button>
                                        ))}
                                    </div>
                                )}

                                <Button onClick={openModal} className="bg-red-600 text-white rounded px-4 py-2">
                                    End Stream
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Chat Panel with Share Button */}
                    <div className="w-full md:w-80 bg-brandGray border-l border-brandOrange flex flex-col relative">
                        {/* Chat Panel Header with Share Button */}
                        <div className="flex items-center justify-end p-2 border-b border-brandOrange">
                            <ShareButton streamLink={typeof window !== "undefined" ? window.location.href : ""} />
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {messages.map((msg, index) => (
                                <div key={msg.id || index} className="bg-brandBlack p-2 rounded-md text-sm">
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
                            <Button type="submit" onClick={handleSendMessage} className="bg-brandOrange text-brandBlack ml-2">
                                Send
                            </Button>
                            {showEmojiPicker && (
                                <div className="absolute bottom-full mb-2 right-0 z-50">
                                    <EmojiPicker
                                        onEmojiClick={(emojiData) => setNewMessage((prev) => prev + emojiData.emoji)}
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
}
