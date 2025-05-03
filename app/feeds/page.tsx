"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Heart,
  MessageCircle,
  Share2,
  Send,
  Image as ImageIcon,
  MoreHorizontal,
  Dumbbell,
  Timer,
  Trophy,
  Target,
  Plus,
  Users,
  TrendingUp,
  BarChart2,
  Search,
  Bell,
  User,
  Settings,
  MessageSquare,
  LogOut,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Post, Comment } from "@/lib/types/feed";
import Header from "@/components/layout/Header";

export default function FeedsPage() {
  const { currentUser } = useAuthStore();
  const [newPost, setNewPost] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<Post["category"]>("workout");
  const [showPostModal, setShowPostModal] = useState(false);
  const [workoutDuration, setWorkoutDuration] = useState("");
  const [calories, setCalories] = useState("");
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationsDropdownRef = useRef<HTMLDivElement>(null);

  // Close notifications dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notificationsDropdownRef.current &&
        !notificationsDropdownRef.current.contains(event.target as Node)
      ) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const [posts, setPosts] = useState<Post[]>([
    {
      id: "1",
      user: {
        name: "Sarah Fitness",
        image:
          "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&crop=faces&fit=crop&auto=format&q=80",
        username: "@sarahfit",
        isStreamer: true,
      },
      content:
        "Crushed a 45-minute HIIT session! 💪 Burned 500 calories and feeling unstoppable. Join my next live stream for more intense workouts!",
      image:
        "https://images.unsplash.com/photo-1601422407692-ec4eeec1d9b3?w=800&auto=format&q=80",
      likes: 128,
      comments: 32,
      timestamp: "2 hours ago",
      isLiked: false,
      category: "workout",
      metrics: {
        duration: "45 min",
        calories: 500,
        exercises: ["Burpees", "Mountain Climbers", "Jump Squats"],
      },
    },
    {
      id: "2",
      user: {
        name: "Yoga Master",
        image:
          "https://images.unsplash.com/photo-1607346256330-dee7af15f7c5?w=150&h=150&crop=faces&fit=crop&auto=format&q=80",
        username: "@yogamaster",
        isStreamer: true,
      },
      content:
        "🎯 Monthly Goal Update: 20 meditation sessions completed! Remember, mental fitness is just as important as physical fitness.",
      likes: 95,
      comments: 18,
      timestamp: "4 hours ago",
      isLiked: true,
      category: "achievement",
      metrics: {
        duration: "300 min",
      },
    },
  ]);

  const [comments] = useState<Comment[]>([
    {
      id: "1",
      user: {
        name: "John Doe",
        image:
          "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150&h=150&crop=faces&fit=crop&auto=format&q=80",
      },
      content:
        "This is exactly what I needed! Can't wait for the next session.",
      timestamp: "1 hour ago",
    },
    {
      id: "2",
      user: {
        name: "Emma Wilson",
        image:
          "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&crop=faces&fit=crop&auto=format&q=80",
      },
      content: "Your sessions are always so inspiring! 🙌",
      timestamp: "30 minutes ago",
    },
  ]);

  const [notifications] = useState([
    {
      id: 1,
      title: "Sarah Fitness is live!",
      message: "Join her HIIT workout session now",
      time: "2 min ago",
      type: "live",
    },
    {
      id: 2,
      title: "New follower",
      message: "Mike Strength started following you",
      time: "1 hour ago",
      type: "follow",
    },
    {
      id: 3,
      title: "Yoga Master posted",
      message: "Check out their latest achievement",
      time: "3 hours ago",
      type: "post",
    },
  ]);

  const handlePostSubmit = () => {
    if (!newPost.trim() || !currentUser) return;

    const post: Post = {
      id: Date.now().toString(),
      user: {
        name: currentUser.username || "Anonymous",
        image: "/images/default-avatar.png",
        username: currentUser.username || "@anonymous",
        isStreamer: currentUser.role?.streamer || false,
      },
      content: newPost,
      likes: 0,
      comments: 0,
      timestamp: "Just now",
      isLiked: false,
      category: selectedCategory,
      metrics:
        selectedCategory === "workout"
          ? {
              duration: workoutDuration,
              calories: parseInt(calories),
            }
          : undefined,
    };

    setPosts([post, ...posts]);
    setNewPost("");
    setShowPostModal(false);
    setWorkoutDuration("");
    setCalories("");
  };

  const toggleLike = (postId: string) => {
    setPosts(
      posts.map((post) => {
        if (post.id === postId) {
          return {
            ...post,
            isLiked: !post.isLiked,
            likes: post.isLiked ? post.likes - 1 : post.likes + 1,
          };
        }
        return post;
      })
    );
  };

  const getCategoryIcon = (category: Post["category"]) => {
    switch (category) {
      case "workout":
        return <Dumbbell className="w-5 h-5 text-purple-500" />;
      case "achievement":
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case "motivation":
        return <Target className="w-5 h-5 text-blue-500" />;
      case "nutrition":
        return <Timer className="w-5 h-5 text-green-500" />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-brandBlack text-brandWhite font-inter">
      <Header />
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="flex items-center justify-between p-4 md:p-6 bg-black border-b border-orange-500/30">
        <div className="flex items-center gap-6">
          <div className="relative w-full max-w-md">
            <input
              type="text"
              placeholder="Search fitness content, streamers, or topics..."
              className="w-full px-4 py-2 bg-[#111827] border border-gray-700 text-white rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-500 w-5 h-5" />
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              href="/streaming"
              className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
            >
              Streaming
            </Link>
            <Link
              href="/feeds"
              className="text-sm font-medium text-orange-500 hover:text-orange-400 transition-colors"
            >
              Feeds
            </Link>
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <div className="relative" ref={notificationsDropdownRef}>
            <Button
              variant="outline"
              size="sm"
              className="bg-gray-700 hover:bg-gray-600 text-white relative"
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            >
              <Bell className="h-4 w-4 mr-2 text-orange-500" />
              <span className="hidden sm:inline">Notifications</span>
              <span className="absolute -top-1 -right-1 bg-red-500 text-xs text-white rounded-full h-4 w-4 flex items-center justify-center">
                3
              </span>
            </Button>

            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-50">
                <div className="p-3 border-b border-gray-700">
                  <h3 className="font-medium">Notifications</h3>
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
                    src="/images/default-avatar.png"
                    alt={currentUser?.username || "User"}
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
                  <Link href="/profile">Profile</Link>
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
                <DropdownMenuItem className="text-red-400 hover:bg-gray-700 cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Sidebar - Popular Streamers */}
          <div className="col-span-3">
              <div className="bg-blue-900 rounded-xl p-4 border border-orange-500/20 sticky top-4">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-orange-500" />
                Popular Streamers
              </h2>
              <div className="space-y-4">
                {[
                  {
                    name: "Sarah Fitness",
                    image:
                      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&crop=faces&fit=crop&auto=format&q=80",
                    viewers: 1234,
                    isLive: true,
                    category: "HIIT Workout",
                  },
                  {
                    name: "Yoga Master",
                    image:
                      "https://images.unsplash.com/photo-1607346256330-dee7af15f7c5?w=150&h=150&crop=faces&fit=crop&auto=format&q=80",
                    viewers: 856,
                    isLive: true,
                    category: "Yoga Flow",
                  },
                  {
                    name: "Mike Strength",
                    image:
                      "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150&h=150&crop=faces&fit=crop&auto=format&q=80",
                    viewers: 2341,
                    isLive: false,
                    category: "Weight Training",
                  },
                ].map((streamer, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="relative">
                      <Image
                        src={streamer.image}
                        alt={streamer.name}
                        width={48}
                        height={48}
                        className="rounded-full"
                      />
                      {streamer.isLive && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-gray-900 animate-pulse" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-white truncate">
                        {streamer.name}
                      </h3>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-400">
                          {streamer.category}
                        </span>
                        {streamer.isLive && (
                          <>
                            <span className="text-red-500">•</span>
                            <span className="text-red-500">
                              {streamer.viewers} watching
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="col-span-6">
            {/* Motivational Quote */}
            <div className="mb-6 text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                  className="bg-blue-900 rounded-xl p-6 border border-orange-500/20"
              >
                <motion.h2
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl font-bold text-white mb-2"
                >
                  &ldquo;Your body can stand almost anything. It&apos;s your
                  mind you have to convince.&rdquo;
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-gray-400"
                >
                  - Anonymous
                </motion.p>
              </motion.div>
            </div>

            {/* Create Post Button */}
            <Dialog open={showPostModal} onOpenChange={setShowPostModal}>
              <DialogTrigger asChild>
                <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white mb-6">
                  <Plus className="w-4 h-4 mr-2" />
                  Share Your Fitness Journey
                </Button>
              </DialogTrigger>
                <DialogContent className="bg-blue-900 border border-orange-500/20">
                <DialogHeader>
                    <DialogTitle className="text-white">
                      Create Post
                    </DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Share your workout, achievement, or motivation with the
                    community
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label className="text-white mb-2 block">Category</Label>
                    <RadioGroup
                      value={selectedCategory}
                      onValueChange={(value) =>
                        setSelectedCategory(value as Post["category"])
                      }
                      className="flex space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="workout" id="workout" />
                        <Label htmlFor="workout" className="text-white">
                          Workout
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                          <RadioGroupItem
                            value="achievement"
                            id="achievement"
                          />
                        <Label htmlFor="achievement" className="text-white">
                          Achievement
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="motivation" id="motivation" />
                        <Label htmlFor="motivation" className="text-white">
                          Motivation
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="nutrition" id="nutrition" />
                        <Label htmlFor="nutrition" className="text-white">
                          Nutrition
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {selectedCategory === "workout" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="duration" className="text-white">
                          Duration
                        </Label>
                        <Input
                          id="duration"
                          placeholder="e.g., 45 min"
                          value={workoutDuration}
                          onChange={(e) => setWorkoutDuration(e.target.value)}
                          className="bg-gray-800 border-gray-700 text-white"
                        />
                      </div>
                      <div>
                        <Label htmlFor="calories" className="text-white">
                          Calories Burned
                        </Label>
                        <Input
                          id="calories"
                          type="number"
                          placeholder="e.g., 300"
                          value={calories}
                          onChange={(e) => setCalories(e.target.value)}
                          className="bg-gray-800 border-gray-700 text-white"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="content" className="text-white">
                      Your Message
                    </Label>
                    <Textarea
                      id="content"
                      placeholder="Share your fitness journey..."
                      value={newPost}
                      onChange={(e) => setNewPost(e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white resize-none mt-2"
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-between items-center">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-gray-400"
                    >
                      <ImageIcon className="h-5 w-5 mr-1" />
                      Add Photo
                    </Button>
                    <Button
                      onClick={handlePostSubmit}
                      className="bg-orange-500 hover:bg-orange-600"
                      disabled={!newPost.trim()}
                    >
                      Post
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Posts Feed */}
            <div className="space-y-6">
              {posts.map((post) => (
                <div
                  key={post.id}
                    className="bg-blue-900 rounded-xl p-4 border border-orange-500/20"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <Image
                        src={post.user.image}
                        alt={post.user.name}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-white">
                            {post.user.name}
                          </h3>
                          {post.user.isStreamer && (
                            <span className="bg-orange-500/20 text-orange-500 text-xs px-2 py-0.5 rounded-full">
                              Streamer
                            </span>
                          )}
                          <span className="flex items-center gap-1 bg-gray-800/50 px-2 py-0.5 rounded-full text-xs text-gray-300">
                            {getCategoryIcon(post.category)}
                            {post.category.charAt(0).toUpperCase() +
                              post.category.slice(1)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400">
                          {post.user.username} · {post.timestamp}
                        </p>
                      </div>
                    </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-400"
                      >
                      <MoreHorizontal className="h-5 w-5" />
                    </Button>
                  </div>

                  {post.metrics && (
                    <div className="flex gap-4 mt-3 p-2 bg-gray-800/30 rounded-lg">
                      {post.metrics.duration && (
                        <div className="flex items-center gap-2">
                          <Timer className="w-4 h-4 text-orange-500" />
                          <span className="text-sm text-gray-300">
                            {post.metrics.duration}
                          </span>
                        </div>
                      )}
                      {post.metrics.calories && (
                        <div className="flex items-center gap-2">
                          <Dumbbell className="w-4 h-4 text-orange-500" />
                          <span className="text-sm text-gray-300">
                            {post.metrics.calories} cal
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <p className="mt-3 text-white">{post.content}</p>

                  {post.image && (
                    <div className="mt-3 rounded-xl overflow-hidden">
                      <Image
                        src={post.image}
                        alt="Post image"
                        width={800}
                        height={400}
                        className="w-full object-cover"
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-800">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`text-sm ${
                        post.isLiked ? "text-orange-500" : "text-gray-400"
                      }`}
                      onClick={() => toggleLike(post.id)}
                    >
                      <Heart
                        className={`h-5 w-5 mr-1 ${
                          post.isLiked ? "fill-current" : ""
                        }`}
                      />
                      {post.likes}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-sm text-gray-400"
                    >
                      <MessageCircle className="h-5 w-5 mr-1" />
                      {post.comments}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-sm text-gray-400"
                    >
                      <Share2 className="h-5 w-5 mr-1" />
                      Share
                    </Button>
                  </div>

                  {/* Comments Section */}
                  <div className="mt-4 space-y-3">
                    {comments.map((comment) => (
                        <div
                          key={comment.id}
                          className="flex items-start gap-3"
                        >
                        <Image
                          src={comment.user.image}
                          alt={comment.user.name}
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                        <div className="flex-1 bg-gray-800 rounded-xl p-3">
                          <div className="flex justify-between items-start">
                            <h4 className="font-medium text-white">
                              {comment.user.name}
                            </h4>
                            <span className="text-xs text-gray-400">
                              {comment.timestamp}
                            </span>
                          </div>
                          <p className="text-sm text-gray-300 mt-1">
                            {comment.content}
                          </p>
                        </div>
                      </div>
                    ))}

                    {/* Add Comment */}
                    <div className="flex items-center gap-3 mt-3">
                      <Image
                        src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&crop=faces&fit=crop&auto=format&q=80"
                        alt="Current user"
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                      <div className="flex-1 relative">
                        <Input
                          placeholder="Write a comment..."
                          className="w-full bg-gray-800 border-gray-700 focus:border-orange-500 text-white pr-10"
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Sidebar - Trending & Stats */}
          <div className="col-span-3">
            <div className="space-y-6">
              {/* Vertical Text (Right-Aligned & Vertical) */}
              <motion.div
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="absolute right-16 top-[20%] -translate-y-1/2 transform -rotate-90 origin-right text-6xl font-extrabold tracking-widest z-0 hidden lg:block"
              >
                  {["M", "O", "T", "I", "V", "A", "T", "E"].map(
                    (char, index) => (
                  <span
                    key={index}
                    className="block"
                    style={{
                      color: `rgba(255, 255, 255, ${
                        1 - Math.abs(index - 3.5) * 0.15
                      })`,
                      lineHeight: "0.9",
                      marginBottom: "0.1rem",
                    }}
                  >
                    {char}
                  </span>
                    )
                  )}
              </motion.div>

              {/* Trending Topics */}
                <div className="bg-blue-900 rounded-xl p-4 border border-orange-500/20">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-orange-500" />
                  Trending Topics
                </h2>
                <div className="space-y-3">
                  {[
                    { topic: "#HIITChallenge", posts: 1234 },
                    { topic: "#MorningYoga", posts: 856 },
                    { topic: "#FitnessGoals", posts: 2341 },
                    { topic: "#HealthyEating", posts: 567 },
                    { topic: "#WorkoutMotivation", posts: 890 },
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-700/50 transition-colors"
                    >
                      <span className="text-white">{item.topic}</span>
                      <span className="text-sm text-gray-400">
                        {item.posts} posts
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Your Stats */}
                <div className="bg-blue-900 rounded-xl p-4 border border-orange-500/20">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <BarChart2 className="h-5 w-5 text-orange-500" />
                  Your Stats
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gray-800/50 rounded-lg p-3 text-center"
                  >
                      <div className="text-2xl font-bold text-orange-500">
                        24
                      </div>
                    <div className="text-sm text-gray-400">Posts</div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gray-800/50 rounded-lg p-3 text-center"
                  >
                    <div className="text-2xl font-bold text-orange-500">
                      156
                    </div>
                    <div className="text-sm text-gray-400">Followers</div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="bg-gray-800/50 rounded-lg p-3 text-center"
                  >
                      <div className="text-2xl font-bold text-orange-500">
                        89
                      </div>
                    <div className="text-sm text-gray-400">Following</div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="bg-gray-800/50 rounded-lg p-3 text-center"
                  >
                    <div className="text-2xl font-bold text-orange-500">
                      1.2k
                    </div>
                    <div className="text-sm text-gray-400">Likes</div>
                  </motion.div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
