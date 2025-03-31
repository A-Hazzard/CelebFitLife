import {
  RemoteTrack,
  RemoteTrackPublication,
  RemoteParticipant,
} from "twilio-video";
import { User } from "./user";
import { Timestamp } from "firebase/firestore";

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
export type StreamStatus =
  | "draft"
  | "scheduled"
  | "live"
  | "ended"
  | "cancelled";

export interface Stream {
  id: string;
  title: string;
  description?: string;
  slug: string;
  status?: StreamStatus;
  userId?: string;
  createdBy?: string;
  isScheduled?: boolean;
  scheduledFor?: string | null;
  scheduledAt?: Timestamp;
  thumbnailUrl?: string;
  thumbnail?: string;
  viewCount?: number;
  likeCount?: number;
  roomName?: string;
  deviceStatus?: {
    currentCameraId?: string;
    currentMicId?: string;
  };
  // Firestore timestamps
  createdAt: string | Timestamp;
  updatedAt?: string | Timestamp;
  startedAt?: string | Timestamp;
  endedAt?: string | Timestamp;
  lastUpdated?: Timestamp;

  // Stream state properties used by StreamManager
  hasStarted: boolean;
  hasEnded: boolean;
  audioMuted?: boolean;
  cameraOff?: boolean;
  category?: string;
  tags?: string[];
}

export interface StreamWithDetails extends Stream {
  streamer?: User;
}

export interface Streamer extends User {
  specialty: string;
  categories?: string[];
  streams?: Stream[];
  followers?: number;
  isLive?: boolean;
  currentStream?: Stream;
}

export interface StreamUpdateData {
  title?: string;
  description?: string;
  thumbnailUrl?: string;
  isScheduled?: boolean;
  scheduledFor?: string | null;
  status?: StreamStatus;
}

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

/**
 * Chat message from a stream
 */
export interface ChatMessage {
  id: string;
  userName: string;
  content: string;
  createdAt?: string;
}

/**
 * Base error interface for streaming operations
 */
export interface StreamingError {
  name: string;
  message: string;
  stack?: string;
  code?: string | number;
}

/**
 * Type for Twilio-specific errors
 */
export interface TwilioStreamingError extends StreamingError {
  code: number;
  twilioError: boolean;
}

/**
 * Type for DOM-related errors that can occur during streaming
 */
export interface DOMError extends StreamingError {
  domError: boolean;
  element?: {
    tagName?: string;
    id?: string;
    className?: string;
  };
}

/**
 * Type for media device errors
 */
export interface MediaDeviceError extends StreamingError {
  deviceId?: string;
  deviceType?: "audio" | "video";
  deviceError: boolean;
}

/**
 * Type for track-related errors
 */
export interface TrackError extends StreamingError {
  trackSid?: string;
  trackType?: "audio" | "video";
  trackError: boolean;
}

/**
 * Type for network-related errors
 */
export interface NetworkError extends StreamingError {
  networkError: boolean;
  status?: number;
}

/**
 * Type for Firestore-related errors
 */
export interface FirestoreError extends StreamingError {
  firestoreError: boolean;
  path?: string;
  operation?: "read" | "write" | "update" | "delete";
}

/**
 * Union type of all streaming-related errors
 */
export type StreamingErrorType =
  | TwilioStreamingError
  | DOMError
  | MediaDeviceError
  | TrackError
  | NetworkError
  | FirestoreError
  | StreamingError;

/**
 * Function to safely convert an unknown error to a typed StreamingError
 */
export function toStreamingError(error: unknown): StreamingErrorType {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  if (typeof error === "string") {
    return {
      name: "StringError",
      message: error,
    };
  }

  return {
    name: "UnknownError",
    message: String(error),
  };
}
