import React, { useState } from 'react';
import { Dumbbell, Clock, Calendar, Flame } from 'lucide-react';
import { searchUserByUsername } from '@/lib/services/UserService';

// Sample workout history data
const workoutHistoryData = [
  {
    trainer: "FitnessPro Sarah",
    workoutType: "HIIT Cardio Blast",
    duration: "45m",
    date: "Feb 10, 2025",
    calories: 450,
    intensity: "High",
    thumbnail: "/path/to/hiit-workout.jpg"
  },
  {
    trainer: "BodyBuilder Mike",
    workoutType: "Strength Training",
    duration: "1h 15m",
    date: "Feb 8, 2025",
    calories: 350,
    intensity: "Medium",
    thumbnail: "/path/to/strength-workout.jpg"
  },
  {
    trainer: "Yoga Master Emma",
    workoutType: "Power Yoga Flow",
    duration: "1h",
    date: "Feb 5, 2025",
    calories: 250,
    intensity: "Low",
    thumbnail: "/path/to/yoga-workout.jpg"
  }
];

interface WorkoutHistoryProps {
  searchedUser?: {
    displayName: string;
    isStreamer: boolean;
  };
}

const WorkoutHistoryComponent = ({ searchedUser }: WorkoutHistoryProps) => {
  return (
    <div className="bg-brandGray/10 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-brandWhite flex items-center">
          <Dumbbell className="mr-2" /> Workout History
          {searchedUser && (
            <span className="ml-2 text-sm text-brandGray">
              for {searchedUser.displayName}
            </span>
          )}
        </h2>
        <span className="text-sm text-brandGray">
          Total Workouts: {workoutHistoryData.length}
        </span>
      </div>

      <div className="space-y-4">
        {workoutHistoryData.map((workout, index) => (
          <div 
            key={index} 
            className="flex items-center bg-brandBlack/50 rounded-lg p-3 hover:bg-brandBlack/70 transition-colors"
          >
            {/* Thumbnail */}
            <div className="w-24 h-16 mr-4 rounded-md overflow-hidden">
              <img 
                src={workout.thumbnail} 
                alt={`${workout.workoutType} with ${workout.trainer}`} 
                className="w-full h-full object-cover"
              />
            </div>

            {/* Workout Details */}
            <div className="flex-grow">
              <div className="flex justify-between items-center">
                <h3 className="text-brandWhite font-semibold">{workout.workoutType}</h3>
                <span className="text-xs text-brandGray flex items-center">
                  <Calendar size={12} className="mr-1" /> {workout.date}
                </span>
              </div>
              
              <div className="flex justify-between items-center mt-1">
                <p className="text-sm text-brandGray">Trainer: {workout.trainer}</p>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-brandGray flex items-center">
                    <Clock size={12} className="mr-1" /> {workout.duration}
                  </span>
                  <span className="text-xs text-brandOrange flex items-center">
                    <Flame size={12} className="mr-1" /> {workout.calories} cal
                  </span>
                </div>
              </div>

              {/* Intensity Badge */}
              <div className="mt-2">
                <span 
                  className={`text-xs px-2 py-1 rounded-full 
                    ${workout.intensity === 'High' ? 'bg-red-600/20 text-red-400' : 
                      workout.intensity === 'Medium' ? 'bg-yellow-600/20 text-yellow-400' : 
                      'bg-green-600/20 text-green-400'}`}
                >
                  {workout.intensity} Intensity
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* View More Button */}
      <div className="text-center mt-4">
        <button 
          className="text-brandOrange hover:underline text-sm"
        >
          View More Workouts
        </button>
      </div>
    </div>
  );
};

export default function WorkoutHistory() {
  const [searchUsername, setSearchUsername] = useState('');
  const [searchedUser, setSearchedUser] = useState<any>(null);
  const [searchError, setSearchError] = useState('');

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
    <div>
      {/* User Search Bar */}
      <div className="mb-6 flex">
        <input 
          type="text" 
          value={searchUsername}
          onChange={(e) => setSearchUsername(e.target.value)}
          placeholder="Search user by username"
          className="flex-grow p-2 mr-2 bg-brandBlack/50 text-brandWhite rounded"
        />
        <button 
          onClick={handleUserSearch}
          className="bg-brandOrange hover:bg-brandOrange/80 text-brandWhite p-2 rounded"
        >
          Search
        </button>
      </div>

      {/* Search Error */}
      {searchError && (
        <div className="text-red-500 mb-4">{searchError}</div>
      )}

      {/* Searched User Info */}
      {searchedUser && (
        <div className="mb-6 bg-brandBlack/50 p-4 rounded-lg">
          <h2 className="text-xl font-bold text-brandWhite mb-4">Searched User Profile</h2>
          <div className="flex items-center">
            <div className="mr-4">
              <img 
                src="/default-profile.jpg" 
                alt={`${searchedUser.displayName}'s profile`} 
                className="w-16 h-16 rounded-full object-cover"
              />
            </div>
            <div>
              <h3 className="text-brandWhite font-semibold">{searchedUser.displayName}</h3>
              <p className="text-brandGray text-sm">{searchedUser.email}</p>
              <span className="text-sm text-brandOrange">
                {searchedUser.isStreamer ? 'Streamer' : 'Viewer'}
              </span>
            </div>
          </div>
        </div>
      )}

      <WorkoutHistoryComponent searchedUser={searchedUser} />
    </div>
  );
}