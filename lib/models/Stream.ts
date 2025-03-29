export interface Stream {
  id?: string;
  slug: string;
  createdBy: string;
  createdAt: string;
  title?: string;
  description?: string;
  scheduledAt: string;
  startedAt?: string;
  endedAt?: string;
  hasStarted: boolean;
  hasEnded: boolean;
  audioMuted: boolean;
  cameraOff: boolean;
  isCameraOff: boolean;
  isMuted: boolean;
  currentCameraId?: string;
  currentMicId?: string;
  lastUpdated?: string;
}

export interface StreamCreateDTO {
  title?: string;
  description?: string;
  scheduledAt: string;
  createdBy: string;
}

export interface StreamUpdateDTO {
  title?: string;
  description?: string;
  scheduledAt?: string;
  hasStarted?: boolean;
  hasEnded?: boolean;
  audioMuted?: boolean;
  cameraOff?: boolean;
  isCameraOff?: boolean;
  isMuted?: boolean;
  currentCameraId?: string;
  currentMicId?: string;
  startedAt?: string;
  endedAt?: string;
}
