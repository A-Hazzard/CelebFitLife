'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSignupStore } from '@/store/useSignupStore';
import { Button } from '@/components/ui/button';

interface Streamer {
  id: number;
  name: string;
  category: string;
  viewers: string;         // e.g., '2K viewers'
  isLive: boolean;
  mainThumbnail: string;   // Large or main image
  avatar: string;          // Circular profile pic
  nextLive?: string;       // e.g., 'Tomorrow at 9am'
}

const dummyStreamers: Streamer[] = [
  {
    id: 1,
    name: 'JackJake',
    category: 'Bodybuilding',
    viewers: '2K viewers',
    isLive: true,
    mainThumbnail: '/images/example1.jpg',
    avatar: '/images/avatar1.jpg',
  },
  {
    id: 2,
    name: 'FlexMamba',
    category: 'CrossFit',
    viewers: '1.6K viewers',
    isLive: false,
    nextLive: 'Wed 5pm',
    mainThumbnail: '/images/example2.jpg',
    avatar: '/images/avatar2.jpg',
  },
  {
    id: 3,
    name: 'CardioQueen',
    category: 'HIIT & Cardio',
    viewers: '980 viewers',
    isLive: true,
    mainThumbnail: '/images/example3.jpg',
    avatar: '/images/avatar3.jpg',
  },
  {
    id: 4,
    name: 'YogaWithAnna',
    category: 'Yoga & Meditation',
    viewers: '1.2K viewers',
    isLive: false,
    nextLive: 'Tonight 7pm',
    mainThumbnail: '/images/example4.jpg',
    avatar: '/images/avatar4.jpg',
  },
  {
    id: 5,
    name: 'FitDuo',
    category: 'Partner Workouts',
    viewers: '3.1K viewers',
    isLive: true,
    mainThumbnail: '/images/example5.jpg',
    avatar: '/images/avatar5.jpg',
  },
];

export default function SelectStreamers() {
  const router = useRouter();
  const { userData } = useSignupStore();

  // Read plan from userData: { name: 'Basic', maxStreamers: 1 }
  const { plan } = userData || {};
  const maxAllowed = plan?.maxStreamers ?? 1;  // default to 1 if not found

  // Store selected streamer IDs
  const [selectedStreamers, setSelectedStreamers] = useState<number[]>([]);

  // Current index (which streamer is centered)
  const [currentIndex, setCurrentIndex] = useState(0);

  // Slider navigation
  const goLeft = () => {
    setCurrentIndex((prev) => (prev === 0 ? dummyStreamers.length - 1 : prev - 1));
  };
  const goRight = () => {
    setCurrentIndex((prev) => (prev === dummyStreamers.length - 1 ? 0 : prev + 1));
  };

  // Helper: get streamer by offset
  const getStreamer = (offset: number) => {
    const idx = (currentIndex + offset + dummyStreamers.length) % dummyStreamers.length;
    return dummyStreamers[idx];
  };

  // Select/unselect streamer
  const handleSelect = (streamerId: number) => {
    if (selectedStreamers.includes(streamerId)) {
      // Unselect
      setSelectedStreamers((prev) => prev.filter((id) => id !== streamerId));
    } else {
      // If not at limit or unlimited
      if (selectedStreamers.length < maxAllowed || maxAllowed === Infinity) {
        setSelectedStreamers((prev) => [...prev, streamerId]);
      }
    }
  };

  // ✅ If plan is unlimited => always can finish
  // ✅ Otherwise => must select exactly maxAllowed
  const canFinish =
    maxAllowed === Infinity || selectedStreamers.length === maxAllowed;

  const finishSignup = () => {
    // Save to Firestore or do final logic if needed
    router.push('/login?verification=sent');
  };

  // Items to show in slider: center, ±1, ±2
  const offsets = [-2, -1, 0, 1, 2];

  return (
    <div className="min-h-screen bg-brandBlack text-brandWhite flex flex-col items-center py-6">
      <h2 className="text-3xl font-edo text-brandOrange mb-2">Choose Your Streamers</h2>

      {/* Show how many are allowed/selected */}
      <p className="text-brandGray mb-6">
        You must select 
        {maxAllowed === Infinity
          ? ' unlimited'
          : ` exactly ${maxAllowed}`
        } {maxAllowed === 1 ? 'streamer' : 'streamers'}
        . Currently selected: 
        <span className="text-brandOrange font-semibold"> {selectedStreamers.length}</span>
      </p>

      {/* Slider */}
      <div className="relative w-full max-w-5xl overflow-hidden">
        {/* Left Arrow */}
        <button
          onClick={goLeft}
          className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-brandBlack text-brandWhite hover:bg-brandGray w-10 h-10 rounded-full z-10 flex items-center justify-center"
        >
          ‹
        </button>

        <div className="flex justify-center items-center gap-4">
          {offsets.map((offset) => {
            const streamer = getStreamer(offset);
            const isCenter = offset === 0;
            const isSelected = selectedStreamers.includes(streamer.id);

            return (
              <div
                key={streamer.id}
                className={`relative flex-shrink-0 transition-all duration-500 ${
                  isCenter ? 'scale-100 z-10 w-[350px]' : 'scale-75 z-0 w-[250px]'
                }`}
              >
                {/* Main Thumbnail */}
                <div className="relative h-[200px] overflow-hidden rounded-lg">
                  <img
                    src={streamer.mainThumbnail}
                    alt={streamer.name}
                    className="w-full h-full object-cover"
                  />
                  {/* LIVE or Next Info */}
                  {streamer.isLive ? (
                    <span className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full">
                      LIVE
                    </span>
                  ) : streamer.nextLive ? (
                    <span className="absolute top-2 left-2 bg-brandOrange text-brandBlack text-xs px-2 py-1 rounded-full">
                      Next: {streamer.nextLive}
                    </span>
                  ) : null}
                </div>

                {/* Center Overlay */}
                {isCenter && (
                  <div className="absolute right-0 top-0 h-[200px] w-[150px] bg-brandBlack/90 p-3 flex flex-col justify-center">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full border-2 border-brandOrange overflow-hidden mb-2 mx-auto">
                      <img
                        src={streamer.avatar}
                        alt={`${streamer.name} avatar`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {/* Name, Category */}
                    <h3 className="text-brandWhite text-sm font-semibold text-center">
                      {streamer.name}
                    </h3>
                    <p className="text-xs text-brandGray text-center">{streamer.category}</p>
                    <p className="text-xs text-brandGray text-center">{streamer.viewers}</p>

                    {/* Choose/Unchoose Button */}
                    <button
                      onClick={() => handleSelect(streamer.id)}
                      className={`mt-3 px-2 py-1 text-sm font-bold rounded-full ${
                        // If we already selected this streamer
                        isSelected ? 'bg-brandGray text-brandBlack' : 'bg-brandOrange text-brandBlack'
                      }`}
                    >
                      {isSelected ? 'Unchoose' : 'Choose'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right Arrow */}
        <button
          onClick={goRight}
          className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-brandBlack text-brandWhite hover:bg-brandGray w-10 h-10 rounded-full z-10 flex items-center justify-center"
        >
          ›
        </button>
      </div>

      {/* Finish Signup */}
      <div className="mt-8">
        <Button
          onClick={finishSignup}
          disabled={!canFinish} // 🔸 disabled if not all selected
          className={`px-6 py-2 rounded-full ${
            canFinish ? 'bg-brandOrange text-brandBlack' : 'bg-brandGray text-brandWhite opacity-50'
          }`}
        >
          Finish Signup
        </Button>
      </div>
    </div>
  );
}
