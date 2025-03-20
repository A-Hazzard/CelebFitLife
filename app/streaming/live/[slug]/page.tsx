"use client";
//TODO Fix bug where viewer cannot see streamer's camera
import React, { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { connect, Room, RemoteParticipant, RemoteTrackPublication, RemoteVideoTrack } from "twilio-video";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { db } from "@/lib/config/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { ChatMessage } from "@/lib/types/stream";
import { listenToMessages } from "@/lib/services/ChatService";
import { stopAndDetachTrack } from "@/lib/twilioTrackUtils";

function RemoteVideoPlayer({ track }: { track: RemoteVideoTrack | null }) {
  const videoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (track && videoRef.current) {
      // Detach old track
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
      if (track) {
        track.detach().forEach((el) => el.remove());
      }
    };
  }, [track]);

  if (!track) {
    return (
        <div className="w-full h-full flex items-center justify-center bg-brandGray">
          <div className="animate-pulse bg-brandBlack w-full h-full" />
        </div>
    );
  }
  return <div ref={videoRef} className="w-full h-full" />;
}

export default function LiveViewPage() {
  const pathname = usePathname();
  const slug = pathname?.split("/").pop() || "";
  const { currentUser } = useAuthStore();

  const [hasStarted, setHasStarted] = useState(false);
  const [room, setRoom] = useState<Room | null>(null);
  const [remoteVideoTrack, setRemoteVideoTrack] = useState<RemoteVideoTrack | null>(null);
  const [videoStatus, setVideoStatus] = useState<"waiting" | "active" | "paused" | "offline" | "ended">("waiting");
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (!slug) return;
    // Subscribe to Firestore stream doc for hasStarted
    const streamRef = doc(db, "streams", slug);
    const unsub = onSnapshot(streamRef, (snap) => {
      if (!snap.exists()) {
        setHasStarted(false);
        setVideoStatus("ended");
        return;
      }
      const data = snap.data();
      setHasStarted(Boolean(data.hasStarted));

      if (data.hasStarted) {
        console.log("✅ Stream has started. Attempting to connect...");
        joinAsViewer();
      } else {
        console.log("❌ Stream not started yet.");
        setVideoStatus("waiting");
      }
    });
    return unsub;
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    // Chat subscription
    const unsub = listenToMessages(slug, (msgs) => setMessages(msgs));
    return () => unsub();
  }, [slug]);

  const joinAsViewer = async () => {
    try {
      if (room) return; // Already connected
      if (!currentUser) return;

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
        console.error("No Twilio token returned");
        return;
      }

      const twRoom = await connect(data.token, {
        audio: false,
        video: false,
      });

      setRoom(twRoom);

      console.log("Viewer connected to room:", twRoom.sid);

      // Check existing participants
      twRoom.participants.forEach((participant) => {
        attachParticipantTracks(participant);
      });

      // On participant connect
      twRoom.on("participantConnected", (participant: RemoteParticipant) => {
        attachParticipantTracks(participant);
      });

      // On participant disconnect
      twRoom.on("participantDisconnected", (participant) => {
        setRemoteVideoTrack(null);
        setVideoStatus("offline");
      });

      twRoom.on("disconnected", () => {
        console.log("Viewer disconnected from room");
        setVideoStatus("ended");

        // Filter out data tracks before stopping/detaching
        twRoom.localParticipant.tracks.forEach((trackPub) => {
          if (trackPub.track.kind === "audio" || trackPub.track.kind === "video") {
            stopAndDetachTrack(trackPub.track);
          }
        });
      });

    } catch (error) {
      console.error("Viewer join error:", error);
    }
  };

  const attachParticipantTracks = (participant: RemoteParticipant) => {
    participant.tracks.forEach((pub: RemoteTrackPublication) => {
      if (pub.isSubscribed && pub.track?.kind === "video") {
        setRemoteVideoTrack(pub.track as RemoteVideoTrack);
        setVideoStatus("active");
      }
    });

    participant.on("trackSubscribed", (track) => {
      if (track.kind === "video") {
        setRemoteVideoTrack(track as RemoteVideoTrack);
        setVideoStatus("active");
      }
    });
    participant.on("trackUnsubscribed", (track) => {
      if (track.kind === "video") {
        setRemoteVideoTrack(null);
        setVideoStatus("paused");
      }
    });
  };

  return (
      <div className="min-h-screen flex flex-col bg-brandBlack text-brandWhite">
        <div className="flex flex-1">
          <div className="flex-1 p-4 relative">
            <div className="relative bg-black w-full h-64 md:h-full rounded-lg shadow-lg overflow-hidden">
              <RemoteVideoPlayer track={remoteVideoTrack} />
              {videoStatus === "waiting" && !hasStarted && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
                <span className="text-xl text-brandOrange font-bold">
                  Stream hasn&apos;t started yet
                </span>
                  </div>
              )}
              {videoStatus === "paused" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
                <span className="text-xl text-brandOrange font-bold">
                  Streamer Paused Video
                </span>
                  </div>
              )}
              {videoStatus === "offline" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
                <span className="text-xl text-brandOrange font-bold">
                  Streamer is Offline
                </span>
                  </div>
              )}
              {videoStatus === "ended" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
                <span className="text-xl text-brandOrange font-bold">
                  Stream has Ended
                </span>
                  </div>
              )}
            </div>
          </div>

          {/* Chat Panel */}
          <div className="w-full md:w-80 bg-brandGray border-l border-brandOrange flex flex-col relative">
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {messages.map((msg, index) => (
                  <div key={index} className="bg-brandBlack p-2 rounded-md text-sm">
                    <strong className="text-brandOrange">{msg.userName}:</strong> {msg.content}
                  </div>
              ))}
            </div>
          </div>
        </div>
      </div>
  );
}
