import { LocalVideoTrack, LocalAudioTrack } from "twilio-video";

/**
 * Types for Twilio video utilities
 */

export interface VideoTrackOptions {
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
}

export interface AudioTrackOptions {
  deviceId?: string;
  echoCancellation?: boolean;
  noiseSuppression?: boolean;
  autoGainControl?: boolean;
}

export interface RoomConnectOptions {
  videoTrack?: LocalVideoTrack;
  audioTrack?: LocalAudioTrack;
  roomName: string;
  networkQuality?: {
    local?: number;
    remote?: number;
  };
  dominantSpeaker?: boolean;
}

export interface StreamerTokenOptions {
  roomName: string;
  identity: string;
  ttl?: number;
  metadata?: Record<string, unknown>;
}
