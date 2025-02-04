'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { listenToMessages, sendChatMessage } from '@/lib/services/ChatService';
import { attachVideoTrack, stopAndDetachTrack } from '@/lib/twilioTrackUtils';
import { useAuthStore } from '@/store/useAuthStore';
import { usePathname } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';
import {
  connect,
  LocalVideoTrack,
  RemoteVideoTrack,
  Room,
  RemoteParticipant,
  RemoteTrackPublication,
  RemoteTrack
} from 'twilio-video';

// Define a chat message type.
interface ChatMessage {
  id: string;
  userName: string;
  content: string;
}

export default function LiveViewPage() {
  const pathname = usePathname();
  const slug = pathname?.split('/').pop() || '';

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const roomRef = useRef<Room | null>(null);
  const { currentUser, isLoggedIn } = useAuthStore();
  const videoContainerRef = useRef<HTMLDivElement>(null);
  // A container for remote audio tracks; can be hidden.
  const audioContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!slug || !isLoggedIn || !currentUser) return;

    const joinAsViewer = async () => {
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

        const twRoom = await connect(data.token, { audio: false, video: false });
        roomRef.current = twRoom;

        // Helper function to attach both video and audio tracks.
        const setupParticipantTracks = (participant: RemoteParticipant) => {
          participant.tracks.forEach((pub: RemoteTrackPublication) => {
            if (pub.isSubscribed && pub.track) {
              if (pub.track.kind === 'video') {
                if (videoContainerRef.current) {
                  // Clear any previous video elements and attach the new video.
                  videoContainerRef.current.innerHTML = '';
                  attachVideoTrack(pub.track as RemoteVideoTrack | LocalVideoTrack, videoContainerRef.current);
                }
              }
              if (pub.track.kind === 'audio') {
                if (audioContainerRef.current) {
                  // For audio, create an audio element and attach.
                  const audioElement = pub.track.attach() as HTMLAudioElement;
                  audioElement.autoplay = true;
                  // Optionally hide controls.
                  audioElement.controls = false;
                  // Append if not already attached.
                  if (!audioContainerRef.current.querySelector(`[data-twilio-track="${pub.track.sid}"]`)) {
                    // Tag the element so we can check later.
                    audioElement.setAttribute('data-twilio-track', pub.track.sid);
                    audioContainerRef.current.appendChild(audioElement);
                  }
                }
              }
            }
          });
          participant.on('trackSubscribed', (track: RemoteTrack) => {
            if (track.kind === 'video') {
              if (videoContainerRef.current) {
                videoContainerRef.current.innerHTML = '';
                attachVideoTrack(track as RemoteVideoTrack, videoContainerRef.current);
              }
            }
            if (track.kind === 'audio') {
              if (audioContainerRef.current) {
                const audioElement = track.attach() as HTMLAudioElement;
                audioElement.autoplay = true;
                audioElement.controls = false;
                if (!audioContainerRef.current.querySelector(`[data-twilio-track="${track.sid}"]`)) {
                  audioElement.setAttribute('data-twilio-track', track.sid);
                  audioContainerRef.current.appendChild(audioElement);
                }
              }
            }
          });
        };

        // Attach tracks from existing participants.
        twRoom.participants.forEach((participant: RemoteParticipant) => {
          setupParticipantTracks(participant);
        });

        // Listen for new participants.
        twRoom.on('participantConnected', (participant: RemoteParticipant) => {
          setupParticipantTracks(participant);
        });

        twRoom.on('disconnected', () => {
          twRoom.localParticipant.tracks.forEach((pub) => {
            if (pub.track.kind === 'audio' || pub.track.kind === 'video') {
              stopAndDetachTrack(pub.track);
            }
          });
        });
      } catch (err) {
        console.error('Viewer join error:', err);
      }
    };

    joinAsViewer();

    const unsub = listenToMessages(slug, (msgs: ChatMessage[]) => setMessages(msgs));
    return () => {
      unsub();
      if (roomRef.current) {
        roomRef.current.disconnect();
      }
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
    setNewMessage('');
  };

  if (!isLoggedIn) {
    return <div className="p-4 text-white">Please log in first.</div>;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row text-white">
      <div className="flex-1 bg-gray-800 p-4 relative">
        <div ref={videoContainerRef} className="bg-black w-full h-64 md:h-full"></div>
        {/* Hidden container for audio elements */}
        <div ref={audioContainerRef} style={{ display: 'none' }}></div>
      </div>

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
