import { User } from "./user";

/**
 * Types for streamer-related functionality
 */

/**
 * Basic streamer selection interface for user preferences
 */
export interface StreamerSelection {
  streamerId: string;
  streamerName: string;
}

/**
 * Recommended streamer interface with additional display data
 */
export interface RecommendedStreamer {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
  bio?: string;
  category?: string;
  tags?: string[];
  followers?: number;
  isLive?: boolean;
  currentStreamTitle?: string;
}

/**
 * Streamer profile interface extending user
 */
export interface StreamerProfile extends User {
  bio?: string;
  specialty?: string;
  followers?: number;
  totalStreams?: number;
  totalViews?: number;
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    youtube?: string;
    tiktok?: string;
  };
}
