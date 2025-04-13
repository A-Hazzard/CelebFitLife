"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/useAuthStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { TimePickerDialog } from "@/components/ui/time-picker-dialog";
import { Calendar, Hash, Play, X, AlertCircle } from "lucide-react";
import { createStream } from "@/lib/helpers/streaming";
import { getDefaultScheduleTime } from "@/lib/utils/streaming";
import { toast } from "sonner";
import { tagCategories } from "@/lib/data/tags";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";
import { CreateStreamModalProps } from "@/lib/types/ui";

export function CreateStreamModal({ isOpen, onClose }: CreateStreamModalProps) {
  const router = useRouter();
  const { currentUser } = useAuthStore();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [showSchedule, setShowSchedule] = useState(false);
  const [selectedTime, setSelectedTime] = useState(getDefaultScheduleTime(10));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [category, setCategory] = useState("Fitness");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    if (!currentUser || !currentUser.uid) {
      setFormError(
        "Authentication error. You must be logged in to create a stream."
      );
      setIsSubmitting(false);
      return;
    }

    if (!title.trim()) {
      setFormError("Please provide a title for your stream.");
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
        toast.success("Stream created successfully");
        onClose();
        router.push(`/dashboard/streams/manage/${result.streamId}`);
      } else {
        const errorMessage = result.error || "Unknown error occurred";
        setFormError(errorMessage);
      }
    } catch (error) {
      console.error("Unhandled error creating stream:", error);
      setFormError("An unexpected error occurred. Please try again later.");
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

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setThumbnail("");
    setShowSchedule(false);
    setSelectedTime(getDefaultScheduleTime(10));
    setTags([]);
    setTagInput("");
    setCategory("Fitness");
    setFormError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-brandOrange">
            Create New Stream
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleCreate} className="space-y-4 py-4">
          {formError && (
            <div className="bg-red-500/20 text-red-400 p-3 rounded-md flex items-start">
              <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
              <p>{formError}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title" className="text-white">
              Stream Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder="E.g. Morning Yoga Session"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white focus:border-purple-500"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-white">
              Description
            </Label>
            <Textarea
              id="description"
              placeholder="Optional details about the workout, difficulty level, etc."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white focus:border-purple-500 min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category" className="text-white">
              Category
            </Label>
            <Select onValueChange={setCategory} defaultValue={category}>
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white focus:border-purple-500">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700 text-white">
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

          <div className="space-y-2">
            <Label htmlFor="tags" className="text-white">
              Tags (up to 5)
            </Label>
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
                className="bg-gray-800 border-gray-700 text-white focus:border-purple-500"
                disabled={tags.length >= 5}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="ml-2 bg-transparent border-gray-700 hover:bg-gray-700"
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

          <div className="space-y-2">
            <Label htmlFor="thumbnail" className="text-white">
              Thumbnail URL
            </Label>
            <Input
              id="thumbnail"
              placeholder="Optional thumbnail URL"
              value={thumbnail}
              onChange={(e) => setThumbnail(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white focus:border-purple-500"
            />
            {thumbnail && (
              <div className="relative w-full aspect-video rounded-md overflow-hidden mt-2 border border-gray-700">
                <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                  <span className="text-sm text-gray-400">
                    Loading thumbnail...
                  </span>
                </div>
                <Image
                  src={thumbnail}
                  alt="Stream thumbnail preview"
                  fill
                  className="object-cover"
                  onError={(e) => {
                    // Hide the image on error and show a fallback message
                    e.currentTarget.style.display = "none";
                    e.currentTarget.parentElement
                      ?.querySelector("div")
                      ?.classList.remove("hidden");
                    toast.error(
                      "Couldn't load image from URL. Make sure it's a valid image URL."
                    );
                  }}
                />
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="schedule"
              checked={showSchedule}
              onCheckedChange={handleScheduleChange}
            />
            <Label
              htmlFor="schedule"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Schedule for later
            </Label>
          </div>

          {showSchedule && (
            <div className="space-y-2 pl-6">
              <Label htmlFor="scheduleTime" className="text-white">
                Schedule Time
              </Label>
              <TimePickerDialog date={selectedTime} setDate={setSelectedTime} />
            </div>
          )}

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="bg-transparent border-gray-700 text-white hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              disabled={isSubmitting}
              className="bg-brandOrange hover:bg-brandOrange/90 text-white"
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <span className="h-4 w-4 mr-2 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                  Creating...
                </span>
              ) : (
                <span className="flex items-center">
                  <Play className="w-4 h-4 mr-2" />
                  Create Stream
                </span>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
