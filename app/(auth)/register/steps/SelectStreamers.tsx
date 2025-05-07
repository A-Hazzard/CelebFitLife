"use client";

import { useState, useEffect } from "react";
import { useSignupStore } from "@/lib/store/useSignupStore";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { motion } from "framer-motion";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { ArrowRight, ArrowLeft, Check, User, Loader2 } from "lucide-react";
import Image from "next/image";
import { Streamer, Category, SlickArrowProps } from "@/lib/types/streamer";
import { registerUser } from "@/lib/helpers/auth";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 1) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.4,
      ease: "easeOut",
    },
  }),
};

// Custom Slick Arrows
const SlickArrow: React.FC<SlickArrowProps> = ({
  className,
  style,
  onClick,
  direction,
}) => (
  <div
    className={`${className} z-10 flex items-center justify-center w-10 h-10 rounded-full bg-gray-800 hover:bg-orange-500 border border-gray-700 cursor-pointer transition-all duration-300 absolute ${
      direction === "prev" ? "left-0" : "right-0"
    }`}
    style={{ ...style, display: "flex" }}
    onClick={onClick}
  >
    {direction === "prev" ? (
      <ArrowLeft size={20} className="text-white" />
    ) : (
      <ArrowRight size={20} className="text-white" />
    )}
  </div>
);

export default function SelectStreamers() {
  const { userData, completeSignup, prevStep } = useSignupStore();
  const router = useRouter();
  const [selectedStreamers, setSelectedStreamers] = useState<string[]>([]);
  const [streamers, setStreamers] = useState<Streamer[]>([]);
  const [, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Get the maximum selectable streamers based on the selected plan
  const maxSelectable = (() => {
    const planMax = userData.planDetails?.maxStreamers;
    if (planMax === "∞" || planMax === Infinity) return Infinity;
    if (typeof planMax === "string") return parseInt(planMax) || 1;
    return planMax || 1;
  })();

  // Slick slider settings
  const sliderSettings = {
    dots: true,
    infinite: false,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    initialSlide: 0,
    prevArrow: <SlickArrow direction="prev" />,
    nextArrow: <SlickArrow direction="next" />,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 640,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
    ],
  };

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        // Fetch categories
        const categoriesSnapshot = await getDocs(collection(db, "categories"));
        const categoriesData: Category[] = categoriesSnapshot.docs.map(
          (doc) => ({
            id: doc.id,
            name: doc.data().name,
          })
        );
        setCategories(categoriesData);

        // Fetch streamers
        const streamersRef = collection(db, "users");
        const q = query(streamersRef, where("role.streamer", "==", true));
        const streamersSnapshot = await getDocs(q);

        if (streamersSnapshot.empty) {
          console.log("No streamers found");
          setStreamers([]);
        } else {
          // Process streamers data
          const streamersData: Streamer[] = streamersSnapshot.docs.map(
            (doc) => {
              const data = doc.data();

              // Get the category name based on the category ID
              const categoryName =
                categoriesData.find((cat) => cat.id === data.category)?.name ||
                "Fitness";

              return {
                id: doc.id,
                name: data.username || "Unnamed Streamer",
                profileImage: data.profileImage || "",
                thumbnail:
                  data.thumbnail ||
                  "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=1000",
                quote: data.bio || "",
                category: data.category || "",
                categoryName,
              };
            }
          );

          setStreamers(streamersData);
        }
      } catch (err) {
        setError("Failed to load streamers. Please try again.");
        console.error("Error loading data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleStreamerSelect = (streamerId: string) => {
    if (selectedStreamers.includes(streamerId)) {
      setSelectedStreamers((prev) => prev.filter((id) => id !== streamerId));
    } else if (selectedStreamers.length < maxSelectable) {
      setSelectedStreamers((prev) => [...prev, streamerId]);
    }
  };

  const handleFinish = async () => {
    try {
      setSubmitting(true);
      setError("");

      // Check if there's at least one streamer selected
      if (selectedStreamers.length === 0) {
        setError("Please select at least one streamer.");
        setSubmitting(false);
        return;
      }

      // Update the userData with selected streamers
      completeSignup({
        myStreamers: selectedStreamers,
      });

      // Register user via API to ensure password is hashed
      await registerUser({
        ...userData,
        password: userData.password || "",
        myStreamers: selectedStreamers,
      });
      router.push("/login?registered=true");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Registration failed."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-4">
        <p className="text-gray-400">
          Select up to{" "}
          {maxSelectable === Infinity ? "unlimited" : maxSelectable} streamer
          {maxSelectable !== 1 ? "s" : ""} to follow
        </p>
        <p className="text-sm text-orange-500 mt-2">
          {selectedStreamers.length} streamer
          {selectedStreamers.length !== 1 ? "s" : ""} selected
        </p>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-12 w-12 animate-spin text-orange-500" />
        </div>
      ) : streamers.length === 0 ? (
        <div className="bg-gray-800 text-gray-400 rounded-lg p-6 text-center">
          <User className="h-12 w-12 mx-auto mb-2 text-gray-500" />
          <p>No streamers available at the moment.</p>
        </div>
      ) : (
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={1}
          className="mb-6"
        >
          <div className="mb-8">
            <Slider {...sliderSettings}>
              {streamers.map((streamer) => (
                <div key={streamer.id} className="px-2">
                  <div
                    onClick={() => handleStreamerSelect(streamer.id)}
                    className={`cursor-pointer rounded-xl overflow-hidden h-full transition-all ${
                      selectedStreamers.includes(streamer.id)
                        ? "ring-2 ring-orange-500 shadow-lg shadow-orange-500/20"
                        : "border border-gray-700"
                    }`}
                  >
                    <div className="relative h-40 overflow-hidden">
                      <Image
                        src={streamer.thumbnail}
                        alt={streamer.name}
                        className="w-full h-full object-cover"
                        width={160}
                        height={160}
                      />
                      {streamer.categoryName && (
                        <span className="absolute top-2 right-2 bg-gray-900/80 text-orange-500 text-xs px-2 py-1 rounded-full">
                          {streamer.categoryName}
                        </span>
                      )}
                      {selectedStreamers.includes(streamer.id) && (
                        <div className="absolute top-2 left-2 bg-orange-500 rounded-full w-6 h-6 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="p-4 bg-gray-800">
                      <div className="flex items-center mb-2">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-700 mr-2">
                          <Image
                            src={
                              streamer.profileImage ||
                              "https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=200"
                            }
                            alt={streamer.name}
                            className="w-full h-full object-cover"
                            width={32}
                            height={32}
                          />
                        </div>
                        <h3 className="text-white font-medium">
                          {streamer.name}
                        </h3>
                      </div>
                      {streamer.quote && (
                        <p className="text-gray-400 text-sm italic line-clamp-2">
                          &quot;{streamer.quote}&quot;
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </Slider>
          </div>
        </motion.div>
      )}

      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 pt-2">
        <Button
          onClick={prevStep}
          className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-full text-sm"
          disabled={submitting}
        >
          Back
        </Button>
        <Button
          onClick={handleFinish}
          className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-full text-sm flex-1"
          disabled={submitting || selectedStreamers.length === 0}
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Complete Registration"
          )}
        </Button>
      </div>
    </div>
  );
}
