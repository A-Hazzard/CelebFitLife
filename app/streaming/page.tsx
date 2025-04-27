"use client";

import { ChevronDown, ChevronUp, ChevronRight } from "lucide-react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import React, { useEffect, useState } from "react";
import { fetchCategoriesWithTags } from "@/lib/store/categoriesStore";
import { Category, Tag } from "@/lib/store/categoriesStore";
import { SLIDER_SETTINGS } from "@/lib/uiConstants";
import { useStreamerStore } from "@/lib/store/useStreamerStore";
import StreamerCard from "@/components/streamPage/StreamerCard";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";

export default function UserDashboard() {
  const [visibleDiscoverStreamers, setVisibleDiscoverStreamers] = useState(6);
  const [isTagsOpen, setIsTagsOpen] = useState(false);
  const [categories, setCategories] = useState<(Category & { tags: Tag[] })[]>(
    []
  );
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

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
      <Header />

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
