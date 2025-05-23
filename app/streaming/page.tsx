"use client";

import { ChevronDown, ChevronUp, ChevronRight, Lock } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { DialogClose, DialogDescription } from "@/components/ui/dialog";
import { DialogTitle } from "@/components/ui/dialog";
import { DialogHeader } from "@/components/ui/dialog";
import { DialogContent } from "@/components/ui/dialog";
import { Dialog } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  doc,
  onSnapshot,
  updateDoc,
  arrayUnion,
  DocumentSnapshot,
  DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";

export default function UserDashboard() {
  const [visibleDiscoverStreamers, setVisibleDiscoverStreamers] = useState(6);
  const [isTagsOpen, setIsTagsOpen] = useState(false);
  const [categories, setCategories] = useState<(Category & { tags: Tag[] })[]>(
    []
  );
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showLockedModal, setShowLockedModal] = useState<string | null>(null);
  const [previewingStreamerId, setPreviewingStreamerId] = useState<
    string | null
  >(null);
  const [previewCountdown, setPreviewCountdown] = useState<number>(60);
  const [previewInterval, setPreviewInterval] = useState<NodeJS.Timeout | null>(
    null
  );
  const [previewedStreamers, setPreviewedStreamers] = useState<string[]>([]);

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

  // Fetch previewedStreamers from Firestore
  useEffect(() => {
    if (currentUser?.email) {
      const userRef = doc(db, "users", currentUser.email);
      const unsubscribe = onSnapshot(
        userRef,
        (snapshot: DocumentSnapshot<DocumentData>) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            setPreviewedStreamers(data.previewedStreamers || []);
          }
        }
      );

      return () => unsubscribe();
    }
    // Always return a cleanup function
    return () => {};
  }, [currentUser?.email]);

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

    // If user has myStreamers, we could use it for additional filtering
    // but for now we just apply category filtering
    return categoryMatches;
  });

  const handlePreview = async (streamerId: string) => {
    // Check if streamer has already been previewed
    if (previewedStreamers.includes(streamerId)) {
      toast.error("You have already previewed this streamer");
      return;
    }

    // Find the streamer's active stream
    const streamer = streamers.find((s) => s.id === streamerId);
    const liveStream = streamer?.streams?.find((s) => {
      // Instead of directly accessing hasStarted, check if it's live using other logic
      return s.hasEnded !== true;
    });

    if (!liveStream) {
      toast.error("This streamer is not currently live");
      return;
    }

    setPreviewingStreamerId(streamerId);
    setPreviewCountdown(60);

    // Navigate to the live stream
    router.push(
      `/streaming/live/${liveStream.id}?preview=true&countdown=${60}`
    );

    // Start countdown
    const interval = setInterval(() => {
      setPreviewCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setPreviewingStreamerId(null);
          // Update Firestore: add streamerId to previewedStreamers
          if (currentUser && currentUser.email) {
            const userRef = doc(db, "users", currentUser.email);
            updateDoc(userRef, {
              previewedStreamers: arrayUnion(streamerId),
            });
          }
          // Redirect back after preview ends
          router.push("/streaming");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    setPreviewInterval(interval);
  };

  useEffect(() => {
    return () => {
      if (previewInterval) clearInterval(previewInterval);
    };
  }, [previewInterval]);

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
                    Unlock Streamer
                  </DialogTitle>
                  <DialogDescription className="text-base text-center text-brandGray mt-2">
                    This streamer is locked. Buy another streamer or preview for
                    1 minute.
                  </DialogDescription>
                </div>
              </DialogHeader>
              <div className="my-6 border-t border-brandOrange/20 w-full" />
              {showLockedModal && (
                <div className="flex flex-col sm:flex-row gap-4 justify-center w-full">
                  <Button
                    variant="default"
                    className="bg-brandOrange text-brandBlack font-bold px-6 py-3 rounded-full text-lg shadow-md hover:scale-105 transition-transform w-full sm:w-auto"
                    onClick={() => {
                      setShowLockedModal(null);
                      // TODO: Implement buy logic
                    }}
                  >
                    Buy Another Streamer
                  </Button>
                  {showLockedModal && (
                    <Button
                      variant="outline"
                      className="border-2 border-brandOrange text-brandOrange font-bold px-6 py-3 rounded-full text-lg shadow-md hover:bg-brandOrange/10 hover:scale-105 transition-transform w-full sm:w-auto"
                      onClick={() => {
                        setShowLockedModal(null);
                        handlePreview(showLockedModal);
                      }}
                    >
                      Preview 1 min
                    </Button>
                  )}
                </div>
              )}
              <DialogClose asChild>
                <button className="absolute top-4 right-4 text-brandOrange hover:text-brandWhite transition-colors">
                  <span className="sr-only">Close</span>
                </button>
              </DialogClose>
            </DialogContent>
          </Dialog>

          {previewingStreamerId && (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80">
              <div className="bg-brandBlack border-2 border-brandOrange rounded-2xl p-8 flex flex-col items-center">
                <Lock className="w-12 h-12 text-brandOrange mb-4" />
                <h2 className="text-2xl font-bold text-brandOrange mb-2">
                  Previewing Stream
                </h2>
                <p className="text-lg text-brandWhite mb-4">
                  You have {previewCountdown} seconds left
                </p>
                <Button
                  variant="default"
                  className="bg-brandOrange text-brandBlack font-bold px-6 py-3 rounded-full text-lg shadow-md hover:scale-105 transition-transform"
                  onClick={() => {
                    setPreviewingStreamerId(null);
                    if (previewInterval) clearInterval(previewInterval);
                  }}
                >
                  Stop Preview
                </Button>
              </div>
            </div>
          )}

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
