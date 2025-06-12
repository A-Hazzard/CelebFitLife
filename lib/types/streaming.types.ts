// No longer using Twilio or Firebase types directly in this file

/**
 * STREAMING TYPES
 *
 * This file contains all types related to streaming functionality using Mux Video.
 * It includes types for live streams, playback, error handling, and UI components.
 *
 * Related files:
 * - lib/services/ClientMuxService.ts
 * - components/streaming/StreamManager.tsx
 * - components/streaming/VideoContainer.tsx
 * - lib/utils/mux.ts
 * - lib/helpers/streaming.ts
 */

// ---------- CORE STREAMING TYPES ----------

/**
 * Basic stream information stored in the database
 */
export type StreamInfo = {
  id: string;
  title: string;
  description?: string;
  streamerId: string;
  streamerName?: string;
  slug: string;
  isLive: boolean;
  hasStarted: boolean;
  hasEnded?: boolean; // Optional since it's only set when stream actually ends
  isPrivate: boolean;
  requiresSubscription: boolean;
  language: string;
  commentCount: number;
  likeCount: number;
  thumbnail: string;
  userId: string;
  userPhotoURL: string;
  username: string;
  scheduledAt: string | null;
  tags: string[];
  category: string;
  viewerCount: number;
  createdAt: string;
  updatedAt: string;
};

/**
 * Extended stream information including Mux data
 */
export type StreamData = StreamInfo & {
  muxStreamId?: string;
  muxPlaybackId?: string;
  muxStreamKey?: string;
  muxStatus?: "idle" | "active" | "disabled";
};

/**
 * Stream configuration options
 */
export type StreamConfig = {
  quality?: "basic" | "plus" | "max";
  resolution?: string;
  bitrate?: number;
  enableRecording?: boolean;
  playbackPolicy?: "public" | "signed";
};

// ---------- MUX LIVE STREAM TYPES ----------

/**
 * Mux Live Stream data structure
 */
export type MuxLiveStream = {
  id: string;
  playbackId: string;
  streamKey: string;
  status: "idle" | "active" | "disabled";
  createdAt: string;
};

/**
 * Mux Asset (recording) data structure
 */
export type MuxAsset = {
  id: string;
  playbackId: string;
  status: string;
  duration?: number;
};

/**
 * Mux playback options
 */
export type MuxPlaybackOptions = {
  playbackId: string;
  signed?: boolean;
  signedUrl?: string;
  autoplay?: boolean;
  muted?: boolean;
  controls?: boolean;
  accentColor?: string;
};

// ---------- ERROR HANDLING TYPES ----------

/**
 * Base streaming error type
 * Used as foundation for all streaming-related errors
 */
export type StreamingError = {
  code: string;
  message: string;
  isRecoverable: boolean;
  context?: Record<string, unknown>;
};

/**
 * Type for Mux-specific errors
 */
export type MuxStreamingError = StreamingError & {
  muxError: boolean;
  muxErrorCode?: string;
};

/**
 * Union type for all possible streaming errors
 */
export type StreamingErrorUnion =
  | StreamingError
  | MuxStreamingError
  | { error: string; details?: string };

// ---------- API RESPONSE TYPES ----------

/**
 * Request body for creating live streams
 */
export type CreateStreamRequestBody = {
  title: string;
  description?: string;
  category?: string;
  tags?: string[];
  scheduledAt?: string | null;
  isPrivate?: boolean;
  requiresSubscription?: boolean;
  language?: string;
  thumbnail?: string;
  userId?: string;
  userPhotoURL?: string;
  username?: string;
};

/**
 * Response for successful stream creation
 */
export type CreateStreamResponseSuccess = {
  success: true;
  liveStream: MuxLiveStream;
  requestId: string;
  latency: number;
};

/**
 * Response for stream creation errors
 */
export type CreateStreamResponseError = {
  success: false;
  error: string;
  details?: string;
  requestId: string;
  latency?: number;
};

/**
 * Cache entry for tokens or stream data
 */
export type CacheEntry = {
  token?: string;
  data?: unknown;
  expiresAt: number;
};

// ---------- COMPONENT PROPS TYPES ----------

/**
 * Props for StreamManager component
 */
