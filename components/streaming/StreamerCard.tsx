import React from "react";
import Image from "next/image";
import { Streamer } from "@/lib/types/ui";

export function StreamerCard({ streamer }: { streamer: Streamer }) {
  const getStatusIndicator = (status: Streamer["status"]) => {
    switch (status) {
      case "live":
        return {
          dotClass: "bg-red-500 animate-pulse",
          statusClass: "text-red-400",
          statusText: "Live",
        };
      case "online":
        return {
          dotClass: "bg-green-500",
          statusClass: "text-green-400",
          statusText: "Online",
        };
      case "offline":
        return {
          dotClass: "bg-gray-500",
          statusClass: "text-gray-400",
          statusText: "Offline",
        };
    }
  };

  const statusInfo = getStatusIndicator(streamer.status);

  // Fallback image if the streamer image is not available
  const fallbackImage =
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&auto=format";

  return (
    <div className="flex items-center p-2 rounded-lg hover:bg-gray-800/50 transition-colors cursor-pointer">
      <div className="relative mr-3 flex-shrink-0">
        <div className="relative h-10 w-10 rounded-full overflow-hidden border border-gray-700">
          <Image
            src={streamer.imageUrl || fallbackImage}
            alt={streamer.name}
            className="object-cover"
            width={40}
            height={40}
            priority
            sizes="40px"
          />
        </div>
        <span
          className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-gray-900 ${statusInfo.dotClass}`}
        ></span>
      </div>

      <div className="flex-grow min-w-0 overflow-hidden">
        <div className="flex items-center">
          <h4 className="font-medium text-sm truncate max-w-[120px] sm:max-w-full">
            {streamer.name}
          </h4>
          {streamer.status === "live" && (
            <span className="ml-2 text-xs bg-red-600/20 text-red-400 px-1.5 py-0.5 rounded flex-shrink-0">
              LIVE
            </span>
          )}
        </div>
        {streamer.streamTitle && (
          <p className="text-xs text-gray-300 truncate">
            {streamer.streamTitle}
          </p>
        )}
        <p className={`text-xs ${statusInfo.statusClass} flex items-center`}>
          {streamer.status === "live" ? (
            <>
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500 mr-1"></span>
              <span className="truncate">
                {streamer.viewerCount || 0} viewers
              </span>
            </>
          ) : (
            statusInfo.statusText
          )}
        </p>
      </div>
    </div>
  );
}
