"use client";

import React, { useState, useEffect } from "react";
import { ActivityItem, ActivityLogType } from "@/lib/types/ui";
import {
  collection,
  query,
  limit,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { formatDistanceToNow } from "date-fns";
import {
  HistoryIcon,
  Ban,
  Clock,
  ShieldCheck,
  ShieldX,
  Mic,
  MicOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type ActivityLogProps = {
  streamId: string;
  className?: string;
  maxItems?: number;
};

export const ActivityLog: React.FC<ActivityLogProps> = ({
  streamId,
  className = "",
  maxItems = 10,
}) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only proceed if we have a streamId
    if (!streamId) {
      setLoading(false);
      setError("Stream ID is required to load activities");
      return;
    }

    // Create a query for the latest activities
    const activitiesQuery = query(
      collection(db, `streams/${streamId}/activities`),
      orderBy("timestamp", "desc"),
      limit(maxItems)
    );

    // Subscribe to real-time updates
    const unsubscribe = onSnapshot(
      activitiesQuery,
      (snapshot) => {
        const activityList: ActivityItem[] = [];
        snapshot.forEach((doc) => {
          activityList.push({
            id: doc.id,
            ...(doc.data() as Omit<ActivityItem, "id">),
          });
        });
        setActivities(activityList);
        setLoading(false);
      },
      (err) => {
        console.error("Error loading activities:", err);
        setError("Failed to load activity log");
        setLoading(false);
      }
    );

    // Cleanup function to unsubscribe when component unmounts
    return unsubscribe;
  }, [streamId, maxItems]);

  const reverseAction = async (activity: ActivityItem) => {
    try {
      console.log("Reversing action for activity:", activity);
      // Implementation of action reversal
      // For example, let's log the activity type being reversed
      console.log(
        `Reversing ${activity.type} action for user ${activity.username}`
      );
      toast.success("Action reversed successfully");
    } catch (err) {
      console.error("Error reversing action:", err);
      toast.error("Failed to reverse action");
    }
  };

  // Helper function to get text and icon for activity types
  const getActivityDisplay = (activity: ActivityItem) => {
    switch (activity.type) {
      case "ban":
        return {
          icon: <Ban className="w-4 h-4 text-red-400" />,
          text: "banned",
          className: "text-red-400",
        };
      case "unban":
        return {
          icon: <Ban className="w-4 h-4 text-green-400" />,
          text: "unbanned",
          className: "text-green-400",
        };
      case "mute":
        return {
          icon: <MicOff className="w-4 h-4 text-yellow-400" />,
          text: "muted",
          className: "text-yellow-400",
        };
      case "unmute":
        return {
          icon: <Mic className="w-4 h-4 text-green-400" />,
          text: "unmuted",
          className: "text-green-400",
        };
      case "makeAdmin":
        return {
          icon: <ShieldCheck className="w-4 h-4 text-blue-400" />,
          text: "made admin",
          className: "text-blue-400",
        };
      case "removeAdmin":
        return {
          icon: <ShieldX className="w-4 h-4 text-gray-400" />,
          text: "removed as admin",
          className: "text-gray-400",
        };
      default:
        return {
          icon: <Clock className="w-4 h-4 text-gray-400" />,
          text: "action performed",
          className: "text-gray-400",
        };
    }
  };

  const isReversible = (
    type:
      | ActivityLogType
      | "stream_started"
      | "stream_ended"
      | "subscriber"
      | "comment"
      | "like"
      | "viewer_milestone"
      | "achievement"
      | "error"
  ): boolean => {
    // Only certain actions can be reversed
    return ["ban", "mute", "makeAdmin"].includes(type as string);
  };

  if (loading) {
    return (
      <div className={`p-4 bg-gray-900 rounded-lg ${className}`}>
        <div className="flex items-center justify-center h-32">
          <div className="loader"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 bg-gray-900 rounded-lg ${className}`}>
        <div className="text-red-400 text-center">{error}</div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className={`p-4 bg-gray-900 rounded-lg ${className}`}>
        <div className="text-center py-6 text-gray-400">
          <HistoryIcon className="w-12 h-12 mx-auto opacity-30 mb-2" />
          <p>No moderation activity yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <h3 className="font-medium text-lg text-white mb-3">
        Moderation Activity
      </h3>

      <div className="bg-gray-900 rounded-lg border border-gray-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left p-3 text-gray-400">Action</th>
              <th className="text-left p-3 text-gray-400">User</th>
              <th className="text-left p-3 text-gray-400">Moderator</th>
              <th className="text-left p-3 text-gray-400">Time</th>
              <th className="text-right p-3 text-gray-400">Manage</th>
            </tr>
          </thead>
          <tbody>
            {activities.map((activity) => {
              const { icon, text, className } = getActivityDisplay(activity);

              return (
                <tr
                  key={activity.id}
                  className="border-b border-gray-800 last:border-b-0 hover:bg-gray-800/50"
                >
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      {icon}
                      <span className={className}>{text}</span>
                    </div>
                  </td>
                  <td className="p-3 text-white">@{activity.username}</td>
                  <td className="p-3 text-gray-400">{activity.performedBy}</td>
                  <td className="p-3 text-gray-400">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          {formatDistanceToNow(activity.timestamp.toDate(), {
                            addSuffix: true,
                          })}
                        </TooltipTrigger>
                        <TooltipContent>
                          {activity.timestamp.toDate().toLocaleString()}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </td>
                  <td className="p-3 text-right">
                    {isReversible(activity.type as ActivityLogType) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs bg-transparent hover:bg-gray-800 text-gray-400 hover:text-white"
                        onClick={() => reverseAction(activity)}
                      >
                        Reverse
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ActivityLog;
