import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  Sliders,
  Star,
  UserCheck,
  Video,
  Users,
  Dumbbell,
  Heart,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FitnessStreamer } from "@/lib/types/ui";
import { ExploreStreamersModalProps } from "@/lib/types/dashboard";
import Image from "next/image";

// Fake fitness streamer data
const fitnessCategories = [
  "HIIT",
  "Strength Training",
  "Yoga",
  "Pilates",
  "Cardio",
  "CrossFit",
  "Calisthenics",
  "Cycling",
  "Dance Fitness",
  "Boxing",
  "Meditation",
  "Nutrition",
];

const firstNames = [
  "Emma",
  "Noah",
  "Olivia",
  "Liam",
  "Ava",
  "William",
  "Sophia",
  "Mason",
  "Isabella",
  "James",
  "Mia",
  "Benjamin",
  "Charlotte",
  "Jacob",
  "Amelia",
  "Michael",
  "Harper",
  "Elijah",
  "Evelyn",
  "Ethan",
  "Abigail",
  "Alexander",
  "Emily",
  "Daniel",
  "Elizabeth",
];

const lastNames = [
  "Smith",
  "Johnson",
  "Williams",
  "Jones",
  "Brown",
  "Davis",
  "Miller",
  "Wilson",
  "Moore",
  "Taylor",
  "Anderson",
  "Thomas",
  "Jackson",
  "White",
  "Harris",
  "Martin",
  "Thompson",
  "Garcia",
  "Martinez",
  "Robinson",
  "Clark",
  "Rodriguez",
  "Lewis",
  "Lee",
  "Walker",
];

// Generate fake streamer data
const generateFakeStreamers = (count = 50) => {
  return Array.from({ length: count }, (_, i) => {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const categories = Array.from(
      { length: 1 + Math.floor(Math.random() * 3) },
      () =>
        fitnessCategories[Math.floor(Math.random() * fitnessCategories.length)]
    ).filter((value, index, self) => self.indexOf(value) === index);

    return {
      id: `streamer-${i + 1}`,
      name: `${firstName} ${lastName}`,
      username: `${firstName.toLowerCase()}${lastName.toLowerCase()}${Math.floor(
        Math.random() * 100
      )}`,
      categories,
      followers: Math.floor(Math.random() * 100000) + 1000,
      isVerified: Math.random() > 0.7,
      isLive: Math.random() > 0.7,
      viewerCount:
        Math.random() > 0.7 ? Math.floor(Math.random() * 5000) + 100 : 0,
      profileImage: `https://randomuser.me/api/portraits/${
        Math.random() > 0.5 ? "women" : "men"
      }/${Math.floor(Math.random() * 70) + 1}.jpg`,
      bio: `Fitness ${categories[0]} specialist and wellness coach. Helping you achieve your fitness goals!`,
    };
  });
};

