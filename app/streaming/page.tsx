"use client";
import { Search, ChevronDown, ChevronUp, ChevronRight } from "lucide-react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import React, { useMemo } from "react";
import { fetchCategoriesWithTags } from "@/lib/store/categoriesStore";
import { Category, Tag } from "@/lib/store/categoriesStore";
import {
  MOCK_STREAMERS,
  DISCOVER_STREAMERS,
  SLIDER_SETTINGS,
} from "@/lib/uiConstants";
import { Streamer } from "@/lib/types/streaming";
import { filterStreamers } from "@/lib/utils/streaming";

const StreamerCard: React.FC<{ streamer: Streamer }> = ({ streamer }) => {
  return (
    <div className="bg-brandBlack border border-brandOrange/30 p-4 md:p-5 rounded-xl shadow-lg hover:shadow-2xl">
      <div className="flex items-center mb-4 space-x-3 md:space-x-4">
        <div
          className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-cover bg-center border-2 border-brandOrange/30"
          style={{ backgroundImage: `url(${streamer.imageUrl})` }}
        />
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-base md:text-lg font-bold text-brandWhite">
              {streamer.name}
            </h3>
            <span className="bg-brandOrange text-brandBlack text-xs px-2 py-1 rounded-full">
              {streamer.specialty}
            </span>
          </div>
          <p className="text-xs md:text-sm text-brandOrange/70">
            {streamer.followers.toLocaleString()} Followers
          </p>
        </div>
      </div>

      <p className="text-xs md:text-sm text-brandWhite/70 italic mb-4">
        &ldquo;{streamer.quote}&rdquo;
      </p>

      <div className="flex space-x-2 overflow-x-auto pb-1">
        {streamer.tags.map((tag: string, tagIndex: number) => (
          <span
            key={tagIndex}
            className="flex-shrink-0 bg-brandBlack border border-brandOrange/30 text-xs px-2 py-1 rounded-full text-brandOrange"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
};

export default function UserDashboard() {
  const [visibleDiscoverStreamers, setVisibleDiscoverStreamers] =
    React.useState(3);
  const [isTagsOpen, setIsTagsOpen] = React.useState(false);
  const [categories, setCategories] = React.useState<
    (Category & { tags: Tag[] })[]
  >([]);
  const [selectedTags, setSelectedTags] = React.useState<string[]>([]);
  const [expandedCategory, setExpandedCategory] = React.useState<string | null>(
    null
  );
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>(
    []
  );

  const filteredStreamers = useMemo(
    () => filterStreamers(MOCK_STREAMERS, selectedCategories, selectedTags),
    [selectedCategories, selectedTags]
  );

  const filteredDiscoverStreamers = useMemo(
    () => filterStreamers(DISCOVER_STREAMERS, selectedCategories, selectedTags),
    [selectedCategories, selectedTags]
  );

  React.useEffect(() => {
    const loadCategoriesAndTags = async () => {
      try {
        const result = await fetchCategoriesWithTags();
        if (result.success) {
          setCategories(
            result.categoriesWithTags as (Category & { tags: Tag[] })[]
          );
        } else {
          console.error("Failed to fetch categories and tags");
          alert("Failed to load categories and tags");
        }
      } catch (error) {
        console.error("Error in loadCategoriesAndTags:", error);
      }
    };

    loadCategoriesAndTags();
  }, []);

  const loadMoreStreamers = () => {
    setVisibleDiscoverStreamers((prev) =>
      Math.min(prev + 3, DISCOVER_STREAMERS.length)
    );
  };

  const toggleCategory = (categoryName: string) => {
    // If the category is already expanded, collapse it
    if (expandedCategory === categoryName) {
      setExpandedCategory(null);
    } else {
      // Set the new expanded category
      setExpandedCategory(categoryName);
    }

    // Toggle category selection
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

  React.useEffect(() => {
    if (categories.length > 0) {
      // This is just for demo purposes - to ensure streamers match available categories
      console.log("Categories loaded:", categories);
    }
  }, [categories]);

  return (
    <div className="min-h-screen flex flex-col bg-brandBlack text-brandWhite font-inter">
      <header className="flex items-center justify-between p-4 md:p-6 bg-brandBlack border-b border-brandOrange/30">
        <div className="w-10 md:w-1/4"></div>

        <div className="relative w-full max-w-md mx-auto">
          <input
            type="text"
            placeholder="Search streamers, workouts, tags..."
            className="w-full px-3 py-2 md:px-4 md:py-2 bg-brandBlack border border-brandOrange/30 text-brandWhite rounded-full focus:outline-none focus:ring-2 focus:ring-brandOrange text-sm md:text-base"
          />
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-brandOrange w-4 h-4 md:w-5 md:h-5" />
        </div>

        <div className="flex items-center space-x-2 md:space-x-4 justify-end w-10 md:w-1/4">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-brandOrange/20 rounded-full"></div>
          <div className="w-8 h-8 md:w-10 md:h-10 bg-brandOrange/20 rounded-full"></div>
          <div className="w-8 h-8 md:w-10 md:h-10 bg-brandOrange/20 rounded-full"></div>
        </div>
      </header>

      <main className="flex flex-col p-4 md:p-6 space-y-6">
        <div className="flex flex-col md:flex-row space-y-6 md:space-y-0 md:space-x-6">
          <section className="w-full md:w-3/4 space-y-6">
            <h2 className="text-xl md:text-2xl font-bold text-brandWhite">
              MY STREAMERS
            </h2>
            <Slider {...SLIDER_SETTINGS}>
              {filteredStreamers.map((streamer, index) => (
                <div
                  key={index}
                  className="p-2 md:p-4 transform transition-all duration-300 hover:scale-105"
                >
                  <StreamerCard streamer={streamer} />
                </div>
              ))}
            </Slider>
          </section>

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
              className={`
              ${isTagsOpen ? "block" : "hidden"} 
              md:block 
              space-y-1 p-2 pt-0
            `}
            >
              {categories.map((category) => (
                <div key={category.name} className="mb-1">
                  <div
                    className={`
                      flex justify-between items-center 
                      bg-brandBlack border border-brandOrange/30 
                      p-2 rounded-lg hover:bg-brandOrange/10 
                      transition-colors cursor-pointer
                      ${
                        selectedCategories.includes(category.name)
                          ? "bg-brandOrange/20"
                          : ""
                      }
                    `}
                    onClick={() => toggleCategory(category.name)}
                  >
                    <div className="flex items-center space-x-1">
                      <span className="text-xs font-semibold text-brandWhite">
                        {category.name}
                      </span>
                    </div>
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
                          className={`
                            bg-brandBlack border border-brandOrange/30 
                            text-[10px] p-1 rounded-lg 
                            hover:bg-brandOrange/20 transition-colors
                            ${
                              selectedTags.includes(tag.name)
                                ? "bg-brandOrange text-brandBlack"
                                : "text-brandWhite"
                            }
                          `}
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

        <section className="space-y-6">
          <h2 className="text-xl md:text-2xl font-bold text-brandWhite">
            DISCOVER
          </h2>
          <p className="text-xs md:text-sm text-brandOrange/70">
            What fits your needs from your previous tags?
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {filteredDiscoverStreamers
              .slice(0, visibleDiscoverStreamers)
              .map((streamer, index) => (
                <div
                  key={index}
                  className="transform transition-all duration-300 hover:scale-105"
                >
                  <div className="bg-brandBlack border border-brandOrange/30 p-4 md:p-5 rounded-xl shadow-lg hover:shadow-2xl">
                    <div className="flex items-center mb-4 space-x-3 md:space-x-4">
                      <div
                        className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-cover bg-center border-2 border-brandOrange/30"
                        style={{ backgroundImage: `url(${streamer.imageUrl})` }}
                      />
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-base md:text-lg font-bold text-brandWhite">
                            {streamer.name}
                          </h3>
                          <span className="bg-brandOrange text-brandBlack text-xs px-2 py-1 rounded-full">
                            {streamer.specialty}
                          </span>
                        </div>
                        <p className="text-xs md:text-sm text-brandOrange/70">
                          {streamer.followers.toLocaleString()} Followers
                        </p>
                      </div>
                    </div>

                    <p className="text-xs md:text-sm text-brandWhite/70 italic mb-4">
                      &ldquo;{streamer.quote}&rdquo;
                    </p>

                    <div className="flex space-x-2 overflow-x-auto pb-1">
                      {streamer.tags.map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          className="flex-shrink-0 bg-brandBlack border border-brandOrange/30 text-xs px-2 py-1 rounded-full text-brandOrange"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
          </div>

          {visibleDiscoverStreamers < DISCOVER_STREAMERS.length && (
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
