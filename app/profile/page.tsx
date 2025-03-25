'use client';
import { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { searchUserByUsername } from '@/lib/services/UserService';
import { StreamerProfileHeader, ViewerProfileHeader } from '@/components/profile/ProfileHeader';
import { StreamerProfileOverview, ViewerProfileOverview } from '@/components/profile/Overview';
import SubscriptionCard from '@/components/profile/SubscriptionCard';
import ProfileTabs from '@/components/profile/ProfileTabs';

export default function ProfilePage() {
  const { currentUser } = useAuthStore();
  const [searchUsername, setSearchUsername] = useState('');
  const [searchedUser, setSearchedUser] = useState<any>(null);
  const [searchError, setSearchError] = useState('');

  const isStreamerProfile = currentUser?.isStreamer || false;

  // // Use actual user data if available
  // const profileData = {
  //   name: currentUser?.displayName || 'User',
  //   username: currentUser?.email?.split('@')[0] || 'user',
  //   followers: 0,
  //   views: 0,
  //   profilePicture: "/default-profile.jpg",
  //   isVerified: false,
  //   isOwnProfile: true
  // };

  const handleUserSearch = async () => {
    try {
      setSearchError('');
      const user = await searchUserByUsername(searchUsername);
      
      if (user) {
        setSearchedUser(user);
      } else {
        setSearchError('No user found with that username');
        setSearchedUser(null);
      }
    } catch (error) {
      setSearchError('Error searching for user');
      setSearchedUser(null);
    }
  };

  return (
    <div className="min-h-screen bg-brandBlack text-brandWhite">
      <div className="max-w-5xl mx-auto p-6">
        {/* User Search Bar */}
        <div className="mb-6 flex">
          <input 
            type="text" 
            value={searchUsername}
            onChange={(e) => setSearchUsername(e.target.value)}
            placeholder="Search user by username"
            className="flex-grow p-2 mr-2 bg-gray-700 text-white rounded"
          />
          <button 
            onClick={handleUserSearch}
            className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded"
          >
            Search
          </button>
        </div>

        {/* Search Error */}
        {searchError && (
          <div className="text-red-500 mb-4">{searchError}</div>
        )}

        {/* Searched User Profile */}
        {searchedUser && (
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-4">Searched User Profile</h2>
            {searchedUser.isStreamer ? (
              <StreamerProfileHeader 
                name={searchedUser.displayName}
                username={searchedUser.displayName}
                followers={100000}
                views={5000000}
                profilePicture="/images/man1.jpg"
                isVerified={false}
                isOwnProfile={false}
              />
            ) : (
              <ViewerProfileHeader 
                name={searchedUser.displayName}
                username={searchedUser.displayName}
                followers={50}
                views={5}
                profilePicture="/default-profile.jpg"
                isVerified={false}
                isOwnProfile={false}
              />
            )}
          </div>
        )}

        {/* Current User Profile */}
        {/* Dynamic Profile Header */}
        {/* {isStreamerProfile ? (
          <StreamerProfileHeader {...profileData} />
        ) : (
          <ViewerProfileHeader {...profileData} />
        )} */}

        {/* Subscription Details */}
        <SubscriptionCard />

        {/* Tabs (Overview, Subscription, Settings, Streams) */}
        <ProfileTabs 
 
/>
      </div>
    </div>
  );
}