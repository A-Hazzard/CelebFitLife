import { create } from "zustand";
import { fetchCategoriesWithTags } from "@/lib/store/categoriesStore";
import { fetchStreamersWithStreams } from "@/app/api/streamers/route";
import {
  StreamerWithStreams,
  EnrichedStreamer,
} from "@/lib/types/streaming.types";

type Store = {
  streamers: EnrichedStreamer[];
  loading: boolean;
  fetchAll: () => Promise<void>;
};

export const useStreamerStore = create<Store>((set) => ({
  streamers: [],
  loading: false,

  fetchAll: async () => {
    set({ loading: true });
    try {
      const [streamersData, categoriesResult] = await Promise.all([
        fetchStreamersWithStreams(),
        fetchCategoriesWithTags(),
      ]);

      if (!categoriesResult.success) {
        throw new Error("Failed to fetch categories and tags");
      }

      const categories = categoriesResult.categoriesWithTags;

      // Cast the streamersData to our expected type
      const typedStreamersData = streamersData as StreamerWithStreams[];

      const enrichedStreamers = typedStreamersData
        .filter((streamer) => streamer.id !== undefined) // Filter out streamers without id
        .map((streamer) => {
          const categoryName =
            categories.find((cat) => cat.id === streamer.Category)?.name ||
            "Unknown";

          const tagNames =
            streamer.Tags?.map((tagId: string) => {
              const foundTag = categories
                .flatMap((cat) => cat.tags)
                .find((tag) => tag.id === tagId);
              return foundTag ? foundTag.name : "Unknown Tag";
            }) || [];

          // Transform streams to match the expected format
          const formattedStreams = streamer.streams?.map((stream) => ({
            id: stream.id,
            title: stream.title || "Untitled Stream",
            thumbnail: stream.thumbnailUrl || "/favicon.ico",
            hasEnded: stream.hasEnded,
          }));

          return {
            ...streamer,
            id: streamer.id!, // Use non-null assertion as we've filtered out undefined ids
            categoryName,
            tagNames,
            streams: formattedStreams,
          };
        });

      set({ streamers: enrichedStreamers });
    } catch (err) {
      console.error("🔥 Error fetching streamer data:", err);
    } finally {
      set({ loading: false });
    }
  },
}));
