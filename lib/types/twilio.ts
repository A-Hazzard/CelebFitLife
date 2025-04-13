import { LocalVideoTrack, LocalAudioTrack } from "twilio-video";

/**
 * Types for Twilio video utilities
 */

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

// API request/response types
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

// Twilio service types
export type CacheEntry = {
  token: string;
  expiresAt: number;
};
