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
import { stopAndDetachTrack } from '@/lib/twilioTrackUtils';
import { sendChatMessage, listenToMessages } from '@/lib/services/ChatService';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Picker } from 'emoji-mart';

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
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

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
          userName: currentUser.displayName || currentUser.email
        })
      });
      const data = await res.json();
      if (!data.token) throw new Error('No token returned');

      // The connect call triggers getUserMedia and prompts for mic/camera permission.
      const twRoom = await connect(data.token, {
        video: { width: 640, height: 360 },
        audio: true
      });
      roomRef.current = twRoom;

      // Attach the local video track with explicit style adjustments.
      twRoom.localParticipant.tracks.forEach((pub: LocalTrackPublication) => {
        if (pub.track.kind === 'video' && videoContainerRef.current) {
          // Clear any previous attachments.
          videoContainerRef.current.innerHTML = '';
          // Attach the track and then style the video element.
          const videoElement = pub.track.attach() as HTMLVideoElement;
          videoElement.style.width = '100%';
          videoElement.style.height = '100%';
          videoElement.style.objectFit = 'cover';
          videoContainerRef.current.appendChild(videoElement);
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
    return <div className="p-4 text-brandWhite">Please log in first.</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-brandBlack text-brandWhite">
      {/* Header */}
      <header className="h-16 flex items-center justify-between px-4 border-b border-brandOrange">
        <div className="text-2xl font-bold">CelebFitLife</div>
        <div className="flex items-center space-x-4">
          <Button className="px-4 py-2 bg-brandOrange text-brandBlack rounded">Subscribe</Button>
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
                <Button onClick={joinAsStreamer} className="bg-brandOrange text-brandBlack">
                  Start Stream (Enable Mic/Camera)
                </Button>
              </div>
            )}
            <div ref={videoContainerRef} className="bg-black w-full h-64 md:h-full rounded-lg shadow-lg overflow-hidden"></div>
            {isStreamStarted && (
              <div className="mt-2 space-x-2">
                <Button onClick={handleToggleAudio} className="bg-brandOrange text-brandBlack">
                  {isAudioEnabled ? 'Mute' : 'Unmute'}
                </Button>
                <Button onClick={handleToggleVideo} className="bg-brandOrange text-brandBlack">
                  {isVideoEnabled ? 'Stop Cam' : 'Start Cam'}
                </Button>
              </div>
            )}
          </div>

          {/* Chat Panel */}
          <div className="w-full md:w-80 bg-brandGray border-l border-brandOrange flex flex-col">
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
                  <Picker
                    onSelect={(emoji) => setNewMessage((prev) => prev + emoji.native)}
                    theme="dark"
                    style={{ maxWidth: '320px' }}
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
