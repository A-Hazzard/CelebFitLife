import {
  RemoteTrack,
  RemoteTrackPublication,
  RemoteParticipant,
  Room,
  LocalVideoTrack,
  RemoteVideoTrack,
  LocalAudioTrack,
  RemoteAudioTrack,
} from "twilio-video";
import { User } from "./user";
import { Timestamp } from "firebase/firestore";
import {
  MutableRefObject,
  CSSProperties,
  RefObject,
  FormEvent,
  KeyboardEvent,
} from "react";

/**
 * Consolidated type definitions for streaming functionality
 * Includes types from:
 * - streaming-components.ts
 * - streaming.ts
 * - streaming-hooks.ts
 * - twilio.ts
 */

// ---------- COMPONENT PROP TYPES ----------

// Stream Chat component types
export type StreamChatProps = {
  streamId: string;
  className?: string;
  onUserClick?: (username: string, userId: string) => void;
};

// Device Tester component types
export type DeviceTesterProps = {
  onComplete: () => void;
  className?: string;
  // Props for lifted state from useMediaDevices
  cameraDevices: MediaDeviceInfo[];
  micDevices: MediaDeviceInfo[];
  speakerDevices: MediaDeviceInfo[];
  currentCameraId: string;
  currentMicId: string;
  currentSpeakerId: string;
  setCurrentCameraId: React.Dispatch<React.SetStateAction<string>>;
  setCurrentMicId: React.Dispatch<React.SetStateAction<string>>;
  setCurrentSpeakerId: React.Dispatch<React.SetStateAction<string>>;
  loadingDevices: boolean;
  mediaDeviceError: string | null;
};

export type DeviceOption = {
  deviceId: string;
  label: string;
};

// StreamManager component types
export type StreamManagerProps = {
  stream: Stream;
  className?: string;
};

// StreamManager ref type with exposed methods
export type StreamManagerHandles = {
  startStream: () => Promise<void>;
  endStream: () => void;
  toggleMic: () => void;
  toggleVideo: () => void;
};

// Countdown component types
export type CountdownProps = {
  scheduledTime: string;
  onComplete?: () => void;
  className?: string;
};

// Stream status overlay props
export type StreamStatusOverlayProps = {
  status: "waiting" | "connecting" | "active" | "offline" | "ended" | "error";
  error?: string;
  isRetrying?: boolean;
  onRetry?: () => void;
  connectionAttempts?: number;
  maxConnectionAttempts?: number;
  thumbnail?: string;
  streamTitle?: string;
};

// Video container props
export type VideoContainerProps = {
  containerRef: MutableRefObject<HTMLDivElement | null>;
  room: Room | null;
  isActive: boolean;
};

// ---------- STREAM DATA TYPES ----------

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
  scheduledAt?: Timestamp | null;
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

export type StreamDoc = Omit<Stream, "id"> & {
  id?: string;
  username?: string;
  userPhotoURL?: string;
  language?: string;
  isPrivate?: boolean;
  requiresSubscription?: boolean;
  commentCount?: number;
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
  thumbnail?: string;
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
  scheduledFor?: string | Date | null;
  scheduledAt?: string | Date | null;
  hasStarted?: boolean;
  hasEnded?: boolean;
  audioMuted?: boolean;
  cameraOff?: boolean;
  isCameraOff?: boolean;
  isMuted?: boolean;
  startedAt?: string;
  endedAt?: string;
  status?: StreamStatus;
  category?: string;
  tags?: string[];
  language?: string;
  isPrivate?: boolean;
  requiresSubscription?: boolean;
};

/**
 * Object used for updating stream properties in Firestore
 * This extends StreamUpdateData with Firestore-specific fields
 */
export type StreamUpdateObject = Omit<StreamUpdateData, "scheduledAt"> & {
  updatedAt?: Timestamp;
  scheduledAt?: Timestamp | Date | null;
  slug?: string;
};

// ---------- CHAT TYPES ----------

/**
 * Chat message from a stream
 */
export type ChatMessage = {
  id: string;
  createdAt: string;
  sender: string;
  message: string;
  isHost?: boolean;
  // These are now optional since they're not used in useStreamChat.ts
  userName?: string;
  content?: string;
};

// ---------- ERROR TYPES ----------

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
 * This type is used for converting Twilio's error instances (from twilio-video package)
 * to a consistent format in our error handling system.
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
 * Used to classify errors related to network connectivity issues
 * Extends the base StreamingError with networkError flag and optional status code
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
 * Type for unknown errors
 */
