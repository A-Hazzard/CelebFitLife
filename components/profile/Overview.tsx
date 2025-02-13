import React from 'react';
import { Trophy, Gamepad, Clock, Heart, MessageCircle, Star } from 'lucide-react';

// Streamer-specific data
const streamerAchievements = [
  { title: 'Streamer of the Month', icon: <Trophy />, month: 'January 2025' },
  { title: '1M Followers', icon: <Gamepad />, date: 'December 2024' },
];

const recentStreams = [
  { game: 'Chest', duration: '3h 45m', viewers: '42.5K' },
  { game: 'Legs', duration: '2h 15m', viewers: '35.2K' },
];

export function StreamerProfileOverview() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Recent Stream Highlights */}
      <div className="bg-brandGray/10 p-4 rounded-lg">
        <h2 className="text-xl font-bold text-brandWhite mb-4">Recent Streams</h2>
        {recentStreams.map((stream, index) => (
          <div key={index} className="flex justify-between items-center mb-2 pb-2 border-b border-brandGray/20">
            <div>
              <p className="text-brandWhite">{stream.game}</p>
              <p className="text-xs text-brandGray">Viewers: {stream.viewers}</p>
            </div>
            <div className="flex items-center text-brandGray">
              <Clock className="mr-2" size={16} />
              <span>{stream.duration}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Achievements */}
      <div className="bg-brandGray/10 p-4 rounded-lg">
        <h2 className="text-xl font-bold text-brandWhite mb-4">Achievements</h2>
        {streamerAchievements.map((achievement, index) => (
          <div key={index} className="flex items-center mb-3">
            <div className="text-brandOrange mr-4">{achievement.icon}</div>
            <div>
              <p className="text-brandWhite">{achievement.title}</p>
              <p className="text-xs text-brandGray">
                {achievement.month || achievement.date}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Performance Stats */}
      <div className="bg-brandGray/10 p-4 rounded-lg col-span-full">
        <h2 className="text-xl font-bold text-brandWhite mb-4">Performance Stats</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-brandOrange">42.5K</p>
            <p className="text-xs text-brandGray">Avg. Viewers</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-brandOrange">85%</p>
            <p className="text-xs text-brandGray">Stream Uptime</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-brandOrange">1.2M</p>
            <p className="text-xs text-brandGray">Total Views</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Viewer-specific data
const viewerInteractions = [
  { type: 'Streams Watched', count: 42, icon: <Gamepad /> },
  { type: 'Comments', count: 156, icon: <MessageCircle /> },
];

const viewerSupport = [
  { title: 'Supporter Badge', icon: <Star />, date: 'January 2025' },
  { title: 'Community Contributor', icon: <Heart />, date: 'December 2024' },
];

export function ViewerProfileOverview() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Community Interactions */}
      <div className="bg-brandGray/10 p-4 rounded-lg">
        <h2 className="text-xl font-bold text-brandWhite mb-4">Community Interactions</h2>
        {viewerInteractions.map((interaction, index) => (
          <div key={index} className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <div className="text-brandOrange mr-4">{interaction.icon}</div>
              <p className="text-brandWhite">{interaction.type}</p>
            </div>
            <p className="text-lg font-bold text-brandWhite">{interaction.count}</p>
          </div>
        ))}
      </div>

      {/* Community Contributions */}
      <div className="bg-brandGray/10 p-4 rounded-lg">
        <h2 className="text-xl font-bold text-brandWhite mb-4">Community Contributions</h2>
        {viewerSupport.map((contribution, index) => (
          <div key={index} className="flex items-center mb-3">
            <div className="text-brandOrange mr-4">{contribution.icon}</div>
            <div>
              <p className="text-brandWhite">{contribution.title}</p>
              <p className="text-xs text-brandGray">{contribution.date}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Engagement Stats */}
      <div className="bg-brandGray/10 p-4 rounded-lg col-span-full">
        <h2 className="text-xl font-bold text-brandWhite mb-4">Engagement Stats</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-brandOrange">5</p>
            <p className="text-xs text-brandGray">Favorite Streamers</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-brandOrange">3</p>
            <p className="text-xs text-brandGray">Active Communities</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-brandOrange">12h</p>
            <p className="text-xs text-brandGray">Weekly Watch Time</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StreamerProfileOverview;