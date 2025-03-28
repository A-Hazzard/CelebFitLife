"use client";

import React, { useState } from "react";
import { 
  Laptop, 
  Users, 
  DollarSign, 
  Play, 
  X,
  LogOut
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/useAuthStore";
import DashboardAreaChart from "@/components/dashboard/AreaChart";

// Streaming Profile Modal
const StreamingProfileModal = ({ 
  isOpen, 
  onClose, 
  onSubmit 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onSubmit: (data: StreamingProfileData) => void 
}) => {
  const [profileData, setProfileData] = useState<StreamingProfileData>({
    streamName: "",
    category: "",
    description: "",
    tags: [],
    socialLinks: {
      instagram: "",
      youtube: "",
      twitter: ""
    }
  });

  const streamCategories = [
    "Fitness Coaching", 
    "Workout Tutorials", 
    "Nutrition Advice", 
    "Weight Loss Journey", 
    "Bodybuilding", 
    "Yoga & Wellness"
  ];

  const availableTags = [
    "Strength", "Cardio", "Flexibility", "Weight Loss", 
    "Muscle Gain", "Endurance", "Core", "Balance"
  ];

  const handleTagToggle = (tag: string) => {
    setProfileData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const handleSubmit = () => {
    // Basic validation
    if (profileData.streamName && profileData.category) {
      onSubmit(profileData);
      onClose();
    } else {
      alert("Please fill in stream name and category");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-brandBlack border border-brandOrange/30 rounded-xl p-8 w-full max-w-md relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-brandWhite hover:text-brandOrange"
        >
          <X className="w-6 h-6" />
        </button>
        <h2 className="text-3xl font-bold text-brandOrange mb-6 text-center">
          Set Up Your Stream Profile
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-brandWhite mb-2">Stream Name</label>
            <input 
              type="text"
              value={profileData.streamName}
              onChange={(e) => setProfileData(prev => ({ ...prev, streamName: e.target.value }))}
              className="w-full px-4 py-3 bg-brandBlack border border-brandOrange/30 text-brandWhite rounded-lg"
              placeholder="Enter your stream name"
            />
          </div>

          <div>
            <label className="block text-brandWhite mb-2">Stream Category</label>
            <select 
              value={profileData.category}
              onChange={(e) => setProfileData(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-4 py-3 bg-brandBlack border border-brandOrange/30 text-brandWhite rounded-lg"
            >
              <option value="">Select Category</option>
              {streamCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-brandWhite mb-2">Stream Description</label>
            <textarea 
              value={profileData.description}
              onChange={(e) => setProfileData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-4 py-3 bg-brandBlack border border-brandOrange/30 text-brandWhite rounded-lg"
              placeholder="Describe your stream"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-brandWhite mb-2">Stream Tags</label>
            <div className="flex flex-wrap gap-2">
              {availableTags.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagToggle(tag)}
                  className={`
                    px-3 py-1 rounded-full text-sm transition-all
                    ${profileData.tags.includes(tag) 
                      ? 'bg-brandOrange text-brandBlack' 
                      : 'bg-brandBlack border border-brandOrange/30 text-brandWhite'}
                  `}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-brandWhite mb-2">Social Links (Optional)</label>
            <input 
              type="text"
              value={profileData.socialLinks.instagram}
              onChange={(e) => setProfileData(prev => ({ 
                ...prev, 
                socialLinks: { ...prev.socialLinks, instagram: e.target.value } 
              }))}
              className="w-full px-4 py-3 mb-2 bg-brandBlack border border-brandOrange/30 text-brandWhite rounded-lg"
              placeholder="Instagram Profile URL"
            />
            <input 
              type="text"
              value={profileData.socialLinks.youtube}
              onChange={(e) => setProfileData(prev => ({ 
                ...prev, 
                socialLinks: { ...prev.socialLinks, youtube: e.target.value } 
              }))}
              className="w-full px-4 py-3 mb-2 bg-brandBlack border border-brandOrange/30 text-brandWhite rounded-lg"
              placeholder="YouTube Channel URL"
            />
            <input 
              type="text"
              value={profileData.socialLinks.twitter}
              onChange={(e) => setProfileData(prev => ({ 
                ...prev, 
                socialLinks: { ...prev.socialLinks, twitter: e.target.value } 
              }))}
              className="w-full px-4 py-3 bg-brandBlack border border-brandOrange/30 text-brandWhite rounded-lg"
              placeholder="Twitter Profile URL"
            />
          </div>

          <button 
            onClick={handleSubmit}
            className="w-full bg-brandOrange text-brandBlack py-3 rounded-full hover:opacity-90 transition-all"
          >
            Save Stream Profile
          </button>
        </div>
      </div>
    </div>
  );
};

// Type for Streaming Profile Data
type StreamingProfileData = {
  streamName: string;
  category: string;
  description: string;
  tags: string[];
  socialLinks: {
    instagram: string;
    youtube: string;
    twitter: string;
  };
};

export default function DashboardPage() {
  const router = useRouter();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const { clearUser } = useAuthStore();

  const handleGoLive = () => {
    router.push("/dashboard/streams/new");
  };

  const handleStreamProfileSubmit = (data: StreamingProfileData) => {
    console.log("Stream Profile Submitted:", data);
    // TODO: Implement actual submission logic
  };

  const handleLogout = () => {
    clearUser(); // Clear user from auth store
    router.push("/login"); // Redirect to login page
  };

  // Mock metrics data
  const metricsData = [
    { month: "Feb", streams: 80, viewers: 220, earnings: 650 },
    { month: "Mar", streams: 100, viewers: 280, earnings: 850 },
    { month: "Apr", streams: 127, viewers: 340, earnings: 1020 },
    { month: "May", streams: 900, viewers: 300, earnings: 950 },
    { month: "Jun", streams: 1100, viewers: 320, earnings: 1100 },
  ];

  const statsCards = [
    {
      icon: <Laptop className="text-brandOrange text-4xl" />,
      title: "Total Streams",
      value: "12",
      bgClass: "bg-brandBlack border border-brandOrange/30",
    },
    {
      icon: <Users className="text-brandOrange text-4xl" />,
      title: "Total Viewers",
      value: "340",
      bgClass: "bg-brandBlack border border-brandOrange/30",
    },
    {
      icon: <DollarSign className="text-brandOrange text-4xl" />,
      title: "Monthly Earnings",
      value: "$1,020",
      bgClass: "bg-brandBlack border border-brandOrange/30",
    }
  ];

  return (
    <div className="min-h-screen bg-brandBlack text-brandWhite p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold text-brandOrange">
          Welcome, Streamer
        </h1>
        <div className="flex space-x-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-6 py-3 bg-brandGray text-brandWhite
            rounded-full font-semibold hover:bg-opacity-90 transition-colors"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Logout
          </button>
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-brandWhite text-brandBlack
            rounded-full font-semibold hover:bg-opacity-90 transition-colors"
          >
            Set Up Stream
          </button>
          <button
            onClick={handleGoLive}
            className="flex items-center gap-2 px-6 py-3 bg-brandOrange text-brandBlack
            rounded-full font-semibold hover:bg-opacity-90 transition-colors"
          >
            <Play className="text-2xl" />
            Go Live
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statsCards.map((card, index) => (
          <div
            key={index}
            className={`p-6 rounded-xl ${card.bgClass} 
            flex items-center space-x-4 shadow-lg hover:scale-105 transition-transform`}
          >
            <div>{card.icon}</div>
            <div>
              <h2 className="text-lg text-brandGray">{card.title}</h2>
              <p className="text-3xl font-bold text-brandWhite">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-brandBlack border border-brandOrange/30 rounded-xl p-6">
        <h2 className="text-2xl font-bold text-brandOrange mb-6">
          Performance Overview
        </h2>
        <DashboardAreaChart data={metricsData} />
      </div>

      <StreamingProfileModal 
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onSubmit={handleStreamProfileSubmit}
      />
    </div>
  );
}
