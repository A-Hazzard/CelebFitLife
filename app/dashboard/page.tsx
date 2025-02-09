'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';

export default function DashboardPage() {
  const router = useRouter();
  const { currentUser, isLoggedIn } = useAuthStore();

  if (!isLoggedIn || !currentUser) {
    return (
      <div className="p-4 text-white">
        <h1 className="text-2xl">Please log in to access the dashboard.</h1>
      </div>
    );
  }

  // Fake metrics
  const totalStreams = 12;
  const totalViewers = 340;
  const monthlyEarnings = 1020;

  const handleGoLive = () => {
    // Navigate to the form that creates a new stream
    router.push('/dashboard/streams/new');
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold mb-4">Welcome, {currentUser.displayName}</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-lg font-semibold">Total Streams</h2>
          <p className="text-2xl mt-2">{totalStreams}</p>
        </div>
        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-lg font-semibold">Total Viewers</h2>
          <p className="text-2xl mt-2">{totalViewers}</p>
        </div>
        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-lg font-semibold">Monthly Earnings</h2>
          <p className="text-2xl mt-2">${monthlyEarnings}</p>
        </div>
      </div>

      <button
        onClick={handleGoLive}
        className="px-4 py-2 bg-orange-500 rounded text-black font-semibold hover:bg-orange-600"
      >
        Go Live
      </button>
    </div>
  );
}
