import React, { useState, useEffect } from "react";
import {
  Bell,
  CheckCircle,
  UserCheck,
  MessageSquare,
  Star,
  Calendar,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: "follow" | "comment" | "like" | "schedule" | "system";
}

export function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [open, setOpen] = useState(false);

  // Generate fake notifications
  useEffect(() => {
    const types: ("follow" | "comment" | "like" | "schedule" | "system")[] = [
      "follow",
      "comment",
      "like",
      "schedule",
      "system",
    ];

    const titles = {
      follow: "New Follower",
      comment: "New Comment",
      like: "Stream Liked",
      schedule: "Upcoming Stream",
      system: "System Notification",
    };

    const messages = {
      follow: [
        "JohnFitness started following you",
        "FitnessGuru123 started following you",
        "WorkoutKing followed you",
      ],
      comment: [
        "Great stream! Loved the workout tips",
        "When is your next cardio session?",
        "Your nutrition advice helped me a lot!",
      ],
      like: [
        "FitnessFan liked your HIIT workout stream",
        "YogaMaster liked your meditation stream",
        "GymExpert liked your strength training stream",
      ],
      schedule: [
        "Your 'Morning Cardio' stream starts in 1 hour",
        "Don't forget your scheduled 'Protein Meal Prep' stream tomorrow",
        "Your weekly fitness Q&A is scheduled for Friday",
      ],
      system: [
        "Your stream reached 1000 views!",
        "Your account has been verified",
        "New streaming features available",
      ],
    };

    const times = [
      "Just now",
      "5m ago",
      "15m ago",
      "30m ago",
      "1h ago",
      "2h ago",
      "3h ago",
      "5h ago",
      "Yesterday",
      "2 days ago",
    ];

    // Generate 15 random notifications
    const fakeNotifications = Array.from({ length: 15 }, (_, i) => {
      const type = types[Math.floor(Math.random() * types.length)];
      const messageArray = messages[type];
      return {
        id: `notif-${i}`,
        title: titles[type],
        message: messageArray[Math.floor(Math.random() * messageArray.length)],
        time: times[Math.floor(Math.random() * times.length)],
        read: Math.random() > 0.3, // 30% chance of being unread
        type,
      };
    });

    setTimeout(() => {
      setNotifications(fakeNotifications);
      setIsLoading(false);
    }, 1000);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "follow":
        return <UserCheck className="h-4 w-4 text-blue-400" />;
      case "comment":
        return <MessageSquare className="h-4 w-4 text-green-400" />;
      case "like":
        return <Star className="h-4 w-4 text-yellow-400" />;
      case "schedule":
        return <Calendar className="h-4 w-4 text-purple-400" />;
      default:
        return <Bell className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white"
              variant="destructive"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4">
          <h3 className="font-medium">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              <CheckCircle className="mr-1 h-4 w-4" />
              Mark all read
            </Button>
          )}
        </div>
        <Separator />
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="flex flex-col gap-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <div className="h-9 w-9 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/3 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                    <div className="h-3 w-full bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length > 0 ? (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  "flex items-start p-3 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer",
                  !notification.read && "bg-blue-50 dark:bg-blue-900/20"
                )}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="h-9 w-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mr-3">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{notification.title}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {notification.time}
                  </p>
                </div>
                {!notification.read && (
                  <div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5" />
                )}
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              No notifications
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