export function ExploreStreamersModal({
  open,
  onOpenChange,
}: ExploreStreamersModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [streamers, setStreamers] = useState<FitnessStreamer[]>([]);
  const [visibleStreamers, setVisibleStreamers] = useState<FitnessStreamer[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  // Add infinite scroll functionality
  const handleScroll = React.useCallback(() => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } =
        scrollContainerRef.current;

      // If we're close to the bottom (50px threshold) and not currently loading more
      if (
        scrollHeight - scrollTop - clientHeight < 50 &&
        !loadingMore &&
        page * itemsPerPage < streamers.length
      ) {
        // Moved loadMore function inside useCallback
        if (page * itemsPerPage < streamers.length) {
          setLoadingMore(true);
          setTimeout(() => {
            setPage(page + 1);
            setLoadingMore(false);
          }, 1000);
        }
      }
    }
  }, [loadingMore, page, streamers.length]);

  // Add scroll event listener
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleScroll);
      return () => scrollContainer.removeEventListener("scroll", handleScroll);
    }
    // Add a return function for the case when scrollContainer is null
    return () => {};
  }, [handleScroll]);

  // Initial load
  useEffect(() => {
    if (open) {
      setLoading(true);
      setTimeout(() => {
        const allStreamers = generateFakeStreamers(50);
        setStreamers(allStreamers);
        setVisibleStreamers(allStreamers.slice(0, itemsPerPage));
        setLoading(false);
        setPage(1);
      }, 1500);
    }
  }, [open]);

  // Filter streamers based on search and category
  useEffect(() => {
    if (streamers.length > 0) {
      let filtered = streamers;

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (streamer) =>
            streamer.name.toLowerCase().includes(query) ||
            streamer.username.toLowerCase().includes(query) ||
            streamer.bio.toLowerCase().includes(query) ||
            streamer.categories.some((cat: string) =>
              cat.toLowerCase().includes(query)
            )
        );
      }

      if (selectedCategory) {
        filtered = filtered.filter((streamer) =>
          streamer.categories.includes(selectedCategory)
        );
      }

      setVisibleStreamers(filtered.slice(0, page * itemsPerPage));
    }
  }, [searchQuery, selectedCategory, streamers, page]);

  const formatFollowers = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const handleCategorySelect = (category: string | null) => {
    setSelectedCategory(category);
    setPage(1);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Explore Fitness Streamers
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search streamers by name or category..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="gap-1 text-black dark:text-white"
              >
                <Sliders className="h-4 w-4" />
                {selectedCategory ? selectedCategory : "Categories"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => handleCategorySelect(null)}
                className="text-black dark:text-white"
              >
                All Categories
              </DropdownMenuItem>
              {fitnessCategories.map((category) => (
                <DropdownMenuItem
                  key={category}
                  onClick={() => handleCategorySelect(category)}
                  className="text-black dark:text-white"
                >
                  {category}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto pr-2 mb-4"
          style={{ maxHeight: "calc(80vh - 180px)" }}
        >
          {loading ? (
            <div className="space-y-4 p-4">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 border rounded-md animate-pulse"
                >
                  <div className="w-12 h-12 rounded-full bg-gray-800"></div>
                  <div className="flex-1">
                    <div className="h-4 w-3/4 bg-gray-800 mb-2 rounded"></div>
                    <div className="h-3 w-1/2 bg-gray-800 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {visibleStreamers.length > 0 ? (
                <>
                  {visibleStreamers.map((streamer) => (
                    <div
                      key={streamer.id}
                      className="flex items-center p-3 rounded-md border border-gray-800 hover:bg-gray-800/50"
                    >
                      <div className="relative h-12 w-12 flex-shrink-0 rounded-full overflow-hidden">
                        <Image
                          src={streamer.profileImage}
                          alt={streamer.name}
                          width={48}
                          height={48}
                          className="object-cover"
                        />
                        {streamer.isLive && (
                          <div className="absolute bottom-0 right-0 bg-red-500 rounded-full h-3 w-3 border-2 border-gray-900">
                            <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75"></div>
                          </div>
                        )}
                      </div>
                      <div className="ml-4 flex-1 min-w-0">
                        <div className="flex items-center">
                          <h3 className="font-medium truncate">
                            {streamer.name}
                          </h3>
                          {streamer.isVerified && (
                            <div className="ml-1.5 h-4 w-4 bg-brandOrange text-white rounded-full flex items-center justify-center">
                              <UserCheck className="h-2.5 w-2.5" />
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          @{streamer.username}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {streamer.categories.map((category: string) => (
                            <Badge
                              key={category}
                              variant="secondary"
                              className="text-xs font-normal"
                            >
                              {category}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-xs">
                          <div className="flex items-center">
                            <Users className="h-3 w-3 mr-1" />
                            {formatFollowers(streamer.followers)} followers
                          </div>
                          {streamer.isLive && (
                            <div className="flex items-center text-red-500 dark:text-red-400">
                              <Video className="h-3 w-3 mr-1" />
                              {streamer.viewerCount} viewers
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="ml-2 flex flex-col items-end justify-between py-1 text-xs">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1 text-black dark:text-white"
                        >
                          <UserCheck className="h-3 w-3" />
                          Follow
                        </Button>
                        {streamer.isLive ? (
                          <Button
                            size="sm"
                            className="mt-2 bg-brandOrange hover:bg-brandOrange/90 flex items-center gap-1 text-white"
                          >
                            <Video className="h-3 w-3" />
                            Watch
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-2 flex items-center gap-1 text-black dark:text-white"
                          >
                            <Star className="h-3 w-3" />
                            View
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  {loadingMore && (
                    <div className="flex justify-center py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-full border-2 border-brandOrange border-r-transparent animate-spin" />
                        <span>Loading more streamers...</span>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                    <Heart className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="font-medium mb-1">No streamers found</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Try adjusting your filters or search term
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="pt-2 border-t border-gray-800 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>
            Showing {visibleStreamers.length} of{" "}
            {searchQuery || selectedCategory
              ? "filtered results"
              : `${streamers.length} streamers`}
          </p>
          <div className="flex items-center justify-center gap-2 mt-1">
            <Dumbbell className="h-3 w-3" />
            <span>Fitness experts from around the world</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
