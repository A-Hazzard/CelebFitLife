"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { CreateStreamModal } from "@/components/streaming/CreateStreamModal";
import { Button } from "@/components/ui/button";
import { StreamerCard } from "@/components/streaming/StreamerCard";
import ActivityLog from "@/components/dashboard/ActivityLog";
import StreamStats from "@/components/dashboard/StreamStats";
import { fetchAllUserStreams } from "@/lib/helpers/dashboard";
import { StreamDoc } from "@/lib/types/streaming.types";
import {
  Activity,
  Bell,
  ChevronRight,
  Edit,
  LogOut,
  MessageSquare,
  Plus,
  Settings,
  User,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { useOnClickOutside } from "@/lib/hooks/useOnClickOutside";
import { SettingsModal } from "@/components/dashboard/SettingsModal";
import { StreamerGuideModal } from "@/components/dashboard/StreamerGuideModal";
import { ExploreStreamersModal } from "@/components/dashboard/ExploreStreamersModal";
import UpcomingStreamsCalendar from "@/components/dashboard/UpcomingStreamsCalendar";

export default function DashboardPage() {
  // Add states for dropdowns
  const [liveStreams, setLiveStreams] = useState<StreamDoc[]>([]);
  const [pastStreams, setPastStreams] = useState<StreamDoc[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isStreamerGuideOpen, setIsStreamerGuideOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isExploreStreamersOpen, setIsExploreStreamersOpen] = useState(false);

  // Refs for dropdown handling
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const notificationsDropdownRef = useRef<HTMLDivElement>(null);

  // Add close functions
  const closeAllDropdowns = () => {
    setIsNotificationsOpen(false);
  };

  // Add click outside handlers
  useOnClickOutside(profileDropdownRef, closeAllDropdowns);
  useOnClickOutside(notificationsDropdownRef, closeAllDropdowns);

  const authStore = useAuthStore();
  const { currentUser } = authStore;
  const router = useRouter();

  // Add more loading states for components
  const [isStreamStatsLoading, setIsStreamStatsLoading] = useState(true);
  const [isUpcomingLoading, setIsUpcomingLoading] = useState(true);
  const [isActivityLoading, setIsActivityLoading] = useState(true);
  const [isRecommendedLoading, setIsRecommendedLoading] = useState(true);

  // Add useEffect for loading states
  useEffect(() => {
    // Simulate loading times for various components
    const streamStatsTimer = setTimeout(() => {
      setIsStreamStatsLoading(false);
    }, 2000);

    const upcomingTimer = setTimeout(() => {
      setIsUpcomingLoading(false);
    }, 2000);

    const activityTimer = setTimeout(() => {
      setIsActivityLoading(false);
    }, 2000);

    const recommendedTimer = setTimeout(() => {
      setIsRecommendedLoading(false);
    }, 2000);

    return () => {
      clearTimeout(streamStatsTimer);
      clearTimeout(upcomingTimer);
      clearTimeout(activityTimer);
      clearTimeout(recommendedTimer);
    };
  }, []);

  // Get user's streams when component mounts
  useEffect(() => {
    async function fetchStreams() {
      // Check if user is authenticated
      if (!currentUser) {
        router.push("/login");
        return;
      }

      // Check if user is a streamer - if not, redirect to streaming page
      const isStreamer = currentUser.role?.streamer === true;
      if (!isStreamer) {
        console.log(
          "[DASHBOARD] User is not a streamer, redirecting to streaming"
        );
        router.push("/streaming");
        return;
      }

      // Use nullish coalescing to safely get userId
      const userId = currentUser.uid ?? currentUser.id;

      // Explicitly check if userId is a valid string before proceeding
      if (!userId) {
        console.error(
          "[DASHBOARD] Could not determine user ID (uid or id). Redirecting to login."
        );
        router.push("/login");
        return;
      }

      try {
        // Now userId is guaranteed to be a string
        const { live, past } = await fetchAllUserStreams(userId);
        setLiveStreams(live);
        setPastStreams(past);
      } catch (error) {
        console.error("Error fetching streams:", error);
      }
    }

    fetchStreams();
    fetchProfilePicture();
  }, [currentUser, router]);

  // Fetch random profile picture from API
  const fetchProfilePicture = async () => {
    try {
      // We're not using this value anywhere, so we can remove the setProfilePicture call
      // Just keep the function for future use if needed
    } catch (error) {
      console.error("Error setting profile picture:", error);
    }
  };

  // Add this function after fetchProfilePicture
  const getStreamThumbnail = (stream: StreamDoc) => {
    if (stream.thumbnail) return stream.thumbnail;

    // Use static Unsplash images instead of dynamic API calls
    const thumbnailImages = {
      fitness:
        "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&h=400&auto=format&q=80",
      yoga: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&h=400&auto=format&q=80",
      nutrition:
        "https://images.unsplash.com/photo-1490818387583-1baba5e638af?w=600&h=400&auto=format&q=80",
      mindfulness:
        "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=600&h=400&auto=format&q=80",
      default:
        "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&h=400&auto=format&q=80",
    };

    const category = stream.category?.toLowerCase() || "default";
    return (
      thumbnailImages[category as keyof typeof thumbnailImages] ||
      thumbnailImages.default
    );
  };

  const handleCreateStream = () => {
    setIsCreateModalOpen(true);
  };

  // Recommended streamers with Unsplash images
  const recommendedStreamers = [
    {
      id: "streamer1",
      name: "FitnessPro",
      status: "live" as const,
      imageUrl:
        "https://images.unsplash.com/photo-1594381898411-846e7d193883?w=150&h=150&crop=faces&fit=crop&auto=format&q=80",
      streamTitle: "HIIT Workout Session",
      viewerCount: 342,
    },
    {
      id: "streamer2",
      name: "YogaMaster",
      status: "online" as const,
      // Use a different yoga instructor image
      imageUrl:
        "https://images.unsplash.com/photo-1552196563-55cd4e45efb3?w=150&h=150&crop=faces&fit=crop&auto=format&q=80",
    },
    {
      id: "streamer3",
      name: "NutritionExpert",
      status: "live" as const,
      imageUrl:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&crop=faces&fit=crop&auto=format&q=80",
      streamTitle: "Healthy Meal Prep",
      viewerCount: 156,
    },
    {
      id: "streamer4",
      name: "MindfulnessGuide",
      status: "offline" as const,
      imageUrl:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&crop=faces&fit=crop&auto=format&q=80",
    },
  ];

  // Clean up currentUser check
  const isUserAdmin = currentUser?.role?.admin || false;

  // Use the proper logout function from lib/helpers/auth
  const handleLogout = async () => {
    try {
      // Ensure currentUser exists before trying to log out
      if (!currentUser) return;

      // First clear the auth store
      authStore.clearUser();

      // Then import and use the logout utility that handles localStorage and redirect
      import("@/lib/helpers/auth").then(({ logout }) => {
        logout();
      });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Updated dropdown menu with additional links
  const profileDropdownContent = (
    <div className="w-56 mt-1 bg-gray-800 border-gray-700 rounded-md overflow-hidden">
      <DropdownMenuLabel>
        <div className="flex flex-col">
          <span className="font-medium">{currentUser?.username || "User"}</span>
          <span className="text-xs text-gray-400 mt-1 break-words">
            {currentUser?.email || ""}
          </span>
        </div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuItem>
          <Link href="/profile" className="w-full">
            <div className="text-gray-200 hover:bg-gray-700 hover:text-white cursor-pointer rounded-md p-2 w-full flex items-center">
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </div>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <div className="text-gray-200 hover:bg-gray-700 hover:text-white cursor-pointer rounded-md p-2 w-full flex items-center">
            <Settings className="mr-2 h-4 w-4 text-brandOrange" />
            <span className="text-white">Settings</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <div className="text-gray-200 hover:bg-gray-700 hover:text-white cursor-pointer rounded-md p-2 w-full flex items-center">
            <MessageSquare className="mr-2 h-4 w-4" />
            <span>Messages</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <div className="text-gray-200 hover:bg-gray-700 hover:text-white cursor-pointer rounded-md p-2 w-full flex items-center">
            <Activity className="mr-2 h-4 w-4" />
            <span>Analytics</span>
          </div>
        </DropdownMenuItem>
        {isUserAdmin && (
          <DropdownMenuItem>
            <div className="text-indigo-300 hover:bg-brandOrange/40 hover:text-white cursor-pointer rounded-md p-2 w-full flex items-center">
              <Settings className="mr-2 h-4 w-4 text-brandOrange" />
              <span>Admin Dashboard</span>
            </div>
          </DropdownMenuItem>
        )}
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuItem>
        <div
          onClick={handleLogout}
          className="text-red-400 hover:bg-red-900/40 hover:text-red-300 cursor-pointer rounded-md p-2 w-full flex items-center"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </div>
      </DropdownMenuItem>
    </div>
  );

  // Update the SkeletonLoader component to be more reusable
  const SkeletonLoader = ({
    className = "",
    count = 1,
    height = "h-6",
    width = "w-full",
  }: {
    className?: string;
    count?: number;
    height?: string;
    width?: string;
  }) => (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`animate-pulse bg-gray-800 rounded ${height} ${width} ${className}`}
        ></div>
      ))}
    </div>
  );

  // Create fake notifications
  const [fakeNotifications, setFakeNotifications] = useState([
    {
      id: "1",
      title: "New Subscriber",
      message: "JohnFitness subscribed to your channel",
      time: "10 minutes ago",
      isRead: false,
      type: "subscription",
    },
    {
      id: "2",
      title: "Stream Achievement",
      message: "You reached 100 viewers in your last stream!",
      time: "1 hour ago",
      isRead: false,
      type: "achievement",
    },
    {
      id: "3",
      title: "Comment on Stream",
      message: 'YogaLover22: "Your cobra pose explanation was so helpful!"',
      time: "3 hours ago",
      isRead: false,
      type: "comment",
    },
    {
      id: "4",
      title: "Stream Reminder",
      message: "Your scheduled stream starts in 30 minutes",
      time: "30 minutes ago",
      isRead: true,
      type: "reminder",
    },
    {
      id: "5",
      title: "Platform Update",
      message: "New analytics features are now available",
      time: "2 days ago",
      isRead: true,
      type: "system",
    },
  ]);

  const handleMarkAllAsRead = () => {
    setFakeNotifications((prev) =>
      prev.map((notification) => ({
        ...notification,
        isRead: true,
      }))
    );
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900 shadow-lg">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <h1 className="text-2xl font-bold text-white">
              Streamer Dashboard
            </h1>

            <div className="flex items-center space-x-4">
              <div className="relative" ref={notificationsDropdownRef}>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-white relative"
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                >
                  <Bell className="h-4 w-4 mr-2 text-brandOrange" />
                  <span className="hidden sm:inline">Notifications</span>
                  <span className="absolute -top-1 -right-1 bg-red-500 text-xs text-white rounded-full h-4 w-4 flex items-center justify-center">
                    3
                  </span>
                </Button>

                {isNotificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-50">
                    <div className="p-3 border-b border-gray-700 flex justify-between items-center">
                      <h3 className="font-medium">Notifications</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-blue-400 hover:text-blue-300 p-1 h-auto"
                        onClick={handleMarkAllAsRead}
                      >
                        Mark all as read
                      </Button>
                    </div>
                    <div className="max-h-96 overflow-y-auto py-1">
                      {fakeNotifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-3 hover:bg-gray-700/50 border-l-2 ${
                            notification.isRead
                              ? "border-transparent"
                              : "border-blue-500"
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <h4 className="font-medium text-sm">
                              {notification.title}
                            </h4>
                            <span className="text-xs text-gray-400">
                              {notification.time}
                            </span>
                          </div>
                          <p className="text-xs text-gray-300 mt-1">
                            {notification.message}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="p-2 border-t border-gray-700 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-gray-400 w-full"
                      >
                        View all notifications
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              {currentUser && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative rounded-full hover:bg-gray-800 p-0"
                    >
                      <div className="relative h-9 w-9 sm:h-10 sm:w-10 overflow-hidden rounded-full border-2 border-purple-500">
                        <Image
                          src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&crop=faces&fit=crop&auto=format&q=80"
                          alt="Profile picture"
                          width={40}
                          height={40}
                          className="rounded-full object-cover"
                          priority
                        />
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900"></span>
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {profileDropdownContent}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="flex flex-col space-y-6">
          {/* Quick Actions Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h2 className="text-xl font-semibold">
              Welcome back, {currentUser?.username || "Streamer"}!
            </h2>
            <div className="flex space-x-3 w-full sm:w-auto">
              <Button
                variant="default"
                onClick={handleCreateStream}
                className="bg-brandOrange hover:bg-brandOrange/90 flex-1 sm:flex-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Stream
              </Button>
              <Button
                variant="outline"
                className="bg-gray-800 border-gray-700 flex-1 sm:flex-auto text-white"
                onClick={() => setIsSettingsOpen(true)}
              >
                <Settings className="h-4 w-4 mr-2 text-brandOrange" />
                <span className="hidden sm:inline">Settings</span>
              </Button>
            </div>
          </div>

          {/* Live Streams (if any) */}
          {liveStreams.length > 0 && (
            <div className="bg-gradient-to-r from-purple-900/50 to-purple-600/30 rounded-lg p-4 mb-6 border border-purple-500/30">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                <div className="flex items-center">
                  <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse mr-2"></div>
                  <h3 className="text-lg font-semibold">You&apos;re Live!</h3>
                </div>
                <Button
                  variant="default"
                  className="bg-brandOrange hover:bg-brandOrange/90 text-sm w-full sm:w-auto"
                >
                  Manage Stream
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {liveStreams.map((stream) => (
                  <div
                    key={stream.id}
                    className="bg-gray-800/80 rounded-lg overflow-hidden cursor-pointer transition-all duration-200 hover:scale-[1.02]"
                    onClick={() =>
                      router.push(`/dashboard/streams/manage/${stream.id}`)
                    }
                  >
                    <div className="relative aspect-video">
                      <Image
                        src={getStreamThumbnail(stream)}
                        alt={stream.title}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded flex items-center">
                        <span className="inline-block h-2 w-2 bg-white rounded-full mr-1 animate-pulse"></span>
                        LIVE
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                        <h3 className="font-medium truncate">{stream.title}</h3>
                        <div className="flex justify-between items-center text-xs text-gray-300 mt-1">
                          <span className="truncate max-w-[120px]">
                            Started{" "}
                            {stream.createdAt
                              ? new Date(
                                  typeof stream.createdAt === "string"
                                    ? stream.createdAt
                                    : stream.createdAt.toDate()
                                ).toLocaleTimeString()
                              : "Recently"}
                          </span>
                          <div className="flex items-center">
                            <Activity className="h-3 w-3 mr-1" />
                            {stream.viewCount || 0} viewers
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3-column layout for dashboard content */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Main content - 8 columns */}
            <div className="lg:col-span-8 space-y-6">
              {/* Stream performance metrics */}
              {isStreamStatsLoading ? (
                <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                  <div className="mb-4">
                    <SkeletonLoader height="h-8" width="w-48" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <SkeletonLoader height="h-24" count={4} />
                  </div>
                  <SkeletonLoader height="h-64" />
                </div>
              ) : (
                <StreamStats />
              )}

              {/* Upcoming streams */}
              {isUpcomingLoading ? (
                <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                  <div className="flex justify-between mb-4">
                    <SkeletonLoader height="h-6" width="w-40" />
                    <SkeletonLoader height="h-8" width="w-32" />
                  </div>
                  <div className="space-y-4">
                    <SkeletonLoader height="h-32" count={3} />
                  </div>
                </div>
              ) : (
                <UpcomingStreamsCalendar />
              )}

              {/* Most popular past streams */}
              <div className="bg-gray-900 rounded-lg p-4 sm:p-6 border border-gray-800">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
                  <h3 className="text-lg font-medium">Past Streams</h3>
                  <Button
                    variant="ghost"
                    className="text-sm text-gray-400 hover:text-white"
                    type="button"
                    onClick={(e) => e.preventDefault()}
                  >
                    View all <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>

                <div className="space-y-4">
                  {pastStreams.slice(0, 5).map((stream) => (
                    <div
                      key={stream.id}
                      className="flex items-center gap-3 sm:gap-4 p-3 rounded-lg hover:bg-gray-800/50 transition-colors"
                    >
                      <div className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-md overflow-hidden flex-shrink-0">
                        <Image
                          src={getStreamThumbnail(stream)}
                          alt={stream.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate text-sm sm:text-base">
                          {stream.title}
                        </h4>
                        <div className="text-xs sm:text-sm text-gray-400 truncate">
                          {stream.endedAt
                            ? new Date(
                                typeof stream.endedAt === "string"
                                  ? stream.endedAt
                                  : stream.endedAt.toDate()
                              ).toLocaleDateString()
                            : "N/A"}{" "}
                          • {stream.viewCount || 0} views
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="flex-shrink-0"
                        onClick={() =>
                          router.push(`/dashboard/streams/manage/${stream.id}`)
                        }
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  {pastStreams.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <div className="mx-auto w-40 h-40 relative mb-4">
                        <Image
                          src="https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=300&h=300&auto=format&q=80"
                          alt="No past streams"
                          width={160}
                          height={160}
                          className="rounded-lg object-cover opacity-50"
                        />
                      </div>
                      <p>No past streams found</p>
                      <Button
                        variant="outline"
                        className="mt-4 bg-transparent border-gray-700 text-black dark:text-white"
                        onClick={handleCreateStream}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Your First Stream
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right sidebar - 4 columns */}
            <div className="lg:col-span-4 space-y-6">
              {/* Activity Log Card */}
              {isActivityLoading ? (
                <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                  <div className="mb-4">
                    <SkeletonLoader height="h-6" width="w-32" />
                    <SkeletonLoader
                      height="h-4"
                      width="w-48"
                      className="mt-2"
                    />
                  </div>
                  <SkeletonLoader
                    height="h-8"
                    width="w-full"
                    className="mb-4"
                  />
                  <div className="space-y-4">
                    <SkeletonLoader height="h-16" count={5} />
                  </div>
                </div>
              ) : (
                <ActivityLog />
              )}

              {/* Recommended Streamers Card */}
              {isRecommendedLoading ? (
                <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                  <div className="mb-4">
                    <SkeletonLoader height="h-6" width="w-48" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <SkeletonLoader height="h-32" count={6} />
                  </div>
                </div>
              ) : (
                <div className="bg-gray-900 rounded-lg p-4 sm:p-6 border border-gray-800">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
                    <h3 className="text-lg font-medium">Popular Streamers</h3>
                    <Button
                      variant="ghost"
                      className="text-sm text-gray-400 hover:text-white w-full sm:w-auto"
                      onClick={() => setIsExploreStreamersOpen(true)}
                      type="button"
                    >
                      Explore <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {recommendedStreamers.map((streamer) => (
                      <StreamerCard key={streamer.id} streamer={streamer} />
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Tips Card */}
              <div className="bg-gradient-to-r from-blue-900/50 to-indigo-900/50 rounded-lg p-4 sm:p-6 border border-blue-800/30">
                <h3 className="text-lg font-medium mb-3">Streamer Tips</h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start">
                    <div className="bg-blue-500/20 p-1 rounded mr-2 mt-0.5 flex-shrink-0">
                      <Activity className="h-4 w-4 text-blue-400" />
                    </div>
                    <span>
                      Schedule streams in advance to build anticipation
                    </span>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-blue-500/20 p-1 rounded mr-2 mt-0.5 flex-shrink-0">
                      <Activity className="h-4 w-4 text-blue-400" />
                    </div>
                    <span>
                      Engage with your audience through polls and Q&As
                    </span>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-blue-500/20 p-1 rounded mr-2 mt-0.5 flex-shrink-0">
                      <Activity className="h-4 w-4 text-blue-400" />
                    </div>
                    <span>Use detailed descriptions and relevant tags</span>
                  </li>
                </ul>
                <Button
                  className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsStreamerGuideOpen(true);
                  }}
                  type="button"
                >
                  View Streamer Guide
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Create Stream Modal */}
      <CreateStreamModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {/* Settings Modal */}
      <SettingsModal open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />

      {/* Streamer Guide Modal */}
      <StreamerGuideModal
        open={isStreamerGuideOpen}
        onOpenChange={setIsStreamerGuideOpen}
      />

      {/* Explore Streamers Modal */}
      <ExploreStreamersModal
        open={isExploreStreamersOpen}
        onOpenChange={setIsExploreStreamersOpen}
      />
    </div>
  );
}
