export interface StreamerSelection {
  streamerId: string;
  streamerName: string;
}

export async function saveStreamerSelections(userId: string, selectedStreamers: StreamerSelection[]): Promise<void> {
  try {
    const response = await fetch('/api/user/streamers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        selectedStreamers
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to save streamer selections');
    }
  } catch (error) {
    console.error('Streamer selection error:', error);
    throw error;
  }
}

export async function getRecommendedStreamers(): Promise<any[]> {
  // Implementation to fetch recommended streamers
  return [];
} 