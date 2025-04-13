"use client";

import {
  Search,
  ChevronDown,
  ChevronUp,
  Bell,
  LogOut,
  Settings,
  User,
  MessageSquare,
  ChevronRight,
} from "lucide-react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import React, { useEffect, useState, useRef } from "react";
import { fetchCategoriesWithTags } from "@/lib/store/categoriesStore";
import { Category, Tag } from "@/lib/store/categoriesStore";
import { SLIDER_SETTINGS } from "@/lib/uiConstants";
import { useStreamerStore } from "@/lib/store/useStreamerStore";
import StreamerCard from "@/components/streamPage/StreamerCard";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";

export default function UserDashboard() {
  const [visibleDiscoverStreamers, setVisibleDiscoverStreamers] = useState(6);
  const [isTagsOpen, setIsTagsOpen] = useState(false);
  const [categories, setCategories] = useState<(Category & { tags: Tag[] })[]>(
    []
  );
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [notifications] = useState([
    {
      id: "1",
      title: "FitnessPro is Live!",
      message: "Join the HIIT workout session now",
      time: "Just now",
      isRead: false,
      type: "live",
    },
    {
      id: "2",
      title: "YogaMaster Starting Soon",
      message: "Morning Yoga session starts in 15 minutes",
      time: "10 minutes ago",
      isRead: false,
      type: "upcoming",
    },
  ]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationsDropdownRef = useRef<HTMLDivElement>(null);

  const { streamers, fetchAll } = useStreamerStore();
  const { currentUser } = useAuthStore();
  const router = useRouter();

  // Add authentication check
  useEffect(() => {
    // If user is not authenticated, redirect to login
    if (currentUser === null) {
      router.push("/login");
    }
    // If user is a streamer, they should be on the dashboard
    else if (currentUser && currentUser.role?.streamer === true) {
      console.log("[STREAMING] User is a streamer, redirecting to dashboard");
      router.push("/dashboard");
    }
  }, [currentUser, router]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    const loadCategoriesAndTags = async () => {
      const result = await fetchCategoriesWithTags();
      if (result.success) {
        setCategories(result.categoriesWithTags);
      } else {
        alert("Failed to load categories and tags");
      }
    };
    loadCategoriesAndTags();
  }, []);

  const toggleCategory = (categoryName: string) => {
    setExpandedCategory((prev) =>
      prev === categoryName ? null : categoryName
    );
    setSelectedCategories((prev) =>
      prev.includes(categoryName)
        ? prev.filter((cat) => cat !== categoryName)
        : [...prev, categoryName]
    );
  };

  const toggleTagSelection = (tagName: string) => {
    setSelectedTags((prevTags) =>
      prevTags.includes(tagName)
        ? prevTags.filter((tag) => tag !== tagName)
        : [...prevTags, tagName]
    );
  };

  const loadMoreStreamers = () => {
    setVisibleDiscoverStreamers((prev) => prev + 3);
  };

  // Add logout handler
  const handleLogout = async () => {
    try {
      // Ensure currentUser exists before trying to log out
      if (!currentUser) return;

      // First clear the auth store
      useAuthStore.getState().clearUser();

      // Then import and use the logout utility that handles localStorage and redirect
      import("@/lib/helpers/auth").then(({ logout }) => {
        logout();
      });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Filter streamers based on selected categories
  const filteredStreamers = streamers.filter(
    (streamer) =>
      selectedCategories.length === 0 ||
      (streamer.categoryName &&
        selectedCategories.includes(streamer.categoryName))
  );

  // Use correct property 'id' instead of non-existent 'streamID'
  const uniqueStreamers = Array.from(
    new Map(streamers.map((s) => [s.id, s])).values()
  );

  return (
    <div className="min-h-screen flex flex-col bg-brandBlack text-brandWhite font-inter">
      {/* Header */}
      <header className="flex items-center justify-between p-4 md:p-6 bg-brandBlack border-b border-brandOrange/30">
        <div className="flex items-center gap-6">
          <div className="relative w-full max-w-md">
            <input
              type="text"
              placeholder="Search streamers..."
              className="w-full px-4 py-2 bg-brandBlack border border-brandOrange/30 text-brandWhite rounded-full focus:outline-none focus:ring-2 focus:ring-brandOrange text-sm"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-brandOrange w-5 h-5" />
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              href="/feeds"
              className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
            >
              Feeds
            </Link>
            <Link
              href="/streaming"
              className="text-sm font-medium text-orange-500 hover:text-orange-400 transition-colors"
            >
              Streaming
            </Link>
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          {/* Notifications */}
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
                2
              </span>
            </Button>

            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-50">
                <div className="p-3 border-b border-gray-700">
                  <h3 className="font-medium">Stream Notifications</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 hover:bg-gray-700/50 border-l-2 ${
                        notification.type === "live"
                          ? "border-red-500"
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
              </div>
            )}
          </div>

          {/* User Menu */}
          {currentUser && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full"
                >
                  <Image
                    src={
                      currentUser?.profileImage || "/images/default-avatar.jpg"
                    }
                    alt={currentUser?.name || "User"}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-gray-800 border-gray-700">
                <DropdownMenuLabel className="text-gray-300">
                  My Account
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-gray-700" />
                <DropdownMenuItem className="text-gray-300 hover:bg-gray-700 cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <Link href="/profile" className="w-full">
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="text-gray-300 hover:bg-gray-700 cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="text-gray-300 hover:bg-gray-700 cursor-pointer">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  <span>Messages</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-700" />
                <DropdownMenuItem
                  className="text-red-400 hover:bg-gray-700 cursor-pointer"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>

      {/* 🧱 Main Layout */}
      <main className="flex flex-col p-4 md:p-6 space-y-6">
        <div className="flex flex-col md:flex-row space-y-6 md:space-y-0 md:space-x-6">
          {/* 🎞 MY STREAMERS */}
          <section className="w-full md:w-3/4 space-y-6">
            <h2 className="text-xl md:text-2xl font-bold text-brandWhite">
              MY STREAMERS
            </h2>
            <Slider {...SLIDER_SETTINGS}>
              {uniqueStreamers.slice(0, 3).map((streamer, index) => (
                <div
                  key={index}
                  className="px-2 md:p-4 transform transition-all duration-300 hover:scale-105"
                >
                  <StreamerCard
                    streamer={{
                      ...streamer,
                      avatarUrl: streamer.avatarUrl || "/favicon.ico",
                      username: streamer.username || streamer.name,
                      bio: streamer.bio || "",
                      streams:
                        streamer.streams?.map((stream) => ({
                          ...stream,
                          thumbnail: stream.thumbnail || "/favicon.ico",
                          hasEnded: stream.hasEnded || false,
                          title: stream.title || "Untitled Stream",
                        })) || [],
                    }}
                  />
                </div>
              ))}
            </Slider>
          </section>

          {/* 🎛 CATEGORY SIDEBAR */}
          <aside className="w-full md:w-1/5 bg-brandBlack border border-brandOrange/30 rounded-xl">
            <div
              className="flex justify-between items-center p-3 cursor-pointer md:cursor-default"
              onClick={() => setIsTagsOpen(!isTagsOpen)}
            >
              <h2 className="text-base md:text-lg font-bold text-brandWhite">
                CATEGORIES
              </h2>
              <div className="md:hidden">
                {isTagsOpen ? (
                  <ChevronUp className="text-brandOrange w-4 h-4" />
                ) : (
                  <ChevronDown className="text-brandOrange w-4 h-4" />
                )}
              </div>
            </div>

            <div
              className={`${
                isTagsOpen ? "block" : "hidden"
              } md:block space-y-1 p-2 pt-0`}
            >
              {categories.map((category) => (
                <div key={category.name} className="mb-1">
                  <div
                    className={`flex justify-between items-center bg-brandBlack border border-brandOrange/30 p-2 rounded-lg hover:bg-brandOrange/10 transition-colors cursor-pointer ${
                      selectedCategories.includes(category.name)
                        ? "bg-brandOrange/20"
                        : ""
                    }`}
                    onClick={() => toggleCategory(category.name)}
                  >
                    <span className="text-xs font-semibold text-brandWhite">
                      {category.name}
                    </span>
                    <ChevronRight
                      className={`text-brandOrange transform transition-transform ${
                        expandedCategory === category.name ? "rotate-90" : ""
                      }`}
                      size={14}
                    />
                  </div>

                  {expandedCategory === category.name && (
                    <div className="grid grid-cols-2 gap-1 mt-1 pl-1">
                      {category.tags.map((tag) => (
                        <button
                          key={tag.name}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTagSelection(tag.name);
                          }}
                          className={`bg-brandBlack border border-brandOrange/30 text-[10px] p-1 rounded-lg hover:bg-brandOrange/20 transition-colors ${
                            selectedTags.includes(tag.name)
                              ? "bg-brandOrange text-brandBlack"
                              : "text-brandWhite"
                          }`}
                        >
                          {tag.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </aside>
        </div>

        {/* 🔥 DISCOVER SECTION */}
        <section className="space-y-6">
          <h2 className="text-xl md:text-2xl font-bold text-brandWhite">
            DISCOVER
          </h2>
          <p className="text-xs md:text-sm text-brandOrange/70">
            What fits your needs from your previous tags?
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {filteredStreamers
              .slice(0, visibleDiscoverStreamers)
              .map((streamer, index) => (
                <div
                  key={index}
                  className="transform transition-all duration-300 hover:scale-105"
                >
                  <StreamerCard
                    streamer={{
                      ...streamer,
                      avatarUrl: streamer.avatarUrl || "/favicon.ico",
                      username: streamer.username || streamer.name,
                      bio: streamer.bio || "",
                      streams:
                        streamer.streams?.map((stream) => ({
                          ...stream,
                          thumbnail: stream.thumbnail || "/favicon.ico",
                          hasEnded: stream.hasEnded || false,
                          title: stream.title || "Untitled Stream",
                        })) || [],
                    }}
                  />
                </div>
              ))}
          </div>

          {visibleDiscoverStreamers < filteredStreamers.length && (
            <div className="flex justify-center mt-6">
              <button
                onClick={loadMoreStreamers}
                className="bg-brandOrange text-brandBlack px-6 py-2 rounded-full hover:opacity-80 transition-opacity text-sm md:text-base"
              >
                Load More
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
