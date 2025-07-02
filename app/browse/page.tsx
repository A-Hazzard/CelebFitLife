"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Users,
  Play,
  Eye,
  Filter,
  Clock,
  ArrowRight,
  Loader2,
} from "lucide-react";
import Image from "next/image";

// TODO for Kyle: Import proper StreamData type when stream types are recreated
interface StreamData {
  id: string;
  title: string;
  description?: string;
  userName?: string;
  category?: string;
  thumbnail?: string;
  thumbnailUrl?: string;
  viewerCount?: number;
  slug: string;
  startedAt?: unknown;
}

export default function BrowseStreamsPage() {
  const router = useRouter();
  const [streams, setStreams] = useState<StreamData[]>([]);
  const [filteredStreams, setFilteredStreams] = useState<StreamData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "fitness", label: "Fitness & Workout" },
    { value: "nutrition", label: "Nutrition & Diet" },
    { value: "wellness", label: "Wellness & Health" },
    { value: "motivation", label: "Motivation & Mindset" },
    { value: "lifestyle", label: "Lifestyle" },
    { value: "other", label: "Other" },
  ];

  const filterStreams = useCallback(() => {
    let filtered = streams;

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (stream) =>
          stream.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          stream.description
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          stream.userName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (stream) => stream.category === selectedCategory
      );
    }

    setFilteredStreams(filtered);
  }, [streams, searchQuery, selectedCategory]);

  useEffect(() => {
    fetchLiveStreams();
  }, []);

  useEffect(() => {
    filterStreams();
  }, [filterStreams]);

  const fetchLiveStreams = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/streams/browse");
      if (response.ok) {
        const data = await response.json();
        setStreams(data.streams || []);
      } else {
        console.error("Failed to fetch streams");
      }
    } catch (error) {
      console.error("Error fetching streams:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStreamClick = (stream: StreamData) => {
    router.push(`/streaming/live/${stream.slug}`);
  };

  const getStreamThumbnail = (stream: StreamData) => {
    return (
      stream.thumbnail || stream.thumbnailUrl || "/api/placeholder/400/225"
    );
  };

  const formatViewerCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  const getTimeAgo = (timestamp: unknown) => {
    if (!timestamp) return "Recently";

    let date: Date;

    if (timestamp instanceof Date) {
      date = timestamp;
    } else if (
      typeof timestamp === "object" &&
      timestamp !== null &&
      "toDate" in timestamp &&
      typeof (timestamp as { toDate: () => Date }).toDate === "function"
    ) {
      date = (timestamp as { toDate: () => Date }).toDate();
    } else if (typeof timestamp === "string") {
      date = new Date(timestamp);
    } else {
      return "Recently";
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  return (
    <div className="min-h-screen bg-brandBlack text-brandWhite">
      {/* Header */}
      <div className="border-b border-gray-800 bg-blue-900">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-brandOrange">
                  Live Streams
                </h1>
                <p className="text-gray-300 mt-1">
                  Discover live fitness and wellness content
                </p>
              </div>
              <Badge variant="secondary" className="bg-red-600 text-white">
                🔴 {filteredStreams.length} Live Now
              </Badge>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search streams, streamers, or topics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-brandBlack border-gray-700 text-brandWhite placeholder:text-gray-400 focus:border-brandOrange"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-brandBlack border border-gray-700 text-brandWhite rounded-md px-3 py-2 focus:border-brandOrange focus:outline-none"
                >
                  {categories.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-brandOrange" />
              <p className="text-gray-400">Loading live streams...</p>
            </div>
          </div>
        ) : filteredStreams.length === 0 ? (
          <div className="text-center py-12">
            <Eye className="h-16 w-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">
              {streams.length === 0 ? "No Live Streams" : "No Results Found"}
            </h3>
            <p className="text-gray-400 mb-6">
              {streams.length === 0
                ? "There are no live streams at the moment. Check back soon!"
                : "Try adjusting your search or filter criteria."}
            </p>
            <Button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
              }}
              variant="outline"
              className="border-brandOrange text-brandOrange hover:bg-brandOrange hover:text-brandBlack"
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredStreams.map((stream) => (
              <Card
                key={stream.id}
                className="bg-blue-800 border-gray-700 hover:border-brandOrange transition-all duration-200 cursor-pointer group overflow-hidden"
                onClick={() => handleStreamClick(stream)}
              >
                {/* Thumbnail */}
                <div className="relative aspect-video overflow-hidden">
                  <Image
                    src={getStreamThumbnail(stream)}
                    alt={stream.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute top-2 left-2 flex items-center space-x-2">
                    <Badge className="bg-red-600 text-white text-xs animate-pulse">
                      🔴 LIVE
                    </Badge>
                    {stream.category && (
                      <Badge
                        variant="secondary"
                        className="bg-black/50 text-white text-xs"
                      >
                        {stream.category}
                      </Badge>
                    )}
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center">
                    <Users className="h-3 w-3 mr-1" />
                    {formatViewerCount(stream.viewerCount || 0)}
                  </div>
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                    <Play className="h-12 w-12 text-white" />
                  </div>
                </div>

                <CardHeader className="pb-2">
                  <CardTitle className="text-brandWhite text-lg line-clamp-2 group-hover:text-brandOrange transition-colors">
                    {stream.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {/* Streamer Info */}
                    <div className="flex items-center space-x-2">
                      <div className="h-8 w-8 bg-brandOrange rounded-full flex items-center justify-center text-brandBlack font-semibold text-sm">
                        {stream.userName?.charAt(0)?.toUpperCase() || "U"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-brandWhite font-medium text-sm truncate">
                          {stream.userName || "Unknown Streamer"}
                        </p>
                        <p className="text-gray-400 text-xs flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          Started {getTimeAgo(stream.startedAt)}
                        </p>
                      </div>
                    </div>

                    {/* Description */}
                    {stream.description && (
                      <p className="text-gray-300 text-sm line-clamp-2">
                        {stream.description}
                      </p>
                    )}

                    {/* Action Button */}
                    <Button
                      className="w-full bg-brandOrange hover:bg-brandOrange/90 text-brandBlack font-semibold"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStreamClick(stream);
                      }}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Watch Now
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
