"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import {
  Menu,
  X,
  Bell,
  LogOut,
  Settings,
  User,
  MessageSquare,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/lib/store/useAuthStore";
import type { StreamDoc } from "@/lib/types/streaming.types";

/**
 * Returns a thumbnail URL for a given stream, using a static Unsplash image if none is provided.
 * @param stream - The stream object (StreamDoc)
 * @returns The thumbnail URL string
 */
export function getStreamThumbnail(stream: StreamDoc): string {
  if (stream.thumbnail) return stream.thumbnail;
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
}

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser, clearUser } = useAuthStore();

  // --- Dashboard Header State ---
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationsDropdownRef = useRef<HTMLDivElement>(null);

  // Fake notifications for demo
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
      prev.map((notification) => ({ ...notification, isRead: true }))
    );
  };

  // --- Dashboard Profile Dropdown ---
  const isUserAdmin = currentUser?.role?.admin || false;
  const handleLogout = async () => {
    try {
      if (!currentUser) return;
      clearUser();
      import("@/lib/helpers/auth").then(({ logout }) => {
        logout();
      });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };
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

  // --- Route Logic ---
  const isLandingOrAuth =
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/(auth)");

  // --- Landing/Auth Header ---
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const openMobileMenu = () => {
    setShowMobileMenu(true);
    requestAnimationFrame(() => {
      setMobileMenuOpen(true);
    });
  };
  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    setTimeout(() => {
      setShowMobileMenu(false);
    }, 300);
  };
  const toggleMobileMenu = () => {
    if (isMobileMenuOpen) {
      closeMobileMenu();
    } else {
      openMobileMenu();
    }
  };
  const handleLogoClick = () => {
    setMobileMenuOpen(false);
    setShowMobileMenu(false);
    router.push("/");
  };

  if (isLandingOrAuth) {
    return (
      <header className="bg-blue-900 border-b-2 border-brandOrange p-4 flex items-center justify-between relative">
        {/* Logo and Title */}
        <div
          className="flex items-center space-x-4 cursor-pointer"
          onClick={handleLogoClick}
        >
          <div>
            <Image
              src="/og-image.jpg"
              alt="CelebFitLife Logo"
              width={100}
              height={100}
              className="w-12 h-12 object-contain "
            />
          </div>
          <h1 className="text-2xl font-bold text-brandOrange">CelebFitLife</h1>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex space-x-4">
          <Link
            href="/login"
            className="transition-colors duration-300 text-brandWhite hover:text-brandOrange"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="transition-colors duration-300 text-brandWhite hover:text-brandOrange"
          >
            Sign Up
          </Link>
          <Link
            href="/#contact"
            className="transition-colors duration-300 text-brandWhite hover:text-brandOrange"
          >
            Contact
          </Link>
        </nav>

        {/* Mobile Hamburger Icon */}
        <div className="md:hidden">
          <button
            onClick={toggleMobileMenu}
            className="text-brandOrange focus:outline-none"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation Overlay */}
        {showMobileMenu && (
          <div
            className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-brandBlack bg-opacity-95 transition-opacity duration-300 ${
              isMobileMenuOpen ? "opacity-100" : "opacity-0"
            } space-y-12`}
          >
            <button
              onClick={toggleMobileMenu}
              className="absolute top-4 right-4 text-brandOrange focus:outline-none"
            >
              <X size={30} />
            </button>
            <Link
              href="/login"
              className="text-2xl text-brandWhite transition-colors duration-300 hover:text-brandOrange"
              onClick={closeMobileMenu}
            >
              Login
            </Link>
            <Link
              href="/register"
              className="text-2xl text-brandWhite transition-colors duration-300 hover:text-brandOrange"
              onClick={closeMobileMenu}
            >
              Sign Up
            </Link>
            <Link
              href="#contact"
              className="text-2xl text-brandWhite transition-colors duration-300 hover:text-brandOrange"
              onClick={closeMobileMenu}
            >
              Contact
            </Link>
          </div>
        )}
      </header>
    );
  }

  // --- Dashboard Header ---
  return (
    <header className="bg-blue-900 border-b-2 border-brandOrange shadow-lg">
      <div className="container mx-auto px-4 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
          <h1 className="text-2xl font-bold text-brandOrange">
            Streamer Dashboard
          </h1>

          <div className="flex items-center space-x-4">
            <div className="relative" ref={notificationsDropdownRef}>
              <Button
                variant="outline"
                size="sm"
                className="bg-brandBlack border-brandOrange hover:bg-brandOrange/20 text-brandWhite relative"
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              >
                <Bell className="h-4 w-4 mr-2 text-brandOrange" />
                <span className="hidden sm:inline">Notifications</span>
                <span className="absolute -top-1 -right-1 bg-brandOrange text-xs text-white rounded-full h-4 w-4 flex items-center justify-center">
                  3
                </span>
              </Button>

              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-brandBlack border border-brandOrange rounded-md shadow-lg z-50">
                  <div className="p-3 border-b border-brandOrange flex justify-between items-center">
                    <h3 className="font-medium text-brandWhite">
                      Notifications
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-brandOrange hover:text-brandWhite p-1 h-auto"
                      onClick={handleMarkAllAsRead}
                    >
                      Mark all as read
                    </Button>
                  </div>
                  <div className="max-h-96 overflow-y-auto py-1">
                    {fakeNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 hover:bg-brandBlack border-l-2 ${
                          notification.isRead
                            ? "border-transparent"
                            : "border-brandOrange"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium text-sm text-brandWhite">
                            {notification.title}
                          </h4>
                          <span className="text-xs text-brandGray">
                            {notification.time}
                          </span>
                        </div>
                        <p className="text-xs text-brandGray mt-1">
                          {notification.message}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="p-2 border-t border-brandOrange text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-brandGray w-full hover:text-brandOrange"
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
                    className="relative rounded-full hover:bg-brandBlack p-0"
                  >
                    <div className="relative h-9 w-9 sm:h-10 sm:w-10 overflow-hidden rounded-full border-2 border-brandOrange">
                      <Image
                        src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&crop=faces&fit=crop&auto=format&q=80"
                        alt="Profile picture"
                        width={40}
                        height={40}
                        className="rounded-full object-cover"
                        priority
                      />
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-brandBlack"></span>
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
  );
}
