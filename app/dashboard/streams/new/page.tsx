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
import { Play, Calendar } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

export default function CreateStreamPage() {
  const router = useRouter();
  const { currentUser } = useAuthStore();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [showSchedule, setShowSchedule] = useState(false);
  const [selectedTime, setSelectedTime] = useState(new Date());

  useEffect(() => {
    if (!currentUser) router.push("/login");
  }, [currentUser, router]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) return;

    const slug = `${title
      .trim()
      .replace(/\s+/g, "-")
      .toLowerCase()}-${uuidv4()}`;

    // Log the raw selected time
    console.log("Selected time object:", selectedTime);
    console.log("Selected time is valid:", !isNaN(selectedTime.getTime()));
    console.log("Time in ISO format:", selectedTime.toISOString());
    console.log("Time in local format:", selectedTime.toString());
    console.log("Scheduling enabled:", showSchedule);

    const streamData = {
      title,
      description,
      thumbnail:
        thumbnailUrl ||
        "https://1.bp.blogspot.com/-Rsu_fHvj-IA/YH0ohFqGK_I/AAAAAAAAm7o/dOKXFVif7hYDymAsCNZRe4MK3p7ihTGmgCLcBGAsYHQ/s2362/Stream.jpg",
      slug,
      createdAt: new Date().toISOString(),
      createdBy: currentUser.uid,
      hasStarted: false, // Never automatically start the stream
      hasEnded: false,
      scheduledAt: showSchedule ? selectedTime.toISOString() : null,
      audioMuted: false,
      cameraOff: false,
    };

    console.log("Creating stream with scheduledAt:", streamData.scheduledAt);

    await setDoc(doc(db, "streams", slug), streamData);
    router.push(`/dashboard/streams/manage/${slug}`);
  };

  const handleScheduleChange = (checked: boolean) => {
    setShowSchedule(checked);
    if (checked) {
      // Set default scheduled time to 10 minutes from now
      const newDate = new Date();
      newDate.setMinutes(newDate.getMinutes() + 10);
      setSelectedTime(newDate);
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
          >
            <Play className="w-5 h-5" />
            Create Stream
          </Button>
        </form>
      </div>
    </div>
  );
}
