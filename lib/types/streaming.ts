import {
  RemoteTrack,
  RemoteTrackPublication,
  RemoteParticipant,
  Room,
} from "twilio-video";
import { User } from "./user";
import { Timestamp } from "firebase/firestore";

/**
 * Stream-related type definitions
 */

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

export type StreamStatus =
  | "draft"
  | "scheduled"
  | "live"
  | "ended"
  | "cancelled";

export type Stream = {
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
};

/**
 * Streamer with associated streams from the API
 */
export type StreamerWithStreams = {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
  bio?: string;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
  streams: Stream[];
  // Fields that might be added by the categories lookup
  Category?: string;
  Tags?: string[];
};

/**
 * Enriched streamer with category and tag information
 */
export type EnrichedStreamer = StreamerWithStreams & {
  categoryName: string;
  tagNames: string[];
};

export type StreamWithDetails = Stream & {
  streamer?: User;
};

export type Streamer = User & {
  specialty: string;
  categories?: string[];
  streams?: Stream[];
  followers?: number;
  isLive?: boolean;
  currentStream?: Stream;
};

export type StreamUpdateData = {
  title?: string;
  description?: string;
  thumbnailUrl?: string;
  thumbnail?: string;
  isScheduled?: boolean;
  scheduledFor?: string | null;
  scheduledAt?: string;
  hasStarted?: boolean;
  hasEnded?: boolean;
  audioMuted?: boolean;
  cameraOff?: boolean;
  isCameraOff?: boolean;
  isMuted?: boolean;
  startedAt?: string;
  endedAt?: string;
  status?: StreamStatus;
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

/**
 * Chat message from a stream
 */
export type ChatMessage = {
  id: string;
  userName: string;
  content: string;
  createdAt?: string;
};

/**
 * Base error type for streaming operations
 */
export type StreamingError = {
  name: string;
  message: string;
  stack?: string;
  code?: string | number;
};

/**
 * Type for Twilio-specific errors
 */
export type TwilioStreamingError = StreamingError & {
  code: number;
  twilioError: boolean;
};

/**
 * Type for DOM-related errors that can occur during streaming
 */
export type DOMError = StreamingError & {
  domError: boolean;
  element?: {
    tagName?: string;
    id?: string;
    className?: string;
  };
};

/**
 * Type for media device errors
 */
export type MediaDeviceError = StreamingError & {
  deviceId?: string;
  deviceType?: "audio" | "video";
  deviceError: boolean;
};

/**
 * Type for track-related errors
 */
export type TrackError = StreamingError & {
  trackSid?: string;
  trackType?: "audio" | "video";
  trackError: boolean;
};

/**
 * Type for network-related errors
 */
export type NetworkError = StreamingError & {
  networkError: boolean;
  status?: number;
};

/**
 * Type for Firestore-related errors
 */
export type FirestoreError = StreamingError & {
  firestoreError: boolean;
  path?: string;
  operation?: "read" | "write" | "update" | "delete";
};

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

export function toStreamingError(error: unknown): StreamingErrorType {
  // Implementation retained as is
  if (!error) {
    return {
      name: "UnknownError",
      message: "An unknown error occurred",
    };
  }

  // Return as is if it's already a StreamingError
  if (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    "message" in error
  ) {
    return error as StreamingErrorType;
  }

  // Convert Error object
  if (error instanceof Error) {
    return {
      name: error.name || "Error",
      message: error.message,
      stack: error.stack,
    };
  }

  // Convert string
  if (typeof error === "string") {
    return {
      name: "StringError",
      message: error,
    };
  }

  // Convert any other type
  return {
    name: "UnknownError",
    message: String(error),
  };
}

/**
 * Firestore document structure for a stream
 */
export type StreamDoc = {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  userId: string;
  username: string;
  userPhotoURL: string;
  category: string;
  tags: string[];
  language: string;
  hasStarted: boolean;
  hasEnded: boolean;
  isPrivate: boolean;
  requiresSubscription: boolean;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  slug: string;
  isScheduled: boolean;
  scheduledAt: Timestamp | null;
  startedAt?: string | Timestamp;
  endedAt?: string | Timestamp;
};

export type StreamUpdateObject = {
  [key: string]: unknown; // Using unknown instead of any for better type safety
  updatedAt: Timestamp;
  slug?: string;
  scheduledAt?: Timestamp | null;
};

export type StreamManagerProps = {
  stream: Stream;
  className?: string;
};

export type StreamChatProps = {
  streamId: string;
  isStreamer?: boolean;
  className?: string;
};

export type DeviceOption = {
  deviceId: string;
  label: string;
};

export type DeviceTesterProps = {
  onComplete: () => void;
  className?: string;
};

export type CreateStreamModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export type AudioLevelMeterProps = {
  audioTrack: MediaStreamTrack | null;
  width?: number;
  height?: number;
  className?: string;
};

export type StreamCreateDTO = {
  title: string;
  description?: string;
  thumbnailUrl?: string;
  slug?: string;
  category?: string;
  tags?: string[];
  language?: string;
  scheduledAt?: Date;
};

export type StreamUpdateDTO = {
  title?: string;
  description?: string;
  thumbnailUrl?: string;
  hasStarted?: boolean;
  hasEnded?: boolean;
  status?: "scheduled" | "live" | "ended";
  scheduledAt?: Date;
  category?: string;
  tags?: string[];
  language?: string;
};

// For API services
export type StreamApiUpdateData = {
  title?: string;
  description?: string;
  thumbnail?: string;
  hasStarted?: boolean;
  hasEnded?: boolean;
  scheduledAt?: Date | null;
  audioMuted?: boolean;
  cameraOff?: boolean;
  [key: string]: unknown;
};

export type StreamEventsMap = Record<string, unknown>;

export type TwilioConnectionResult = {
  success: boolean;
  room?: Room;
  error?: string;
  errorCode?: string;
  originalError?: unknown;
};
