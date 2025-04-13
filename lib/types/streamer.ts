import { User } from "./user";

/**
 * Types for streamer-related functionality
 */

/**
 * Basic streamer selection type for user preferences
 */
export type StreamerSelection = {
  streamerId: string;
  streamerName: string;
};

/**
 * Recommended streamer type with additional display data
 */
export type RecommendedStreamer = {
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
};

/**
 * Streamer profile type extending user
 */
export type StreamerProfile = User & {
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
};

// Types related to streamers and categories

export type Streamer = {
  id: string;
  name: string;
  profileImage: string;
  thumbnail: string;
  quote: string;
  category: string;
  categoryName?: string;
};

export type Category = {
  id: string;
  name: string;
  description?: string;
};

export type SlickArrowProps = {
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  direction: "prev" | "next";
};

// From Category model
export type CategoryCreateDTO = {
  name: string;
  description: string;
};

// From Tag model
export type TagCreateDTO = {
  name: string;
  category: string;
};
