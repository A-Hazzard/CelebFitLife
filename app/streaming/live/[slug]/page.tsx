"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listenToMessages, sendChatMessage } from "@/lib/services/ChatService";
import { stopAndDetachTrack } from "@/lib/twilioTrackUtils";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { usePathname } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import {
  connect,
  Room,
  RemoteParticipant,
  RemoteTrackPublication,
  RemoteTrack,
  RemoteVideoTrack,
} from "twilio-video";
import { ChatMessage } from "@/lib/types/stream";
import EmojiPicker, { Theme } from "emoji-picker-react";
import ShareButton from "@/components/ui/ShareButton";

function RemoteVideoPlayer({ track }: { track: RemoteVideoTrack | null }) {
  const videoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (track && videoRef.current) {
      track.detach().forEach((el) => el.remove());
      console.log("RemoteVideoPlayer: Attaching track:", track.sid);
      const videoElement = track.attach() as HTMLVideoElement;
      videoElement.style.width = "100%";
      videoElement.style.height = "100%";
      videoElement.style.objectFit = "cover";
      videoElement.autoplay = true;
      videoElement.muted = true;
      videoRef.current.appendChild(videoElement);
      videoElement
        .play()
        .then(() => console.log("RemoteVideoPlayer: Video playback started."))
        .catch((err) =>
          console.error("RemoteVideoPlayer: Video play error:", err)
        );
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

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [remoteVideoTrack, setRemoteVideoTrack] =
    useState<RemoteVideoTrack | null>(null);
  // videoStatus: "active" = playing; "paused" = track disabled; "offline" = participant disconnected; "ended" = stream ended; "waiting" = stream not started.
  const [videoStatus, setVideoStatus] = useState<
    "active" | "paused" | "offline" | "ended" | "waiting"
  >("waiting");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const roomRef = useRef<Room | null>(null);
  const { currentUser, isLoggedIn } = useAuthStore();
  const audioContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!slug || !isLoggedIn || !currentUser) return;

    const joinAsViewer = async () => {
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
        if (!data.token) throw new Error("No token returned");
        const twRoom = await connect(data.token, {
          audio: false,
          video: false,
        });
        roomRef.current = twRoom;
        console.log("Viewer: Connected to room:", twRoom.sid);
        setVideoStatus("waiting");

        twRoom.on(
          "participantDisconnected",
          (participant: RemoteParticipant) => {
            console.log(
              "Viewer: Participant disconnected:",
              participant.identity
            );
            setRemoteVideoTrack(null);
            setVideoStatus("offline");
          }
        );

        const setupParticipantTracks = (participant: RemoteParticipant) => {
          participant.tracks.forEach((pub: RemoteTrackPublication) => {
            if (pub.isSubscribed && pub.track) {
              if (pub.track.kind === "video") {
                console.log("Viewer: Found remote video track:", pub.track.sid);
                const rvt = pub.track as RemoteVideoTrack;
                setRemoteVideoTrack(rvt);
                setVideoStatus("active");
                rvt.on("disabled", () => {
                  console.log("Viewer: Remote video track disabled.");
                  setVideoStatus("paused");
                });
                rvt.on("enabled", () => {
                  console.log("Viewer: Remote video track enabled.");
                  setVideoStatus("active");
                });
              }
              if (pub.track.kind === "audio") {
                if (
                  audioContainerRef.current &&
                  !audioContainerRef.current.querySelector(
                    `[data-twilio-track="${pub.track.sid}"]`
                  )
                ) {
                  console.log(
                    "Viewer: Attaching remote audio track:",
                    pub.track.sid
                  );
                  const audioElement = pub.track.attach() as HTMLAudioElement;
                  audioElement.autoplay = true;
                  audioElement.controls = false;
                  audioElement.muted = false;
                  try {
                    audioElement
                      .play()
                      .catch((err) =>
                        console.error("Viewer: Audio play error:", err)
                      );
                  } catch (err) {
                    console.error("Viewer: Audio play exception:", err);
                  }
                  audioElement.setAttribute("data-twilio-track", pub.track.sid);
                  audioContainerRef.current.appendChild(audioElement);
                }
              }
            }
          });
          participant.on("trackSubscribed", (track: RemoteTrack) => {
            if (track.kind === "video") {
              console.log(
                "Viewer: Subscribed to remote video track:",
                track.sid
              );
              setRemoteVideoTrack(track as RemoteVideoTrack);
              setVideoStatus("active");
              (track as RemoteVideoTrack).on("disabled", () => {
                console.log("Viewer: Remote video track disabled.");
                setVideoStatus("paused");
              });
              (track as RemoteVideoTrack).on("enabled", () => {
                console.log("Viewer: Remote video track enabled.");
                setVideoStatus("active");
              });
            }
            if (track.kind === "audio") {
              if (
                audioContainerRef.current &&
                !audioContainerRef.current.querySelector(
                  `[data-twilio-track="${track.sid}"]`
                )
              ) {
                console.log(
                  "Viewer: Subscribed to remote audio track:",
                  track.sid
                );
                const audioElement = track.attach() as HTMLAudioElement;
                audioElement.autoplay = true;
                audioElement.controls = false;
                audioElement.muted = false;
                try {
                  audioElement
                    .play()
                    .catch((err) =>
                      console.error("Viewer: Audio play error:", err)
                    );
                } catch (err) {
                  console.error("Viewer: Audio play exception:", err);
                }
                audioElement.setAttribute("data-twilio-track", track.sid);
                audioContainerRef.current.appendChild(audioElement);
              }
            }
          });
        };

        twRoom.participants.forEach((participant: RemoteParticipant) => {
          setupParticipantTracks(participant);
        });
        twRoom.on("participantConnected", (participant: RemoteParticipant) => {
          console.log("Viewer: Participant connected:", participant.identity);
          setupParticipantTracks(participant);
        });
        twRoom.on("disconnected", () => {
          console.log("Viewer: Disconnected from room");
          twRoom.localParticipant.tracks.forEach((pub) => {
            if (pub.track.kind === "audio" || pub.track.kind === "video") {
              stopAndDetachTrack(pub.track);
            }
          });
          setVideoStatus("ended");
        });
      } catch (err) {
        console.error("Viewer join error:", err);
      }
    };

    joinAsViewer();
    const unsub = listenToMessages(slug, (msgs: ChatMessage[]) =>
      setMessages(msgs)
    );
    return () => {
      unsub();
      if (roomRef.current) roomRef.current.disconnect();
    };
  }, [slug, isLoggedIn, currentUser]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser) return;
    await sendChatMessage(
      slug,
      currentUser.displayName || currentUser.email,
      newMessage.trim()
    );
    setNewMessage("");
  };

  // if (!isLoggedIn) {
  //   return <div className="p-4 text-brandWhite">Please log in first.</div>;
  // }

  return (
    <div className="min-h-screen flex flex-col bg-brandBlack text-brandWhite">
      {/* Video Section */}
      <div className="flex flex-1">
        <div className="flex-1 p-4 relative">
          <div className="relative bg-black w-full h-64 md:h-full rounded-lg shadow-lg overflow-hidden">
            <RemoteVideoPlayer track={remoteVideoTrack} />
            {videoStatus === "waiting" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
                <span className="text-xl text-brandOrange font-bold">
                  Stream hasn&apos;t started yet
                </span>
              </div>
            )}
            {videoStatus === "paused" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
                <span className="text-xl text-brandOrange font-bold">
                  Streamer Paused Their Video
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
          <div ref={audioContainerRef} style={{ display: "none" }} />
        </div>

        {/* Chat Panel with Share Button */}
        <div className="w-full md:w-80 bg-brandGray border-l border-brandOrange flex flex-col relative">
          {/* Chat Panel Header with Share Button */}
          <div className="flex items-center justify-end p-2 border-b border-brandOrange">
            <ShareButton
              streamLink={
                typeof window !== "undefined" ? window.location.href : ""
              }
            />
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {messages.map((msg, index) => (
              <div
                key={msg.id || index}
                className="bg-brandBlack p-2 rounded-md text-sm"
              >
                <strong className="text-brandOrange">{msg.userName}:</strong>{" "}
                {msg.content}
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
      </div>
    </div>
  );
}
