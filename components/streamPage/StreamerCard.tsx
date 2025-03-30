import React from "react";
import { Streamer } from "@/lib/types/streaming";

const StreamerCard: React.FC<{ streamer: Streamer }> = ({ streamer }) => {
  return (
    <div className="bg-brandBlack border border-brandOrange/30 p-4 md:p-5 rounded-xl shadow-lg hover:shadow-2xl">
      {/* Avatar + Name */}
      <div className="flex items-center mb-4 space-x-3 md:space-x-4">
        <div
          className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-cover bg-center border-2 border-brandOrange/30"
          style={{
            backgroundImage: `url(${streamer.thumbnail || "/default-avatar.png"})`,
          }}
        />
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-base md:text-lg font-bold text-brandWhite">
              {streamer.streamerName}
            </h3>
            <span className="bg-brandOrange text-brandBlack text-xs px-2 py-1 rounded-full">
              {streamer.categoryName}
            </span>
          </div>
          <p className="text-xs md:text-sm text-brandOrange/70">{streamer.email}</p>
        </div>
      </div>

      {/* Optional quote (if exists) */}
      {streamer.quote && (
        <p className="text-xs md:text-sm text-brandWhite/70 italic mb-4">
          &ldquo;{streamer.quote}&rdquo;
        </p>
      )}

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {streamer.tagNames?.map((tag: string, i: number) => (
          <span
            key={i}
            className="bg-brandBlack border border-brandOrange/30 text-xs px-2 py-1 rounded-full text-brandOrange"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Streams Section */}
      {streamer.streams?.length > 0 && (
        <div className="border-t border-brandOrange/30 pt-3 space-y-3">
          <h4 className="text-sm font-semibold text-brandWhite">📺 Streams</h4>
          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-brandOrange/50">
            {streamer.streams.map((stream, index) => (
              <div
                key={stream.id || index}
                className="flex items-start space-x-3"
              >
                {/* Thumbnail */}
                {stream.thumbnail && (
                  <img
                    src={stream.thumbnail}
                    alt={stream.title}
                    className="w-16 h-10 object-cover rounded-md border border-brandOrange/20"
                  />
                )}

                {/* Stream Info */}
                <div className="flex-1">
                  <p className="text-xs font-medium text-brandWhite">
                    {stream.title}
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
        </div>
      )}
    </div>
  );
};

export default StreamerCard;
