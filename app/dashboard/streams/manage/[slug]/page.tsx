'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  connect,
  Room,
  LocalVideoTrack,
  LocalAudioTrack,
  LocalTrackPublication
} from 'twilio-video';
import { stopAndDetachTrack, attachVideoTrack } from '@/lib/twilioTrackUtils';
import { sendChatMessage, listenToMessages } from '@/lib/services/ChatService';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';

interface ChatMessage {
  id: string;
  userName: string;
  content: string;
}

export default function ManageStreamPage() {
  const pathname = usePathname();
  const slug = pathname?.split('/').pop() || '';
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const roomRef = useRef<Room | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isStreamStarted, setIsStreamStarted] = useState(false);

  const { currentUser, isLoggedIn } = useAuthStore();

  // Subscribe to chat messages regardless of stream start.
  useEffect(() => {
    if (!slug) return;
    const unsub = listenToMessages(slug, (msgs: ChatMessage[]) => setMessages(msgs));
    return () => {
      unsub();
      if (roomRef.current) {
        roomRef.current.disconnect();
      }
    };
  }, [slug]);

  // Triggered by a user gesture.
  const joinAsStreamer = async () => {
    if (!slug || !isLoggedIn || !currentUser) return;

    // Verify the stream exists in Firestore.
    const snap = await getDoc(doc(db, 'streams', slug));
    if (!snap.exists()) {
      console.error('Stream not found in Firestore.');
      return;
    }
    console.log('Stream doc:', snap.data());

    try {
      const res = await fetch('/api/twilio/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomName: slug,
          userName: currentUser.displayName || currentUser.email,
        }),
      });
      const data = await res.json();
      if (!data.token) throw new Error('No token returned');

      // The connect call will trigger getUserMedia and (because of the user click) prompt for mic/camera permission.
      const twRoom = await connect(data.token, {
        video: { width: 640, height: 360 },
        audio: true,
      });
      roomRef.current = twRoom;

      // Attach the local video track.
      twRoom.localParticipant.tracks.forEach((pub: LocalTrackPublication) => {
        if (pub.track.kind === 'video' && videoContainerRef.current) {
          videoContainerRef.current.innerHTML = '';
          attachVideoTrack(pub.track as LocalVideoTrack, videoContainerRef.current);
        }
      });

      twRoom.on('disconnected', () => {
        twRoom.localParticipant.tracks.forEach((pub) => {
          if (pub.track.kind === 'audio' || pub.track.kind === 'video') {
            stopAndDetachTrack(pub.track);
          }
        });
      });

      setIsStreamStarted(true);
    } catch (err) {
      console.error('Error connecting to Twilio:', err);
    }
  };

  const handleToggleAudio = () => {
    if (!roomRef.current) return;
    roomRef.current.localParticipant.audioTracks.forEach((pub: LocalTrackPublication) => {
      if (pub.track.kind === 'audio') {
        const audioTrack = pub.track as LocalAudioTrack;
        const newStatus = !audioTrack.isEnabled;
        console.log(`Toggling audio. Was enabled: ${audioTrack.isEnabled}. New status: ${newStatus}`);
        audioTrack.enable(newStatus);
      }
    });
    setIsAudioEnabled((prev) => !prev);
  };

  const handleToggleVideo = () => {
    if (!roomRef.current) return;
    roomRef.current.localParticipant.videoTracks.forEach((pub: LocalTrackPublication) => {
      if (pub.track.kind === 'video') {
        const videoTrack = pub.track as LocalVideoTrack;
        const newStatus = !videoTrack.isEnabled;
        console.log(`Toggling video. Was enabled: ${videoTrack.isEnabled}. New status: ${newStatus}`);
        videoTrack.enable(newStatus);
      }
    });
    setIsVideoEnabled((prev) => !prev);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser) {
      console.error("User not logged in. Cannot send message.");
      return;
    }
    const userName = currentUser.displayName || currentUser.email;
    if (!userName) {
      console.error("User name is undefined. Cannot send message.");
      return;
    }
    await sendChatMessage(slug, userName, newMessage.trim());
    setNewMessage('');
  };

  if (!isLoggedIn) {
    return <div className="p-4 text-white">Please log in first.</div>;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row text-white">
      {/* Video section */}
      <div className="flex-1 bg-gray-800 p-4 relative">
        {/* Button to trigger mic/camera permission via user gesture */}
        {!isStreamStarted && (
          <div className="mb-4">
            <Button onClick={joinAsStreamer}>Start Stream (Enable Mic/Camera)</Button>
          </div>
        )}
        <div ref={videoContainerRef} className="bg-black w-full h-64 md:h-full"></div>
        {isStreamStarted && (
          <div className="mt-2 space-x-2">
            <Button onClick={handleToggleAudio}>
              {isAudioEnabled ? 'Mute' : 'Unmute'}
            </Button>
            <Button onClick={handleToggleVideo}>
              {isVideoEnabled ? 'Stop Cam' : 'Start Cam'}
            </Button>
          </div>
        )}
      </div>

      {/* Chat panel */}
      <div className="w-full md:w-80 bg-white text-gray-800 border-l border-gray-200 flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {messages.map((msg) => (
            <div key={msg.id} className="bg-gray-100 p-2 rounded-md text-sm">
              <strong>{msg.userName}: </strong>
              {msg.content}
            </div>
          ))}
        </div>
        <form onSubmit={handleSendMessage} className="p-2 border-t border-gray-200 flex">
          <Input
            className="flex-1 border border-gray-300 mr-2"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <Button type="submit">Send</Button>
        </form>
      </div>
    </div>
  );
}
