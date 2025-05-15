// Streaming and viewer types for Twilio/Firestore
import type { Timestamp } from "firebase/firestore";
import type {
  LocalParticipant,
  LocalVideoTrack,
  CreateLocalTrackOptions,
} from "twilio-video";

export type StreamStatus =
  | "draft"
  | "scheduled"
  | "live"
  | "ended"
  | "cancelled";

// Twilio Track Types
export type VideoTrackOptions = CreateLocalTrackOptions & {
  deviceId?: string;
  facingMode?: "user" | "environment";
  frameRate?: number;
  height?: number;
  width?: number;
};

export type AudioTrackOptions = CreateLocalTrackOptions & {
  deviceId?: string;
  noiseCancellation?: boolean;
  echoCancellation?: boolean;
};

export type TrackStatusChangeHandler = (
  kind: "audio" | "video",
  isEnabled: boolean
) => void;

export interface NetworkQualityStats extends LocalParticipant {
  networkQualityLevel: number | null;
}

export type VideoQuality = "low" | "medium" | "high";

export type QualityChangeHandler = (
  quality: VideoQuality,
  result: { success: boolean; track: LocalVideoTrack | null }
) => void;

// Base error type
export interface BaseError {
  name: string;
  message: string;
  stack?: string;
}

// Specific error types
export interface UnknownError extends BaseError {
  unknownError: true;
}

export interface TwilioStreamingError extends BaseError {
  twilioError: true;
  code: number;
}

export interface NetworkError extends UnknownError {
  networkError: true;
}

export interface DeviceError extends BaseError {
  deviceError: true;
  deviceName?: string;
}

export interface FirestoreError extends BaseError {
  firestoreError: true;
  code?: string;
}

export interface TrackError extends BaseError {
  trackError: true;
  trackName?: string;
}

export interface DOMError extends BaseError {
  domError: true;
  domElement?: string;
}

// Union type for all streaming errors
export type StreamingErrorType =
  | UnknownError
  | TwilioStreamingError
  | NetworkError
  | DeviceError
  | FirestoreError
  | TrackError
  | DOMError;

export type Stream = {
  id: string;
  slug: string;
  title: string;
  description?: string;
  category?: string;
  tags?: string[];
  status?: StreamStatus;
  startedAt?: string | Timestamp;
  endedAt?: string | Timestamp;
  scheduledAt?: string | number | Date | Timestamp;
  createdAt?: string | Timestamp;
  hasStarted: boolean;
  hasEnded: boolean;
  audioMuted?: boolean;
  cameraOff?: boolean;
  thumbnailUrl?: string;
  viewCount?: number;
  userId?: string;
};

export type ApiStreamCreateDTO = {
  createdBy: string;
  scheduledAt?: string | number | Date;
  [key: string]: unknown;
};

export type ApiStreamUpdateDTO = {
  scheduledAt?: string | number | Date;
  [key: string]: unknown;
};

export type StreamApiUpdateData = {
  scheduledAt?: string | number | Date;
  [key: string]: unknown;
};

export type StreamUpdateData = {
  title?: string;
  description?: string;
  thumbnailUrl?: string;
  scheduledAt?: string | Date;
  category?: string;
  tags?: string[];
  status?: StreamStatus;
};

export type StreamWithDetails = Stream & {
  streamerName?: string;
  streamerAvatar?: string;
  scheduledFor?: string;
};

/**
 * Streamer with associated streams from the API
 */
export type StreamerWithStreams = {
  id: string;
  name: string;
  username?: string;
  avatarUrl?: string;
  bio?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  thumbnail?: string;
  Category?: string;
  Tags?: string[];
  streams?: Stream[];
  [key: string]: unknown;
};

export type TokenRequestBody = {
  roomName: string;
  identity: string;
  [key: string]: unknown;
};

export type TokenResponseSuccess = { token: string; [key: string]: unknown };
export type TokenResponseError = { error: string; [key: string]: unknown };
export type StreamDoc = Stream;

export type StreamManagerProps = {
  stream: Stream;
  className?: string;
};

export type DeviceTesterProps = {
  onComplete: () => void;
  className?: string;
  cameraDevices: MediaDeviceInfo[];
  micDevices: MediaDeviceInfo[];
  speakerDevices: MediaDeviceInfo[];
  currentCameraId: string | undefined;
  currentMicId: string | undefined;
  currentSpeakerId: string | undefined;
  setCurrentCameraId: (id: string) => void;
  setCurrentMicId: (id: string) => void;
  setCurrentSpeakerId: (id: string) => void;
  loadingDevices: boolean;
  mediaDeviceError: string | null;
};

export type StreamChatProps = {
  streamId: string;
  className?: string;
  onUserClick?: (username: string, userId: string) => void;
};

export type ChatMessage = {
  id: string;
  message: string;
  sender: string;
  createdAt: string;
  isHost?: boolean;
};

export type EnrichedStreamer = {
  id: string;
  name?: string;
  username?: string;
  avatarUrl?: string;
  bio?: string;
  categoryName?: string;
  tagNames?: string[];
  streams?: {
    id: string;
    title: string;
    thumbnail: string;
    hasEnded: boolean;
  }[];
};

export type Streamer = {
  id: string;
  name: string;
  avatarUrl?: string;
  username?: string;
  bio?: string;
  categoryName?: string;
  tagNames?: string[];
  streams?: Stream[];
};

export type StreamChatHookResult = {
  messages: ChatMessage[];
  newMessage: string;
  setNewMessage: (message: string) => void;
  handleSubmit: (event: React.FormEvent) => void;
  handleKeyPress: (event: React.KeyboardEvent) => void;
  isLoading: boolean;
  error: string | null;
  retryConnection: () => void;
  sendMessage: (message: string) => Promise<void>;
  scrollRef: React.RefObject<HTMLDivElement | null>;
};
