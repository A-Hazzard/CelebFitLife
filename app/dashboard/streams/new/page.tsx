"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TimePickerDialog } from "@/components/ui/time-picker-dialog";
import { Play, Calendar } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { createStream } from "@/lib/helpers/streaming";
import { getDefaultScheduleTime } from "@/lib/utils/streaming";
import { toast } from "sonner";

export default function CreateStreamPage() {
  const router = useRouter();
  const { currentUser } = useAuthStore();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [showSchedule, setShowSchedule] = useState(false);
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        thumbnailUrl,
        showSchedule ? selectedTime : null
      );

      if (result.success) {
        toast.success("Stream created successfully", {
          description: "Redirecting to stream manager...",
        });
        router.push(`/dashboard/streams/manage/${result.slug}`);
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
            <label className="block text-brandWhite mb-2">Thumbnail URL</label>
            <Input
              className="bg-brandBlack border border-brandOrange/30 text-brandWhite 
              focus:ring-2 focus:ring-brandOrange placeholder-brandGray/50"
              type="text"
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
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
