/**
 * Types for dashboard components
 */

import { ReactNode } from "react";

/**
 * ExportData component types
 */
export type ExportFormat = "csv" | "json";

export type StreamData = {
  id: string;
  title: string;
  date: Date;
  duration: number;
  viewers: number;
  likes: number;
  comments: number;
  category: string;
};

/**
 * StreamStats component types
 */
export type MetricCardProps = {
  title: string;
  value: string;
  change: number;
  icon: ReactNode;
};

/**
 * ActivityLogOptions component types
 */
export type ActivityLogOptionsProps = {
  activityId?: string;
  onMarkAsRead?: () => void;
  onDelete?: () => void;
  onOpenDetails?: () => void;
};

/**
 * ExploreStreamersModal component types
 */
export type ExploreStreamersModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * General dashboard utils
 */
export type KeyValueRecord = Record<string, unknown>;

// Dashboard Component Types
export type UpcomingStream = {
  id: string;
  title: string;
  scheduledAt: Date;
  thumbnail?: string;
};

export type StreamerGuideModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export type SettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export type DashboardNotification = {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: "system" | "follower" | "stream" | "achievement";
};

export type MetricsData = {
  month: string;
  streams: number;
  viewers: number;
  earnings: number;
  // These fields may be used in other metrics visualizations
  date?: string;
  value?: number;
  category?: string;
};

export type DashboardAreaChartProps = {
  data: MetricsData[];
  title?: string;
  description?: string;
  height?: number;
  className?: string;
};
