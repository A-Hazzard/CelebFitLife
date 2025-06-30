"use client";

import { ChevronDown, ChevronUp, ChevronRight, Lock } from "lucide-react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import React, { useEffect, useState } from "react";
import { fetchCategoriesWithTags } from "@/lib/store/categoriesStore";
import { Category, Tag } from "@/lib/store/categoriesStore";
import { SLIDER_SETTINGS } from "@/lib/uiConstants";
import StreamerCard from "@/components/streamPage/StreamerCard";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import { DialogClose, DialogDescription } from "@/components/ui/dialog";
import { DialogTitle } from "@/components/ui/dialog";
import { DialogHeader } from "@/components/ui/dialog";
import { DialogContent } from "@/components/ui/dialog";
import { Dialog } from "@/components/ui/dialog";

export default function UserDashboard() {
  const [isTagsOpen, setIsTagsOpen] = useState(false);
  const [categories, setCategories] = useState<(Category & { tags: Tag[] })[]>(
    []
  );
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showLockedModal, setShowLockedModal] = useState<string | null>(null);

  // Mock streamers data since streaming store is removed
  const streamers = [
    {
      id: "1",
      name: "FitnessPro",
      username: "fitnesspro",
      avatarUrl: "https://images.unsplash.com/photo-1594381898411-846e7d193883?w=150&h=150&crop=faces&fit=crop&auto=format&q=80",
      bio: "Professional fitness trainer",
      categoryName: "Fitness",
      tagNames: ["workout", "fitness"],
      streams: []
    },
    {
      id: "2", 
      name: "YogaMaster",
      username: "yogamaster",
      avatarUrl: "https://images.unsplash.com/photo-1552196563-55cd4e45efb3?w=150&h=150&crop=faces&fit=crop&auto=format&q=80",
      bio: "Yoga instructor and mindfulness coach",
      categoryName: "Yoga",
      tagNames: ["yoga", "meditation"],
      streams: []
    }
  ];

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
        ? prev.filter((cat: string) => cat !== categoryName)
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

  // Use correct property 'id' instead of non-existent 'streamID'
  const uniqueStreamers = Array.from(
    new Map(streamers.map((s) => [s.id, s])).values()
  );

  // Filter streamers based on user selection and ownership
  const filteredStreamers = streamers.filter((streamer) => {
    // First filter by selected categories
    const categoryMatches =
      selectedCategories.length === 0 ||
      (streamer.categoryName &&
        selectedCategories.includes(streamer.categoryName));

    return categoryMatches;
  });

  return (
    <div className="flex flex-col min-h-screen bg-brandBlack text-brandWhite font-inter overflow-x-hidden">
      <Header />

      {/* 🧱 Main Layout */}
      <main className="flex flex-col p-4 md:p-6 space-y-6 w-full">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* 🎞 MY STREAMERS */}
          <section className="w-full lg:w-4/5 space-y-4">
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
                      streams: [],
                    }}
                  />
                </div>
              ))}
            </Slider>
          </section>

          {/* 🎛 CATEGORY SIDEBAR */}
          <aside className="w-full lg:w-1/5 bg-brandBlack border border-brandOrange/30 rounded-xl h-fit sticky top-4">
            <div
              className="flex justify-between items-center p-3 cursor-pointer lg:cursor-default"
              onClick={() => setIsTagsOpen(!isTagsOpen)}
            >
              <h2 className="text-base md:text-lg font-bold text-brandWhite">
                CATEGORIES
              </h2>
              <div className="lg:hidden">
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
              } lg:block space-y-1 p-2 pt-0`}
            >
              {categories.map((category) => (
                <div key={category.name} className="mb-1">
                  <div
                    className={`flex justify-between items-center bg-brandBlack border border-brandOrange/30 p-2 rounded-lg hover:bg-brandBlack transition-colors cursor-pointer ${
                      selectedCategories.includes(category.name)
                        ? "bg-brandBlack"
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
                          className={`bg-brandBlack border border-brandOrange/30 text-[10px] p-1 rounded-lg hover:bg-brandBlack transition-colors ${
                            selectedTags.includes(tag.name)
                              ? "bg-brandBlack"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 md:gap-6">
            {filteredStreamers
              .slice(0, 6)
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
                      streams: [],
                    }}
                  />
                </div>
              ))}
          </div>

          {/* Locked Streamer Modal */}
          <Dialog
            open={!!showLockedModal}
            onOpenChange={() => setShowLockedModal(null)}
          >
            <DialogContent className="max-w-lg w-full p-5 rounded-2xl border-2 border-brandOrange bg-brandBlack sm:mx-2 mx-0 fixed inset-0 flex flex-col justify-center items-center z-[100]">
              <DialogHeader>
                <div className="flex flex-col items-center gap-4">
                  <span className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brandOrange/10 mb-2">
                    <Lock className="w-10 h-10 text-brandOrange" />
                  </span>
                  <DialogTitle className="text-2xl text-center text-brandOrange font-extrabold">
                    Streaming Removed
                  </DialogTitle>
                  <DialogDescription className="text-base text-center text-brandGray mt-2">
                    Streaming functionality has been removed from this platform.
                  </DialogDescription>
                </div>
              </DialogHeader>
              <DialogClose asChild>
                <button className="absolute top-4 right-4 text-brandOrange hover:text-brandWhite transition-colors">
                  <span className="sr-only">Close</span>
                </button>
              </DialogClose>
            </DialogContent>
          </Dialog>

          <div className="text-center py-8 text-brandGray">
            <p>Streaming features have been removed.</p>
          </div>
        </section>
      </main>
    </div>
  );
}
