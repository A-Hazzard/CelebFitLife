
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/config/firebase";
import { v4 as uuidv4 } from "uuid";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TimePickerDialog } from "@/components/ui/time-picker-dialog";
import { format } from "date-fns";

export default function CreateStreamPage() {
  const router = useRouter();
  const { currentUser } = useAuthStore();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [showSchedule, setShowSchedule] = useState(false);
  const [selectedTime, setSelectedTime] = useState(new Date());

  useEffect(() => {
    if (!currentUser) {
      router.push("/login");
    }
  }, [currentUser, router]);

  const handleCreate = async (e: React.FormEvent, isScheduled = false) => {
    e.preventDefault();

    if (!currentUser) return;

    const slug = `${title.trim().replace(/\s+/g, "-").toLowerCase()}-${uuidv4()}`;
    
    const streamData = {
      title,
      description,
      thumbnail: thumbnailUrl,
      slug,
      createdAt: new Date().toISOString(),
      createdBy: currentUser.uid,
      hasStarted: false,
      hasEnded: false,
      scheduledAt: isScheduled ? selectedTime.toISOString() : null,
    };

    await setDoc(doc(db, "streams", slug), streamData);
    router.push(`/dashboard/streams/manage/${slug}`);
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="bg-gray-800 w-full max-w-md rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Create New Stream</h2>
        <form onSubmit={(e) => handleCreate(e, showSchedule)} className="space-y-4">
          <div>
            <label className="block mb-1 text-gray-400">Title</label>
            <Input
              className="w-full border border-gray-700 rounded p-2 bg-black text-white"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="E.g. Morning Yoga Session"
            />
          </div>
          <div>
            <label className="block mb-1 text-gray-400">Description</label>
            <Textarea
              className="w-full border border-gray-700 rounded p-2 bg-black text-white"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional details about the workout, difficulty level, etc."
            />
          </div>
          <div>
            <label className="block mb-1 text-gray-400">Thumbnail URL</label>
            <Input
              className="w-full border border-gray-700 rounded p-2 bg-black text-white"
              type="text"
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              placeholder="Optional thumbnail URL"
            />
          </div>
          {showSchedule && (
            <div>
              <label className="block mb-1 text-gray-400">Schedule Time</label>
              <TimePickerDialog date={selectedTime} setDate={setSelectedTime} />
            </div>
          )}
          <div className="flex gap-4">
            <Button
              type="submit"
              className="bg-orange-500 text-black px-4 py-2 rounded hover:bg-orange-600 flex-1"
            >
              Create Stream
            </Button>
            <Button
              type="button"
              onClick={() => setShowSchedule(!showSchedule)}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              {showSchedule ? "Go Live Now" : "Schedule"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
