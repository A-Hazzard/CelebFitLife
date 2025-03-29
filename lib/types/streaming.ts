import {
  RemoteTrack,
  RemoteTrackPublication,
  RemoteParticipant,
} from "twilio-video";

// Dashboard types
export type StreamingProfileData = {
  streamName: string;
  category: string;
  description: string;
  tags: string[];
  socialLinks: {
    instagram: string;
    youtube: string;
    twitter: string;
  };
};

// Streaming page types
export type Streamer = {
  name: string;
  quote: string;
  tags: string[];
  followers: number;
  specialty: string;
  imageUrl: string;
};

// Stream data for creation
export type StreamData = {
  title: string;
  description: string;
  thumbnail: string;
  slug: string;
  createdAt: string;
  createdBy: string;
  hasStarted: boolean;
  hasEnded: boolean;
  scheduledAt: string | null;
  audioMuted: boolean;
  cameraOff: boolean;
  currentCameraId?: string;
  currentMicId?: string;
};

// Type for Twilio network quality stats
export type NetworkQualityStats = {
  networkQualityLevel?: number;
};

// Type for Twilio event handler refs
export type HandlerRefs = {
  trackSubscribed: (track: RemoteTrack) => void;
  trackUnsubscribed: (track: RemoteTrack) => void;
  trackPublished: (publication: RemoteTrackPublication) => void;
  trackUnpublished: (publication: RemoteTrackPublication) => void;
  participantConnected: (participant: RemoteParticipant) => void;
  participantDisconnected: (participant: RemoteParticipant) => void;
};

// Utility type for objects with removeAllListeners method
export type WithListeners = {
  removeAllListeners: () => void;
};

// Utility type for objects with detach method
export type WithDetach = {
  detach: () => HTMLElement[];
};
