"use client";

import { useState, useEffect } from "react";
import { useSignupStore } from "@/lib/store/useSignupStore";
import { Button } from "@/components/ui/button";
import {
  getRecommendedStreamers,
  saveStreamerSelections,
} from "@/lib/services/streamingService";

interface Streamer {
  id: string;
  name: string;
  // Add other streamer properties as needed
}

export default function SelectStreamers() {
  const { userData, completeSignup } = useSignupStore();
  // Check if plan is a string or an object, and extract maxStreamers properly
  const maxSelectable =
    typeof userData.plan === "string"
      ? userData.planDetails?.maxStreamers || 1
      : userData.plan?.maxStreamers || 1;
  const userId = userData.userId;
  const [selectedStreamers, setSelectedStreamers] = useState<string[]>([]);
  const [streamers, setStreamers] = useState<Streamer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStreamers = async () => {
      try {
        const data = await getRecommendedStreamers();
        setStreamers(data);
      } catch (error) {
        setError("Failed to load streamers");
        console.error("Error loading streamers:", error);
      }
    };

    fetchStreamers();
  }, []);

  const handleStreamerSelect = (streamerId: string) => {
    if (selectedStreamers.includes(streamerId)) {
      setSelectedStreamers((prev) => prev.filter((id) => id !== streamerId));
    } else if (selectedStreamers.length < Number(maxSelectable)) {
      setSelectedStreamers((prev) => [...prev, streamerId]);
    }
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      // Format the selected streamers data
      const streamerSelections = selectedStreamers.map((id) => {
        const streamer = streamers.find((s) => s.id === id);
        return {
          streamerId: id,
          streamerName: streamer?.name || "",
        };
      });

      // Save selections if we have a userId
      if (userId) {
        await saveStreamerSelections(userId, streamerSelections);
      }

      completeSignup({ selectedStreamers: streamerSelections });
    } catch (error) {
      setError("Failed to save streamer selections");
      console.error("Error saving streamer selections:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl text-brandWhite mb-4">Choose Your Streamers</h2>
      <p className="text-sm text-brandGray mb-4">
        Select up to {maxSelectable} streamer
        {Number(maxSelectable) > 1 ? "s" : ""}
      </p>

      {error && <p className="text-brandOrange mb-4">{error}</p>}

      {/* Streamer selection list would go here */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {streamers.map((streamer) => (
          <div
            key={streamer.id}
            onClick={() => handleStreamerSelect(streamer.id)}
            className={`cursor-pointer p-4 border rounded-lg ${
              selectedStreamers.includes(streamer.id)
                ? "border-brandOrange"
                : "border-gray-700"
            }`}
          >
            {streamer.name}
          </div>
        ))}
      </div>

      <div className="flex justify-between">
        <Button
          onClick={() => {}} // Use the prevStep from the store if available
          className="bg-brandGray"
          disabled={loading}
        >
          Back
        </Button>
        <Button
          onClick={handleFinish}
          className="bg-brandOrange"
          disabled={loading}
        >
          {loading ? "Processing..." : "Finish Signup"}
        </Button>
      </div>
    </div>
  );
}
