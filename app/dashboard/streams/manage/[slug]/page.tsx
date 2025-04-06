"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
// Import regular Firebase client for client components
import { db } from "@/lib/config/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  onSnapshot,
  collection,
  addDoc,
} from "firebase/firestore";
// Use the client service, not direct server imports
import StreamManager from "@/components/streaming/StreamManager";
import StreamChat from "@/components/streaming/StreamChat";
import DeviceTester from "@/components/streaming/DeviceTester";
import { Button } from "@/components/ui/button";
import {
  Settings,
  RefreshCw,
  AlertCircle,
  Calendar,
  Users,
  DollarSign,
  Clock,
  Bell,
  ChevronUp,
  ArrowUpRight,
  Play,
  StopCircle,
  PlusCircle,
  LinkIcon,
  ExternalLink,
  PenSquare,
  BarChartHorizontal,
  MessageCircleQuestion,
  ListFilter,
  ArrowLeftIcon,
  MessageCircle,
  UserPlus,
  MicOff,
  Ban,
  ShieldCheck,
  Zap,
  BarChart,
  Pause,
  Phone,
  Sparkles,
  MoreVertical,
  X,
  Crown,
  Star,
  Filter,
  Copy,
  Share2,
  ShieldX,
  Wand2,
  Video,
  PieChart,
  Speech,
} from "lucide-react";
// Import Stream type from the models
import { Stream } from "@/lib/models/Stream";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/store/useAuthStore";
import ActivityLog from "@/components/streaming/ActivityLog";
import PollDisplay from "@/components/streaming/PollDisplay";
import HighlightedQuestions from "@/components/streaming/HighlightedQuestions";
import PollModal from "@/components/streaming/PollModal";
import EditStreamModal from "@/components/streaming/EditStreamModal";
import { StreamDuration } from "@/components/streaming/StreamDuration";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import Image from "next/image";

// Mock data for analytics (would be replaced with real data in production)
const mockAnalytics = {
  subscribers: 1254,
  subscribersThisWeek: 25,
  earningsToday: 349.99,
  earningsMonth: 4875.25,
  earningsTotal: 28750.5,
  hoursToday: 1.5,
  hoursWeek: 12.5,
  currentViewers: 0,
  topSessions: [
    {
      id: "1",
      title: "Morning HIIT Challenge",
      viewers: 1250,
      earnings: 450.75,
      date: "2025-03-01",
    },
    {
      id: "2",
      title: "Yoga for Beginners",
      viewers: 985,
      earnings: 320.5,
      date: "2025-03-04",
    },
    {
      id: "3",
      title: "Strength Training 101",
      viewers: 875,
      earnings: 290.25,
      date: "2025-03-06",
    },
  ],
  newSubscribers: [
    {
      id: "1",
      name: "Sarah Johnson",
      avatar: "https://randomuser.me/api/portraits/women/44.jpg",
      date: new Date(Date.now() - 12000000),
    },
    {
      id: "2",
      name: "Mike Peterson",
      avatar: "https://randomuser.me/api/portraits/men/32.jpg",
      date: new Date(Date.now() - 7200000),
    },
    {
      id: "3",
      name: "Emma Williams",
      avatar: "https://randomuser.me/api/portraits/women/63.jpg",
      date: new Date(Date.now() - 3600000),
    },
    {
      id: "4",
      name: "Alex Martinez",
      avatar: "https://randomuser.me/api/portraits/men/91.jpg",
      date: new Date(Date.now() - 1800000),
    },
  ],
  chatHighlights: [
    {
      id: "1",
      user: "TennisLover92",
      message: "Your form cues are amazing! Finally fixed my squat.",
      likes: 24,
    },
    {
      id: "2",
      user: "FitMama2023",
      message: "Can you do more pregnancy-safe modifications next time?",
      likes: 18,
    },
    {
      id: "3",
      user: "RunForever",
      message: "This workout was exactly what I needed today! 🔥",
      likes: 15,
    },
  ],
  pastSessions: [
    {
      id: "1",
      title: "Full Body Workout",
      date: "2025-03-05",
      duration: "45 min",
      viewers: 780,
      earnings: 276.5,
      thumbnail: "https://images.unsplash.com/photo-1549060279-7e168fcee0c2",
    },
    {
      id: "2",
      title: "Meditation & Mindfulness",
      date: "2025-03-02",
      duration: "30 min",
      viewers: 560,
      earnings: 185.75,
      thumbnail: "https://images.unsplash.com/photo-1506126613408-eca07ce68773",
    },
    {
      id: "3",
      title: "Core Strength Focus",
      date: "2025-02-28",
      duration: "50 min",
      viewers: 890,
      earnings: 305.25,
      thumbnail: "https://images.unsplash.com/photo-1516526995003-435ccce2be97",
    },
    {
      id: "4",
      title: "Cardio Blast",
      date: "2025-02-25",
      duration: "40 min",
      viewers: 720,
      earnings: 245.0,
      thumbnail: "https://images.unsplash.com/photo-1538805060514-97d9cc17730c",
    },
  ],
  moderationLogs: [
    {
      id: "1",
      username: "ToxicTroll123",
      action: "Banned",
      duration: "Permanent",
      reason: "Hate speech",
      date: "2025-03-07",
    },
    {
      id: "2",
      username: "SpamBot44",
      action: "Banned",
      duration: "Permanent",
      reason: "Spam",
      date: "2025-03-06",
    },
    {
      id: "3",
      username: "AngryUser22",
      action: "Muted",
      duration: "24 hours",
      reason: "Excessive profanity",
      date: "2025-03-05",
    },
  ],
  chatMessages: 0,
  follows: 0,
};

