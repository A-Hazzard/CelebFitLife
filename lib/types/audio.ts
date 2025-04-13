import { LocalAudioTrack, RemoteAudioTrack } from "twilio-video";

/**
 * Types for audio-related utilities and hooks
 */

// Audio source type
export type AudioSourceType = "microphone" | "speaker";

// Audio track type for Twilio compatibility
export type AudioTrack = {
  detach: () => HTMLMediaElement[];
  // Add other properties as needed
};

export type AudioLevelMeterHookResult = {
  level: number;
  isAnalyzing: boolean;
  startAnalyzing: () => void;
  stopAnalyzing: () => void;
  handleAudioTrack: (track: AudioTrack) => HTMLMediaElement[];
};

// Audio tracks hook types
export type TwilioAudioTrack = LocalAudioTrack | RemoteAudioTrack;

export type AudioElement = {
  id: string;
  track: TwilioAudioTrack;
  muted: boolean;
};

export type AudioTracksHookResult = {
  audioElements: AudioElement[];
  isGloballyMuted: boolean;
  addAudio: (track: TwilioAudioTrack, options?: { muted?: boolean }) => string;
  removeAudio: (trackIdOrSid: string) => void;
  toggleTrackMute: (trackIdOrSid: string) => void;
  toggleGlobalMute: () => void;
  clearAudios: () => void;
};

export type AudioTrackRendererProps = {
  track: TwilioAudioTrack;
  muted?: boolean;
};

// Add missing types that were imported in useAudioTracks.tsx
export type AudioDeviceInfo = {
  deviceId: string;
  label: string;
  kind: "audioinput" | "audiooutput";
};

export type AudioTrackOptions = {
  deviceId?: string;
  muted?: boolean;
  name?: string;
};
