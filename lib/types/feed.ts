// Types related to the feed/posts functionality

export type Post = {
  id: string;
  user: {
    name: string;
    image: string;
    username: string;
    isStreamer: boolean;
  };
  content: string;
  image?: string;
  likes: number;
  comments: number;
  timestamp: string;
  isLiked: boolean;
  category: "achievement" | "workout" | "motivation" | "nutrition";
  metrics?: {
    duration?: string;
    calories?: number;
    exercises?: string[];
  };
};

export type Comment = {
  id: string;
  user: {
    name: string;
    image: string;
  };
  content: string;
  timestamp: string;
};

export type Notification = {
  id: number;
  title: string;
  message: string;
  time: string;
  type: string;
};
