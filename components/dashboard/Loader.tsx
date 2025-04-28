"use client";

import React from "react";
import { Loader2 } from "lucide-react";

export default function Loader() {
  return (
    <div className="min-h-screen bg-brandBlack flex flex-col items-center justify-center text-brandWhite space-y-6">
      <div className="animate-pulse">
        <Loader2 
          className="text-brandOrange animate-spin" 
          size={64} 
          strokeWidth={2} 
        />
      </div>
      <div className="text-center">
        <h2 className="text-3xl font-bold text-brandOrange mb-4">
          Preparing Your Dashboard
        </h2>
        <p className="text-brandGray text-lg">
          Gathering your latest performance insights...
        </p>
      </div>
      <div className="w-64 bg-gray-800 h-1 rounded-full overflow-hidden">
        <div 
          className="h-full bg-brandOrange animate-progress-bar" 
          style={{
            animation: "progress-bar 2s infinite",
            transformOrigin: "left",
          }}
        ></div>
      </div>
    </div>
  );
}
