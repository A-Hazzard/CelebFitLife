'use client';

import ProfileHeader from '@/components/profile/ProfileHeader';
import SubscriptionCard from '@/components/profile/SubscriptionCard';
import ProfileTabs from '@/components/profile/ProfileTabs';

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-brandBlack text-brandWhite">
      <div className="max-w-5xl mx-auto p-6">
        {/* Profile Header */}
        <ProfileHeader />

        {/* Subscription Details */}
        <SubscriptionCard />

        {/* Tabs (Overview, Subscription, Settings, Streams) */}
        <ProfileTabs />
      </div>
    </div>
  );
}
