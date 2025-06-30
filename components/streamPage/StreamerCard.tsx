import React from "react";
import Image from "next/image";
import { Lock } from "lucide-react";

// Minimal types to replace deleted streaming types
type Stream = {
  id: string;
  title?: string;
  hasEnded?: boolean;
  thumbnail?: string;
};

type EnrichedStreamer = {
  id: string;
  name?: string;
  username?: string;
  avatarUrl?: string;
  bio?: string;
  categoryName?: string;
  tagNames?: string[];
  streams?: Stream[];
};

const StreamerCard: React.FC<{
  streamer: EnrichedStreamer;
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
          src={streamer.avatarUrl || "/favicon.ico"}
          alt="Thumbnail"
          className="object-cover w-full h-full md:rounded-l-xl"
          width={200}
          height={160}
          priority
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
              {streamer.categoryName && (
                <span className="bg-brandOrange text-brandBlack text-[10px] px-1 py-0.5 md:text-xs md:px-2 md:py-1 rounded-full">
                  {streamer.categoryName}
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
          {streamer.tagNames && streamer.tagNames.length > 0 ? (
            streamer.tagNames.map((tag: string, i: number) => (
              <span
                key={i}
                className="bg-blue-900 border border-brandOrange/30 text-xs px-2 py-1 rounded-full text-brandOrange"
              >
                {tag}
              </span>
            ))
          ) : (
            <span className="text-xs text-brandOrange/50">No tags</span>
          )}
        </div>

        {/* Streams */}
        {streamer.streams && streamer.streams.length > 0 && (
          <div className="border-t border-brandOrange/30 pt-2 space-y-2 max-h-20 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-brandOrange/50">
            <h4 className="text-xs font-semibold text-brandWhite mb-1">
              📺 Streams
            </h4>
            {streamer.streams.map((stream, index) => (
              <div
                key={stream.id || index}
                className="flex items-start space-x-2"
              >
                <div className="relative w-12 h-8 overflow-hidden rounded-md border border-brandOrange/20">
                  <Image
                    src={stream.thumbnail || "/favicon.ico"}
                    alt={stream.title || "Stream thumbnail"}
                    width={48}
                    height={32}
                    className="object-cover"
                    priority={index < 2}
                  />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-brandWhite truncate">
                    {stream.title || "Untitled Stream"}
                  </p>
                  <p className="text-[10px] text-brandOrange/70">
                    {stream.hasEnded ? (
                      <span className="text-red-400">Ended</span>
                    ) : (
                      <span className="text-green-400">Live</span>
                    )}
                  </p>
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
