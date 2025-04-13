import {
  LocalVideoTrack,
  RemoteVideoTrack,
  LocalAudioTrack,
  RemoteAudioTrack,
} from "twilio-video";
import React from "react";

/**
 * Types for streaming-related hooks
 */

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
  style?: React.CSSProperties;
};

export type VideoContainerHookResult = {
  videoElements: VideoElement[];
  addVideo: (
    track: VideoTrack,
    options?: {
      style?: React.CSSProperties;
      replaceExisting?: boolean;
    }
  ) => void;
  removeVideo: (trackIdOrSid: string) => void;
  clearVideos: () => void;
  videoContainerRef: React.RefObject<HTMLDivElement | null>;
};

// --- Twilio Track Events Hook Types ---
export type TrackStatusChangeHandler = (
  trackType: "video" | "audio",
  isEnabled: boolean
) => void;

export type NetworkQualityStats = {
  networkQualityLevel?: number;
};

export type QualityChangeHandler = (
  quality: "low" | "medium" | "high",
  result: { success: boolean; track: LocalVideoTrack | null; error?: string }
) => void;

// --- Stream Chat Hook Types ---
export type ChatMessage = {
  id: string;
  createdAt: string;
  sender: string;
  message: string;
  isHost: boolean;
};

export type StreamChatHookResult = {
  messages: ChatMessage[];
  newMessage: string;
  setNewMessage: (message: string) => void;
  sendMessage: () => Promise<void>;
  handleSubmit: (e: React.FormEvent) => void;
  handleKeyPress: (e: React.KeyboardEvent) => void;
  isLoading: boolean;
  error: string | null;
  retryConnection: () => void;
  scrollRef: React.RefObject<HTMLDivElement | null>;
};
 