/**
 * UI-related types for the CelebFitLife streaming platform
 */

import { Timestamp } from "firebase/firestore";

/**
 * Types for dashboard components
 */

export type StreamerStatus = "offline" | "online" | "live";

export type StreamerCardProps = {
  id: string;
  name: string;
  avatarUrl: string;
  status: StreamerStatus;
  streamTitle?: string;
  viewCount?: number;
  slug?: string;
};

/**
 * Types for stream management components
 */

export type ActivityLogType =
  | "ban"
  | "unban"
  | "mute"
  | "unmute"
  | "makeAdmin"
  | "removeAdmin";

export type ActivityLogItem = {
  id: string;
  type: ActivityLogType;
  username: string;
  performedBy: string;
  timestamp: Timestamp;
};

export type PollOption = {
  id: string;
  text: string;
  votes: number;
};

export type Poll = {
  id: string;
  question: string;
  options: PollOption[];
  createdAt: Timestamp;
  expiresAt?: Timestamp;
  endTime?: Timestamp;
  isActive: boolean;
  streamId: string;
  totalVotes?: number;
};

export type HighlightedQuestion = {
  id: string;
  username: string;
  question: string;
  highlighted: boolean;
  timestamp: Timestamp;
  avatarUrl?: string;
};

/**
 * Types for live stream view components
 */

export type StreamQuality =
  | "auto"
  | "1080p"
  | "720p"
  | "480p"
  | "360p"
  | "240p";

export type ChatAction = {
  type: "timeout" | "ban" | "delete" | "highlight" | "makemod";
  userId: string;
  username: string;
  duration?: number; // For timeout
};

export type StreamMetadata = {
  title: string;
  description?: string;
  category?: string;
  tags: string[];
  streamerName: string;
  streamerAvatarUrl?: string;
  viewerCount: number;
  likeCount: number;
  duration: number; // In seconds
  status: "scheduled" | "live" | "ended" | "connecting";
  streamStartTime?: Timestamp;
  scheduledTime?: Timestamp;
};

export type StreamAnalytics = {
  viewerCount: number;
  peakViewerCount: number;
  totalUniqueViewers: number;
  chatCount: number;
  likeCount: number;
  subscriptionCount: number;
  watchTime: number; // In seconds
};

/**
 * Stream modal types
 */

export type CreateStreamFormData = {
  title: string;
  description: string;
  thumbnail: string;
  category: string;
  tags: string[];
  language: string;
  isScheduled: boolean;
  scheduledTime?: Date;
};

export type EditStreamFormData = Partial<CreateStreamFormData>;

/**
 * ActivityItem interface for dashboard activity log
 */
export interface ActivityItem {
  id: string;
  type:
    | ActivityLogType
    | "stream_started"
    | "stream_ended"
    | "subscriber"
    | "comment"
    | "like"
    | "viewer_milestone"
    | "achievement"
    | "error";
  streamId?: string;
  streamTitle?: string;
  timestamp: Timestamp;
  details?: string;
  username: string;
  performedBy: string;
  userImage?: string;
  count?: number;
  read?: boolean;
}

/**
 * Streamer type for displaying streamer cards
 */
export type Streamer = {
  id: string;
  name: string;
  status: "live" | "online" | "offline";
  imageUrl: string;
  streamTitle?: string;
  viewerCount?: number;
};

/**
 * FitnessStreamer type for ExploreStreamersModal component
 */
export type FitnessStreamer = {
  id: string;
  name: string;
  username: string;
  categories: string[];
  followers: number;
  isVerified: boolean;
  isLive: boolean;
  viewerCount: number;
  profileImage: string;
  bio: string;
};
