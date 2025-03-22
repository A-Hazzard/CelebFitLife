"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
    connect,
    Room,
    RemoteParticipant,
    RemoteTrack,
    RemoteVideoTrack,
    RemoteAudioTrack,
    RemoteTrackPublication
} from "twilio-video";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { db } from "@/lib/config/firebase";
import { doc, onSnapshot, getDoc } from "firebase/firestore";
import { ChatMessage } from "@/lib/types/stream";
import { listenToMessages, sendChatMessage } from "@/lib/services/ChatService";
import { stopAndDetachTrack } from "@/lib/twilioTrackUtils";
import axios from "axios";
import { MicOff, VideoOff, Volume2, VolumeX } from "lucide-react";

/** RemoteVideoPlayer attaches the video track to a DOM node */
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
            track?.detach().forEach((el) => el.remove());
        };
    }, [track]);

    return <div ref={videoRef} className="w-full h-full" />;
}

/** RemoteAudioPlayer handles audio playback */
function RemoteAudioPlayer({ track }: { track: RemoteAudioTrack | null }) {
    useEffect(() => {
        if (track) {
            const el = track.attach() as HTMLAudioElement;
            el.autoplay = true;
            el.muted = false;
            el.style.display = "none";
            document.body.appendChild(el);
            return () => {
                track.detach().forEach((el) => el.remove());
            };
        }
    }, [track]);

    return null;
}

// Type guards
function isRemoteVideoTrack(track: RemoteTrack): track is RemoteVideoTrack {
    return track.kind === "video";
}

function isRemoteAudioTrack(track: RemoteTrack): track is RemoteAudioTrack {
    return track.kind === "audio";
}

