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
