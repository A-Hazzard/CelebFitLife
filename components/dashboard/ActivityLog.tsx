"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Activity,
  CheckCircle,
  Clock,
  Eye,
  MessageSquare,
  Star,
  Users,
  AlertCircle,
  ArrowUpRight,
  Calendar,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useRouter } from "next/navigation";
import { subscribeToUserActivities } from "@/lib/helpers/dashboard";
import { formatDistanceToNow } from "date-fns";
import { ActivityItem } from "@/lib/types/ui";
import { Timestamp } from "firebase/firestore";
import ActivityLogOptions from "./ActivityLogOptions";

export default function ActivityLog() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState("all");
  const router = useRouter();
  const [showRead, setShowRead] = useState(true);

  useEffect(() => {
    if (!currentUser?.uid) return;

    // Use our new helper for subscribing to activity updates
    const unsubscribe = subscribeToUserActivities(
      currentUser.uid,
      (activityItems) => {
        setActivities(activityItems as ActivityItem[]);
        setIsLoading(false);
      },
      30 // Limit to 30 activities
    );

    return () => unsubscribe();
  }, [currentUser?.uid]);

  // We'll use this to simulate data for the demo
  useEffect(() => {
    if (!isLoading && activities.length === 0) {
      // Create mock activities for demo
      const mockActivities: ActivityItem[] = [
        {
          id: "1",
          type: "stream_started",
          streamId: "mock-stream-1",
          streamTitle: "Morning Yoga Session",
          timestamp: Timestamp.fromDate(new Date(Date.now() - 20 * 60000)),
          username: "YourUsername",
          performedBy: "YourUsername",
          read: true,
        },
        {
          id: "2",
          type: "subscriber",
          timestamp: Timestamp.fromDate(new Date(Date.now() - 40 * 60000)),
          username: "JohnFitness",
          performedBy: "JohnFitness",
          userImage: "https://i.pravatar.cc/150?img=3",
          read: false,
        },
        {
          id: "3",
          type: "viewer_milestone",
          streamId: "mock-stream-1",
          streamTitle: "Morning Yoga Session",
          timestamp: Timestamp.fromDate(new Date(Date.now() - 50 * 60000)),
          username: "YourUsername",
          performedBy: "System",
          count: 100,
          read: true,
        },
        {
          id: "4",
          type: "comment",
          streamId: "mock-stream-1",
          timestamp: Timestamp.fromDate(new Date(Date.now() - 65 * 60000)),
          username: "YogaLover22",
          performedBy: "YogaLover22",
          details: "Your cobra pose explanation was so helpful!",
          userImage: "https://i.pravatar.cc/150?img=5",
          read: false,
        },
        {
          id: "5",
          type: "achievement",
          timestamp: Timestamp.fromDate(new Date(Date.now() - 2 * 3600000)),
          username: "YourUsername",
          performedBy: "System",
          details: "Completed 10 streams!",
          read: true,
        },
        {
          id: "6",
          type: "stream_ended",
          streamId: "mock-stream-2",
          streamTitle: "HIIT Workout Challenge",
          timestamp: Timestamp.fromDate(new Date(Date.now() - 24 * 3600000)),
          username: "YourUsername",
          performedBy: "YourUsername",
          read: true,
        },
        {
          id: "7",
          type: "error",
          timestamp: Timestamp.fromDate(new Date(Date.now() - 25 * 3600000)),
          details: "Stream disconnected unexpectedly",
          streamId: "mock-stream-2",
          username: "YourUsername",
          performedBy: "System",
          read: false,
        },
      ];

      setActivities(mockActivities);
    }
  }, [isLoading, activities.length]);

  const getActivityIcon = (type: ActivityItem["type"]) => {
    switch (type) {
      case "stream_started":
        return <Activity className="h-4 w-4 text-brandOrange" />;
      case "stream_ended":
        return <CheckCircle className="h-4 w-4 text-brandGray" />;
      case "subscriber":
        return <Users className="h-4 w-4 text-brandOrange" />;
      case "comment":
        return <MessageSquare className="h-4 w-4 text-brandOrange" />;
      case "like":
        return <Star className="h-4 w-4 text-brandOrange" />;
      case "viewer_milestone":
        return <Eye className="h-4 w-4 text-brandOrange" />;
      case "achievement":
        return <Star className="h-4 w-4 text-brandOrange" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-brandGray" />;
    }
  };

  const getActivityText = (activity: ActivityItem) => {
    switch (activity.type) {
      case "stream_started":
        return `You started a new stream: "${activity.streamTitle}"`;
      case "stream_ended":
        return `Stream ended: "${activity.streamTitle}"`;
      case "subscriber":
        return `${activity.username} subscribed to your channel`;
      case "comment":
        return `${activity.username}: "${activity.details}"`;
      case "like":
        return `${activity.username} liked your stream`;
      case "viewer_milestone":
        return `You reached ${activity.count} viewers in "${activity.streamTitle}"`;
      case "achievement":
        return activity.details;
      case "error":
        return `Error: ${activity.details}`;
      default:
        return "Unknown activity";
    }
  };

  const navigateToStream = (streamId?: string) => {
    if (streamId) {
      router.push(`/dashboard/streams/manage/${streamId}`);
    }
  };

  const filteredActivities = activities.filter((activity) => {
    if (activeTab === "all") return showRead || !activity.read;
    if (activeTab === "streams")
      return activity.type.includes("stream") && (showRead || !activity.read);
    if (activeTab === "engagement")
      return (
        ["subscriber", "comment", "like", "viewer_milestone"].includes(
          activity.type
        ) &&
        (showRead || !activity.read)
      );
    if (activeTab === "alerts")
      return activity.type === "error" || !activity.read;
    return showRead || !activity.read;
  });

  const renderActivityItem = (activity: ActivityItem) => (
    <div
      key={activity.id}
      className={`flex items-start p-3 border-b border-brandOrange hover:bg-brandBlack transition-colors last:border-b-0 ${
        !activity.read ? "bg-brandOrange/5" : ""
      }`}
    >
      <div className="flex-shrink-0 mr-3 mt-1">
        {getActivityIcon(activity.type)}
      </div>
      <div className="flex-grow min-w-0">
        <div className="flex flex-col">
          <div className="text-sm text-brandWhite">
            {getActivityText(activity)}
          </div>
          <div className="text-xs text-brandGray mt-1">
            {formatDistanceToNow(activity.timestamp.toDate(), {
              addSuffix: true,
            })}
          </div>
        </div>
      </div>
      <div className="flex-shrink-0 ml-2 flex space-x-1">
        {activity.streamId && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-brandOrange"
            onClick={() => navigateToStream(activity.streamId)}
          >
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Button>
        )}
        <ActivityLogOptions
          activityId={activity.id}
          onMarkAsRead={() => {
            setActivities((prev) =>
              prev.map((a) => (a.id === activity.id ? { ...a, read: true } : a))
            );
            if (activeTab === "alerts" && !showRead) {
              setActivities((prev) =>
                prev.filter((a) => a.id !== activity.id || !a.read)
              );
            }
          }}
          onDelete={() => {
            setActivities((prev) => prev.filter((a) => a.id !== activity.id));
          }}
          onOpenDetails={() => console.log("View details for", activity.id)}
        />
      </div>
    </div>
  );

  const handleMarkAllAsRead = () => {
    setActivities((prev) =>
      prev.map((activity) => ({
        ...activity,
        read: true,
      }))
    );
    // Hide read activities if in alerts tab
    if (activeTab === "alerts") {
      setShowRead(false);
    }
  };

  return (
    <Card className="bg-brandBlack border-2 border-brandOrange">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg font-medium text-brandOrange">
              Activity Log
            </CardTitle>
            <CardDescription className="text-brandGray">
              Recent events and notifications
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            {!isLoading && (
              <Button
                variant="ghost"
                size="sm"
                className="text-sm text-brandOrange hover:text-brandOrange/80 hover:bg-brandOrange/20"
                onClick={handleMarkAllAsRead}
              >
                Mark all as read
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <div className="px-4">
          <TabsList className="bg-brandBlack w-full grid grid-cols-4 border-b-2 border-brandOrange">
            <TabsTrigger
              value="all"
              className="data-[state=active]:bg-brandOrange data-[state=active]:text-brandBlack text-brandGray"
            >
              All
            </TabsTrigger>
            <TabsTrigger
              value="streams"
              className="data-[state=active]:bg-brandOrange data-[state=active]:text-brandBlack text-brandGray"
            >
              Streams
            </TabsTrigger>
            <TabsTrigger
              value="engagement"
              className="data-[state=active]:bg-brandOrange data-[state=active]:text-brandBlack text-brandGray"
            >
              Engagement
            </TabsTrigger>
            <TabsTrigger
              value="alerts"
              className="relative data-[state=active]:bg-brandOrange data-[state=active]:text-brandBlack text-brandGray"
            >
              Alerts
              {activities.filter((a) => !a.read).length > 0 && (
                <span className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 h-4 w-4 rounded-full bg-red-500 flex items-center justify-center text-[10px] text-white">
                  {activities.filter((a) => !a.read).length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        <CardContent className="p-0 pt-2">
          <TabsContent value="all" className="mt-0">
            <ScrollArea className="h-[320px] rounded-md">
              {isLoading ? (
                <div className="space-y-3 p-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-start space-x-4">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-3/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredActivities.length > 0 ? (
                filteredActivities.map(renderActivityItem)
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-6">
                  <Calendar className="h-10 w-10 text-brandGray mb-2" />
                  <p className="text-brandGray text-center">
                    No recent activities found
                  </p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Each tab shares the same structure but filters different content */}
          <TabsContent value="streams" className="mt-0">
            <ScrollArea className="h-[320px] rounded-md">
              {isLoading ? (
                <div className="space-y-3 p-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-start space-x-4">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-3/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredActivities.length > 0 ? (
                filteredActivities.map(renderActivityItem)
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-6">
                  <Activity className="h-10 w-10 text-brandGray mb-2" />
                  <p className="text-brandGray text-center">
                    No stream activities yet
                  </p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="engagement" className="mt-0">
            <ScrollArea className="h-[320px] rounded-md">
              {isLoading ? (
                <div className="space-y-3 p-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-start space-x-4">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-3/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredActivities.length > 0 ? (
                filteredActivities.map(renderActivityItem)
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-6">
                  <Users className="h-10 w-10 text-brandGray mb-2" />
                  <p className="text-brandGray text-center">
                    No engagement activities yet
                  </p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="alerts" className="mt-0">
            <ScrollArea className="h-[320px] rounded-md">
              {isLoading ? (
                <div className="space-y-3 p-3">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="flex items-start space-x-4">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-3/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredActivities.length > 0 ? (
                filteredActivities.map(renderActivityItem)
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-6">
                  <CheckCircle className="h-10 w-10 text-brandGray mb-2" />
                  <p className="text-brandGray text-center">
                    No alerts to display
                  </p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
}
