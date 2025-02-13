'use client';
import { useState } from 'react';
import { StreamerProfileHeader, ViewerProfileHeader } from '@/components/profile/ProfileHeader';
import { StreamerProfileOverview, ViewerProfileOverview } from '@/components/profile/Overview';
import SubscriptionCard from '@/components/profile/SubscriptionCard';
import ProfileTabs from '@/components/profile/ProfileTabs';
import { Button } from '@/components/ui/button';

export default function ProfilePage({ initialProfileType }) {
  // Static data for the streamer profile
  const streamerProfile = {
    name: "John 'StreamKing' Doe",
    username: "streamking",
    followers: 42500,
    views: 1200000,
    profilePicture: "/path/to/streamer-profile.jpg",
    isVerified: true,
    isOwnProfile: true
  };

  // Static data for the viewer profile
  const viewerProfile = {
    name: "Jane Community",
    username: "janeviewer",
    followers: 5000,
    views: 50000,
    profilePicture: "/path/to/viewer-profile.jpg",
    isVerified: false
  };

  // State to toggle between streamer and viewer profiles
  const [isStreamerProfile, setIsStreamerProfile] = useState(initialProfileType === 'streamer');

  // Toggle profile function
  const toggleProfile = () => {
    setIsStreamerProfile(!isStreamerProfile);
  };

  return (
    <div className="min-h-screen bg-brandBlack text-brandWhite">
      <div className="max-w-5xl mx-auto p-6">
        {/* Dynamic Profile Header */}
        {isStreamerProfile ? (
          <StreamerProfileHeader {...streamerProfile} />
        ) : (
          <ViewerProfileHeader {...viewerProfile} />
        )}

        {/* Profile Toggle Button */}
        <div className="flex justify-center mt-4">
          <Button 
            onClick={toggleProfile} 
            variant="outline" 
            className="text-brandWhite border-brandOrange hover:bg-brandOrange/20"
          >
            Switch to {isStreamerProfile ? 'Viewer' : 'Streamer'} Profile
          </Button>
        </div>

     

        {/* Subscription Details */}
        <SubscriptionCard />

        {/* Tabs (Overview, Subscription, Settings, Streams) */}
        <ProfileTabs />
      </div>
    </div>
  );
}
