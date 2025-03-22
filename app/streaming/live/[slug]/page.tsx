"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
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

/** RemoteVideoPlayer attaches/detaches the remote video track to a div. */
function RemoteVideoPlayer({ track }: { track: RemoteVideoTrack | null }) {
    const videoRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (track && videoRef.current) {
            // Detach any existing elements
            track.detach().forEach((el) => el.remove());
            // Attach new element
            const videoEl = track.attach() as HTMLVideoElement;
            videoEl.style.width = "100%";
            videoEl.style.height = "100%";
            videoEl.style.objectFit = "cover";
            videoEl.autoplay = true;
            videoEl.muted = true;
            videoRef.current.appendChild(videoEl);
        }
        return () => {
            if (track) {
                track.detach().forEach((el) => el.remove());
            }
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
    const [streamerStatus, setStreamerStatus] = useState({ audioMuted: false, cameraOff: false });

    // Hydration effect
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
    }, [hasHydrated]);

    // Auth check effect
    useEffect(() => {
        if (hasHydrated && !currentUser) {
            router.push("/login");
        }
    }, [currentUser, hasHydrated, router]);

    // Callback: Subscribe to the remote video track.
    const handleTrackSubscribed = useCallback((track: RemoteVideoTrack) => {
        setRemoteVideoTrack(track);
        setStreamerStatus((prev) => ({ ...prev, cameraOff: !track.isEnabled }));
    }, []);

    // Callback: Unsubscribe from the remote video track.
    const handleTrackUnsubscribed = useCallback(() => {
        setRemoteVideoTrack(null);
        setStreamerStatus((prev) => ({ ...prev, cameraOff: true }));
    }, []);

    // Callback: Handle track disable/enable events.
    const handleTrackDisabled = useCallback((disabled: boolean) => {
        setStreamerStatus((prev) => ({ ...prev, cameraOff: disabled }));
    }, []);

    // Callback: When a participant disconnects.
    const handleParticipantDisconnect = useCallback(() => {
        setRemoteVideoTrack(null);
        setVideoStatus("offline");
        setStreamerStatus((prev) => ({ ...prev, cameraOff: true }));
    }, []);

    // Callback: When the entire room disconnects.
    const handleRoomDisconnect = useCallback(() => {
        setVideoStatus("ended");
        room?.localParticipant.tracks.forEach((trackPub) => {
            if (trackPub.track && (trackPub.track.kind === "audio" || trackPub.track.kind === "video")) {
                stopAndDetachTrack(trackPub.track);
            }
        });
    }, [room]);

    // Callback: Attach a new participant's video track(s).
    const attachParticipantTracks = useCallback((participant: RemoteParticipant) => {
        participant.videoTracks.forEach((pub) => {
            if (pub.track) {
                handleTrackSubscribed(pub.track);
                pub.track.on("disabled", () => handleTrackDisabled(true));
                pub.track.on("enabled", () => handleTrackDisabled(false));
            }
        });
        participant.on("trackSubscribed", (track) => {
            if (track.kind === "video") {
                handleTrackSubscribed(track);
                track.on("disabled", () => handleTrackDisabled(true));
                track.on("enabled", () => handleTrackDisabled(false));
            }
        });
        participant.on("trackUnsubscribed", (track) => {
            if (track.kind === "video") {
                handleTrackUnsubscribed();
            }
        });
    }, [handleTrackSubscribed, handleTrackDisabled, handleTrackUnsubscribed]);

    // Callback: Join the Twilio room as a viewer (audio off, video off).
    const joinAsViewer = useCallback(async () => {
        try {
            if (room || !currentUser) return;
            setVideoStatus("connecting");

            const { data } = await axios.post("/api/twilio/token", {
                roomName: slug,
                userName: currentUser.username || currentUser.email,
            });

            if (data?.token) {
                const twRoom = await connect(data.token, { audio: false, video: false });
                setRoom(twRoom);
                setVideoStatus("active");

                // Attach existing participants.
                twRoom.participants.forEach(attachParticipantTracks);
                // Listen for new participants.
                twRoom.on("participantConnected", attachParticipantTracks);
                // Listen for participant disconnects.
                twRoom.on("participantDisconnected", handleParticipantDisconnect);
                // Listen for room disconnect.
                twRoom.on("disconnected", handleRoomDisconnect);
            }
        } catch {
            setVideoStatus("offline");
        }
    }, [slug, currentUser, room, attachParticipantTracks, handleParticipantDisconnect, handleRoomDisconnect]);

    // Stream status subscription effect.
    useEffect(() => {
        if (!slug || !currentUser) return;

        const streamRef = doc(db, "streams", slug);
        const unsub = onSnapshot(streamRef, (snap) => {
            if (!snap.exists()) {
                setVideoStatus("ended");
                return;
            }
            const data = snap.data();
            const started = !!data?.hasStarted;
            setHasStarted(started);
            if (started) {
                joinAsViewer();
            } else {
                setVideoStatus("waiting");
            }
        });
        return unsub;
    }, [slug, currentUser, joinAsViewer]);

    // Chat messages subscription effect.
    useEffect(() => {
        if (!slug || !currentUser) return;
        return listenToMessages(slug, (msgs) => {
            const filtered = msgs.filter((msg) => msg.userName !== "System");
            setMessages(filtered);
            msgs.forEach((msg) => {
                if (msg.userName === "System") {
                    setStreamerStatus((prev) => ({
                        ...prev,
                        audioMuted: msg.content.includes("Microphone muted"),
                        cameraOff: msg.content.includes("Camera disabled"),
                    }));
                }
            });
        });
    }, [slug, currentUser]);

    // Callback: Send chat message.
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim() && (currentUser?.username || currentUser?.email)) {
            await sendChatMessage(
                slug,
                currentUser?.username || "User",
                newMessage.trim()
            );
            setNewMessage("");
        }
    };

    if (!hasHydrated || !currentUser) return null;

    return (
        <div className="h-screen w-screen flex flex-col bg-brandBlack text-brandWhite overflow-hidden">
            {/* Stream Status */}
            <div className="text-center py-2 border-b border-brandOrange">
                <p>
                    Stream Status:{" "}
                    <span className="font-bold">
            {hasStarted ? "Live" : "Not started yet"}
          </span>
                </p>
            </div>
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
                                <span className="text-2xl font-bold text-brandOrange">Camera is Off</span>
                            </div>
                        )}
                        {/* Mic Status Overlay */}
                        <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-black/80 px-4 py-2 rounded-lg">
                            {streamerStatus.audioMuted ? (
                                <>
                                    <MicOff className="h-5 w-5 text-brandOrange" />
                                    <span className="text-brandOrange text-sm font-medium">Mic Muted</span>
                                </>
                            ) : (
                                <>
                                    <Mic className="h-5 w-5 text-brandOrange" />
                                    <span className="text-brandOrange text-sm font-medium">Mic On</span>
                                </>
                            )}
                        </div>
                        {/* Connection Status Overlays */}
                        {videoStatus === "connecting" && (
                            <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                                <span className="text-xl text-brandOrange font-bold">Connecting...</span>
                            </div>
                        )}
                        {videoStatus === "waiting" && (
                            <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                                <span className="text-xl text-brandOrange font-bold">Stream Starting Soon</span>
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
                                    <strong className="text-brandOrange text-sm block">{msg.userName}:</strong>
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
                            <button type="submit" className="px-4 py-2 bg-brandOrange text-brandBlack rounded-lg hover:bg-brandOrange/90 transition-colors">
                                Send
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
