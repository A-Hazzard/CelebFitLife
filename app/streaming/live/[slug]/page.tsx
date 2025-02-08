"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listenToMessages, sendChatMessage } from "@/lib/services/ChatService";
import { stopAndDetachTrack } from "@/lib/twilioTrackUtils";
import { useAuthStore } from "@/store/useAuthStore";
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
import { ChatMessage } from "@/types/stream"; // ensure this type is defined
import { Picker } from "emoji-mart";

// ----------------------------------------------------------------
// RemoteVideoPlayer: Renders the remote video track or a skeleton loader.
// Autoplay is forced by muting the video element.
// ----------------------------------------------------------------
function RemoteVideoPlayer({ track }: { track: RemoteVideoTrack | null }) {
  const videoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (track && videoRef.current) {
      // Detach any previously attached elements.
      track.detach().forEach((el) => el.remove());
      console.log("RemoteVideoPlayer: Attaching track:", track.sid);
      const videoElement = track.attach() as HTMLVideoElement;
      videoElement.style.width = "100%";
      videoElement.style.height = "100%";
      videoElement.style.objectFit = "cover";
      videoElement.autoplay = true;
      // Muted to ensure autoplay works without user interaction.
      videoElement.muted = true;
      videoRef.current.appendChild(videoElement);
      videoElement
        .play()
        .then(() => {
          console.log("RemoteVideoPlayer: Video playback started.");
        })
        .catch((err) => {
          console.error("RemoteVideoPlayer: Video play error:", err);
        });
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

// ----------------------------------------------------------------
// LiveViewPage: Viewer page that connects to Twilio and shows an overlay
// if the streamer's video is paused or offline.
// ----------------------------------------------------------------
export default function LiveViewPage() {
  const pathname = usePathname();
  const slug = pathname?.split("/").pop() || "";

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [remoteVideoTrack, setRemoteVideoTrack] =
    useState<RemoteVideoTrack | null>(null);
  // videoStatus: "active" means video is playing; "paused" means the track is disabled; "offline" means participant disconnected.
  const [videoStatus, setVideoStatus] = useState<
    "active" | "paused" | "offline"
  >("active");
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

        // Connect without requesting local media.
        const twRoom = await connect(data.token, {
          audio: false,
          video: false,
        });
        roomRef.current = twRoom;
        console.log("Viewer: Connected to room:", twRoom.sid);

        // Handle participant disconnection.
        twRoom.on(
          "participantDisconnected",
          (participant: RemoteParticipant) => {
            console.log(
              "Viewer: Participant disconnected:",
              participant.identity
            );
            // If our current remote video track belongs to a disconnected participant, mark as offline.
            setRemoteVideoTrack(null);
            setVideoStatus("offline");
          }
        );

        // Helper to process remote participant tracks.
        const setupParticipantTracks = (participant: RemoteParticipant) => {
          participant.tracks.forEach((pub: RemoteTrackPublication) => {
            if (pub.isSubscribed && pub.track) {
              if (pub.track.kind === "video") {
                console.log("Viewer: Found remote video track:", pub.track.sid);
                const rvt = pub.track as RemoteVideoTrack;
                setRemoteVideoTrack(rvt);
                setVideoStatus("active");
                // Subscribe to track events.
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
          twRoom.localParticipant.tracks.forEach((pub) =>
            stopAndDetachTrack(pub.track)
          );
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

  if (!isLoggedIn) {
    return <div className="p-4 text-brandWhite">Please log in first.</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-brandBlack text-brandWhite">
      {/* Header */}
      <header className="h-16 flex items-center justify-between px-4 border-b border-brandOrange">
        <div className="text-2xl font-bold">CelebFitLife</div>
        <div className="flex items-center space-x-4">
          <Button className="px-4 py-2 bg-brandOrange text-brandBlack rounded">
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
            <div className="relative bg-black w-full h-64 md:h-full rounded-lg shadow-lg overflow-hidden">
              <RemoteVideoPlayer track={remoteVideoTrack} />
              {(videoStatus === "paused" || videoStatus === "offline") && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-70">
                  {videoStatus === "paused" ? (
                    <span className="text-xl text-brandOrange font-bold">
                      Streamer Paused Their Video
                    </span>
                  ) : (
                    <span className="text-xl text-brandOrange font-bold">
                      Streamer is Offline
                    </span>
                  )}
                </div>
              )}
            </div>
            <div ref={audioContainerRef} style={{ display: "none" }} />
          </div>

          {/* Chat Panel */}
          <div className="w-full md:w-80 bg-brandGray border-l border-brandOrange flex flex-col">
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
                  <Picker
                    onSelect={(emoji) =>
                      setNewMessage((prev) => prev + emoji.native)
                    }
                    theme="dark"
                    style={{ maxWidth: "320px" }}
                  />
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
