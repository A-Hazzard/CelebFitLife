import React from 'react';
import { Dumbbell, Clock, Calendar, Flame } from 'lucide-react';

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

export default function WorkoutHistory() {
  return (
    <div className="bg-brandGray/10 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-brandWhite flex items-center">
          <Dumbbell className="mr-2" /> Workout History
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
}