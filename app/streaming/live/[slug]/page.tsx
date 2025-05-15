"use client";
import React, { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Stream } from "@/lib/types/streaming.types";
import { ClientTwilioService } from "@/lib/services/ClientTwilioService";
import Video from "twilio-video";

export default function ViewerPage() {
  const { slug } = useParams<{ slug: string }>();
  const [stream, setStream] = useState<Stream | null>(null);
  const [status, setStatus] = useState<
    "loading" | "live" | "offline" | "ended"
  >("loading");
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLDivElement>(null);
  const roomRef = useRef<Video.Room | null>(null);

  useEffect(() => {
    if (!slug) return;
    const fetchStream = async () => {
      setStatus("loading");
      setError(null);
      const docRef = doc(db, "streams", slug as string);
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        setStatus("offline");
        setStream(null);
        return;
      }
      const data = snap.data() as Stream;
      setStream(data);
      if (data.hasEnded) setStatus("ended");
      else if (data.hasStarted) setStatus("live");
      else setStatus("offline");
    };
    fetchStream();
  }, [slug]);

  useEffect(() => {
    if (status !== "live" || !stream) return;
    let mounted = true;
    let videoTrack: Video.RemoteVideoTrack | null = null;
    let audioTrack: Video.RemoteAudioTrack | null = null;
    const joinRoom = async () => {
      try {
        const identity = `viewer_${Date.now()}_${Math.floor(
          Math.random() * 10000
        )}`;
        const client = new ClientTwilioService();
        const token = await client.getToken(stream.slug, identity);
        const room = await Video.connect(token, {
          name: stream.slug,
          tracks: [],
        });
        if (!mounted) return;
        roomRef.current = room;
        room.participants.forEach(handleParticipant);
        room.on("participantConnected", handleParticipant);
        room.on("participantDisconnected", cleanupTracks);
        room.on("disconnected", cleanupTracks);
      } catch (error: unknown) {
        let message = "Failed to connect to stream";
        if (
          typeof error === "object" &&
          error &&
          "message" in error &&
          typeof (error as { message: unknown }).message === "string"
        ) {
          message = (error as { message: string }).message;
        }
        setError(message);
      }
    };
    const handleParticipant = (participant: Video.RemoteParticipant) => {
      participant.tracks.forEach((pub) => {
        if (pub.isSubscribed && pub.track) handleTrack(pub.track);
      });
      participant.on("trackSubscribed", handleTrack);
      participant.on("trackUnsubscribed", cleanupTracks);
    };
    const handleTrack = (track: Video.RemoteTrack) => {
      if (track.kind === "video" && videoRef.current) {
        cleanupTracks();
        videoTrack = track as Video.RemoteVideoTrack;
        const el = videoTrack.attach();
        el.style.width = "100%";
        el.style.height = "100%";
        el.setAttribute("playsinline", "");
        el.setAttribute("autoplay", "");
        videoRef.current.appendChild(el);
      } else if (track.kind === "audio") {
        audioTrack = track as Video.RemoteAudioTrack;
        const el = audioTrack.attach();
        el.style.display = "none";
        document.body.appendChild(el);
      }
    };
    const cleanupTracks = () => {
      if (videoTrack && videoRef.current) {
        videoTrack.detach().forEach((el) => el.remove());
        videoTrack = null;
      }
      if (audioTrack) {
        audioTrack.detach().forEach((el) => el.remove());
        audioTrack = null;
      }
    };
    joinRoom();
    return () => {
      mounted = false;
      if (roomRef.current) roomRef.current.disconnect();
      cleanupTracks();
    };
  }, [status, stream]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-4">
      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-bold mb-2 truncate">
          {stream?.title || "Live Stream"}
        </h1>
        <div className="mb-4">
          {status === "live" && (
            <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm">
              LIVE
            </span>
          )}
          {status === "offline" && (
            <span className="bg-gray-700 text-gray-300 px-3 py-1 rounded-full text-sm">
              Offline
            </span>
          )}
          {status === "ended" && (
            <span className="bg-gray-900 text-gray-400 px-3 py-1 rounded-full text-sm">
              Ended
            </span>
          )}
        </div>
        <div
          className="aspect-video bg-black rounded-lg border border-gray-800 flex items-center justify-center mb-4"
          style={{ minHeight: 320 }}
        >
          {status === "loading" && (
            <span className="text-gray-400">Loading...</span>
          )}
          {status === "live" && (
            <div ref={videoRef} className="w-full h-full" />
          )}
          {status === "offline" && (
            <span className="text-gray-400">The stream is not live yet.</span>
          )}
          {status === "ended" && (
            <span className="text-gray-500">This stream has ended.</span>
          )}
        </div>
        {error && <div className="text-red-500 mb-2">{error}</div>}
      </div>
    </div>
  );
}
