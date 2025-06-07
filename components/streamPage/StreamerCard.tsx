import React from "react";
import Image from "next/image";
import { Lock } from "lucide-react";

// Define the Stream type inline based on expected fields
interface Stream {
  id: string;
  title: string;
  thumbnail?: string;
  createdAt?: string;
  updatedAt?: string;
  isLive?: boolean;
  hasStarted?: boolean;
  hasEnded?: boolean;
  category?: string;
  tags?: string[];
}

// Define the Streamer type inline based on expected fields
interface Streamer {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
  bio?: string;
  category?: string;
  tags?: string[];
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  thumbnail?: string;
  streams?: Stream[];
}

const StreamerCard: React.FC<{
  streamer: Streamer;
  isLocked?: boolean;
  onLockedClick?: () => void;
}> = ({ streamer, isLocked = false, onLockedClick }) => {
  return (
    <div
      className={`relative flex flex-col md:flex-row bg-blue-900 border border-brandOrange/30 rounded-xl shadow-lg hover:shadow-2xl overflow-hidden w-full h-auto ${
        isLocked ? "cursor-pointer opacity-70" : ""
      }`}
      onClick={isLocked ? onLockedClick : undefined}
      style={{
        width: "100%",
        minWidth: 280,
        maxWidth: 480,
        height: "160px",
        minHeight: "160px",
      }}
    >
      {/* Thumbnail as Background */}
      <div className="relative w-full md:w-1/3 h-48 md:h-auto flex-shrink-0">
        <Image
          src={streamer.thumbnail || "/favicon.ico"}
          alt="Thumbnail"
          className="object-cover w-full h-full md:rounded-l-xl"
        />
        {/* Dark overlay only on mobile */}
        <div className="absolute inset-0 bg-black/50 md:hidden" />
      </div>

      {/* Card Content */}
      <div className="absolute top-0 left-0 right-0 bottom-0 p-4 flex flex-col justify-between md:static md:flex-1 md:p-4">
        {/* Avatar + Name */}
        <div className="flex items-center mb-2 space-x-3 md:space-x-4">
          <div
            className="relative w-12 h-12 md:w-16 md:h-16 rounded-full bg-cover bg-center border-2 border-brandOrange/30"
            style={{
              backgroundImage: `url(${streamer.avatarUrl || "/favicon.ico"})`,
            }}
          >
            {/* Lock inside Avatar */}
            {isLocked && (
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                <Lock className="w-4 h-4 md:w-6 md:h-6 text-brandOrange" />
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base md:text-lg font-bold text-brandWhite truncate">
                {streamer.username || streamer.name || "Unknown Streamer"}
              </h3>
              {streamer.category && (
                <span className="bg-brandOrange text-brandBlack text-[10px] px-1 py-0.5 md:text-xs md:px-2 md:py-1 rounded-full">
                  {streamer.category}
                </span>
              )}
            </div>
            <p className="text-xs md:text-sm text-brandOrange/70">
              {streamer.name || "Unknown Streamer"}
            </p>
          </div>
        </div>

        {/* Bio */}
        {streamer.bio && (
          <p className="text-xs md:text-sm text-brandWhite/70 italic mb-2">
            &ldquo;{streamer.bio}&rdquo;
          </p>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-2">
          {Array.isArray(streamer.tags) && streamer.tags.length > 0 ? (
            streamer.tags.map((tag: string, i: number) => (
              <span
                key={i}
                className="bg-gray-800 text-gray-300 text-xs px-2 py-1 rounded-full"
              >
                #{tag}
              </span>
            ))
          ) : (
            <span className="text-gray-500 text-xs">No tags</span>
          )}
        </div>

        {/* Streams */}
        {streamer.streams && streamer.streams.length > 0 && (
          <div className="border-t border-brandOrange/30 pt-2 space-y-2 max-h-20 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-brandOrange/50">
            <h4 className="text-xs font-semibold text-brandWhite mb-1">
              📺 Streams
            </h4>
            {Array.isArray(streamer.streams) &&
              streamer.streams.length > 0 &&
              streamer.streams.map((stream: Stream, index: number) => (
                <div
                  key={stream.id || index}
                  className="flex items-start space-x-2"
                >
                  <div className="relative w-12 h-8 overflow-hidden rounded-md border border-brandOrange/20">
                    {/* Stream thumbnail or fallback */}
                    <Image
                      src={stream.thumbnail || "/default-thumbnail.jpg"}
                      alt={stream.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-xs text-brandWhite truncate">
                      {stream.title}
                    </div>
                    <div className="text-xs text-gray-400">
                      {stream.category || "Uncategorized"}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StreamerCard;