// Component for Quick Stats Widget (FRD-D1)
const QuickStatsWidget = () => (
  <div className="flex flex-wrap gap-4 mb-6">
    <div className="flex-1 min-w-[200px] bg-gradient-to-r from-brandOrange/90 to-brandOrange/70 rounded-lg p-4 shadow-md">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-brandOrange rounded-lg">
          <Users size={20} className="text-white" />
        </div>
        <div>
          <div className="text-sm text-white">Subscribers</div>
          <div className="text-xl font-bold flex items-center">
            {mockAnalytics.subscribers.toLocaleString()}
            <span className="text-xs bg-green-500/20 text-green-300 px-2 py-0.5 rounded ml-2 flex items-center">
              +{mockAnalytics.subscribersThisWeek} <ChevronUp size={14} />
            </span>
          </div>
        </div>
      </div>
    </div>

    <div className="flex-1 min-w-[200px] bg-gradient-to-r from-blue-900 to-blue-800 rounded-lg p-4 shadow-md">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-700 rounded-lg">
          <DollarSign size={20} className="text-blue-200" />
        </div>
        <div>
          <div className="text-sm text-blue-200">Earnings</div>
          <div className="flex flex-col">
            <span className="text-xl font-bold">
              ${mockAnalytics.earningsMonth.toLocaleString()}
            </span>
            <span className="text-xs text-blue-300">
              Today: ${mockAnalytics.earningsToday.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div className="flex-1 min-w-[200px] bg-gradient-to-r from-amber-900 to-amber-800 rounded-lg p-4 shadow-md">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-amber-700 rounded-lg">
          <Clock size={20} className="text-amber-200" />
        </div>
        <div>
          <div className="text-sm text-amber-200">Hours Streamed</div>
          <div className="flex flex-col">
            <span className="text-xl font-bold">{mockAnalytics.hoursWeek}</span>
            <span className="text-xs text-amber-300">
              Today: {mockAnalytics.hoursToday}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div className="flex-1 min-w-[200px] bg-gradient-to-r from-emerald-900 to-emerald-800 rounded-lg p-4 shadow-md">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-emerald-700 rounded-lg">
          <Zap size={20} className="text-emerald-200" />
        </div>
        <div>
          <div className="text-sm text-emerald-200">Current Viewers</div>
          <div className="text-xl font-bold">
            {mockAnalytics.currentViewers}
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Component for Analytics Chart (FRD-D3)
const AnalyticsChart = () => (
  <div className="bg-gray-800 rounded-lg p-4 mb-6 shadow-md">
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-lg font-bold">Performance Analytics</h3>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-700"
        >
          7 Days
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-700"
        >
          30 Days
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-700 flex items-center"
        >
          <Filter className="w-4 h-4 mr-2" />
          Filter
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-700"
        >
          Export
        </Button>
      </div>
    </div>
    <div className="h-64 bg-gray-900 rounded-lg flex items-center justify-center">
      <div className="flex flex-col items-center text-gray-400">
        <div className="flex items-center gap-4">
          <BarChart size={36} strokeWidth={1} />
          <PieChart size={36} strokeWidth={1} />
        </div>
        <p className="mt-2">Analytics charts will appear here</p>
      </div>
    </div>
  </div>
);

// Component for Top Sessions Widget (FRD-D4)
const TopSessionsWidget = () => (
  <div className="bg-gray-800 rounded-lg p-4 mb-6 shadow-md">
    <h3 className="text-lg font-bold mb-4">Top Performing Sessions</h3>
    <div className="space-y-3">
      {mockAnalytics.topSessions.map((session, index) => (
        <div
          key={session.id}
          className="bg-gray-900 p-3 rounded-lg flex justify-between"
        >
          <div className="flex items-center gap-2">
            <span className="text-brandOrange font-bold">{index + 1}</span>
            <div>
              <h4 className="font-medium">{session.title}</h4>
              <div className="text-xs text-gray-400">{session.date}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-medium">
              ${session.earnings.toLocaleString()}
            </div>
            <div className="text-xs text-gray-400">
              {session.viewers.toLocaleString()} viewers
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Component for Upcoming Sessions Calendar (FRD-D6)
const UpcomingSessionsCalendar = () => (
  <div className="bg-gray-800 rounded-lg p-4 mb-6 shadow-md">
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-lg font-bold">Upcoming Sessions</h3>
      <Button className="bg-brandOrange hover:bg-brandOrange/90 text-white">
        <Calendar className="w-4 h-4 mr-2" />
        Schedule New
      </Button>
    </div>
    <div className="h-64 bg-gray-900 rounded-lg flex items-center justify-center">
      <div className="flex flex-col items-center text-gray-400">
        <Calendar size={48} strokeWidth={1} />
        <p className="mt-2">Your calendar will appear here</p>
      </div>
    </div>
  </div>
);

// Component for Recent Activity (FRD-D8, FRD-D9)
const RecentActivity = () => (
  <div className="bg-gray-800 rounded-lg p-4 mb-6 shadow-md">
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-lg font-bold">Stream Activity</h3>
      <Button variant="ghost" size="icon" className="h-8 w-8">
        <MoreVertical className="h-4 w-4" />
      </Button>
    </div>
    <div className="space-y-3">
      <div className="bg-gray-900 p-3 rounded-lg">
        <div className="flex justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="bg-green-500/20 p-1 rounded-full">
              <Play className="h-3 w-3 text-green-400" />
            </div>
            <span className="text-sm">Stream Started</span>
          </div>
          <span className="text-xs text-gray-400">10:15 AM</span>
        </div>
        <p className="text-xs text-gray-400">
          Your stream went live successfully
        </p>
      </div>

      <div className="bg-gray-900 p-3 rounded-lg">
        <div className="flex justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="bg-orange-500/20 p-1 rounded-full">
              <Pause className="h-3 w-3 text-orange-400" />
            </div>
            <span className="text-sm">Stream Paused</span>
          </div>
          <span className="text-xs text-gray-400">10:45 AM</span>
        </div>
        <p className="text-xs text-gray-400">
          You paused the stream temporarily
        </p>
      </div>

      <div className="bg-gray-900 p-3 rounded-lg">
        <div className="flex justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="bg-blue-500/20 p-1 rounded-full">
              <Phone className="h-3 w-3 text-blue-400" />
            </div>
            <span className="text-sm">Call Received</span>
          </div>
          <span className="text-xs text-gray-400">11:02 AM</span>
        </div>
        <p className="text-xs text-gray-400">
          You accepted a guest call from @FitnessPro
        </p>
      </div>

      <div className="bg-gray-900 p-3 rounded-lg">
        <div className="flex justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="bg-purple-500/20 p-1 rounded-full">
              <Sparkles className="h-3 w-3 text-brandOrange" />
            </div>
            <span className="text-sm">Special Effect Used</span>
          </div>
          <span className="text-xs text-gray-400">11:15 AM</span>
        </div>
        <p className="text-xs text-gray-400">
          Added confetti effect during milestone
        </p>
      </div>

      <div className="bg-gray-900 p-3 rounded-lg">
        <div className="flex justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="bg-red-500/20 p-1 rounded-full">
              <X className="h-3 w-3 text-red-400" />
            </div>
            <span className="text-sm">Stream Ended</span>
          </div>
          <span className="text-xs text-gray-400">11:30 AM</span>
        </div>
        <div className="flex justify-between">
          <p className="text-xs text-gray-400">
            Stream ended successfully after 1h 15m
          </p>
          <button className="text-xs text-blue-400 flex items-center">
            Share <Share2 className="h-3 w-3 ml-1" />
          </button>
        </div>
      </div>

      <div className="bg-gray-900 p-3 rounded-lg">
        <div className="flex justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="bg-yellow-500/20 p-1 rounded-full">
              <Speech className="h-3 w-3 text-yellow-400" />
            </div>
            <span className="text-sm">Auto-Caption Enabled</span>
          </div>
          <span className="text-xs text-gray-400">During Stream</span>
        </div>
        <p className="text-xs text-gray-400">
          Auto-captions were enabled for accessibility
        </p>
      </div>
    </div>
  </div>
);

// Component for Session History (FRD-D10)
const SessionHistory = () => (
  <div className="bg-gray-800 rounded-lg p-4 mb-6 shadow-md">
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-lg font-bold">Session History</h3>
      <Button
        variant="outline"
        className="bg-transparent border-gray-700 text-gray-300 hover:bg-gray-700 text-xs h-8"
      >
        View All <ArrowUpRight className="ml-1 w-3 h-3" />
      </Button>
    </div>
    <div className="space-y-3">
      {mockAnalytics.pastSessions.map((session) => (
        <div
          key={session.id}
          className="flex items-start gap-3 p-3 bg-gray-900 rounded-lg"
        >
          <div className="relative w-20 h-12 overflow-hidden rounded bg-gray-800 flex-shrink-0">
            {session.thumbnail ? (
              <Image
                src={session.thumbnail}
                alt={session.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-800">
                <Video className="w-5 h-5 text-gray-600" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-sm">{session.title}</h4>
            <div className="text-xs text-gray-400 mt-1 flex items-center gap-2">
              <span>{session.date}</span>
              <span>·</span>
              <span>{session.duration}</span>
              <span>·</span>
              <span>{session.viewers} viewers</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium">${session.earnings}</div>
            <div className="text-xs text-gray-400">earnings</div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Component for Moderation Logs (FRD-D7)
const ModerationLogs = () => (
  <div className="bg-gray-800 rounded-lg p-4 mb-6 shadow-md">
    <h3 className="text-lg font-bold mb-4">Moderation Actions</h3>
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-700">
            <th className="text-left py-2 px-3">Username</th>
            <th className="text-left py-2 px-3">Action</th>
            <th className="text-left py-2 px-3">Duration</th>
            <th className="text-left py-2 px-3">Reason</th>
            <th className="text-left py-2 px-3">Date</th>
            <th className="text-left py-2 px-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {mockAnalytics.moderationLogs.map((log) => (
            <tr key={log.id} className="border-b border-gray-700">
              <td className="py-2 px-3">
                <div className="flex items-center gap-1">
                  @{log.username}
                  <button
                    className="text-gray-400 hover:text-white"
                    onClick={() => {
                      navigator.clipboard.writeText(`@${log.username}`);
                      toast.success("Username copied to clipboard");
                    }}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              </td>
              <td className="py-2 px-3">
                <span
                  className={`px-2 py-0.5 rounded-full text-xs ${
                    log.action === "Banned"
                      ? "bg-red-900/30 text-red-300"
                      : "bg-yellow-900/30 text-yellow-300"
                  }`}
                >
                  {log.action}
                </span>
              </td>
              <td className="py-2 px-3">{log.duration}</td>
              <td className="py-2 px-3">{log.reason}</td>
              <td className="py-2 px-3">{log.date}</td>
              <td className="py-2 px-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 bg-transparent hover:bg-gray-700"
                >
                  Reverse
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// Notification bell component (FRD-D2)
const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        className="relative p-2 rounded-full hover:bg-gray-800"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-5 w-5" />
        <span className="absolute -top-1 -right-1 bg-red-500 rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
          3
        </span>
      </button>
      {isOpen && (
        <div className="absolute right-0 top-10 w-80 bg-gray-800 rounded-lg shadow-lg p-2 z-50">
          <div className="p-3 border-b border-gray-700">
            <h4 className="font-medium">Notifications</h4>
          </div>
          <div className="max-h-64 overflow-y-auto">
            <div className="p-3 hover:bg-gray-700 rounded-lg flex gap-3 cursor-pointer">
              <div className="bg-blue-500/20 p-2 rounded-full">
                <MessageCircle className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <p className="text-sm">New comment on your stream</p>
                <p className="text-xs text-gray-400">2 minutes ago</p>
              </div>
            </div>
            <div className="p-3 hover:bg-gray-700 rounded-lg flex gap-3 cursor-pointer">
              <div className="bg-purple-500/20 p-2 rounded-full">
                <Crown className="h-4 w-4 text-purple-400" />
              </div>
              <div>
                <p className="text-sm">New VIP subscriber</p>
                <p className="text-xs text-gray-400">1 hour ago</p>
              </div>
            </div>
            <div className="p-3 hover:bg-gray-700 rounded-lg flex gap-3 cursor-pointer">
              <div className="bg-yellow-500/20 p-2 rounded-full">
                <Star className="h-4 w-4 text-yellow-400" />
              </div>
              <div>
                <p className="text-sm">You received a 5-star rating</p>
                <p className="text-xs text-gray-400">Yesterday</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Main component
export default function ManageStreamPage() {
  const pathname = usePathname();
  const slug = pathname?.split("/").pop() || "";
  const { currentUser } = useAuthStore();

  const [stream, setStream] = useState<Stream | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeviceTester, setShowDeviceTester] = useState(false);
  const [shouldStartStreamAfterTest, setShouldStartStreamAfterTest] =
    useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "overview" | "chat" | "activity" | "polls" | "questions"
  >("overview");
  const [isPollModalOpen, setIsPollModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [moderationTarget, setModerationTarget] = useState<{
    username: string;
    userId: string;
  } | null>(null);

  const streamManagerRef = useRef<{ startStream: () => Promise<void> } | null>(
    null
  );

  // Use currentUser to avoid lint error
  useEffect(() => {
    if (currentUser) {
      console.log("Managing stream for user:", currentUser.uid);
    }
  }, [currentUser]);

  // Function to fetch stream data wrapped in useCallback
  const fetchStream = useCallback(async () => {
    try {
      setLoading(true);
      const streamDocRef = doc(db, "streams", slug);
      const streamSnapshot = await getDoc(streamDocRef);

      if (!streamSnapshot.exists()) {
        setError("Stream not found");
        setStream(null);
      } else {
        setStream({
          id: streamSnapshot.id,
          ...streamSnapshot.data(),
        } as Stream);
      }
    } catch (err) {
      console.error("Error fetching stream:", err);
      setError("Error fetching stream details");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    // Fetch the stream data from Firestore client-side
    fetchStream();

    // Set up real-time listener for stream updates
    const streamDocRef = doc(db, "streams", slug);
    const unsubscribe = onSnapshot(streamDocRef, (snapshot) => {
      if (snapshot.exists()) {
        setStream({
          id: snapshot.id,
          ...snapshot.data(),
        } as Stream);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [fetchStream, slug]);

  const handleStartStream = () => {
    // If device tester hasn't been shown yet, show it first and flag to start streaming after
    if (!localStorage.getItem("deviceSettings")) {
      setShowDeviceTester(true);
      setShouldStartStreamAfterTest(true);
      return;
    }

    // Start stream
    startStream();
  };

  const startStream = async () => {
    try {
      if (!stream?.id) return;

      const streamDocRef = doc(db, "streams", stream.id);
      await updateDoc(streamDocRef, {
        hasStarted: true,
        hasEnded: false,
        startedAt: serverTimestamp(),
        lastUpdated: serverTimestamp(),
        audioMuted: false,
        cameraOff: false,
      });

      // Call the internal startStream method of StreamManager
      if (typeof streamManagerRef.current?.startStream === "function") {
        await streamManagerRef.current.startStream();
      }

      setStream((prev) => (prev ? { ...prev, hasStarted: true } : null));
      toast.success("Stream started successfully!");
      setConnectionError(null);
    } catch (error) {
      console.error("Error starting stream:", error);
      toast.error("Failed to start the stream. Please try again.");
      setConnectionError("Failed to start stream. Please retry.");
    }
  };

  const handleEndStream = async () => {
    if (!window.confirm("Are you sure you want to end the stream?")) {
      return;
    }

    try {
      if (!stream?.id) return;

      const streamDocRef = doc(db, "streams", stream.id);
      await updateDoc(streamDocRef, {
        hasEnded: true,
        endedAt: serverTimestamp(),
        lastUpdated: serverTimestamp(),
      });

      setStream((prev) => (prev ? { ...prev, hasEnded: true } : null));
      toast.success("Stream ended successfully!");
    } catch (error) {
      console.error("Error ending stream:", error);
      toast.error("Failed to end the stream. Please try again.");
    }
  };

  const handleRetryConnection = async () => {
    setIsRetrying(true);
    try {
      await startStream();
      setConnectionError(null);
    } catch (error) {
      console.error("Error retrying connection:", error);
      setConnectionError("Connection attempt failed. Please try again.");
    } finally {
      setIsRetrying(false);
    }
  };

  const handleDeviceTestComplete = () => {
    setShowDeviceTester(false);

    // If we should start streaming after device test
    if (shouldStartStreamAfterTest) {
      setShouldStartStreamAfterTest(false);
      startStream();
    }
  };

  const handleEditStream = () => {
    setIsEditModalOpen(true);
  };

  const handleCreatePoll = () => {
    setIsPollModalOpen(true);
  };

  const handleChatUserClick = (username: string, userId: string) => {
    setModerationTarget({ username, userId });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brandBlack text-brandWhite">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-brandOrange border-brandOrange/30 mb-4"></div>
          <p>Loading stream details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brandBlack text-brandWhite">
        <div className="text-center p-8">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">{error}</h2>
          <p className="text-gray-400 mb-6">
            The stream you&apos;re looking for doesn&apos;t exist or you
            don&apos;t have permission to access it.
          </p>
          <Link href="/dashboard">
            <Button>
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!stream) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brandBlack text-brandWhite">
        <div className="text-center p-8">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Stream Not Found</h2>
          <p className="text-gray-400 mb-6">
            The stream you&apos;re looking for doesn&apos;t exist or you
            don&apos;t have permission to access it.
          </p>
          <Link href="/dashboard">
            <Button>
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const isStreamLive = stream.hasStarted && !stream.hasEnded;
  const isStreamScheduled = !stream.hasStarted && stream.scheduledAt;
  const isStreamEnded = stream.hasEnded;

  return (
    <div className="min-h-screen bg-brandBlack text-brandWhite">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link
                href="/dashboard"
                className="text-gray-400 hover:text-white"
              >
                Dashboard
              </Link>
              <span className="text-gray-600">/</span>
              <span>Stream Manager</span>
            </div>
            <h1 className="text-2xl font-bold">{stream.title}</h1>
            <div className="flex items-center mt-1">
              {isStreamLive ? (
                <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full text-xs flex items-center">
                  <span className="w-2 h-2 rounded-full bg-red-500 mr-1.5 animate-pulse"></span>
                  Live
                </span>
              ) : isStreamScheduled ? (
                <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full text-xs flex items-center">
                  <span className="w-2 h-2 rounded-full bg-blue-500 mr-1.5"></span>
                  Scheduled
                </span>
              ) : isStreamEnded ? (
                <span className="bg-gray-500/20 text-gray-400 px-2 py-0.5 rounded-full text-xs flex items-center">
                  <span className="w-2 h-2 rounded-full bg-gray-500 mr-1.5"></span>
                  Ended
                </span>
              ) : (
                <span className="bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full text-xs flex items-center">
                  <span className="w-2 h-2 rounded-full bg-yellow-500 mr-1.5"></span>
                  Ready
                </span>
              )}
              {isStreamLive && (
                <div className="ml-4 text-sm flex items-center">
                  <StreamDuration startTime={stream.startedAt || null} />
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!isStreamEnded && (
              <>
                <Button
                  variant="outline"
                  className="bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800"
                  onClick={() => setShowDeviceTester(true)}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Device Settings
                </Button>

                <Button
                  variant="outline"
                  className="bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800"
                  onClick={handleEditStream}
                >
                  <PenSquare className="w-4 h-4 mr-2" />
                  Edit Stream
                </Button>
              </>
            )}

            {!isStreamLive && !isStreamEnded && (
              <Button
                className="bg-brandOrange hover:bg-brandOrange/90 text-white"
                onClick={handleStartStream}
              >
                <Play className="w-4 h-4 mr-2" />
                {isStreamScheduled
                  ? "Start Scheduled Stream"
                  : "Start Streaming"}
              </Button>
            )}

            {isStreamLive && (
              <Button
                variant="destructive"
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={handleEndStream}
              >
                <StopCircle className="w-4 h-4 mr-2" />
                End Stream
              </Button>
            )}
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left column - Stream preview and controls */}
          <div className="lg:w-2/3">
            <div className="bg-gray-900 rounded-lg overflow-hidden mb-6">
              {showDeviceTester ? (
                <DeviceTester
                  onComplete={handleDeviceTestComplete}
                  className="min-h-[500px]"
                />
              ) : (
                <div className="relative">
                  <StreamManager
                    ref={streamManagerRef}
                    stream={stream}
                    className="min-h-[500px]"
                  />

                  {/* Connection error overlay */}
                  {connectionError && (
                    <div className="absolute inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center z-10">
                      <div className="w-16 h-16 rounded-full bg-gray-800 mb-6 mx-auto flex items-center justify-center">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                      </div>
                      <div className="text-xl font-bold mb-4 text-red-500">
                        Connection Error
                      </div>
                      <div className="text-gray-300 text-center max-w-md mb-6">
                        {connectionError}
                      </div>
                      <Button
                        onClick={handleRetryConnection}
                        className="flex items-center gap-2"
                        disabled={isRetrying}
                      >
                        {isRetrying ? (
                          "Retrying..."
                        ) : (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Retry Connection
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {!showDeviceTester && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                  <div className="flex items-center mb-2">
                    <Users className="w-5 h-5 text-blue-400 mr-2" />
                    <span className="font-medium">Viewers</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {mockAnalytics.currentViewers}
                  </div>
                </div>

                <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                  <div className="flex items-center mb-2">
                    <MessageCircle className="w-5 h-5 text-purple-400 mr-2" />
                    <span className="font-medium">Chat Messages</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {mockAnalytics.chatMessages}
                  </div>
                </div>

                <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                  <div className="flex items-center mb-2">
                    <UserPlus className="w-5 h-5 text-green-400 mr-2" />
                    <span className="font-medium">New Followers</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {mockAnalytics.follows}
                  </div>
                </div>
              </div>
            )}

            {/* Tab navigation */}
            <div className="flex border-b border-gray-800 mb-4">
              <button
                onClick={() => setActiveTab("overview")}
                className={`py-2 px-4 font-medium text-sm ${
                  activeTab === "overview"
                    ? "border-b-2 border-brandOrange text-brandOrange"
                    : "text-gray-400 hover:text-gray-300"
                }`}
              >
                <BarChart className="w-4 h-4 inline-block mr-2" />
                Overview
              </button>
              <button
                onClick={() => setActiveTab("chat")}
                className={`py-2 px-4 font-medium text-sm ${
                  activeTab === "chat"
                    ? "border-b-2 border-brandOrange text-brandOrange"
                    : "text-gray-400 hover:text-gray-300"
                }`}
              >
                <MessageCircle className="w-4 h-4 inline-block mr-2" />
                Chat
              </button>
              <button
                onClick={() => setActiveTab("activity")}
                className={`py-2 px-4 font-medium text-sm ${
                  activeTab === "activity"
                    ? "border-b-2 border-brandOrange text-brandOrange"
                    : "text-gray-400 hover:text-gray-300"
                }`}
              >
                <ListFilter className="w-4 h-4 inline-block mr-2" />
                Activity Log
              </button>
              <button
                onClick={() => setActiveTab("polls")}
                className={`py-2 px-4 font-medium text-sm ${
                  activeTab === "polls"
                    ? "border-b-2 border-brandOrange text-brandOrange"
                    : "text-gray-400 hover:text-gray-300"
                }`}
              >
                <BarChartHorizontal className="w-4 h-4 inline-block mr-2" />
                Polls
              </button>
              <button
                onClick={() => setActiveTab("questions")}
                className={`py-2 px-4 font-medium text-sm ${
                  activeTab === "questions"
                    ? "border-b-2 border-brandOrange text-brandOrange"
                    : "text-gray-400 hover:text-gray-300"
                }`}
              >
                <MessageCircleQuestion className="w-4 h-4 inline-block mr-2" />
                Questions
              </button>
            </div>

            {/* Tab content */}
            <div className="min-h-[400px]">
              {activeTab === "overview" && (
                <>
                  <div className="bg-gray-900 rounded-lg p-4 border border-gray-800 mb-6">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                      <div className="flex-1">
                        <h2 className="text-xl font-bold text-white">
                          {stream.title}
                        </h2>
                        <p className="text-gray-400 text-sm mt-1">
                          {stream.description || "No description set"}
                        </p>
                        <div className="mt-3">
                          <div className="text-gray-400 text-sm mb-1">
                            Category: {stream.category || "Not set"}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {stream.tags && stream.tags.length > 0 ? (
                              stream.tags.map((tag, index) => (
                                <span
                                  key={index}
                                  className="bg-gray-800 text-gray-300 px-2 py-1 rounded text-xs"
                                >
                                  #{tag}
                                </span>
                              ))
                            ) : (
                              <span className="text-gray-400 text-sm">
                                No tags set
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div>
                        <Button
                          variant="outline"
                          className="text-sm bg-transparent border-gray-700 hover:bg-gray-800"
                          onClick={handleEditStream}
                          disabled={stream.hasEnded}
                        >
                          <PenSquare className="w-4 h-4 mr-2" />
                          Update Stream Info
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Add the notification bell to the top of the overview */}
                  <div className="flex justify-end mb-4">
                    <NotificationBell />
                  </div>

                  {/* Add Quick Stats */}
                  <QuickStatsWidget />

                  {/* Add Analytics Chart */}
                  <AnalyticsChart />

                  {/* Add additional components in a grid layout */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <TopSessionsWidget />
                    <ModerationLogs />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <SessionHistory />
                    <div className="space-y-6">
                      <RecentActivity />
                      <UpcomingSessionsCalendar />
                    </div>
                  </div>
                </>
              )}

              {activeTab === "chat" && (
                <div className="h-[400px]">
                  <StreamChat
                    streamId={stream.id}
                    className="h-full"
                    onUserClick={handleChatUserClick}
                  />
                </div>
              )}

              {activeTab === "activity" && (
                <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800 mt-6">
                  <div className="p-3 border-b border-gray-800">
                    <h3 className="font-medium">Activity Log</h3>
                  </div>
                  <ActivityLog
                    streamId={stream.id}
                    className="h-[400px] overflow-y-auto"
                    maxItems={20}
                  />
                </div>
              )}

              {activeTab === "polls" && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">Polls</h3>
                    <Button
                      variant="default"
                      size="sm"
                      className="bg-brandOrange hover:bg-brandOrange/90 text-white"
                      onClick={handleCreatePoll}
                    >
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Create Poll
                    </Button>
                  </div>
                  <PollDisplay streamId={stream.id} isStreamer={true} />
                </div>
              )}

              {activeTab === "questions" && (
                <HighlightedQuestions streamId={stream.id} isStreamer={true} />
              )}
            </div>
          </div>

          {/* Right column - Chat and stream info */}
          <div className="lg:w-1/3 space-y-6">
            {!showDeviceTester && (
              <>
                <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                  <h3 className="text-lg font-bold mb-4">Stream Status</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status</span>
                      <span className="font-medium">
                        {isStreamLive ? (
                          <span className="text-green-500">Live</span>
                        ) : isStreamScheduled ? (
                          <span className="text-blue-400">Scheduled</span>
                        ) : isStreamEnded ? (
                          <span className="text-red-400">Ended</span>
                        ) : (
                          <span className="text-yellow-400">Ready</span>
                        )}
                      </span>
                    </div>

                    {isStreamLive && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Duration</span>
                        <span className="font-medium">
                          <StreamDuration
                            startTime={stream.startedAt || null}
                          />
                        </span>
                      </div>
                    )}

                    {isStreamScheduled && stream.scheduledAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Scheduled For</span>
                        <span className="font-medium">
                          {stream.scheduledAt.toDate().toLocaleString()}
                        </span>
                      </div>
                    )}

                    {stream.startedAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Started At</span>
                        <span className="font-medium">
                          {stream.startedAt.toDate().toLocaleString()}
                        </span>
                      </div>
                    )}

                    {isStreamEnded && stream.endedAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Ended At</span>
                        <span className="font-medium">
                          {stream.endedAt.toDate().toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                  <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      className="w-full bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800 justify-start"
                      onClick={handleCreatePoll}
                    >
                      <BarChartHorizontal className="w-4 h-4 mr-2" />
                      Create Poll
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800 justify-start"
                      onClick={handleEditStream}
                    >
                      <PenSquare className="w-4 h-4 mr-2" />
                      Edit Stream Info
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800 justify-start"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          `https://celebfitlife.com/streaming/live/${stream.slug}`
                        );
                        toast.success("Stream URL copied to clipboard");
                      }}
                    >
                      <LinkIcon className="w-4 h-4 mr-2" />
                      Copy Stream URL
                    </Button>

                    <Link
                      href={`/streaming/live/${stream.slug}`}
                      target="_blank"
                      className="w-full"
                    >
                      <Button
                        variant="outline"
                        className="w-full bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800 justify-start"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open Viewer Page
                      </Button>
                    </Link>
                  </div>
                </div>
              </>
            )}

            <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800 h-[400px]">
              <div className="p-3 border-b border-gray-800">
                <h3 className="font-medium">Live Chat</h3>
              </div>
              <StreamChat
                streamId={stream.id}
                className="h-[calc(100%-44px)]"
                onUserClick={handleChatUserClick}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <EditStreamModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        stream={stream}
        onSuccess={fetchStream}
      />

      <PollModal
        isOpen={isPollModalOpen}
        onClose={() => setIsPollModalOpen(false)}
        stream={stream}
      />

      {moderationTarget && (
        <ModerateUserModal
          isOpen={!!moderationTarget}
          onClose={() => setModerationTarget(null)}
          username={moderationTarget.username}
          userId={moderationTarget.userId}
          streamId={stream.id}
        />
      )}
    </div>
  );
}

function ModerateUserModal({
  isOpen,
  onClose,
  username,
  userId,
  streamId,
}: {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  userId: string;
  streamId: string;
}) {
  const { currentUser } = useAuthStore();

  const handleAction = async (
    action: "mute" | "unmute" | "ban" | "unban" | "makeAdmin" | "removeAdmin"
  ) => {
    try {
      // Log the userId being moderated
      console.log(`Moderating user: ${username} (${userId})`);

      // Add activity log entry for the moderation action
      const activityRef = collection(db, `streams/${streamId}/activity`);
      await addDoc(activityRef, {
        type: action,
        username: username,
        userId: userId,
        performedBy: currentUser?.username || "Streamer",
        timestamp: serverTimestamp(),
      });

      // Here you would update user permissions in a real implementation
      // This would typically be done through a Firebase function

      toast.success(
        `${username} has been ${
          action === "mute"
            ? "muted"
            : action === "ban"
            ? "banned"
            : action === "makeAdmin"
            ? "made admin"
            : "updated"
        }`
      );
      onClose();
    } catch (error) {
      console.error(`Error ${action} user:`, error);
      toast.error(`Failed to ${action} user. Please try again.`);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-brandBlack border-gray-800 text-brandWhite">
        <DialogHeader>
          <DialogTitle className="text-xl text-brandOrange font-bold">
            Moderate User: {username}
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <div className="space-y-3">
            <Button
              onClick={() => handleAction("mute")}
              className="w-full bg-brandOrange hover:bg-brandOrange/90 text-white"
            >
              <MicOff className="mr-2 h-4 w-4" />
              Mute User
            </Button>
            <Button
              onClick={() => handleAction("ban")}
              className="w-full bg-red-800 hover:bg-red-700 text-white"
            >
              <Ban className="mr-2 h-4 w-4" />
              Ban User
            </Button>
            <Button
              onClick={() => handleAction("makeAdmin")}
              className="w-full bg-blue-800 hover:bg-blue-700 text-white"
            >
              <ShieldCheck className="mr-2 h-4 w-4" />
              Make Admin
            </Button>
            <Button
              onClick={() => handleAction("removeAdmin")}
              className="w-full bg-gray-800 hover:bg-gray-700 text-white"
            >
              <ShieldX className="mr-2 h-4 w-4" />
              Remove Admin
            </Button>
            <Button
              onClick={() => toast.info("AI Moderation settings updated")}
              className="w-full bg-purple-800 hover:bg-purple-700 text-white"
            >
              <Wand2 className="mr-2 h-4 w-4" />
              Enable AI Moderation
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
