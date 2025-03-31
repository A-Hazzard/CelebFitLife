import { create } from "zustand";
import { fetchCategoriesWithTags } from "@/lib/store/categoriesStore";
import { fetchStreamersWithStreams } from "@/app/api/streamers/route";
import {
  StreamerWithStreams,
  EnrichedStreamer,
} from "@/lib/types/streaming";

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

      const enrichedStreamers = typedStreamersData.map((streamer) => {
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

        return {
          ...streamer,
          categoryName,
          tagNames,
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