export default function LiveViewPage() {
    const pathname = usePathname();
    const router = useRouter();
    const slug = pathname?.split("/").pop() || "";
    const { currentUser } = useAuthStore();

    const [hasStarted, setHasStarted] = useState(false);
    const [room, setRoom] = useState<Room | null>(null);
    const [remoteParticipant, setRemoteParticipant] = useState<RemoteParticipant | null>(null);
    const [remoteVideoTrack, setRemoteVideoTrack] = useState<RemoteVideoTrack | null>(null);
    const [remoteAudioTrack, setRemoteAudioTrack] = useState<RemoteAudioTrack | null>(null);
    const [videoStatus, setVideoStatus] = useState<"waiting" | "connecting" | "active" | "offline" | "ended">("waiting");
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [hasHydrated, setHasHydrated] = useState(false);
    const [streamerStatus, setStreamerStatus] = useState({ audioMuted: false, cameraOff: false });
    const [isAudioMuted, setIsAudioMuted] = useState(false);
    const videoContainerRef = useRef<HTMLDivElement>(null);
    const [offlineTimerId, setOfflineTimerId] = useState<NodeJS.Timeout | null>(null);

    // Store stable references to handler functions to break circular dependencies
    const handlerRefs = useRef({
        trackSubscribed: null as any,
        trackUnsubscribed: null as any,
        trackPublished: null as any,
        trackUnpublished: null as any,
        participantConnected: null as any,
        participantDisconnected: null as any
    });

    // Define clearVideoContainer outside of handleTrackSubscribed so it can be used anywhere
    const clearVideoContainer = useCallback(() => {
        if (!videoContainerRef.current) return;

        console.log('Clearing video container');
        const existingVideos = videoContainerRef.current.querySelectorAll('video');
        existingVideos.forEach(v => {
            console.log('Removing existing video element');
            v.remove();
        });
        videoContainerRef.current.innerHTML = '';
    }, []);

    useEffect(() => {
        const unsub = useAuthStore.persist.onFinishHydration(() => setHasHydrated(true));
        const timeout = setTimeout(() => setHasHydrated(true), 2000);
        return () => {
            unsub();
            clearTimeout(timeout);
        };
    }, []);

    useEffect(() => {
        if (hasHydrated && !currentUser) router.push("/login");
    }, [currentUser, hasHydrated, router]);

    // Listen for stream status from Firestore
    useEffect(() => {
        if (!slug) return;
        const streamDocRef = doc(db, "streams", slug);
        const unsubscribe = onSnapshot(streamDocRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data();
                setStreamerStatus({
                    audioMuted: data.audioMuted || false,
                    cameraOff: data.cameraOff || false
                });

                // Update video status based on stream state
                if (data.hasEnded) {
                    setVideoStatus("ended");
                    if (room) {
                        room.disconnect();
                    }
                } else if (data.hasStarted) {
                    setVideoStatus("active");
                } else {
                    setVideoStatus("waiting");
                }
            }
        });
        return () => unsubscribe();
    }, [slug, room]);

    // Helper function to update UI based on track enabled state
    const updateTrackEnabledState = useCallback((track: RemoteTrack) => {
        try {
            if (!track) return;

            console.log(`Updating track enabled state for ${track.kind} track:`, track.isEnabled);

            if (track.kind === 'audio') {
                // Handle audio track enabled/disabled state
                const audioElements = document.querySelectorAll(`audio[data-track-sid="${track.sid}"]`);
                audioElements.forEach(el => {
                    const audioEl = el as HTMLAudioElement;
                    audioEl.muted = !track.isEnabled || isAudioMuted;
                });
            } else if (track.kind === 'video') {
                // Handle video track enabled/disabled state
                if (track.isEnabled) {
                    setVideoStatus("active");
                } else {
                    // Only update UI state, don't set to offline
                    // This prevents showing "Stream is Offline" when camera is just disabled
                    console.log('Video track disabled, but not setting to offline');
                }
            }
        } catch (error) {
            console.error('Error in updateTrackEnabledState:', error);
        }
    }, [isAudioMuted]);

    const handleTrackSubscribed = useCallback((track: RemoteTrack) => {
        try {
            console.log('Track subscribed:', track.kind, track.name, 'isEnabled:', track.isEnabled);

            // If we have an offline timer running, clear it since we got a new track
            if (offlineTimerId) {
                console.log('Clearing offline timer since we received a new track');
                clearTimeout(offlineTimerId);
                setOfflineTimerId(null);
            }

            if (track.kind === 'video') {
                const videoTrack = track as RemoteVideoTrack;
                
                // Store the new track reference
                setRemoteVideoTrack(videoTrack);
                setVideoStatus("active");

                console.log('Creating video element for track');

                // Create and configure video element
                if (videoContainerRef.current) {
                    // Clear existing videos first
                    clearVideoContainer();
                    
                    // Create a new video element
                    const element = document.createElement('video');
                    element.style.width = "100%";
                    element.style.height = "100%";
                    element.style.objectFit = "cover";
                    element.setAttribute('data-track-sid', track.sid);
                    element.setAttribute('autoplay', 'true');
                    element.setAttribute('playsinline', 'true');
                    
                    // Attach the track to the element
                    videoTrack.attach(element);
                    
                    // Add the element to the container
                    videoContainerRef.current.appendChild(element);
                    console.log('Video element created and attached to container');
                    
                    // Force play if needed
                    try {
                        element.play().catch(playError => {
                            console.warn('Error auto-playing video:', playError);
                        });
                    } catch (playError) {
                        console.warn('Error calling play():', playError);
                    }
                }

                // Set up track event listeners
                videoTrack.on('disabled', () => {
                    console.log('Video track disabled');
                    // Don't set to offline, just update UI state
                    // This prevents showing "Stream is Offline" when camera is just disabled
                });

                videoTrack.on('enabled', () => {
                    console.log('Video track enabled');
                    setVideoStatus("active");
                });

            } else if (track.kind === 'audio') {
                const audioTrack = track as RemoteAudioTrack;
                
                // Store the new track reference
                setRemoteAudioTrack(audioTrack);

                console.log('Creating audio element for track');

                // Create and configure audio element
                const element = document.createElement('audio');
                element.setAttribute('autoplay', 'true');
                element.setAttribute('data-track-sid', track.sid);
                element.muted = isAudioMuted;
                
                // Attach the track to the element
                audioTrack.attach(element);
                
                // Add the element to the document
                document.body.appendChild(element);
                console.log('Audio element created and attached to document body');

                // Set up track event listeners
                audioTrack.on('disabled', () => {
                    console.log('Audio track disabled');
                    updateTrackEnabledState(audioTrack);
                });

                audioTrack.on('enabled', () => {
                    console.log('Audio track enabled');
                    updateTrackEnabledState(audioTrack);
                });
            }
        } catch (error) {
            console.error('Error in handleTrackSubscribed:', error);
        }
    }, [isAudioMuted, updateTrackEnabledState, offlineTimerId, clearVideoContainer]);

    const handleTrackUnsubscribed = useCallback((track: RemoteTrack) => {
        try {
            console.log('Track unsubscribed:', track.kind, track.name);

            if (track.kind === 'video') {
                // Don't immediately set video status to offline
                // Instead, set a timer to check if we get a new track soon
                console.log('Video track unsubscribed, waiting to see if a new one arrives');

                // Clean up this specific track's elements
                if (videoContainerRef.current) {
                    const videos = videoContainerRef.current.querySelectorAll(`video[data-track-sid="${track.sid}"]`);
                    videos.forEach(video => {
                        console.log('Removing video element for unsubscribed track');
                        video.remove();
                    });
                }

                // Clean up track event listeners
                if ('removeAllListeners' in track) {
                    (track as any).removeAllListeners();
                }

                // Set a timer to mark as offline if no new track arrives
                const offlineTimer = setTimeout(() => {
                    // Only update UI state if no new track arrives, but don't set to offline
                    // This prevents showing "Stream is Offline" when just switching cameras
                    if (!remoteVideoTrack && videoStatus !== "offline") {
                        console.log('No new video track received after timeout, but not setting to offline');
                        setVideoStatus("active"); // Keep as active if hasStarted is true
                        
                        // Clear the video container
                        clearVideoContainer();
                    }
                }, 5000); // Wait 5 seconds before checking

                // Store the timer ID so we can clear it if a new track arrives
                setOfflineTimerId(offlineTimer);

                // Note: We're not setting remoteVideoTrack to null immediately
                // to avoid flickering if a new track is coming soon
            } else if (track.kind === 'audio') {
                // Clean up audio elements
                document.querySelectorAll(`audio[data-track-sid="${track.sid}"]`).forEach(audio => audio.remove());

                // Clean up track event listeners
                if ('removeAllListeners' in track) {
                    (track as any).removeAllListeners();
                }

                setRemoteAudioTrack(null);

                console.log('Audio track unsubscribed and cleaned up');
            }

            // Safely detach track from all elements
            if ('detach' in track) {
                try {
                    const detachedElements = (track as any).detach();
                    if (Array.isArray(detachedElements)) {
                        detachedElements.forEach(element => {
                            if (element && element.remove) {
                                element.remove();
                            }
                        });
                    }
                    console.log(`Detached ${track.kind} track from ${detachedElements?.length || 0} elements`);
                } catch (detachError) {
                    console.error('Error detaching track:', detachError);
                }
            }
        } catch (error) {
            console.error('Error in handleTrackUnsubscribed:', error);
        }
    }, [remoteVideoTrack, videoStatus, clearVideoContainer]);

    const handleTrackPublished = useCallback((publication: RemoteTrackPublication) => {
        try {
            if (!publication) {
                console.warn('handleTrackPublished called with undefined publication');
                return;
            }

            const trackName = publication.trackName || 'unknown';
            console.log('Track published:', trackName,
                'kind:', publication.kind,
                'isSubscribed:', publication.isSubscribed,
                'track exists:', !!publication.track,
                'track enabled:', publication.track?.isEnabled);
                
            // If this is a video track, clear the container to prepare for the new track
            if (publication.kind === 'video') {
                console.log('Video track published, clearing container to prepare for new track');
                clearVideoContainer();
                
                // Force the track to be subscribed if it's not already
                if (!publication.isSubscribed) {
                    console.log(`Attempting to subscribe to track: ${publication.trackName}`);
                    publication.on('subscribed', handleTrackSubscribed);

                    // We can't force subscription directly, but we can monitor for subscription
                    console.log(`Waiting for track ${publication.trackName} to be subscribed automatically`);
                } else if (publication.track) {
                    console.log(`Track already subscribed, handling: ${publication.trackName}`);
                    handleTrackSubscribed(publication.track);
                }
            }

            if (publication.isSubscribed && publication.track) {
                console.log('Track is already subscribed, handling directly');
                handleTrackSubscribed(publication.track);
            } else {
                console.log('Track is not yet subscribed, setting up subscription handler');
                
                // Set up a one-time handler for when the track is subscribed
                const onSubscribed = (track: RemoteTrack) => {
                    try {
                        console.log('Track was subscribed after publication:', trackName, 'kind:', track.kind);
                        handleTrackSubscribed(track);
                    } catch (error) {
                        console.error('Error in onSubscribed handler:', error);
                    } finally {
                        // Always clean up the event listener
                        publication.off('subscribed', onSubscribed);
                    }
                };
                
                publication.on('subscribed', onSubscribed);
                
                // Set a timeout to check if the track was subscribed
                setTimeout(() => {
                    if (publication.isSubscribed && publication.track) {
                        console.log('Track was subscribed after timeout, handling now:', trackName);
                        handleTrackSubscribed(publication.track);
                    } else {
                        console.warn('Track still not subscribed after timeout:', trackName);
                    }
                }, 2000);
            }
        } catch (error) {
            console.error('Error in handleTrackPublished:', error);
        }
    }, [handleTrackSubscribed, clearVideoContainer]);

    const handleTrackUnpublished = useCallback((publication: RemoteTrackPublication) => {
        try {
            if (!publication) {
                console.warn('handleTrackUnpublished called with undefined publication');
                return;
            }

            const trackName = publication.trackName || 'unknown';
            console.log('Track unpublished:', trackName);

            if (publication.track) {
                handleTrackUnsubscribed(publication.track);
            }

            // Clean up any event listeners on the publication
            if ('removeAllListeners' in publication) {
                (publication as any).removeAllListeners();
            }
        } catch (error) {
            console.error('Error in handleTrackUnpublished:', error);
        }
    }, [handleTrackUnsubscribed]);

    const handleParticipantConnected = useCallback((participant: RemoteParticipant) => {
        try {
            if (!participant) {
                console.warn('handleParticipantConnected called with undefined participant');
                return;
            }

            console.log('Participant connected:', participant.identity);
            console.log('Participant tracks:', participant.tracks.size);
            setRemoteParticipant(participant);

            // Force subscription to all tracks
            participant.tracks.forEach(publication => {
                if (!publication) return;

                console.log('Checking publication:', publication.trackName || 'unknown',
                    'isSubscribed:', publication.isSubscribed,
                    'isTrackEnabled:', publication.track?.isEnabled);

                // Force subscribe to the track
                try {
                    if (!publication.isSubscribed) {
                        console.log(`Attempting to subscribe to track: ${publication.trackName}`);
                        publication.on('subscribed', handleTrackSubscribed);

                        // We can't force subscription directly, but we can monitor for subscription
                        console.log(`Waiting for track ${publication.trackName} to be subscribed automatically`);
                    } else if (publication.track) {
                        console.log(`Track already subscribed, handling: ${publication.trackName}`);
                        handleTrackSubscribed(publication.track);
                    }
                } catch (e) {
                    console.error('Error forcing track subscription:', e);
                }
            });

            // Handle track events
            participant.on('trackSubscribed', handleTrackSubscribed);
            participant.on('trackUnsubscribed', handleTrackUnsubscribed);
            participant.on('trackPublished', handleTrackPublished);
            participant.on('trackUnpublished', handleTrackUnpublished);

            // Set a timeout to check if we have received any tracks
            setTimeout(() => {
                if (videoContainerRef.current && !videoContainerRef.current.querySelector('video')) {
                    console.log('No video element found after 2 seconds, attempting to resubscribe to tracks');
                    participant.tracks.forEach(publication => {
                        if (publication.track && publication.isSubscribed && publication.kind === 'video') {
                            console.log(`Resubscribing to video track: ${publication.trackName}`);
                            handleTrackSubscribed(publication.track);
                        }
                    });
                }
            }, 2000);
        } catch (error) {
            console.error('Error in handleParticipantConnected:', error);
        }
    }, [handleTrackSubscribed, handleTrackUnsubscribed, handleTrackPublished, handleTrackUnpublished]);

    const handleParticipantDisconnected = useCallback((participant: RemoteParticipant) => {
        try {
            if (!participant) {
                console.warn('handleParticipantDisconnected called with undefined participant');
                return;
            }

            console.log('Participant disconnected:', participant.identity);

            // Clean up all tracks
            participant.tracks.forEach(publication => {
                if (publication && publication.track) {
                    handleTrackUnsubscribed(publication.track);
                }
            });

            // Clean up all event listeners
            try {
                participant.removeAllListeners();
            } catch (error) {
                console.error('Error removing participant listeners:', error);
            }

            setRemoteParticipant(null);
            if (offlineTimerId) {
                clearTimeout(offlineTimerId);
                setOfflineTimerId(null);
            }
        } catch (error) {
            console.error('Error in handleParticipantDisconnected:', error);
        }
    }, [handleTrackUnsubscribed, offlineTimerId]);

    // Initialize the handler refs to break circular dependencies
    useEffect(() => {
        handlerRefs.current.trackSubscribed = handleTrackSubscribed;
        handlerRefs.current.trackUnsubscribed = handleTrackUnsubscribed;
        handlerRefs.current.trackPublished = handleTrackPublished;
        handlerRefs.current.trackUnpublished = handleTrackUnpublished;
        handlerRefs.current.participantConnected = handleParticipantConnected;
        handlerRefs.current.participantDisconnected = handleParticipantDisconnected;
    }, [
        handleTrackSubscribed,
        handleTrackUnsubscribed,
        handleTrackPublished,
        handleTrackUnpublished,
        handleParticipantConnected,
        handleParticipantDisconnected
    ]);

    useEffect(() => {
        if (!slug || !currentUser) return;

        let isSubscribed = true;
        let roomCleanup: (() => void) | null = null;
        let connectAttempts = 0;
        const maxAttempts = 3;

        const connectToRoom = async () => {
            try {
                // Prevent multiple connection attempts
                connectAttempts++;
                if (connectAttempts > maxAttempts) {
                    console.error(`Failed to connect after ${maxAttempts} attempts`);
                    setVideoStatus("offline");
                    return;
                }

                console.log(`Connecting to room (attempt ${connectAttempts}):`, slug);
                const response = await fetch('/api/twilio/token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        roomName: slug,
                        userName: currentUser.username || currentUser.email
                    }),
                });

                if (!isSubscribed) return;

                if (!response.ok) {
                    const errorData = await response.json();
                    console.error('Error getting token:', errorData);
                    setVideoStatus("offline");
                    return;
                }

                const { token } = await response.json();
                console.log('Got token, connecting to Twilio...');

                const room = await connect(token, {
                    name: slug,
                    tracks: [],
                    networkQuality: {
                        local: 1,
                        remote: 1
                    },
                    dominantSpeaker: true
                });

                if (!isSubscribed) {
                    room.disconnect();
                    return;
                }

                console.log('Connected to room, participants:', room.participants.size);
                setRoom(room);

                // Handle existing participants
                room.participants.forEach(handlerRefs.current.participantConnected);

                // Set up room handlers
                room.on('participantConnected', handlerRefs.current.participantConnected);
                room.on('participantDisconnected', handlerRefs.current.participantDisconnected);
                room.on('disconnected', () => {
                    console.log('Room disconnected');
                });
                room.on('reconnecting', () => {
                    console.log('Room reconnecting');
                });
                room.on('reconnected', () => {
                    console.log('Room reconnected');
                });

                roomCleanup = () => {
                    console.log('Cleaning up room connection');
                    room.off('participantConnected', handlerRefs.current.participantConnected);
                    room.off('participantDisconnected', handlerRefs.current.participantDisconnected);
                    room.removeAllListeners();
                    room.disconnect();
                };
            } catch (error) {
                console.error('Error connecting to room:', error);
            }
        };

        connectToRoom();

        return () => {
            console.log('Cleaning up room connection effect');
            isSubscribed = false;
            if (roomCleanup) roomCleanup();
        };
    }, [slug, currentUser]); // Remove handler dependencies

    // Add track status monitoring
    useEffect(() => {
        if (!remoteParticipant) return;

        const handleTrackStatus = (publication: RemoteTrackPublication) => {
            // Safely handle the case where publication might be undefined
            if (!publication) {
                console.warn('handleTrackStatus called with undefined publication');
                return;
            }

            // Safely access trackName with fallback
            const trackName = publication.trackName || 'unknown';

            // Safely handle the case where track might be null
            const track = publication.track;
            if (!track) {
                console.warn(`Track is null for publication: ${trackName}`);
                return;
            }

            console.log('Track status change:', trackName,
                'video enabled:', track.kind === 'video' ? track.isEnabled : 'n/a',
                'audio enabled:', track.kind === 'audio' ? track.isEnabled : 'n/a');

            // Update UI based on track kind and enabled status
            if (track.kind === 'video') {
                setStreamerStatus(prev => ({
                    ...prev,
                    cameraOff: !track.isEnabled
                }));
            } else if (track.kind === 'audio') {
                setStreamerStatus(prev => ({
                    ...prev,
                    audioMuted: !track.isEnabled
                }));
            }
        };

        const handleSubscribed = (track: RemoteTrack, publication: RemoteTrackPublication) => {
            if (!publication || !track) {
                console.warn('handleSubscribed called with undefined publication or track');
                return;
            }

            console.log('Track subscribed event:', publication.trackName || 'unknown');
            handleTrackStatus(publication);
        };

        const handleUnsubscribed = (track: RemoteTrack, publication: RemoteTrackPublication) => {
            if (!publication || !track) {
                console.warn('handleUnsubscribed called with undefined publication or track');
                return;
            }

            console.log('Track unsubscribed event:', publication.trackName || 'unknown');
            handleTrackStatus(publication);
        };

        const handleDisabled = (publication: RemoteTrackPublication) => {
            if (!publication) {
                console.warn('handleDisabled called with undefined publication');
                return;
            }

            console.log('Track disabled event:', publication.trackName || 'unknown');
            handleTrackStatus(publication);
        };

        const handleEnabled = (publication: RemoteTrackPublication) => {
            if (!publication) {
                console.warn('handleEnabled called with undefined publication');
                return;
            }

            console.log('Track enabled event:', publication.trackName || 'unknown');
            handleTrackStatus(publication);
        };

        // Safely iterate through tracks with null checks
        remoteParticipant.tracks.forEach(publication => {
            if (!publication) return;

            publication.on('subscribed', handleSubscribed);
            publication.on('unsubscribed', handleUnsubscribed);
            publication.on('trackDisabled', handleDisabled);
            publication.on('trackEnabled', handleEnabled);
        });

        return () => {
            // Safely remove event listeners with null checks
            if (remoteParticipant) {
                remoteParticipant.tracks.forEach(publication => {
                    if (!publication) return;

                    publication.off('subscribed', handleSubscribed);
                    publication.off('unsubscribed', handleUnsubscribed);
                    publication.off('trackDisabled', handleDisabled);
                    publication.off('trackEnabled', handleEnabled);
                });
            }
        };
    }, [remoteParticipant]);

    // Add connection status monitoring
    useEffect(() => {
        if (!room) return;

        const handleReconnected = () => {
            console.log('Reconnected to room');
            setVideoStatus('active');
        };

        const handleReconnecting = () => {
            console.log('Reconnecting to room...');
        };

        room.on('reconnected', handleReconnected);
        room.on('reconnecting', handleReconnecting);

        return () => {
            room.off('reconnected', handleReconnected);
            room.off('reconnecting', handleReconnecting);
        };
    }, [room]);

    // Add a function to force check and resubscribe to tracks
    const forceCheckAndResubscribe = useCallback(() => {
        if (!remoteParticipant || !videoContainerRef.current) return;
        
        console.log('Force checking for video tracks to resubscribe');
        
        // Check if we have a video element
        const hasVideoElement = !!videoContainerRef.current.querySelector('video');
        
        // If we don't have a video element but the camera is on, try to resubscribe
        if (!hasVideoElement && !streamerStatus.cameraOff) {
            console.log('No video element found but camera is on, attempting to resubscribe to all tracks');
            
            // First clear the container
            clearVideoContainer();
            
            // Then try to resubscribe to all video tracks
            let foundVideoTrack = false;
            remoteParticipant.tracks.forEach(publication => {
                if (publication.kind === 'video' && publication.isSubscribed && publication.track) {
                    console.log(`Resubscribing to video track: ${publication.trackName}`);
                    handleTrackSubscribed(publication.track);
                    foundVideoTrack = true;
                }
            });
            
            if (!foundVideoTrack) {
                console.log('No subscribed video tracks found, attempting to subscribe to any available tracks');
                remoteParticipant.tracks.forEach(publication => {
                    if (publication.kind === 'video') {
                        console.log(`Setting up subscription for track: ${publication.trackName}`);
                        publication.on('subscribed', handleTrackSubscribed);
                    }
                });
            }
        }
    }, [remoteParticipant, videoContainerRef, streamerStatus.cameraOff, clearVideoContainer, handleTrackSubscribed]);
    
    // Add an effect to periodically check for video tracks when camera is on
    useEffect(() => {
        if (!hasStarted || !remoteParticipant || streamerStatus.cameraOff) return;
        
        // Initial check
        forceCheckAndResubscribe();
        
        // Set up periodic checks
        const checkInterval = setInterval(() => {
            const hasVideoElement = videoContainerRef.current && !!videoContainerRef.current.querySelector('video');
            if (!hasVideoElement && !streamerStatus.cameraOff) {
                console.log('Periodic check: No video element found but camera is on');
                forceCheckAndResubscribe();
            }
        }, 5000); // Check every 5 seconds
        
        return () => clearInterval(checkInterval);
    }, [hasStarted, remoteParticipant, streamerStatus.cameraOff, forceCheckAndResubscribe]);

    // Handle audio muting
    const toggleAudioMute = useCallback(() => {
        if (remoteAudioTrack) {
            const audioElement = document.querySelector('audio');
            if (audioElement) {
                audioElement.muted = !isAudioMuted;
                setIsAudioMuted(!isAudioMuted);
            }
        }
    }, [remoteAudioTrack, isAudioMuted]);

    // Update streamer status in UI
    useEffect(() => {
        const streamerStatusRef = doc(db, 'streams', slug);
        const unsubscribe = onSnapshot(streamerStatusRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                console.log('Stream data from Firestore:', data);
                setStreamerStatus({
                    // Check both field names for compatibility
                    cameraOff: data.isCameraOff ?? data.cameraOff ?? false,
                    audioMuted: data.isMuted ?? data.audioMuted ?? false
                });
                
                // If camera is not off but we're not seeing video, try to resubscribe to tracks
                if (!(data.isCameraOff ?? data.cameraOff) && remoteParticipant && videoContainerRef.current && !videoContainerRef.current.querySelector('video')) {
                    console.log('Camera is on but no video element found, attempting to resubscribe to tracks');
                    remoteParticipant.tracks.forEach(publication => {
                        if (publication.track && publication.isSubscribed && publication.kind === 'video') {
                            console.log(`Resubscribing to video track: ${publication.trackName}`);
                            handleTrackSubscribed(publication.track);
                        }
                    });
                }
            }
        });

        return () => unsubscribe();
    }, [slug, remoteParticipant, handleTrackSubscribed]);

    useEffect(() => {
        if (!slug || !currentUser) return;
        const unsub = onSnapshot(doc(db, "streams", slug), (snap) => {
            if (!snap.exists()) {
                setVideoStatus("ended");
                return;
            }
            const started = !!snap.data()?.hasStarted;
            setHasStarted(started);
            if (started) {
                setVideoStatus("connecting");
            } else {
                setVideoStatus("waiting");
            }
        });
        return unsub;
    }, [slug, currentUser]);

    useEffect(() => {
        if (!slug || !currentUser) return;
        return listenToMessages(slug, (msgs) => {
            setMessages(msgs.filter((msg) => msg.userName !== "System"));
        });
    }, [slug, currentUser]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim()) {
            await sendChatMessage(slug, currentUser?.username || "User", newMessage.trim());
            setNewMessage("");
        }
    };

    if (!hasHydrated || !currentUser) return null;

    return (
        <div className="h-screen w-screen flex flex-col bg-brandBlack text-brandWhite overflow-hidden">
            <div className="text-center py-2 border-b border-brandOrange">
                <p>
                    Stream Status:{" "}
                    <span className="font-bold">
                        {hasStarted ? "Live" : "Not started yet"}
                    </span>
                </p>
            </div>

            <div className="flex-1 flex flex-col md:flex-row h-[calc(100vh-2.5rem)]">
                {/* Video Section */}
                <div className="flex-1 p-2 md:p-4 h-full">
                    <div className="relative w-full h-full">
                        <div ref={videoContainerRef} className="w-full h-full" />

                        {/* Status Overlays */}
                        {videoStatus === "waiting" && !hasStarted && (
                            <div className="absolute inset-0 bg-black flex flex-col items-center justify-center">
                                <p className="text-brandOrange text-2xl font-semibold">Stream Starting Soon</p>
                            </div>
                        )}

                        {videoStatus === "connecting" && (
                            <div className="absolute inset-0 bg-black flex flex-col items-center justify-center">
                                <p className="text-brandOrange">Connecting...</p>
                            </div>
                        )}

                        {/* Only show offline message if hasStarted is false */}
                        {!hasStarted && (
                            <div className="absolute inset-0 bg-black flex flex-col items-center justify-center">
                                <p className="text-brandOrange">Stream is Offline</p>
                            </div>
                        )}

                        {videoStatus === "ended" && (
                            <div className="absolute inset-0 bg-black flex flex-col items-center justify-center">
                                <p className="text-brandOrange">Stream has Ended</p>
                            </div>
                        )}

                        {/* Show camera/mic status - only when hasStarted is true */}
                        {hasStarted && streamerStatus.cameraOff && (
                            <div className="absolute inset-0 bg-black flex flex-col items-center justify-center">
                                <VideoOff className="w-12 h-12 text-brandOrange mb-2" />
                                <p className="text-brandOrange">Camera is Off</p>
                            </div>
                        )}

                        {hasStarted && streamerStatus.audioMuted && (
                            <div className="absolute top-4 left-4 bg-black/50 px-3 py-1 rounded-full flex items-center gap-2">
                                <MicOff className="w-4 h-4 text-brandOrange" />
                                <span className="text-sm text-brandOrange">Audio Muted</span>
                            </div>
                        )}

                        {/* Audio Controls */}
                        <div className="absolute bottom-4 right-4 flex items-center gap-2">
                            <button
                                onClick={toggleAudioMute}
                                className="p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
                            >
                                {isAudioMuted ? (
                                    <VolumeX className="w-5 h-5 text-brandOrange" />
                                ) : (
                                    <Volume2 className="w-5 h-5 text-brandOrange" />
                                )}
                            </button>
                        </div>
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