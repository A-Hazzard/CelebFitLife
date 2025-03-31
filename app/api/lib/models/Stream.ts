/**
 * Stream model representing the data structure in Firestore
 */
export interface Stream {
  id: string;
  slug: string;
  title: string;
  description: string;
  createdBy: string; // User ID of the streamer
  createdAt: string; // ISO date string
  lastUpdated: string; // ISO date string
  hasStarted: boolean;
  hasEnded: boolean;
  audioMuted: boolean;
  cameraOff: boolean;
  isCameraOff: boolean; // Legacy field
  isMuted: boolean; // Legacy field
  scheduledAt: string; // ISO date string for scheduled time
  startedAt?: string; // ISO date string, optional if not started yet
  endedAt?: string; // ISO date string, optional if not ended yet
  thumbnail?: string; // URL to thumbnail image
}

/**
 * Data transfer object for creating a new stream
 */
export interface StreamCreateDTO {
  title: string;
  description?: string;
  createdBy: string; // User ID of the streamer
  scheduledAt?: string; // ISO date string, optional
}

/**
 * Data transfer object for updating an existing stream
 */
export interface StreamUpdateDTO {
  title?: string;
  description?: string;
  hasStarted?: boolean;
  hasEnded?: boolean;
  audioMuted?: boolean;
  cameraOff?: boolean;
  isCameraOff?: boolean;
  isMuted?: boolean;
  startedAt?: string;
  endedAt?: string;
  scheduledAt?: string;
  thumbnail?: string;
}
