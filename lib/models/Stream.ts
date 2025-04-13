import { Timestamp } from "firebase/firestore";

export type Stream = {
  id: string;
  slug: string;
  title: string;
  description?: string;
  hasStarted: boolean;
  hasEnded: boolean;
  createdBy: string;
  createdAt: Timestamp;
  startedAt?: Timestamp;
  endedAt?: Timestamp;
  lastUpdated: Timestamp;
  thumbnail?: string;
  audioMuted?: boolean;
  cameraOff?: boolean;
  scheduledAt?: Timestamp;
  status?: "scheduled" | "live" | "ended";
  category?: string;
  tags?: string[];
  language?: string;

  // Streamer profile data
  streamerName?: string;
  streamerPhotoUrl?: string;

  // Stats
  likes?: number;
  comments?: number;
  uniqueViewers?: number;
  maxConcurrentViewers?: number;
  totalWatchTime?: number;
};
