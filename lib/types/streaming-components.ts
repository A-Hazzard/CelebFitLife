/**
 * Types for streaming-specific components
 */

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
