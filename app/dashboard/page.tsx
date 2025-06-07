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
import { StreamData } from "@/lib/types/streaming.types";
import {
  Activity,
  ChevronRight,
  Edit,
  Plus,
  Settings,
  Users,
} from "lucide-react";
import { useOnClickOutside } from "@/lib/hooks/useOnClickOutside";
import { SettingsModal } from "@/components/dashboard/SettingsModal";
import { StreamerGuideModal } from "@/components/dashboard/StreamerGuideModal";
import { ExploreStreamersModal } from "@/components/dashboard/ExploreStreamersModal";
import UpcomingStreamsCalendar from "@/components/dashboard/UpcomingStreamsCalendar";
import Header from "@/components/layout/Header";
import { getStreamThumbnail } from "@/components/layout/Header";

export default function DashboardPage() {
  // Add states for dropdowns
  const [liveStreams, setLiveStreams] = useState<StreamData[]>([]);
  const [pastStreams, setPastStreams] = useState<StreamData[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isStreamerGuideOpen, setIsStreamerGuideOpen] = useState(false);
  const [isExploreStreamersOpen, setIsExploreStreamersOpen] = useState(false);

  // Refs for dropdown handling
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const notificationsDropdownRef = useRef<HTMLDivElement>(null);

  // Add close functions
  const closeAllDropdowns = () => {
    // Remove unused function
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

  if (!currentUser) return null;

  return (
    <div className="flex flex-col min-h-screen text-brandWhite">
      <Header />
      {/* Main Content */}
      <main className="container mx-auto px-2 sm:px-4 py-6">
        <div className="flex flex-col space-y-6">
          {/* Quick Actions Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 bg-blue-800 rounded-lg p-4 border border-blue-700">
            <h2 className="text-xl font-semibold text-brandOrange">
              Welcome back, {currentUser?.username || "Streamer"}!
            </h2>
            <div className="flex space-x-3 w-full sm:w-auto">
              <Button
                variant="default"
                onClick={handleCreateStream}
                className="bg-brandOrange hover:bg-brandWhite hover:text-brandBlack flex-1 sm:flex-auto text-brandBlack border-2 border-brandOrange"
              >
                <Plus className="h-4 w-4 mr-2 text-brandBlack" />
                New Stream
              </Button>
              <Button
                variant="outline"
                className="border-2 border-brandOrange text-brandOrange bg-brandBlack hover:bg-brandOrange hover:text-brandBlack flex-1 sm:flex-auto"
                onClick={() => setIsSettingsOpen(true)}
              >
                <Settings className="h-4 w-4 mr-2 text-brandOrange" />
                <span className="hidden sm:inline">Settings</span>
              </Button>
            </div>
          </div>

          {/* Live Streams (if any) */}
          {liveStreams.length > 0 && (
            <div className="bg-blue-800 border-2 border-brandOrange rounded-lg p-4 mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                <div className="flex items-center">
                  <div className="h-3 w-3 bg-brandOrange rounded-full animate-pulse mr-2"></div>
                  <h3 className="text-lg font-semibold text-brandOrange">
                    You&apos;re Live!
                  </h3>
                </div>
                <Button
                  variant="default"
                  className="bg-brandOrange hover:bg-brandWhite hover:text-brandBlack text-sm w-full sm:w-auto text-brandBlack border-2 border-brandOrange"
                >
                  Manage Stream
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {liveStreams.map((stream) => (
                  <div
                    key={stream.id}
                    className="bg-brandBlack/90 rounded-lg overflow-hidden cursor-pointer transition-all duration-200 hover:scale-[1.02] border border-brandOrange"
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
                      <div className="absolute top-2 right-2 bg-brandOrange text-brandBlack text-xs px-2 py-1 rounded flex items-center">
                        <span className="inline-block h-2 w-2 bg-brandBlack rounded-full mr-1 animate-pulse"></span>
                        LIVE
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-brandBlack/90 to-transparent p-3">
                        <h3 className="font-medium truncate text-brandWhite">
                          {stream.title}
                        </h3>
                        <div className="flex justify-between items-center text-xs text-brandGray mt-1">
                          <span className="truncate max-w-[120px]">
                            Started{" "}
                            {stream.createdAt
                              ? new Date(stream.createdAt).toLocaleTimeString()
                              : "Recently"}
                          </span>
                          <div className="flex items-center">
                            <Activity className="h-3 w-3 mr-1 text-brandOrange" />
                            {stream.viewerCount || 0} viewers
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
                <div className="bg-blue-800 rounded-lg p-6 border-2 border-brandOrange">
                  <div className="mb-4">
                    <SkeletonLoader height="h-8" width="w-48" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <SkeletonLoader height="h-24" count={4} />
                  </div>
                  <SkeletonLoader height="h-64" />
                </div>
              ) : (
                <div className="bg-blue-800 rounded-lg p-4 sm:p-6 border-2 border-brandOrange">
                  <StreamStats />
                </div>
              )}

              {/* Upcoming streams */}
              {isUpcomingLoading ? (
                <div className="bg-blue-800 rounded-lg p-6 border-2 border-brandOrange">
                  <div className="flex justify-between mb-4">
                    <SkeletonLoader height="h-6" width="w-40" />
                    <SkeletonLoader height="h-8" width="w-32" />
                  </div>
                  <div className="space-y-4">
                    <SkeletonLoader height="h-32" count={3} />
                  </div>
                </div>
              ) : (
                <div className="bg-blue-800 rounded-lg p-4 sm:p-6 border-2 border-brandOrange">
                  <UpcomingStreamsCalendar />
                </div>
              )}

              {/* Most popular past streams */}
              <div className="bg-blue-800 rounded-lg p-4 sm:p-6 border-2 border-brandOrange">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
                  <h3 className="text-lg font-medium text-brandOrange">
                    Past Streams
                  </h3>
                  <Button
                    variant="ghost"
                    className="text-sm text-brandGray hover:text-brandOrange"
                    type="button"
                    onClick={(e) => e.preventDefault()}
                  >
                    View all{" "}
                    <ChevronRight className="h-4 w-4 ml-1 text-brandOrange" />
                  </Button>
                </div>

                <div className="space-y-4">
                  {pastStreams.slice(0, 5).map((stream) => (
                    <div
                      key={stream.id}
                      className="flex items-center gap-3 sm:gap-4 p-3 rounded-lg hover:bg-brandBlack transition-colors border border-brandOrange"
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
                        <h4 className="font-medium truncate text-sm sm:text-base text-brandWhite">
                          {stream.title}
                        </h4>
                        <div className="text-xs sm:text-sm text-brandGray truncate">
                          {stream.updatedAt
                            ? new Date(stream.updatedAt).toLocaleDateString()
                            : "N/A"}{" "}
                          • {stream.viewerCount || 0} views
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="flex-shrink-0 text-brandOrange"
                        onClick={() =>
                          router.push(`/dashboard/streams/manage/${stream.id}`)
                        }
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  {pastStreams.length === 0 && (
                    <div className="text-center py-8 text-brandGray">
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
                        className="mt-4 bg-transparent border-2 border-brandOrange text-brandOrange hover:bg-brandOrange hover:text-brandBlack"
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
                <div className="bg-brandBlack rounded-lg p-6 border-2 border-brandOrange">
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
                <div className="bg-brandBlack rounded-lg p-4 sm:p-6 border-2 border-brandOrange">
                  <ActivityLog />
                </div>
              )}

              {/* Recommended Streamers Card */}
              {isRecommendedLoading ? (
                <div className="bg-brandBlack rounded-lg p-6 border-2 border-brandOrange">
                  <div className="mb-4">
                    <SkeletonLoader height="h-6" width="w-48" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <SkeletonLoader height="h-32" count={6} />
                  </div>
                </div>
              ) : (
                <div className="bg-brandBlack rounded-lg p-4 sm:p-6 border-2 border-brandOrange">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
                    <h3 className="text-xl font-medium text-brandOrange flex items-center">
                      <Users className="h-5 w-5 mr-2 text-brandOrange" />
                      Popular Streamers
                    </h3>
                    <Button
                      variant="default"
                      className="text-sm bg-brandOrange text-brandBlack hover:bg-brandWhite hover:text-brandBlack font-medium w-full sm:w-auto border-none"
                      onClick={() => setIsExploreStreamersOpen(true)}
                      type="button"
                    >
                      Explore
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {recommendedStreamers.map((streamer, index) => (
                      <div
                        key={streamer.id}
                        className={`${
                          index % 3 === 0
                            ? "bg-gradient-to-r from-blue-900 to-blue-800"
                            : index % 3 === 1
                            ? "bg-gradient-to-r from-blue-800 to-blue-700"
                            : "bg-gradient-to-r from-blue-700 to-blue-900"
                        } rounded-lg overflow-hidden border border-brandOrange`}
                      >
                        <StreamerCard streamer={streamer} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Tips Card */}
              <div className="bg-brandBlack rounded-lg p-4 sm:p-6 border-2 border-brandOrange">
                <h3 className="text-lg font-medium mb-3 text-brandOrange">
                  Streamer Tips
                </h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start">
                    <div className="bg-brandOrange/20 p-1 rounded mr-2 mt-0.5 flex-shrink-0">
                      <Activity className="h-4 w-4 text-brandOrange" />
                    </div>
                    <span className="text-brandWhite">
                      Schedule streams in advance to build anticipation
                    </span>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-brandOrange/20 p-1 rounded mr-2 mt-0.5 flex-shrink-0">
                      <Activity className="h-4 w-4 text-brandOrange" />
                    </div>
                    <span className="text-brandWhite">
                      Engage with your audience through polls and Q&As
                    </span>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-brandOrange/20 p-1 rounded mr-2 mt-0.5 flex-shrink-0">
                      <Activity className="h-4 w-4 text-brandOrange" />
                    </div>
                    <span className="text-brandWhite">
                      Use detailed descriptions and relevant tags
                    </span>
                  </li>
                </ul>
                <Button
                  className="w-full mt-4 bg-brandOrange hover:bg-brandWhite hover:text-brandBlack text-brandBlack border-2 border-brandOrange"
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
