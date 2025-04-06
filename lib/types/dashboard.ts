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
