/**
 * UI-related types for the CelebFitLife streaming platform
 */

import { Timestamp } from "firebase/firestore";
import React from "react";
// Remove unused VariantProps import
// import { VariantProps } from "class-variance-authority";
import type {
  BadgeVariantProps,
  ButtonVariantProps,
} from "@/components/ui/types";

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
 * ActivityItem type for dashboard activity log
 */
export type ActivityItem = {
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
};

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

// UI Component Props Types
export type TimePickerDialogProps = {
  date: Date;
  setDate: (date: Date) => void;
};

export type StepProgressBarProps = {
  currentStep: number;
  totalSteps: number;
  stepNames?: string[];
};

export type SpinnerProps = React.HTMLAttributes<HTMLDivElement> & {
  size?: "sm" | "md" | "lg";
  color?: "primary" | "white";
};

export type ShareButtonProps = {
  streamLink: string;
};

export type PageContainerProps = {
  title?: string;
  description?: string;
  children: React.ReactNode;
};

// Badge component
export type BadgeProps = React.HTMLAttributes<HTMLDivElement> &
  BadgeVariantProps;

// Button component
export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  ButtonVariantProps & {
    asChild?: boolean;
  };

// AudioLevelMeter
export type AudioLevelMeterProps = {
  level: number; // 0-100
  isActive: boolean;
  type: "microphone" | "speaker";
  className?: string;
};

// SlickArrow Props (from streamer.ts)
export type SlickArrowProps = {
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  direction: "prev" | "next";
};

// Modals types
export type SettingsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export type StreamerGuideModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export type CreateStreamModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

// Notifications Dropdown
export type Notification = {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: "follow" | "comment" | "like" | "schedule" | "system";
};

// Upcoming Streams Calendar
export type UpcomingStream = {
  id: string;
  title: string;
  date: Date;
  category: string;
  thumbnailUrl: string;
  duration: number; // in minutes
  isSubscriberOnly: boolean;
  description?: string;
};

// Remove the previous declarations and use imported types instead
// export type BadgeVariants = typeof badgeVariants;
// export type ButtonVariants = typeof buttonVariants;
