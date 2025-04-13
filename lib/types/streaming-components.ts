/**
 * Types for streaming-specific components
 */

import { Stream } from "./streaming";
import { MutableRefObject } from "react";
import { Room } from "twilio-video";

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
};

export type DeviceOption = {
  deviceId: string;
  label: string;
};

// StreamManager component types
export interface StreamManagerProps {
  stream: Stream;
  className?: string;
}

// StreamManager ref type with exposed methods
export interface StreamManagerHandles {
  startStream: () => Promise<void>;
  endStream: () => void;
  toggleMic: () => void;
  toggleVideo: () => void;
}

// Countdown component types
export interface CountdownProps {
  scheduledTime: string;
  onComplete?: () => void;
  className?: string;
}

// Stream status overlay props
export interface StreamStatusOverlayProps {
  status: "waiting" | "connecting" | "active" | "offline" | "ended" | "error";
  error?: string | null;
  isRetrying?: boolean;
  onRetry?: () => void;
  connectionAttempts?: number;
  maxConnectionAttempts?: number;
  thumbnail?: string;
  streamTitle?: string;
}

// Video container props
export interface VideoContainerProps {
  containerRef: MutableRefObject<HTMLDivElement | null>;
  room: Room | null;
  isActive: boolean;
}
