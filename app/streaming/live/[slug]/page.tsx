"use client";
import React, { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { connect, Room, RemoteParticipant, RemoteVideoTrack } from "twilio-video";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { db } from "@/lib/config/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { ChatMessage } from "@/lib/types/stream";
import { listenToMessages, sendChatMessage } from "@/lib/services/ChatService";
import { stopAndDetachTrack } from "@/lib/twilioTrackUtils";
import axios from "axios";
import { Mic, MicOff, VideoOff } from "lucide-react";

function RemoteVideoPlayer({ track }: { track: RemoteVideoTrack | null }) {
    const videoRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (track && videoRef.current) {
            track.detach().forEach((el) => el.remove());
            const videoEl = track.attach() as HTMLVideoElement;
            videoEl.style.width = "100%";
            videoEl.style.height = "100%";
            videoEl.style.objectFit = "cover";
            videoEl.autoplay = true;
            videoEl.muted = true;
            videoRef.current.appendChild(videoEl);
        }
        return () => {
            if (track) track.detach().forEach((el) => el.remove());
        };
    }, [track]);

    return <div ref={videoRef} className="w-full h-full" />;
}

export default function LiveViewPage() {
    const pathname = usePathname();
    const router = useRouter();
    const slug = pathname?.split("/").pop() || "";
    const { currentUser } = useAuthStore();

    const [hasStarted, setHasStarted] = useState(false);
    const [room, setRoom] = useState<Room | null>(null);
    const [remoteVideoTrack, setRemoteVideoTrack] = useState<RemoteVideoTrack | null>(null);
    const [videoStatus, setVideoStatus] = useState<"waiting" | "connecting" | "active" | "offline" | "ended">("waiting");
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [hasHydrated, setHasHydrated] = useState(false);

    const [streamerStatus, setStreamerStatus] = useState({
        audioMuted: false,
        cameraOff: false,
    });

    // Hydration
    useEffect(() => {
        const unsubscribe = useAuthStore.persist.onFinishHydration(() => {
            setHasHydrated(true);
        });
        const timeoutId = setTimeout(() => {
            if (!hasHydrated) setHasHydrated(true);
        }, 2000);
        return () => {
            unsubscribe();
            clearTimeout(timeoutId);
        };
    }, []);

    // Auth check
    useEffect(() => {
        if (hasHydrated && !currentUser) router.push("/login");
    }, [currentUser, hasHydrated, router]);

    // Stream status subscription
    useEffect(() => {
        if (!slug || !currentUser) return;
        const streamRef = doc(db, "streams", slug);
        return onSnapshot(streamRef, (snap) => {
            if (!snap.exists()) {
                setVideoStatus("ended");
                return;
            }
            const data = snap.data();
            setHasStarted(!!data?.hasStarted);
            data?.hasStarted ? joinAsViewer() : setVideoStatus("waiting");
        });
    }, [slug, currentUser]);

    // Chat messages subscription
    useEffect(() => {
        if (!slug || !currentUser) return;
        return listenToMessages(slug, (msgs) => {
            const filteredMessages = msgs.filter(msg => msg.userName !== "System");
            setMessages(filteredMessages);

            msgs.forEach(msg => {
                if (msg.userName === "System") {
                    setStreamerStatus(prev => ({
                        ...prev,
                        audioMuted: msg.content.includes("Microphone muted"),
                        cameraOff: msg.content.includes("Camera disabled")
                    }));
                }
            });
        });
    }, [slug, currentUser]);

    const joinAsViewer = async () => {
        try {
            if (room || !currentUser) return;
            setVideoStatus("connecting");
            const { data } = await axios.post("/api/twilio/token", {
                roomName: slug,
                userName: currentUser.displayName || currentUser.email,
            });

            if (data?.token) {
                const twRoom = await connect(data.token, { audio: false, video: false });
                setRoom(twRoom);
                setVideoStatus("active"); // Immediately set to active on connection

                twRoom.participants.forEach(attachParticipantTracks);
                twRoom.on("participantConnected", attachParticipantTracks);
                twRoom.on("participantDisconnected", handleParticipantDisconnect);
                twRoom.on("disconnected", handleRoomDisconnect);
            }
        } catch {
            setVideoStatus("offline");
        }
    };

    const attachParticipantTracks = (participant: RemoteParticipant) => {
        participant.videoTracks.forEach(pub => {
            if (pub.track) {
                handleTrackSubscribed(pub.track);
                pub.track.on('disabled', () => handleTrackDisabled(true));
                pub.track.on('enabled', () => handleTrackDisabled(false));
            }
        });

        participant.on("trackSubscribed", track => {
            if (track.kind === "video") {
                handleTrackSubscribed(track);
                track.on('disabled', () => handleTrackDisabled(true));
                track.on('enabled', () => handleTrackDisabled(false));
            }
        });

        participant.on("trackUnsubscribed", track => {
            if (track.kind === "video") {
                handleTrackUnsubscribed();
            }
        });
    };

    const handleTrackSubscribed = (track: RemoteVideoTrack) => {
        setRemoteVideoTrack(track);
        setStreamerStatus(prev => ({ ...prev, cameraOff: !track.isEnabled }));
    };

    const handleTrackUnsubscribed = () => {
        setRemoteVideoTrack(null);
        setStreamerStatus(prev => ({ ...prev, cameraOff: true }));
    };

    const handleTrackDisabled = (disabled: boolean) => {
        setStreamerStatus(prev => ({ ...prev, cameraOff: disabled }));
    };

    const handleParticipantDisconnect = () => {
        setRemoteVideoTrack(null);
        setVideoStatus("offline");
        setStreamerStatus(prev => ({ ...prev, cameraOff: true }));
    };

    const handleRoomDisconnect = () => {
        setVideoStatus("ended");
        room?.localParticipant.tracks.forEach(trackPub => {
            if (trackPub.track && (trackPub.track.kind === "audio" || trackPub.track.kind === "video")) {
                stopAndDetachTrack(trackPub.track);
            }
        });
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim() && currentUser) {
            await sendChatMessage(slug, currentUser.displayName || currentUser.email, newMessage.trim());
            setNewMessage("");
        }
    };

    if (!hasHydrated || !currentUser) return null;

    return (
        <div className="h-screen w-screen flex flex-col bg-brandBlack text-brandWhite overflow-hidden">
            <div className="flex-1 flex flex-col md:flex-row h-[calc(100vh-4rem)]">
                {/* Video Section */}
                <div className="flex-1 p-2 md:p-4 h-full">
                    <div className="relative bg-black w-full h-full rounded-lg shadow-lg overflow-hidden">
                        {remoteVideoTrack ? (
                            <RemoteVideoPlayer track={remoteVideoTrack} />
                        ) : (
                            <div className="w-full h-full bg-brandGray animate-pulse" />
                        )}

                        {/* Camera Off Overlay */}
                        {streamerStatus.cameraOff && (
                            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-4">
                                <VideoOff className="h-16 w-16 text-brandOrange" />
                                <span className="text-2xl font-bold text-brandOrange">
                                    Camera is Off
                                </span>
                            </div>
                        )}

                        {/* Mic Muted Indicator */}
                        {streamerStatus.audioMuted && (
                            <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-black/80 px-4 py-2 rounded-lg">
                                <MicOff className="h-5 w-5 text-brandOrange" />
                                <span className="text-brandOrange text-sm font-medium">Mic Muted</span>
                            </div>
                        )}

                        {/* Connection Status Overlays */}
                        {videoStatus === "connecting" && (
                            <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                                <span className="text-xl text-brandOrange font-bold">Connecting...</span>
                            </div>
                        )}
                        {videoStatus === "waiting" && (
                            <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                                <span className="text-xl text-brandOrange font-bold">
                                    Stream Starting Soon
                                </span>
                            </div>
                        )}
                        {["offline", "ended"].includes(videoStatus) && (
                            <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                                <span className="text-xl text-brandOrange font-bold">
                                    {videoStatus === "ended" ? "Stream Ended" : "Stream Offline"}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Chat Section */}
                <div className="w-full md:w-[400px] flex flex-col border-l border-brandOrange/20 bg-brandGray/10 h-full">
                    <div className="flex-1 overflow-y-auto p-4">
                        <div className="space-y-3">
                            {messages.map((msg, index) => (
                                <div key={index} className="bg-brandBlack/80 p-3 rounded-lg">
                                    <strong className="text-brandOrange text-sm block">
                                        {msg.userName}:
                                    </strong>
                                    <p className="text-brandWhite text-sm mt-1">{msg.content}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <form onSubmit={handleSendMessage} className="p-4 border-t border-brandOrange/20">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type your message..."
                                className="flex-1 bg-brandBlack text-brandWhite px-4 py-2 rounded-lg border border-brandOrange/20 focus:outline-none focus:border-brandOrange"
                            />
                            <button
                                type="submit"
                                className="px-4 py-2 bg-brandOrange text-brandBlack rounded-lg hover:bg-brandOrange/90 transition-colors"
                            >
                                Send
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}