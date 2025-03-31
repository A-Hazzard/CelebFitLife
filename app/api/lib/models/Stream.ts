export interface Stream {
  id?: string;
  slug: string;
  createdBy: string; // Typically the user ID
  createdAt: string; // ISO Date string
  title?: string;
  description?: string;
  scheduledAt: string; // ISO Date string
  startedAt?: string; // ISO Date string
  endedAt?: string; // ISO Date string
  hasStarted: boolean;
  hasEnded: boolean;
  audioMuted: boolean;
  cameraOff: boolean;
  isCameraOff: boolean; // Redundant? consider removing if same as cameraOff
  isMuted: boolean; // Redundant? consider removing if same as audioMuted
  currentCameraId?: string;
  currentMicId?: string;
  lastUpdated?: string; // ISO Date string
}

export interface StreamCreateDTO {
  title?: string;
  description?: string;
  scheduledAt: string; // ISO Date string
  createdBy: string; // User ID
}

export interface StreamUpdateDTO {
  title?: string;
  description?: string;
  scheduledAt?: string; // ISO Date string
  hasStarted?: boolean;
  hasEnded?: boolean;
  audioMuted?: boolean;
  cameraOff?: boolean;
  // Avoid redundant fields unless they serve different purposes
  // isCameraOff?: boolean;
  // isMuted?: boolean;
  currentCameraId?: string;
  currentMicId?: string;
  startedAt?: string; // ISO Date string
  endedAt?: string; // ISO Date string
}