export type StreamManagerProps = {
  streamData: StreamData;
  onStreamStart?: (streamId: string) => void;
  onStreamEnd?: (streamId: string) => void;
  onError?: (error: StreamingErrorUnion) => void;
  className?: string;
};

/**
 * Ref handle for StreamManager component
 */
export type StreamManagerHandles = {
  startStream: () => Promise<void>;
  endStream: () => Promise<void>;
  toggleMic: () => void;
  toggleCamera: () => void;
  isStreaming: () => boolean;
};

/**
 * Props for VideoContainer component (viewer)
 */
export type VideoContainerProps = {
  playbackId: string;
  isLive?: boolean;
  autoplay?: boolean;
  muted?: boolean;
  controls?: boolean;
  accentColor?: string;
  onError?: (error: StreamingErrorUnion) => void;
  className?: string;
};

// ---------- STREAMING STATE TYPES ----------

/**
 * Overall streaming state for the application
 */
export type StreamingState = {
  isConnected: boolean;
  isStreaming: boolean;
  isMuted: boolean;
  isCameraOff: boolean;
  streamData?: StreamData;
  error?: StreamingErrorUnion;
  viewerCount: number;
  connectionQuality?: "excellent" | "good" | "fair" | "poor";
};

/**
 * Stream statistics and metrics
 */
export type StreamStats = {
  duration: number;
  viewerCount: number;
  peakViewers: number;
  bytesTransferred: number;
  quality: "excellent" | "good" | "fair" | "poor";
  uptime: number;
};

// ---------- HOOK TYPES ----------

/**
 * Return type for streaming hooks
 */
export type UseStreamingReturn = {
  streamingState: StreamingState;
  startStream: (config?: StreamConfig) => Promise<void>;
  endStream: () => Promise<void>;
  toggleMic: () => void;
  toggleCamera: () => void;
  reconnect: () => Promise<void>;
};

/**
 * Return type for viewer hooks
 */
export type UseViewerReturn = {
  isConnected: boolean;
  isLoading: boolean;
  error?: StreamingErrorUnion;
  streamData?: StreamData;
  viewerCount: number;
  connect: (playbackId: string) => Promise<void>;
  disconnect: () => void;
};

// ---------- DEVICE AND MEDIA TYPES ----------

/**
 * Available media devices
 */
export type MediaDevices = {
  cameras: MediaDeviceInfo[];
  microphones: MediaDeviceInfo[];
  speakers: MediaDeviceInfo[];
  selectedCamera?: string;
  selectedMicrophone?: string;
  selectedSpeaker?: string;
};

/**
 * Media constraints for streaming
 */
export type MediaConstraints = {
  video: {
    width?: number;
    height?: number;
    frameRate?: number;
    deviceId?: string;
  };
  audio: {
    deviceId?: string;
    echoCancellation?: boolean;
    noiseSuppression?: boolean;
    autoGainControl?: boolean;
  };
};

// ---------- CHAT TYPES ----------

/**
 * Chat message structure for stream chat
 */
export type ChatMessage = {
  id: string;
  userId: string;
  username: string;
  content: string;
  timestamp: string | number | Date;
  isHost?: boolean;
};

// ---------- UTILITY TYPES ----------

/**
 * Generic API response wrapper
 */
export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  requestId?: string;
  latency?: number;
};

/**
 * Streaming event types
 */
export type StreamingEventType =
  | "stream-started"
  | "stream-ended"
  | "viewer-joined"
  | "viewer-left"
  | "connection-quality-changed"
  | "error-occurred";

/**
 * Streaming event data
 */
export type StreamingEvent = {
  type: StreamingEventType;
  data?: unknown;
  timestamp: number;
};

// Legacy type aliases for backward compatibility (to be removed)
export type TokenRequestBody = CreateStreamRequestBody;
export type TokenResponseSuccess = CreateStreamResponseSuccess;
export type TokenResponseError = CreateStreamResponseError;

export type StreamerWithStreams = {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
  bio?: string;
  category?: string;
  tags?: string[];
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  thumbnail?: string;
  Category?: string;
  Tags?: string[];
  streams: StreamData[];
};

/**
 * Enriched streamer with resolved category and tag names
 */
export type EnrichedStreamer = StreamerWithStreams & {
  categoryName: string;
  tagNames: string[];
};
