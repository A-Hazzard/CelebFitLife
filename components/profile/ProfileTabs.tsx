import { useState } from 'react';
import SubscriptionCard from './SubscriptionCard';
import StreamList from '@/components/profile/StreamList';

const tabs = ['Overview', 'Subscription', 'Watch History', 'My Streams'];

export default function ProfileTabs() {
  const [activeTab, setActiveTab] = useState('Overview');

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
        {/* Add other sections here */}
      </div>
    </div>
  );
}