export type UnknownError = StreamingError & {
  unknownError: boolean;
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
  | UnknownError;

// ---------- TWILIO CONNECTION TYPES ----------

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

export type TwilioConnectionResult = {
  success: boolean;
  room?: Room | null;
  error?: StreamingErrorType | string;
  errorCode?: string;
  originalError?: unknown;
};

// ---------- TWILIO VIDEO TYPES ----------

export type VideoTrackOptions = {
  deviceId?: string;
  width?: {
    min?: number;
    ideal?: number;
    max?: number;
  };
  height?: {
    min?: number;
    ideal?: number;
    max?: number;
  };
  frameRate?: {
    min?: number;
    ideal?: number;
    max?: number;
  };
};

export type AudioTrackOptions = {
  deviceId?: string;
  echoCancellation?: boolean;
  noiseSuppression?: boolean;
  autoGainControl?: boolean;
};

export type RoomConnectOptions = {
  videoTrack?: LocalVideoTrack;
  audioTrack?: LocalAudioTrack;
  roomName: string;
  networkQuality?: {
    local?: number;
    remote?: number;
  };
  dominantSpeaker?: boolean;
};

export type StreamerTokenOptions = {
  roomName: string;
  identity: string;
  ttl?: number;
  metadata?: Record<string, unknown>;
};

// ---------- API REQUEST/RESPONSE TYPES ----------

export type TokenRequestBody = {
  roomName: string;
  identity: string;
};

export type TokenResponseSuccess = {
  success: boolean;
  token: string;
  identity: string;
  roomName: string;
  expiration: number;
  requestId: string;
  latency: number;
};

export type TokenResponseError = {
  success: boolean;
  error: string;
  details?: string;
  requestId: string;
  latency?: number;
};

/**
 * Data transfer object for creating a stream through the API
 */
export type ApiStreamCreateDTO = {
  title: string;
  description?: string;
  scheduledAt?: string;
  createdBy: string;
  thumbnail?: string;
};

/**
 * Data transfer object for updating a stream through the API
 */
export type ApiStreamUpdateDTO = {
  title?: string;
  description?: string;
  scheduledAt?: string;
  thumbnail?: string;
  hasStarted?: boolean;
  hasEnded?: boolean;
  audioMuted?: boolean;
  cameraOff?: boolean;
};

/**
 * Extends ApiStreamUpdateDTO with additional fields for internal API use
 */
export type StreamApiUpdateData = Omit<ApiStreamUpdateDTO, "scheduledAt"> & {
  lastUpdated?: string;
  scheduledAt?: string | Date;
};

// Twilio service types
export type CacheEntry = {
  token: string;
  expiresAt: number;
};

// ---------- HOOK TYPES ----------

// --- Video Container Hook Types ---
export type VideoTrack = LocalVideoTrack | RemoteVideoTrack;
export type AudioTrack = LocalAudioTrack | RemoteAudioTrack;

export type TrackWithSid = {
  sid?: string;
  id?: string;
};

export type TrackWithId = {
  id: string;
};

export type VideoElement = {
  id: string;
  track: VideoTrack;
  style?: CSSProperties;
};

export type VideoContainerHookResult = {
  videoElements: VideoElement[];
  addVideo: (
    track: VideoTrack,
    options?: {
      style?: CSSProperties;
      replaceExisting?: boolean;
    }
  ) => void;
  removeVideo: (trackIdOrSid: string) => void;
  clearVideos: () => void;
  videoContainerRef: RefObject<HTMLDivElement | null>;
};

// --- Twilio Track Events Hook Types ---
export type TrackStatusChangeHandler = (
  trackType: "video" | "audio",
  isEnabled: boolean
) => void;

export type QualityChangeHandler = (
  quality: "low" | "medium" | "high",
  result: { success: boolean; track: LocalVideoTrack | null; error?: string }
) => void;

// --- Stream Chat Hook Types ---
export type StreamChatHookResult = {
  messages: ChatMessage[];
  newMessage: string;
  setNewMessage: (message: string) => void;
  sendMessage: () => Promise<void>;
  handleSubmit: (e: FormEvent) => void;
  handleKeyPress: (e: KeyboardEvent) => void;
  isLoading: boolean;
  error: string | null;
  retryConnection: () => void;
  scrollRef: RefObject<HTMLDivElement | null>;
};

// The toStreamingError function has been moved to lib/utils/errorHandler.ts
