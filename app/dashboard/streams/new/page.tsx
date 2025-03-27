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
      scheduledAt: showSchedule ? selectedTime.toISOString() : null,
    };

    await setDoc(doc(db, "streams", slug), streamData);
    router.push(`/dashboard/streams/manage/${slug}`);
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
          
          {showSchedule && (
            <div>
              <label className="block text-brandWhite mb-2">Schedule Time</label>
              <TimePickerDialog 
                date={selectedTime} 
                setDate={setSelectedTime}  
              />
            </div>
          )}
          
          <div className="flex space-x-4">
            <Button
              type="submit"
              className="flex-1 bg-brandOrange text-brandBlack hover:bg-brandOrange/90 
              transition-colors duration-300 flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5" />
              Create Stream
            </Button>
            
            <Button
              type="button"
              onClick={() => setShowSchedule(!showSchedule)}
              className="flex-1 bg-brandBlack border border-brandOrange/30 text-brandWhite 
              hover:bg-brandOrange/10 transition-colors duration-300 flex items-center justify-center gap-2"
            >
              <Calendar className="w-5 h-5" />
              {showSchedule ? "Go Live Now" : "Schedule"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
