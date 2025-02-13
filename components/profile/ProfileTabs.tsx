import { useState } from 'react';
import SubscriptionCard from './SubscriptionCard';
import StreamList from '@/components/profile/StreamList';
import ViewHistory from '@/components/profile/History';
import { StreamerProfileOverview, ViewerProfileOverview } from '@/components/profile/Overview';
import { Button } from '@/components/ui/button';

const tabs = ['Overview', 'Subscription', 'Watch History', 'My Streams'];

interface ProfileTabsProps {
  initialProfileType?: 'streamer' | 'viewer';
}

export default function ProfileTabs({ initialProfileType = 'streamer' }: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState('Overview');
  const [isStreamerProfile, setIsStreamerProfile] = useState(initialProfileType === 'streamer');

  // Toggle profile function
  const toggleProfile = () => {
    setIsStreamerProfile(!isStreamerProfile);
  };

  return (
    <div>
      {/* Tabs */}
      <div className="flex justify-center space-x-4 border-b border-brandGray pb-2 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`px-4 py-2 text-brandWhite ${activeTab === tab ? 'border-b-2 border-brandOrange' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="mt-4">
        {activeTab === 'My Streams' && <StreamList />}
        {activeTab === 'Subscription' && <SubscriptionCard />}
        {activeTab === 'Watch History' && <ViewHistory />}
        
        {activeTab === 'Overview' && (
          <div>
            {/* Profile Type Toggle */}
            <div className="flex justify-center mb-4">
              <Button 
                onClick={toggleProfile} 
                variant="outline" 
                className="text-brandWhite border-brandOrange hover:bg-brandOrange/20"
              >
                Switch to {isStreamerProfile ? 'Viewer' : 'Streamer'} Profile
              </Button>
            </div>

            {/* Dynamic Overview */}
            {isStreamerProfile ? (
              <StreamerProfileOverview />
            ) : (
              <ViewerProfileOverview />
            )}
          </div>
        )}
        
        {/* Add other sections here */}
      </div>
    </div>
  );
}
