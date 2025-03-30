import { create } from 'zustand';
import { fetchCategoriesWithTags } from '@/lib/store/categoriesStore';
import { fetchStreamersWithStreams } from '@/app/api/streamers/route';

type Stream = {
  id: string;
  title: string;
  createdAt?: string;
  endedAt?: string;
  [key: string]: any;
};

type Streamer = {
  id: string;
  streamerName: string;
  email: string;
  Category: string;
  Tags: string[];
  streamID: string;
  streams: Stream[];
  categoryName?: string;
  tagNames?: string[];
};

type Store = {
  streamers: Streamer[];
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
        throw new Error('Failed to fetch categories and tags');
      }

      const categories = categoriesResult.categoriesWithTags;
      const enrichedStreamers = streamersData.map((streamer: Streamer) => {
        const categoryName = categories.find(cat => cat.id === streamer.Category)?.name || "Unknown";
        const tagNames = streamer.Tags.map(tagId => {
          const foundTag = categories.flatMap(cat => cat.tags).find(tag => tag.id === tagId);
          return foundTag ? foundTag.name : "Unknown Tag";
        });

        return {
          ...streamer,
          categoryName,
          tagNames,
        };
      });

      set({ streamers: enrichedStreamers });
    } catch (err) {
      console.error('🔥 Error fetching streamer data:', err);
    } finally {
      set({ loading: false });
    }
  },
}));
