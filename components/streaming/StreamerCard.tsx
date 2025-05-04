import React from "react";
import Image from "next/image";
import { Streamer } from "@/lib/types/ui";

export function StreamerCard({ streamer }: { streamer: Streamer }) {
  const getStatusIndicator = (status: Streamer["status"]) => {
    switch (status) {
      case "live":
        return {
          dotClass: "bg-red-500 animate-pulse",
          statusClass: "text-brandOrange",
          statusText: "Live",
          bgClass: "bg-brandOrange/20",
          textClass: "text-brandOrange",
          badgeClass: "bg-brandOrange text-brandBlack",
        };
      case "online":
        return {
          dotClass: "bg-green-500",
          statusClass: "text-green-400",
          statusText: "Online",
          bgClass: "bg-green-500/10",
          textClass: "text-green-400",
          badgeClass: "bg-green-700 text-green-200",
        };
      case "offline":
        return {
          dotClass: "bg-gray-500",
          statusClass: "text-gray-400",
          statusText: "Offline",
          bgClass: "bg-gray-700/30",
          textClass: "text-gray-400",
          badgeClass: "bg-gray-700 text-gray-300",
        };
    }
  };

  const statusInfo = getStatusIndicator(streamer.status);

  // Fallback image if the streamer image is not available
  const fallbackImage =
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&auto=format";

  return (
    <div className="flex items-center p-3 hover:bg-opacity-80 transition-colors cursor-pointer">
      <div className="relative mr-3 flex-shrink-0">
        <div className="relative h-12 w-12 rounded-full overflow-hidden border-2 border-brandOrange/70">
          <Image
            src={streamer.imageUrl || fallbackImage}
            alt={streamer.name}
            className="object-cover"
            width={48}
            height={48}
            priority
            sizes="48px"
          />
        </div>
        <span
          className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-blue-900 ${statusInfo.dotClass}`}
        ></span>
      </div>

      <div className="flex-grow min-w-0 overflow-hidden">
        <div className="flex items-center">
          <h4 className="font-medium text-sm truncate max-w-[120px] sm:max-w-full text-brandWhite">
            {streamer.name}
          </h4>
          {streamer.status === "live" && (
            <span className="ml-2 text-xs font-semibold px-1.5 py-0.5 rounded flex-shrink-0 bg-brandOrange text-brandBlack">
              LIVE
            </span>
          )}
        </div>
        {streamer.streamTitle && (
          <p className="text-xs text-gray-300 truncate mt-0.5">
            {streamer.streamTitle}
          </p>
        )}
        <p className={`text-xs ${statusInfo.textClass} flex items-center mt-1`}>
          {streamer.status === "live" ? (
            <>
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-brandOrange mr-1.5 animate-pulse"></span>
              <span className="truncate text-brandOrange">
                {streamer.viewerCount || 0} viewers
              </span>
            </>
          ) : (
            <>
              <span
                className={`inline-block h-1.5 w-1.5 rounded-full ${statusInfo.dotClass} mr-1.5`}
              ></span>
              <span className="truncate">{statusInfo.statusText}</span>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
