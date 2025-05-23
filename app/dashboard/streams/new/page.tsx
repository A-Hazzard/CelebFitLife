"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TimePickerDialog } from "@/components/ui/time-picker-dialog";
import { Play, Calendar, X, Hash } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { createStream } from "@/lib/helpers/streaming";
import { getDefaultScheduleTime } from "@/lib/utils/streaming";
import { toast } from "sonner";
import { tagCategories } from "@/lib/data/tags";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function CreateStreamPage() {
  const router = useRouter();
  const { currentUser } = useAuthStore();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [showSchedule, setShowSchedule] = useState(false);
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [category, setCategory] = useState("Fitness");

  useEffect(() => {
    if (!currentUser) router.push("/login");
  }, [currentUser, router]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!currentUser || !currentUser.uid) {
      toast.error("Authentication error", {
        description: "You must be logged in to create a stream",
      });
      setIsSubmitting(false);
      return;
    }

    if (!title.trim()) {
      toast.error("Missing title", {
        description: "Please provide a title for your stream",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await createStream(
        currentUser.uid,
        title,
        description,
        thumbnail,
        showSchedule ? selectedTime : null,
        category,
        tags
      );

      if (result.success && result.streamId) {
        toast.success("Stream created successfully", {
          description: "Redirecting to stream manager...",
        });
        router.push(`/dashboard/streams/manage/${result.streamId}`);
      } else {
        const errorMessage = result.error || "Unknown error occurred";

        // Show a user-friendly error toast
        toast.error("Failed to create stream", {
          description: errorMessage.includes("technical details:")
            ? errorMessage.split("technical details:")[0].trim()
            : errorMessage,
        });

        // Log the full technical error for debugging
        if (errorMessage.includes("technical details:")) {
          console.error("Stream creation error:", errorMessage);
        }
      }
    } catch (error) {
      toast.error("Stream creation failed", {
        description: "An unexpected error occurred. Please try again later.",
      });
      console.error("Unhandled error creating stream:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScheduleChange = (checked: boolean) => {
    setShowSchedule(checked);
    if (checked) {
      // Set default scheduled time to 10 minutes from now
      setSelectedTime(getDefaultScheduleTime(10));
    }
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      addTag(tagInput.trim());
    }
  };

  const addTag = (tag: string) => {
    const normalizedTag = tag.toLowerCase().trim();

    if (!normalizedTag) return;

    // Prevent duplicates
    if (tags.includes(normalizedTag)) {
      toast.error("Tag already exists");
      return;
    }

    // Limit number of tags
    if (tags.length >= 5) {
      toast.error("Maximum 5 tags allowed");
      return;
    }

    // Limit tag length
    if (normalizedTag.length > 20) {
      toast.error("Tags must be less than 20 characters");
      return;
    }

    setTags([...tags, normalizedTag]);
    setTagInput("");
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleTagToggle = (tagName: string) => {
    if (tags.includes(tagName)) {
      removeTag(tagName);
    } else {
      addTag(tagName);
    }
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-brandBlack text-brandWhite flex items-center justify-center p-8">
      <div className="bg-brandBlack border border-brandOrange/30 rounded-xl w-full max-w-md p-8 space-y-6 shadow-lg">
        <h2 className="text-3xl font-bold text-brandOrange text-center mb-6">
          Create New Stream
        </h2>

        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-brandWhite mb-2">Stream Title</label>
            <Input
              className="bg-brandBlack border border-brandOrange/30 text-brandWhite 
              focus:ring-2 focus:ring-brandOrange placeholder-brandGray/50"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="E.g. Morning Yoga Session"
            />
          </div>

          <div>
            <label className="block text-brandWhite mb-2">Description</label>
            <Textarea
              className="bg-brandBlack border border-brandOrange/30 text-brandWhite 
              focus:ring-2 focus:ring-brandOrange placeholder-brandGray/50"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional details about the workout, difficulty level, etc."
            />
          </div>

          <div>
            <Label className="block text-brandWhite mb-2">Category</Label>
            <Select onValueChange={setCategory} defaultValue={category}>
              <SelectTrigger className="bg-brandBlack border border-brandOrange/30 text-brandWhite">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700 text-white">
                <SelectItem value="Fitness">Fitness</SelectItem>
                <SelectItem value="Yoga">Yoga</SelectItem>
                <SelectItem value="Nutrition">Nutrition</SelectItem>
                <SelectItem value="Mindfulness">Mindfulness</SelectItem>
                <SelectItem value="Strength">Strength Training</SelectItem>
                <SelectItem value="Cardio">Cardio</SelectItem>
                <SelectItem value="HIIT">HIIT</SelectItem>
                <SelectItem value="Dance">Dance Workout</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="block text-brandWhite mb-2">Tags (up to 5)</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <div
                  key={tag}
                  className="bg-brandOrange/20 text-brandOrange px-2 py-1 rounded-full text-sm flex items-center"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1 text-brandOrange hover:text-white"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex">
              <Input
                id="tagInput"
                placeholder="Add a tag and press Enter"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                className="bg-brandBlack border border-brandOrange/30 text-brandWhite 
                focus:ring-2 focus:ring-brandOrange placeholder-brandGray/50"
                disabled={tags.length >= 5}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="ml-2 bg-transparent border-gray-700 hover:bg-gray-800"
                onClick={() => addTag(tagInput)}
                disabled={tagInput.trim() === "" || tags.length >= 5}
              >
                Add
              </Button>
            </div>
          </div>

          {/* Recommended Tags Section */}
          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">Recommended Tags</h3>
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
              {tagCategories.map((category) => (
                <div key={category.name}>
                  <h4 className="text-xs text-gray-400 mb-1">
                    {category.name}
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {category.tags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleTagToggle(tag)}
                        disabled={tags.length >= 5 && !tags.includes(tag)}
                        className={`text-xs px-2 py-1 rounded-full flex items-center ${
                          tags.includes(tag)
                            ? "bg-brandOrange/20 text-brandOrange"
                            : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                        } ${
                          tags.length >= 5 && !tags.includes(tag)
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                      >
                        <Hash size={10} className="mr-1" />
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-brandWhite mb-2">Thumbnail URL</label>
            <Input
              className="bg-brandBlack border border-brandOrange/30 text-brandWhite 
              focus:ring-2 focus:ring-brandOrange placeholder-brandGray/50"
              type="text"
              value={thumbnail}
              onChange={(e) => setThumbnail(e.target.value)}
              placeholder="Optional thumbnail URL"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="schedule"
              checked={showSchedule}
              onCheckedChange={handleScheduleChange}
            />
            <label
              htmlFor="schedule"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Schedule for later
            </label>
          </div>

          {showSchedule && (
            <div>
              <label className="block text-brandWhite mb-2">
                Schedule Time
              </label>
              <TimePickerDialog date={selectedTime} setDate={setSelectedTime} />
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-brandOrange text-brandBlack hover:bg-brandOrange/90 
            transition-colors duration-300 flex items-center justify-center gap-2"
            disabled={isSubmitting}
          >
            <Play className="w-5 h-5" />
            {isSubmitting ? "Creating..." : "Create Stream"}
          </Button>
        </form>
      </div>
    </div>
  );
}
